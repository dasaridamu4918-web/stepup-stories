import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderPaidByProvider } from "@/lib/repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      store_order_id?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      product_name?: string;
      product_slug?: string;
      product_id?: string;
      quantity?: number;
      address_line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };

    const orderId = (body.razorpay_order_id || "").trim();
    const paymentId = (body.razorpay_payment_id || "").trim();
    const signature = (body.razorpay_signature || "").trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keySecret) {
      return NextResponse.json(
        {
          verified: false,
          error: "RAZORPAY_KEY_SECRET is not configured on the server."
        },
        { status: 503, headers: corsHeaders }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    const isValid =
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      return NextResponse.json(
        { verified: false, error: "Invalid Razorpay payment signature." },
        { status: 400, headers: corsHeaders }
      );
    }

    const updatedOrder = await markOrderPaidByProvider({
      orderId: body.store_order_id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      verifiedSource: "signature",
      customerName: body.customer_name,
      customerEmail: body.customer_email,
      customerPhone: body.customer_phone,
      productName: body.product_name,
      productSlug: body.product_slug,
      productId: body.product_id,
      quantity: body.quantity,
      addressLine1: body.address_line1,
      city: body.city,
      state: body.state,
      pincode: body.pincode
    });

    const isTestMode = !(process.env.RAZORPAY_KEY_ID || "")
      .trim()
      .startsWith("rzp_live_");

    return NextResponse.json(
      {
        verified: true,
        test_mode: isTestMode,
        order_id: orderId,
        payment_id: paymentId,
        store_order: updatedOrder,
        verified_at: new Date().toISOString()
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
