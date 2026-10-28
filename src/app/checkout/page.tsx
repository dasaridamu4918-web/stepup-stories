import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getProductBySlug,
  getPublishedProducts,
  getRazorpayConfigStatus,
  isOnlinePaymentProviderConfigured
} from "@/lib/repository";
import { ProductCheckoutFlow } from "@/components/ProductCheckoutFlow";

export const metadata: Metadata = {
  title: "Timepiece Checkout",
  description:
    "Complete your STEPUP STORIES watch order with Indian delivery address support and INR pricing."
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams?: {
    product?: string;
    qty?: string;
  };
}) {
  const products = await getPublishedProducts();
  const requestedSlug = searchParams?.product?.trim() || "";
  const selectedProduct =
    (requestedSlug ? await getProductBySlug(requestedSlug) : null) ??
    products[0] ??
    null;

  const initialQty = Math.max(1, Number(searchParams?.qty || 1) || 1);

  return (
    <div className="bg-obsidian py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              STEPUP STORIES — Direct Checkout
            </p>
            <h1 className="mt-2 font-serif text-3xl text-cream sm:text-5xl">
              Complete Your Order
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders/track"
              className="btn-luxury rounded border border-gold/40 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-bright hover:bg-gold/10"
            >
              Track Existing Order
            </Link>
            <Link
              href="/catalog"
              className="btn-luxury rounded border border-gold/25 bg-obsidian px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cream-secondary hover:text-gold-bright"
            >
              Browse All Timepieces
            </Link>
          </div>
        </div>

        {selectedProduct ? (
          <ProductCheckoutFlow
            product={selectedProduct}
            onlinePaymentConfigured={isOnlinePaymentProviderConfigured()}
            razorpayMode={getRazorpayConfigStatus().mode}
            initialQuantity={initialQty}
          />
        ) : (
          <div className="rounded-xl border border-gold/25 bg-surface p-10 text-center">
            <p className="font-serif text-2xl text-cream">
              No Timepiece Selected
            </p>
            <p className="mt-2 text-sm text-cream-secondary">
              Please select a timepiece from our catalog to proceed to checkout.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex rounded bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian"
            >
              Explore Timepieces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
