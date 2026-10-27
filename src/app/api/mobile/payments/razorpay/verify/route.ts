import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      test_mode?: boolean;
    };

    const orderId = body.razorpay_order_id || "";
    const paymentId = body.razorpay_payment_id || "";
    const signature = body.razorpay_signature || "";

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { verified: false, error: "Missing order_id or payment_id." },
        { status: 400, headers: corsHeaders }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Simulated test mode verification when server secrets are not configured yet
    if (!keySecret && orderId.startsWith("order_test_")) {
      return NextResponse.json(
        {
          verified: true,
          test_mode: true,
          order_id: orderId,
          payment_id: paymentId,
          verified_at: new Date().toISOString()
        },
        { status: 200, headers: corsHeaders }
      );
    }

    if (!keySecret) {
      return NextResponse.json(
        {
          verified: false,
          error: "RAZORPAY_KEY_SECRET is not configured on the server."
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8")
      );

    if (!isValid) {
      return NextResponse.json(
        { verified: false, error: "Invalid Razorpay payment signature." },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        verified: true,
        test_mode: (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_"),
        order_id: orderId,
        payment_id: paymentId,
        verified_at: new Date().toISOString()
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        verified: false,
        error: error instanceof Error ? error.message : "Payment verification failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
