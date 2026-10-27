import { httpsCallable } from "firebase/functions";
import { functions, isFirebaseConfigured } from "./firebase";
import { WEBSITE_BASE_URL } from "../data/seedCatalog";

export interface RazorpayOrderSession {
  test_mode: boolean;
  mode_label: string;
  razorpay_key_id: string;
  order_id: string;
  amount: number; // in paise
  amount_inr: number; // in INR
  currency: "INR";
  receipt: string;
}

export interface RazorpayVerifyResult {
  verified: boolean;
  test_mode: boolean;
  order_id: string;
  payment_id: string;
  error?: string;
}

/**
 * Requests a Razorpay order from the backend server (Firebase Cloud Functions or STEPUP STORIES Next.js API).
 * Secret keys (RAZORPAY_KEY_SECRET) remain strictly on the server in environment variables.
 */
export async function createServerRazorpayOrder(params: {
  items: { product_id: string; quantity: number }[];
  amount_inr: number;
  customer_name: string;
  customer_phone: string;
}): Promise<RazorpayOrderSession> {
  const receipt = `stepup_${Date.now()}`;

  // 1. Try Firebase Cloud Function if Firebase is configured
  if (isFirebaseConfigured && functions) {
    try {
      const callable = httpsCallable<
        { items: { product_id: string; quantity: number }[]; receipt: string },
        RazorpayOrderSession
      >(functions, "createRazorpayOrder");
      const res = await callable({ items: params.items, receipt });
      return res.data;
    } catch {
      // Fall through to Next.js API endpoint
    }
  }

  // 2. Call STEPUP STORIES Website Backend API (/api/mobile/payments/razorpay/create-order)
  try {
    const res = await fetch(
      `${WEBSITE_BASE_URL}/api/mobile/payments/razorpay/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_inr: params.amount_inr,
          receipt,
          customer_name: params.customer_name,
          customer_phone: params.customer_phone
        })
      }
    );

    if (res.ok) {
      return (await res.json()) as RazorpayOrderSession;
    }
  } catch {
    // Offline / local fallback in clearly labeled TEST MODE
  }

  // 3. Clearly marked TEST MODE fallback when offline or before server keys are configured
  return {
    test_mode: true,
    mode_label:
      "TEST MODE — Simulated Razorpay Sandbox (Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET on server for live gateway)",
    razorpay_key_id: "rzp_test_simulated_sandbox",
    order_id: `order_test_${Date.now()}`,
    amount: Math.round(params.amount_inr * 100),
    amount_inr: params.amount_inr,
    currency: "INR",
    receipt
  };
}

/**
 * Verifies a Razorpay payment signature on the server.
 */
export async function verifyServerRazorpayPayment(params: {
  firestore_order_id?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<RazorpayVerifyResult> {
  if (isFirebaseConfigured && functions && params.firestore_order_id) {
    try {
      const callable = httpsCallable<typeof params, RazorpayVerifyResult>(
        functions,
        "verifyRazorpayPayment"
      );
      const res = await callable(params);
      return res.data;
    } catch {
      // Fall through to Next.js verification route
    }
  }

  try {
    const res = await fetch(`${WEBSITE_BASE_URL}/api/mobile/payments/razorpay/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return (await res.json()) as RazorpayVerifyResult;
    }
  } catch {
    // Fall through if offline in test mode
  }

  if (params.razorpay_order_id.startsWith("order_test_")) {
    return {
      verified: true,
      test_mode: true,
      order_id: params.razorpay_order_id,
      payment_id: params.razorpay_payment_id
    };
  }

  return {
    verified: false,
    test_mode: true,
    order_id: params.razorpay_order_id,
    payment_id: params.razorpay_payment_id,
    error: "Could not verify payment signature with server."
  };
}
