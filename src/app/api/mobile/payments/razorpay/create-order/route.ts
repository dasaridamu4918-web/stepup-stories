import { NextRequest, NextResponse } from "next/server";
import {
  attachRazorpayOrderToStoreOrder,
  calculateTrustedOrderPricing,
  getStoreOrderById
} from "@/lib/repository";

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
      items?: {
        product_id?: string;
        slug?: string;
        quantity?: number;
      }[];
      product_id?: string;
      slug?: string;
      quantity?: number;
      delivery_fee?: number;
      receipt?: string;
      customer_name?: string;
      customer_phone?: string;
    };

    let amountInr = 0;
    let existingOrder = null;

    if (body.store_order_id && body.store_order_id.trim()) {
      existingOrder = await getStoreOrderById(body.store_order_id.trim());
      if (!existingOrder) {
        return NextResponse.json(
          {
            ok: false,
            error: "Order not found in the trusted backend."
          },
          { status: 404, headers: corsHeaders }
        );
      }
      amountInr = existingOrder.final_total;
    } else {
      const requestedItems = Array.isArray(body.items)
        ? body.items
        : body.product_id || body.slug
          ? [
              {
                product_id: body.product_id || "",
                slug: body.slug || "",
                quantity: body.quantity ?? 1
              }
            ]
          : [];

      if (requestedItems.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Trusted server order reference (store_order_id) or catalog items are required to calculate the order total on the server. Browser-supplied amounts are never trusted."
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const pricing = await calculateTrustedOrderPricing({
        items: requestedItems.map((i) => ({
          product_id: String(i.product_id || ""),
          slug: String(i.slug || ""),
          quantity: Math.max(1, Math.floor(Number(i.quantity) || 1))
        })),
        delivery_fee: body.delivery_fee,
        decrementStock: false
      });
      amountInr = pricing.finalTotal;
    }

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid server-calculated order amount in INR." },
        { status: 400, headers: corsHeaders }
      );
    }

    const amountPaise = Math.round(amountInr * 100);
    const receipt =
      body.receipt ||
      existingOrder?.order_number ||
      `stepup_${Date.now()}`;

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          test_mode: true,
          error:
            "Razorpay server credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in server environment variables."
        },
        { status: 503, headers: corsHeaders }
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
          store_order_id: existingOrder?.id || "",
          order_number: existingOrder?.order_number || "",
          customer_name:
            body.customer_name || existingOrder?.customer_name || "",
          customer_phone:
            body.customer_phone || existingOrder?.customer_phone || ""
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to create Razorpay order with payment provider."
        },
        { status: 502, headers: corsHeaders }
      );
    }

    const orderData = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
    };

    if (existingOrder) {
      await attachRazorpayOrderToStoreOrder(existingOrder.id, orderData.id);
    }

    const isTestKey = !keyId.startsWith("rzp_live_");

    return NextResponse.json(
      {
        ok: true,
        configured: true,
        test_mode: isTestKey,
        mode_label: isTestKey
          ? "TEST MODE (Razorpay Test Credentials)"
          : "LIVE MODE",
        razorpay_key_id: keyId,
        order_id: orderData.id,
        store_order_id: existingOrder?.id ?? null,
        amount: orderData.amount,
        amount_inr: amountInr,
        currency: orderData.currency || "INR",
        receipt: orderData.receipt || receipt
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment order."
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
