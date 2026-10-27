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
      amount_inr?: number;
      receipt?: string;
      customer_name?: string;
      customer_phone?: string;
    };

    const amountInr = Number(body.amount_inr ?? 0);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount in INR." },
        { status: 400, headers: corsHeaders }
      );
    }

    const amountPaise = Math.round(amountInr * 100);
    const receipt = body.receipt || `stepup_${Date.now()}`;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live/test Razorpay credentials are not configured yet, return a clearly marked
    // TEST MODE order payload so the mobile checkout flow works safely without secrets in the app.
    if (!keyId || !keySecret) {
      const testOrderId = `order_test_${crypto.randomBytes(8).toString("hex")}`;
      return NextResponse.json(
        {
          test_mode: true,
          mode_label: "TEST MODE (Simulated Razorpay Sandbox — Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET on server for live gateway)",
          razorpay_key_id: "rzp_test_simulated_sandbox",
          order_id: testOrderId,
          amount: amountPaise,
          amount_inr: amountInr,
          currency: "INR",
          receipt
        },
        { status: 200, headers: corsHeaders }
      );
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          store: "STEPUP STORIES",
          customer_name: body.customer_name || "",
          customer_phone: body.customer_phone || ""
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Failed to create Razorpay order.", details: errText },
        { status: 502, headers: corsHeaders }
      );
    }

    const orderData = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
    };

    const isTestKey = keyId.startsWith("rzp_test_");

    return NextResponse.json(
      {
        test_mode: isTestKey,
        mode_label: isTestKey ? "TEST MODE (Razorpay Test Key)" : "LIVE MODE",
        razorpay_key_id: keyId,
        order_id: orderData.id,
        amount: orderData.amount,
        amount_inr: amountInr,
        currency: orderData.currency,
        receipt: orderData.receipt
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initialize payment order."
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
