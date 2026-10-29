import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processRazorpayWebhookEvent } from "@/lib/repository";

interface RazorpayWebhookPayload {
  event?: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        email?: string;
        contact?: string;
        description?: string;
        created_at?: number;
        error_description?: string | null;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        amount_paid?: number;
        status?: string;
        receipt?: string;
        created_at?: number;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
        created_at?: number;
        notes?: Record<string, string>;
      };
    };
  };
}

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";

  const hasKeyId = Boolean(keyId);
  const hasKeySecret = Boolean(keySecret);
  const hasWebhookSecret = Boolean(webhookSecret);
  const keyIdAndSecretSeparate =
    hasKeyId &&
    hasKeySecret &&
    keyId !== keySecret &&
    !keyId.includes(":") &&
    !keySecret.includes(":");

  const missingVariables: string[] = [];
  if (!hasKeyId) missingVariables.push("RAZORPAY_KEY_ID");
  if (!hasKeySecret) missingVariables.push("RAZORPAY_KEY_SECRET");
  if (!hasWebhookSecret) missingVariables.push("RAZORPAY_WEBHOOK_SECRET");

  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/razorpay/webhook",
      environment_status: {
        RAZORPAY_KEY_ID: hasKeyId,
        RAZORPAY_KEY_SECRET: hasKeySecret,
        RAZORPAY_WEBHOOK_SECRET: hasWebhookSecret
      },
      online_checkout_ready: hasKeyId && hasKeySecret,
      webhook_ready: hasWebhookSecret,
      key_id_and_secret_separate: keyIdAndSecretSeparate,
      missing_variables: missingVariables,
      mode: hasKeyId && keyId.startsWith("rzp_live_") ? "live" : "test"
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "RAZORPAY_WEBHOOK_SECRET is not configured on the server."
        },
        { status: 503 }
      );
    }

    // 1. Read the exact raw request body before any JSON parsing
    const rawBody = await request.text();
    const signature = (
      request.headers.get("x-razorpay-signature") || ""
    ).trim();
    const eventId = (request.headers.get("x-razorpay-event-id") || "").trim();

    if (!rawBody) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid Razorpay webhook request: empty request body."
        },
        { status: 400 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid Razorpay webhook signature: missing x-razorpay-signature header."
        },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature from raw request body using RAZORPAY_WEBHOOK_SECRET
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid Razorpay webhook signature: HMAC-SHA256 verification failed."
        },
        { status: 400 }
      );
    }

    // 3. Parse verified JSON payload
    let parsed: RazorpayWebhookPayload;
    try {
      parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Malformed JSON in verified webhook request body."
        },
        { status: 400 }
      );
    }

    const eventType = String(parsed.event || "").trim();
    if (!eventType) {
      return NextResponse.json(
        { ok: false, error: "Missing event type in Razorpay webhook payload." },
        { status: 400 }
      );
    }

    const paymentEntity = parsed.payload?.payment?.entity;
    const orderEntity = parsed.payload?.order?.entity;
    const refundEntity = parsed.payload?.refund?.entity;

    const mergedNotes: Record<string, string> = {
      ...(orderEntity?.notes || {}),
      ...(paymentEntity?.notes || {}),
      ...(refundEntity?.notes || {})
    };

    const razorpayOrderId =
      paymentEntity?.order_id ||
      orderEntity?.id ||
      refundEntity?.order_id ||
      mergedNotes.razorpay_order_id ||
      undefined;
    const razorpayPaymentId =
      paymentEntity?.id ||
      refundEntity?.payment_id ||
      mergedNotes.razorpay_payment_id ||
      undefined;
    const razorpayRefundId = refundEntity?.id || undefined;
    const storeOrderId =
      mergedNotes.store_order_id || mergedNotes.order_id || undefined;

    const amountPaise =
      typeof paymentEntity?.amount === "number"
        ? paymentEntity.amount
        : typeof orderEntity?.amount_paid === "number" &&
            orderEntity.amount_paid > 0
          ? orderEntity.amount_paid
          : typeof orderEntity?.amount === "number"
            ? orderEntity.amount
            : typeof refundEntity?.amount === "number"
              ? refundEntity.amount
              : undefined;

    const customerName =
      mergedNotes.customer_name || mergedNotes.name || undefined;
    const customerEmail =
      paymentEntity?.email ||
      mergedNotes.customer_email ||
      mergedNotes.email ||
      undefined;
    const customerPhone =
      paymentEntity?.contact ||
      mergedNotes.customer_phone ||
      mergedNotes.phone ||
      undefined;
    const productName =
      mergedNotes.product_name ||
      mergedNotes.product ||
      paymentEntity?.description ||
      undefined;
    const productSlug = mergedNotes.product_slug || undefined;
    const productId = mergedNotes.product_id || undefined;
    const quantity = mergedNotes.quantity
      ? Number(mergedNotes.quantity)
      : undefined;
    const createdAtUnix =
      paymentEntity?.created_at ||
      orderEntity?.created_at ||
      refundEntity?.created_at ||
      parsed.created_at ||
      undefined;

    // 4. Process verified webhook event (handles duplicates & out-of-order delivery)
    const result = await processRazorpayWebhookEvent({
      eventId,
      eventType,
      storeOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpayRefundId,
      amountPaise,
      errorDescription: paymentEntity?.error_description ?? null,
      customerName,
      customerEmail,
      customerPhone,
      productName,
      productSlug,
      productId,
      quantity,
      createdAtUnix,
      addressLine1: mergedNotes.address_line1,
      city: mergedNotes.city,
      state: mergedNotes.state,
      pincode: mergedNotes.pincode
    });

    // Return HTTP 200 ONLY after successfully processing a verified event
    if (!result.handled) {
      return NextResponse.json(
        {
          ok: false,
          event: eventType,
          error: result.reason || "Unable to process webhook event."
        },
        { status: 400 }
      );
    }

    const order = result.order;

    return NextResponse.json(
      {
        ok: true,
        event: eventType,
        handled: true,
        duplicate: result.duplicate,
        out_of_order: Boolean(result.outOfOrder),
        order_number: order?.order_number ?? null,
        razorpay_payment_id:
          order?.razorpay_payment_id ?? razorpayPaymentId ?? null,
        razorpay_order_id:
          order?.razorpay_order_id ?? razorpayOrderId ?? null,
        customer_name: order?.customer_name ?? null,
        customer_email: order?.customer_email ?? null,
        customer_phone: order?.customer_phone ?? null,
        product_name:
          order?.product_name ??
          order?.items.map((i) => i.name).join(", ") ??
          null,
        amount: order?.amount ?? order?.final_total ?? null,
        payment_status: order?.payment_status ?? null,
        order_status: order?.order_status ?? null,
        created_at: order?.created_at ?? null
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed."
      },
      { status: 500 }
    );
  }
}
