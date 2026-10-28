import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processRazorpayWebhookEvent } from "@/lib/repository";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
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
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        status?: string;
      };
    };
  };
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

    // 1. Read the exact raw request body for HMAC-SHA256 verification
    const rawBody = await request.text();
    const signature = (
      request.headers.get("x-razorpay-signature") || ""
    ).trim();
    const eventId = (request.headers.get("x-razorpay-event-id") || "").trim();

    if (!rawBody || !signature) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing raw request body or x-razorpay-signature header."
        },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature using the raw request body and RAZORPAY_WEBHOOK_SECRET
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
        { ok: false, error: "Invalid Razorpay webhook signature." },
        { status: 400 }
      );
    }

    // 3. Parse verified JSON payload
    const parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const eventType = String(parsed.event || "").trim();

    if (!eventType) {
      return NextResponse.json(
        { ok: false, error: "Missing event type in webhook payload." },
        { status: 400 }
      );
    }

    const paymentEntity = parsed.payload?.payment?.entity;
    const orderEntity = parsed.payload?.order?.entity;
    const refundEntity = parsed.payload?.refund?.entity;

    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || undefined;
    const razorpayPaymentId =
      paymentEntity?.id || refundEntity?.payment_id || undefined;
    const razorpayRefundId = refundEntity?.id || undefined;
    const storeOrderId =
      paymentEntity?.notes?.store_order_id ||
      orderEntity?.notes?.store_order_id ||
      undefined;
    const amountPaise =
      typeof paymentEntity?.amount === "number"
        ? paymentEntity.amount
        : typeof orderEntity?.amount_paid === "number" &&
            orderEntity.amount_paid > 0
          ? orderEntity.amount_paid
          : typeof orderEntity?.amount === "number"
            ? orderEntity.amount
            : undefined;

    // 4. Process webhook event idempotently and update matching order
    const result = await processRazorpayWebhookEvent({
      eventId,
      eventType,
      storeOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpayRefundId,
      amountPaise,
      errorDescription: paymentEntity?.error_description ?? null
    });

    if (
      !result.handled &&
      result.reason?.startsWith("Webhook amount mismatch")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: result.reason
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        event: eventType,
        handled: result.handled,
        duplicate: result.duplicate,
        order_number: result.order?.order_number ?? null,
        payment_status: result.order?.payment_status ?? null,
        order_status: result.order?.order_status ?? null
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
