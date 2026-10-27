import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// Server-side payment secrets stored securely in Firebase Secret Manager / environment variables.
// NEVER place these secrets inside the mobile app!
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

/**
 * Helper to verify if the caller is a store administrator
 */
async function assertAdmin(uid?: string, token?: Record<string, unknown>): Promise<void> {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  if (token?.admin === true) {
    return;
  }
  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.exists && userSnap.data()?.role === "admin") {
    return;
  }
  throw new HttpsError("permission-denied", "Store Administrator privileges are required.");
}

/**
 * 1. Create a Razorpay Order on the server (or return clearly marked TEST MODE order when keys are not yet set).
 * Validates item prices directly from Firestore so clients cannot tamper with INR prices.
 */
export const createRazorpayOrder = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: true },
  async (request) => {
    const { items, receipt } = request.data as {
      items?: { product_id: string; quantity: number }[];
      receipt?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpsError("invalid-argument", "Order must contain at least one watch.");
    }

    let totalInr = 0;
    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const prodSnap = await db.collection("products").doc(item.product_id).get();
      if (!prodSnap.exists) {
        throw new HttpsError("not-found", `Product ${item.product_id} was not found.`);
      }
      const prodData = prodSnap.data()!;
      if ((prodData.stock_quantity ?? 0) < qty) {
        throw new HttpsError(
          "failed-precondition",
          `${prodData.name || "Watch"} only has ${prodData.stock_quantity ?? 0} unit(s) in stock.`
        );
      }
      totalInr += Number(prodData.price_amount) * qty;
    }

    const amountPaise = Math.round(totalInr * 100);
    const orderReceipt = receipt || `stepup_${Date.now()}`;
    const keyId = RAZORPAY_KEY_ID.value() || process.env.RAZORPAY_KEY_ID || "";
    const keySecret = RAZORPAY_KEY_SECRET.value() || process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      const testOrderId = `order_test_${crypto.randomBytes(8).toString("hex")}`;
      return {
        test_mode: true,
        mode_label:
          "TEST MODE (Simulated Razorpay Sandbox — Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in Firebase Secrets for live gateway)",
        razorpay_key_id: "rzp_test_simulated_sandbox",
        order_id: testOrderId,
        amount: amountPaise,
        amount_inr: totalInr,
        currency: "INR",
        receipt: orderReceipt
      };
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: orderReceipt
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new HttpsError("internal", `Razorpay order creation failed: ${errText}`);
    }

    const rzpOrder = (await res.json()) as {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
    };

    const isTestKey = keyId.startsWith("rzp_test_");

    return {
      test_mode: isTestKey,
      mode_label: isTestKey ? "TEST MODE (Razorpay Test Key)" : "LIVE MODE",
      razorpay_key_id: keyId,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      amount_inr: totalInr,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt
    };
  }
);

/**
 * 2. Verify Razorpay Payment Signature on the server & atomically decrement stock
 */
export const verifyRazorpayPayment = onCall(
  { secrets: [RAZORPAY_KEY_SECRET], cors: true },
  async (request) => {
    const {
      firestore_order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = request.data as {
      firestore_order_id?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!firestore_order_id || !razorpay_order_id || !razorpay_payment_id) {
      throw new HttpsError("invalid-argument", "Missing payment verification fields.");
    }

    const keySecret = RAZORPAY_KEY_SECRET.value() || process.env.RAZORPAY_KEY_SECRET || "";
    let isTestMode = false;

    if (!keySecret && razorpay_order_id.startsWith("order_test_")) {
      isTestMode = true;
    } else {
      if (!keySecret) {
        throw new HttpsError("failed-precondition", "RAZORPAY_KEY_SECRET is not set on server.");
      }
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigBuf = Buffer.from(razorpay_signature || "", "utf8");
      const expBuf = Buffer.from(expected, "utf8");
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new HttpsError("permission-denied", "Invalid Razorpay payment signature.");
      }
    }

    const orderRef = db.collection("orders").doc(firestore_order_id);
    await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order record not found.");
      }
      const orderData = orderSnap.data()!;
      if (orderData.payment_status === "paid") {
        return;
      }

      const items = (orderData.items || []) as { product_id: string; quantity: number }[];
      for (const item of items) {
        const prodRef = db.collection("products").doc(item.product_id);
        const prodSnap = await tx.get(prodRef);
        if (prodSnap.exists) {
          const currentStock = Number(prodSnap.data()?.stock_quantity ?? 0);
          const nextStock = Math.max(0, currentStock - Number(item.quantity || 1));
          tx.update(prodRef, {
            stock_quantity: nextStock,
            availability_status: nextStock > 0 ? "available" : "out_of_stock",
            updated_at: new Date().toISOString()
          });
        }
      }

      tx.update(orderRef, {
        status: "confirmed",
        payment_status: isTestMode ? "paid_test_mode" : "paid",
        razorpay_order_id,
        razorpay_payment_id,
        updated_at: new Date().toISOString()
      });
    });

    return {
      verified: true,
      test_mode: isTestMode,
      firestore_order_id,
      razorpay_payment_id
    };
  }
);

/**
 * 3. Razorpay Server Webhook Handler (verifies x-razorpay-signature)
 */
export const razorpayWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const webhookSecret =
      RAZORPAY_WEBHOOK_SECRET.value() || process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] as string | undefined;

    if (!webhookSecret || !signature) {
      res.status(400).send("Webhook secret or signature missing.");
      return;
    }

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSig) {
      res.status(401).send("Invalid webhook signature.");
      return;
    }

    const event = req.body;
    if (event?.event === "payment.captured") {
      const rzpOrderId = event.payload?.payment?.entity?.order_id;
      const rzpPaymentId = event.payload?.payment?.entity?.id;
      if (rzpOrderId) {
        const snap = await db
          .collection("orders")
          .where("razorpay_order_id", "==", rzpOrderId)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0]!.ref.update({
            status: "confirmed",
            payment_status: "paid",
            razorpay_payment_id: rzpPaymentId,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

/**
 * 4. Admin Role Assignment Callable Function (protected by Admin check)
 */
export const setAdminRole = onCall({ cors: true }, async (request) => {
  await assertAdmin(request.auth?.uid, request.auth?.token);
  const { target_uid, is_admin } = request.data as {
    target_uid?: string;
    is_admin?: boolean;
  };

  if (!target_uid) {
    throw new HttpsError("invalid-argument", "target_uid is required.");
  }

  const role = is_admin ? "admin" : "customer";
  await admin.auth().setCustomUserClaims(target_uid, { admin: Boolean(is_admin) });
  await db.collection("users").doc(target_uid).set(
    {
      role,
      updated_at: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true, target_uid, role };
});
