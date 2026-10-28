import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  createStoreOrder,
  getAdminDashboardData,
  isOnlinePaymentProviderConfigured
} from "@/lib/repository";
import { createStoreOrderSchema } from "@/lib/validations";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request.headers.get("authorization"));

  if (auth.authorized) {
    const data = await getAdminDashboardData();
    return NextResponse.json(
      {
        ok: true,
        onlinePaymentConfigured: isOnlinePaymentProviderConfigured(),
        orders: data.orders,
        customers: data.customers
      },
      { status: 200, headers: corsHeaders }
    );
  }

  // Non-admin lookup: a customer can see ONLY their own order when providing
  // both their order_number AND their matching phone number or email address.
  const orderNumber = request.nextUrl.searchParams
    .get("order_number")
    ?.trim()
    .toUpperCase();
  const phone = request.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
  const email = request.nextUrl.searchParams
    .get("email")
    ?.trim()
    .toLowerCase();

  if (!orderNumber || (!phone && !email)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Unauthorized. Admin credentials or matching order_number and customer contact are required."
      },
      { status: 401, headers: corsHeaders }
    );
  }

  const data = await getAdminDashboardData();
  const matchedOrder = data.orders.find((order) => {
    if (order.order_number.toUpperCase() !== orderNumber) return false;
    const orderPhone = order.customer_phone.replace(/\D/g, "");
    const orderEmail = (order.customer_email || "").trim().toLowerCase();
    const phoneMatch = Boolean(
      phone && phone.length >= 10 && orderPhone.endsWith(phone.slice(-10))
    );
    const emailMatch = Boolean(email && orderEmail && orderEmail === email);
    return phoneMatch || emailMatch;
  });

  if (!matchedOrder) {
    return NextResponse.json(
      { ok: false, error: "Order not found or contact details do not match." },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { ok: true, order: matchedOrder },
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createStoreOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check your delivery details and order items.",
          issues: parsed.error.flatten()
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      parsed.data.source === "website" &&
      parsed.data.payment_method === "razorpay" &&
      !isOnlinePaymentProviderConfigured()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Online payment provider (Razorpay) is not configured on the server yet. Please use Cash on Delivery (COD)."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const order = await createStoreOrder(parsed.data);

    return NextResponse.json(
      {
        ok: true,
        order
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unable to place order."
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
