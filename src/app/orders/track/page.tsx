"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { OrderStatusStage, StoreOrderRecord } from "@/types/database";

const STAGE_LABELS: Record<OrderStatusStage, string> = {
  new: "New (Order Received)",
  confirmed: "Confirmed",
  processing: "Processing & Quality Check",
  shipped: "Shipped via Insured Courier",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested"
};

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function OrderTrackClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order_number") || ""
  );
  const [contact, setContact] = useState(
    searchParams.get("phone") || searchParams.get("email") || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<StoreOrderRecord | null>(null);

  const lookupOrder = async (ordNum: string, contactVal: string) => {
    const cleanOrd = ordNum.trim().toUpperCase();
    const cleanContact = contactVal.trim();
    if (!cleanOrd || !cleanContact) {
      setError(
        "Please enter both your Order Number and the Phone Number or Email used at checkout."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ order_number: cleanOrd });
      if (cleanContact.includes("@")) {
        qs.set("email", cleanContact.toLowerCase());
      } else {
        qs.set("phone", cleanContact.replace(/\D/g, ""));
      }

      const res = await fetch(`/api/orders?${qs.toString()}`, {
        cache: "no-store"
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoreOrderRecord;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.order) {
        setOrder(null);
        setError(
          data.error ||
            "No matching order found. Please check your Order Number and contact details."
        );
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Unable to look up order status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialOrd = searchParams.get("order_number");
    const initialContact =
      searchParams.get("phone") || searchParams.get("email");
    if (initialOrd && initialContact) {
      void lookupOrder(initialOrd, initialContact);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lookupOrder(orderNumber, contact);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
        Client Order Portal
      </p>
      <h1 className="mt-2 font-serif text-3xl text-cream sm:text-5xl">
        Track Your Order Status
      </h1>
      <p className="mt-2 text-sm text-cream-secondary">
        Enter your Order Number and the mobile number or email address used
        during checkout. For your privacy, orders are visible only when both
        match.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-gold/30 bg-surface p-6 sm:grid-cols-12"
      >
        <div className="sm:col-span-5">
          <label
            htmlFor="track-order-number"
            className="block text-xs uppercase tracking-wider text-gold"
          >
            Order Number *
          </label>
          <input
            id="track-order-number"
            type="text"
            required
            placeholder="SUS-20261028-1234"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-cream"
          />
        </div>

        <div className="sm:col-span-5">
          <label
            htmlFor="track-contact"
            className="block text-xs uppercase tracking-wider text-gold"
          >
            Mobile Number or Email *
          </label>
          <input
            id="track-contact"
            type="text"
            required
            placeholder="9876543210 or email@example.com"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2.5 text-sm text-cream"
          />
        </div>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gold py-2.5 text-xs font-semibold uppercase tracking-wider text-obsidian hover:bg-gold-bright disabled:opacity-50"
          >
            {loading ? "Checking..." : "Track"}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-burgundy-bright bg-burgundy/25 px-4 py-3 text-xs text-[#ffb3c1]"
        >
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-6 rounded-xl border border-gold/35 bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 pb-5">
            <div>
              <p className="font-mono text-lg font-bold text-gold-bright">
                {order.order_number}
              </p>
              <p className="text-xs text-cream-muted">
                Placed on {new Date(order.created_at).toLocaleString("en-IN")}
              </p>
            </div>
            <span className="rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-bright">
              {STAGE_LABELS[order.order_status] ?? order.order_status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gold">
                Items &amp; Total
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-cream">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.name} &times; {item.quantity}
                    </span>
                    <span className="font-mono text-gold-bright">
                      {formatInr(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-gold/15 pt-2 text-xs text-cream-secondary">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatInr(order.item_subtotal)}</span>
                </div>
                {order.discount_total > 0 && (
                  <div className="flex justify-between text-gold-bright">
                    <span>Discount</span>
                    <span>&minus;{formatInr(order.discount_total)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between text-sm font-bold text-cream">
                  <span>Total</span>
                  <span className="text-gold-bright">
                    {formatInr(order.final_total)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gold">
                Shipping &amp; Tracking
              </h2>
              <p className="mt-2 text-xs text-cream">
                {order.delivery_address.address_line1}
                {order.delivery_address.address_line2
                  ? `, ${order.delivery_address.address_line2}`
                  : ""}
                , {order.delivery_address.city}, {order.delivery_address.state}{" "}
                &ndash; {order.delivery_address.pincode}
              </p>
              <p className="mt-2 text-xs text-cream-secondary">
                Payment: {order.payment_method.toUpperCase()} (
                {order.payment_status.toUpperCase()})
              </p>
              {(order.courier_name || order.tracking_number) && (
                <p className="mt-2 rounded border border-gold/30 bg-obsidian p-2.5 font-mono text-xs text-gold-bright">
                  Courier: {order.courier_name || "Assigned"} &bull; Tracking:{" "}
                  {order.tracking_number || "Pending"}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gold/15 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold">
              Order Timeline
            </h3>
            <div className="mt-3 space-y-2">
              {order.status_history.map((h, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between rounded border border-gold/15 bg-obsidian/60 px-3.5 py-2 text-xs"
                >
                  <span className="font-semibold uppercase text-cream">
                    {STAGE_LABELS[h.to_status] ?? h.to_status}
                  </span>
                  <span className="text-cream-muted">
                    {new Date(h.changed_at).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-xs text-cream-muted">
        <Link href="/catalog" className="text-gold-bright underline">
          &larr; Return to Timepiece Catalog
        </Link>
      </div>
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <div className="bg-obsidian">
      <Suspense fallback={<div className="p-12 text-center text-xs text-cream-muted">Loading order tracker...</div>}>
        <OrderTrackClient />
      </Suspense>
    </div>
  );
}
