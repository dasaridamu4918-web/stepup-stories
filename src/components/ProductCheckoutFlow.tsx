"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductRecord, StoreOrderRecord } from "@/types/database";

const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function ProductCheckoutFlow({
  product,
  onlinePaymentConfigured,
  razorpayMode = "test",
  initialQuantity = 1
}: {
  product: ProductRecord;
  onlinePaymentConfigured: boolean;
  razorpayMode?: "test" | "live";
  initialQuantity?: number;
}) {
  const maxStock = Math.max(0, product.stock_count ?? 10);
  const isOutOfStock =
    maxStock <= 0 || product.availability_status === "archived";

  const unitSalePrice =
    typeof product.price_amount === "number" && product.price_amount > 0
      ? product.price_amount
      : 0;
  const unitOriginalPrice =
    typeof product.original_price_amount === "number" &&
    product.original_price_amount > unitSalePrice
      ? product.original_price_amount
      : unitSalePrice;
  const unitSavings = Math.max(0, unitOriginalPrice - unitSalePrice);
  const discountPercent =
    unitOriginalPrice > unitSalePrice
      ? Math.round(((unitOriginalPrice - unitSalePrice) / unitOriginalPrice) * 100)
      : 0;

  const [quantity, setQuantity] = useState<number>(
    Math.min(Math.max(1, initialQuantity), Math.max(1, maxStock))
  );
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">(
    onlinePaymentConfigured ? "razorpay" : "cod"
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrderRecord | null>(
    null
  );

  const primaryImage =
    product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

  const subtotalAmount = unitOriginalPrice * quantity;
  const discountTotal = unitSavings * quantity;
  const deliveryFee = 0;
  const finalTotal = unitSalePrice * quantity + deliveryFee;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isOutOfStock) {
      setErrorMessage("This timepiece is currently out of stock.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setErrorMessage(
        "Please enter a valid 10-digit Indian mobile number (starting with 6–9)."
      );
      return;
    }

    const cleanPin = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    if (paymentMethod === "razorpay" && !onlinePaymentConfigured) {
      setErrorMessage(
        "Online payment is not configured on the server yet. Please choose Cash on Delivery (COD)."
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the order record on the server first.
      // The server looks up the product in the trusted backend catalog and calculates
      // the authoritative INR total (never trusting browser-supplied amounts).
      // Orders always start with payment_status = 'pending'.
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: cleanPhone,
          delivery_address: {
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim(),
            landmark: landmark.trim(),
            city: city.trim(),
            state: stateName,
            pincode: cleanPin
          },
          items: [
            {
              product_id: product.id,
              slug: product.slug,
              name: product.name,
              collection_name: product.collection?.name ?? null,
              selected_options: null,
              quantity,
              unit_price: unitSalePrice,
              original_unit_price: unitOriginalPrice,
              image_url: primaryImage?.url ?? null
            }
          ],
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          payment_reference: "",
          source: "website"
        })
      });

      const orderData = (await orderRes.json()) as {
        ok?: boolean;
        order?: StoreOrderRecord;
        error?: string;
      };

      if (!orderRes.ok || !orderData.ok || !orderData.order) {
        setErrorMessage(
          orderData.error ||
            "Please check your delivery details and try again."
        );
        setSubmitting(false);
        return;
      }

      const createdOrder = orderData.order;

      // 2. If Cash on Delivery, show order confirmation immediately
      if (paymentMethod === "cod") {
        setConfirmedOrder(createdOrder);
        setSubmitting(false);
        return;
      }

      // 3. Create the Razorpay order on the server using the trusted server order ID & total
      const rzpInitRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_order_id: createdOrder.id,
          receipt: createdOrder.order_number,
          customer_name: createdOrder.customer_name,
          customer_phone: createdOrder.customer_phone
        })
      });

      const rzpInitData = (await rzpInitRes.json()) as {
        ok?: boolean;
        order_id?: string;
        razorpay_key_id?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };

      if (
        !rzpInitRes.ok ||
        !rzpInitData.order_id ||
        !rzpInitData.razorpay_key_id
      ) {
        setErrorMessage(
          rzpInitData.error ||
            `Order ${createdOrder.order_number} was saved with Pending payment status, but online payment could not be initialized.`
        );
        setConfirmedOrder(createdOrder);
        setSubmitting(false);
        return;
      }

      createdOrder.payment_reference = rzpInitData.order_id;

      // 4. Open Razorpay Standard Checkout and verify the HMAC signature on the server
      // before marking the order as paid.
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        setErrorMessage(
          `Order ${createdOrder.order_number} was saved with Pending payment status, but the Razorpay Standard Checkout script could not be loaded.`
        );
        setConfirmedOrder(createdOrder);
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: rzpInitData.razorpay_key_id,
        amount: rzpInitData.amount ?? Math.round(createdOrder.final_total * 100),
        currency: rzpInitData.currency || "INR",
        name: "STEPUP STORIES",
        description: `${product.name} (Qty ${quantity}) — ${createdOrder.order_number}`,
        order_id: rzpInitData.order_id,
        prefill: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          contact: cleanPhone
        },
        notes: {
          store_order_id: createdOrder.id,
          order_number: createdOrder.order_number
        },
        theme: {
          color: "#D4B475"
        },
        modal: {
          ondismiss: () => {
            setConfirmedOrder(createdOrder);
            setSubmitting(false);
          }
        },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          // Do not treat the browser callback alone as proof of payment:
          // verify the HMAC-SHA256 signature on the server before marking the order paid.
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              store_order_id: createdOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = (await verifyRes.json()) as {
            verified?: boolean;
            store_order?: StoreOrderRecord;
          };
          if (verifyRes.ok && verifyData.verified && verifyData.store_order) {
            setConfirmedOrder(verifyData.store_order);
          } else {
            setConfirmedOrder(createdOrder);
          }
          setSubmitting(false);
        }
      });

      rzp.open();
    } catch {
      setErrorMessage("Network error while placing your order. Please try again.");
      setSubmitting(false);
    }
  };

  // ============================================================================
  // ORDER CONFIRMATION VIEW
  // ============================================================================
  if (confirmedOrder) {
    return (
      <div
        role="region"
        aria-labelledby="order-confirmation-heading"
        className="rounded-2xl border border-gold bg-surface p-6 shadow-2xl sm:p-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/25 pb-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-bright">
              <span className="h-2 w-2 rounded-full bg-gold-bright" />
              Order Confirmed
            </span>
            <h3
              id="order-confirmation-heading"
              className="mt-3 font-serif text-3xl text-cream sm:text-4xl"
            >
              Thank You, {confirmedOrder.customer_name}
            </h3>
            <p className="mt-1 text-sm text-cream-secondary">
              Your order has been recorded in the STEPUP STORIES system and our
              fulfillment team has been alerted.
            </p>
          </div>

          <div className="rounded-xl border border-gold/40 bg-obsidian px-5 py-4 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-cream-muted">
              Order Number
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-gold-bright sm:text-2xl">
              {confirmedOrder.order_number}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Order & Payment Summary */}
          <div className="rounded-xl border border-gold/20 bg-obsidian/70 p-5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Order &amp; Payment Summary
            </h4>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-cream-muted">Order Date</dt>
                <dd className="text-cream">
                  {new Date(confirmedOrder.created_at).toLocaleString("en-IN")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-muted">Timepiece</dt>
                <dd className="font-medium text-cream">
                  {product.name} &times; {quantity}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-muted">Item Subtotal</dt>
                <dd className="text-cream">
                  {formatInr(confirmedOrder.item_subtotal)}
                </dd>
              </div>
              {confirmedOrder.discount_total > 0 && (
                <div className="flex justify-between">
                  <dt className="text-cream-muted">Savings / Discount</dt>
                  <dd className="text-gold-bright">
                    &minus;{formatInr(confirmedOrder.discount_total)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-cream-muted">Delivery Fee</dt>
                <dd className="text-cream">
                  {confirmedOrder.delivery_fee === 0
                    ? "Complimentary (₹0)"
                    : formatInr(confirmedOrder.delivery_fee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gold/20 pt-2.5 text-base font-bold">
                <dt className="text-cream">Order Total</dt>
                <dd className="text-gold-bright">
                  {formatInr(confirmedOrder.final_total)}
                </dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-cream-muted">Payment Method</dt>
                <dd className="uppercase text-cream">
                  {confirmedOrder.payment_method === "cod"
                    ? "Cash on Delivery (COD)"
                    : "Online Payment (Razorpay)"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-muted">Payment Status</dt>
                <dd className="font-semibold uppercase text-gold-bright">
                  {confirmedOrder.payment_status === "paid"
                    ? "Paid (Server Signature / Webhook Verified)"
                    : confirmedOrder.payment_status === "failed"
                      ? "Payment Failed"
                      : "Pending Provider Confirmation"}
                </dd>
              </div>
              {confirmedOrder.payment_reference && (
                <div className="flex justify-between gap-3">
                  <dt className="text-cream-muted">Razorpay Reference</dt>
                  <dd className="text-right font-mono text-xs text-cream">
                    {confirmedOrder.payment_reference}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-cream-muted">Order Stage</dt>
                <dd className="uppercase text-cream">
                  {confirmedOrder.order_status}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery Destination */}
          <div className="rounded-xl border border-gold/20 bg-obsidian/70 p-5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Indian Delivery Address
            </h4>
            <div className="mt-4 space-y-1.5 text-sm text-cream-secondary">
              <p className="font-semibold text-cream">
                {confirmedOrder.customer_name}
              </p>
              <p>{confirmedOrder.delivery_address.address_line1}</p>
              {confirmedOrder.delivery_address.address_line2 && (
                <p>{confirmedOrder.delivery_address.address_line2}</p>
              )}
              {confirmedOrder.delivery_address.landmark && (
                <p>Landmark: {confirmedOrder.delivery_address.landmark}</p>
              )}
              <p>
                {confirmedOrder.delivery_address.city},{" "}
                {confirmedOrder.delivery_address.state} &ndash;{" "}
                {confirmedOrder.delivery_address.pincode}
              </p>
              <p className="pt-2 text-xs text-cream-muted">
                Phone: +91 {confirmedOrder.customer_phone} &bull; Email:{" "}
                {confirmedOrder.customer_email}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-gold/15 pt-4">
              <Link
                href={`/orders/track?order_number=${encodeURIComponent(confirmedOrder.order_number)}&phone=${encodeURIComponent(confirmedOrder.customer_phone)}`}
                className="btn-luxury rounded bg-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-obsidian hover:bg-gold-bright"
              >
                Track Order Status
              </Link>
              <Link
                href="/catalog"
                className="btn-luxury rounded border border-gold/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-bright hover:bg-gold/10"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CHECKOUT FORM VIEW
  // ============================================================================
  return (
    <div className="rounded-2xl border border-gold/30 bg-surface p-6 shadow-2xl sm:p-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Column: Selected Watch & Live Price / Discount / Total Breakdown */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Direct Timepiece Acquisition
            </p>
            <h3 className="mt-1 font-serif text-2xl text-cream sm:text-3xl">
              Order Summary
            </h3>
          </div>

          {/* Selected Product Card */}
          <div className="flex gap-4 rounded-xl border border-gold/25 bg-obsidian/80 p-4">
            {primaryImage ? (
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded border border-gold/25 bg-charcoal">
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt_text || product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="flex-1">
              {product.collection && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  {product.collection.name}
                </p>
              )}
              <h4 className="mt-0.5 font-serif text-lg text-cream">
                {product.name}
              </h4>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                {unitOriginalPrice > unitSalePrice && (
                  <span className="text-xs text-cream-muted line-through">
                    {formatInr(unitOriginalPrice)}
                  </span>
                )}
                <span className="text-base font-bold text-gold-bright">
                  {formatInr(unitSalePrice)}
                </span>
                {discountPercent > 0 && (
                  <span className="rounded border border-gold/40 bg-burgundy/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gold-bright">
                    About {discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-cream-muted">
                {isOutOfStock
                  ? "Currently Out of Stock"
                  : `In Stock (${maxStock} available)`}
              </p>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-obsidian/70 px-4 py-3.5">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cream">
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded border border-gold/40 bg-surface text-sm font-bold text-gold-bright hover:bg-gold/15 disabled:opacity-40"
              >
                &minus;
              </button>
              <span
                aria-live="polite"
                className="min-w-[2rem] text-center font-mono text-sm font-bold text-cream"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= maxStock || isOutOfStock}
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                className="flex h-8 w-8 items-center justify-center rounded border border-gold/40 bg-surface text-sm font-bold text-gold-bright hover:bg-gold/15 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Price, Discount & Order Total Breakdown */}
          <div className="rounded-xl border border-gold/25 bg-obsidian/80 p-5">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between text-cream-secondary">
                <dt>
                  Original Price ({quantity} &times;{" "}
                  {formatInr(unitOriginalPrice)})
                </dt>
                <dd>{formatInr(subtotalAmount)}</dd>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-gold-bright">
                  <dt>Savings / Discount</dt>
                  <dd>&minus;{formatInr(discountTotal)}</dd>
                </div>
              )}

              <div className="flex justify-between text-cream-secondary">
                <dt>Selling Price ({quantity} item{quantity > 1 ? "s" : ""})</dt>
                <dd>{formatInr(unitSalePrice * quantity)}</dd>
              </div>

              <div className="flex justify-between text-cream-secondary">
                <dt>Insured Delivery Across India</dt>
                <dd className="text-gold-bright">Complimentary (₹0)</dd>
              </div>

              <div className="flex justify-between border-t border-gold/25 pt-3 text-lg font-bold text-cream">
                <dt>Order Total</dt>
                <dd className="text-gold-bright">{formatInr(finalTotal)}</dd>
              </div>
            </dl>
          </div>

          {/* Separate Concierge & Private Viewing Options */}
          <div className="rounded-xl border border-gold/20 bg-obsidian/50 p-4 text-xs text-cream-secondary">
            <p className="font-semibold uppercase tracking-wider text-gold">
              Prefer a Private Appointment?
            </p>
            <p className="mt-1">
              You may also book an in-person private viewing or speak with our
              general concierge separately:
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/concierge?type=private_viewing&product=${encodeURIComponent(product.slug)}&name=${encodeURIComponent(product.name)}`}
                className="underline decoration-gold/50 underline-offset-4 hover:text-gold-bright"
              >
                Book a Private Viewing &rarr;
              </Link>
              <Link
                href="/concierge"
                className="underline decoration-gold/50 underline-offset-4 hover:text-gold-bright"
              >
                General Concierge &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Contact, Indian Shipping Address & Payment Method */}
        <form
          onSubmit={handlePlaceOrder}
          className="space-y-5 lg:col-span-7"
          noValidate
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Step 1 &amp; 2 — Delivery &amp; Payment
            </p>
            <h3 className="mt-1 font-serif text-2xl text-cream sm:text-3xl">
              Shipping &amp; Checkout Details
            </h3>
            <p className="mt-1 text-xs text-cream-muted">
              We collect only the contact and Indian delivery details required
              to ship and fulfill your order.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-burgundy-bright bg-burgundy/25 px-4 py-3 text-xs text-[#ffb3c1]"
            >
              {errorMessage}
            </div>
          )}

          {/* Customer Contact Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="checkout-full-name"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Full Name *
              </label>
              <input
                id="checkout-full-name"
                type="text"
                required
                placeholder="Aarav Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-email"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Email Address *
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                placeholder="aarav@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-phone"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Mobile Number (+91) *
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                placeholder="9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>
          </div>

          {/* Indian Delivery Address Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkout-line1"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Flat, House No., Building *
              </label>
              <input
                id="checkout-line1"
                type="text"
                required
                placeholder="Apartment 4B, Imperial Tower"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-line2"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Street, Area, Locality
              </label>
              <input
                id="checkout-line2"
                type="text"
                placeholder="Marine Drive, Nariman Point"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label
                htmlFor="checkout-landmark"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                Landmark (Optional)
              </label>
              <input
                id="checkout-landmark"
                type="text"
                placeholder="Near NCPA"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-city"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                City / Town *
              </label>
              <input
                id="checkout-city"
                type="text"
                required
                placeholder="Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-state"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                State / UT *
              </label>
              <select
                id="checkout-state"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3 py-2.5 text-sm text-cream"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="checkout-pincode"
                className="block text-xs uppercase tracking-wider text-gold"
              >
                PIN Code *
              </label>
              <input
                id="checkout-pincode"
                type="text"
                required
                maxLength={6}
                placeholder="400021"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-cream"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="pt-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gold">
              Payment Method
            </span>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Option 1: Cash on Delivery */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === "cod"
                    ? "border-gold bg-gold/15"
                    : "border-gold/25 bg-obsidian/70 hover:border-gold/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-1"
                />
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-cream">
                    Cash on Delivery (COD)
                  </span>
                  <span className="mt-1 block text-xs text-cream-secondary">
                    Pay {formatInr(finalTotal)} in Indian Rupees upon insured
                    doorstep delivery.
                  </span>
                </div>
              </label>

              {/* Option 2: Online Payment (Offered ONLY when payment provider is configured on server) */}
              {onlinePaymentConfigured ? (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    paymentMethod === "razorpay"
                      ? "border-gold bg-gold/15"
                      : "border-gold/25 bg-obsidian/70 hover:border-gold/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="mt-1"
                  />
                  <div>
                    <span className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-cream">
                      Online Payment (Razorpay)
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          razorpayMode === "live"
                            ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                            : "border border-gold/50 bg-gold/20 text-gold-bright"
                        }`}
                      >
                        {razorpayMode === "live" ? "LIVE MODE" : "TEST MODE"}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-cream-secondary">
                      Razorpay Standard Checkout (INR) — UPI, Cards &amp;
                      NetBanking. Server-calculated amount &amp; HMAC signature
                      verified before marking paid.
                    </span>
                  </div>
                </label>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-gold/15 bg-obsidian/40 p-4 opacity-80">
                  <input
                    type="radio"
                    disabled
                    checked={false}
                    readOnly
                    className="mt-1"
                  />
                  <div>
                    <span className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-cream-muted">
                      Online Payment (Razorpay)
                      <span className="rounded border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-bright">
                        TEST MODE (Awaiting Keys)
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] text-cream-muted">
                      Razorpay Standard Checkout activates automatically once{" "}
                      <code className="text-gold">RAZORPAY_KEY_ID</code>,{" "}
                      <code className="text-gold">RAZORPAY_KEY_SECRET</code>{" "}
                      &amp;{" "}
                      <code className="text-gold">RAZORPAY_WEBHOOK_SECRET</code>{" "}
                      are set in Vercel server environment variables.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isOutOfStock}
            className="btn-luxury w-full rounded bg-gradient-to-r from-gold-bright to-gold py-4 text-xs font-semibold uppercase tracking-[0.18em] text-obsidian shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {isOutOfStock
              ? "Out of Stock"
              : submitting
                ? "Processing Your Order..."
                : `Complete Order • ${formatInr(finalTotal)}`}
          </button>

          <p className="text-center text-[11px] text-cream-muted">
            STEPUP STORIES never stores card numbers, CVV codes, or payment
            secrets. Already placed an order?{" "}
            <Link
              href="/orders/track"
              className="text-gold-bright underline underline-offset-4"
            >
              Track your order status
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
