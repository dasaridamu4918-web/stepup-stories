import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductRecord } from "@/types/database";

const availabilityBadgeMap: Record<
  ProductRecord["availability_status"],
  { label: string; className: string }
> = {
  available: {
    label: "Available for Enquiry",
    className: "border-gold/40 bg-obsidian/85 text-gold-bright"
  },
  private_viewing_only: {
    label: "By Private Viewing",
    className: "border-burgundy-bright/50 bg-burgundy/80 text-cream"
  },
  waitlist: {
    label: "Register Interest",
    className: "border-gold/30 bg-charcoal/90 text-cream-secondary"
  },
  archived: {
    label: "Archived Edition",
    className: "border-white/15 bg-charcoal/90 text-cream-muted"
  }
};

export function ProductCard({ product }: { product: ProductRecord }) {
  const primaryImage =
    product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

  const formattedPrice =
    product.price_display ||
    (typeof product.price_amount === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: product.price_currency || "INR",
          maximumFractionDigits: 0
        }).format(product.price_amount)
      : null);

  const formattedOriginalPrice =
    typeof product.original_price_amount === "number" &&
    product.original_price_amount > 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: product.price_currency || "INR",
          maximumFractionDigits: 0
        }).format(product.original_price_amount)
      : null;

  const discountBadge =
    typeof product.discount_percent === "number" && product.discount_percent > 0
      ? `${product.discount_percent}% OFF`
      : null;

  const badge =
    availabilityBadgeMap[product.availability_status] ?? availabilityBadgeMap.available;

  return (
    <article className="card-luxury group flex h-full flex-col overflow-hidden rounded-lg border border-gold/25 bg-surface">
      {/* Image Slot: Shows real uploaded watch photo if present, or a clean, unlabelled neutral studio frame */}
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="relative aspect-[4/5] w-full overflow-hidden border-b border-gold/20 bg-gradient-to-b from-[#13181f] via-[#0c1015] to-[#07090c]"
        aria-label={`View ${product.name}`}
      >
        <span
          className={`absolute left-3.5 top-3.5 z-10 rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] backdrop-blur-sm ${badge.className}`}
        >
          {badge.label}
        </span>

        {discountBadge && (
          <span className="absolute right-3.5 top-3.5 z-10 rounded border border-gold/50 bg-burgundy/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold-bright backdrop-blur-sm">
            {discountBadge}
          </span>
        )}

        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035] group-focus-within:scale-[1.02]"
          />
        ) : (
          /* Neutral, unlabelled architectural frame (never an AI watch) when no photo is uploaded yet */
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center p-8"
          >
            <div className="relative flex h-44 w-44 items-center justify-center">
              <div className="absolute inset-0 rotate-45 rounded-xl border border-gold/20 bg-obsidian/40" />
              <div className="h-32 w-32 rounded-full border border-gold/25 bg-gradient-to-br from-gold/5 to-transparent" />
              <div className="h-2 w-2 rounded-full bg-burgundy-bright/70" />
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {product.collection && (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
              {product.collection.name}
            </p>
          )}
          <h3 className="mt-1.5 font-serif text-2xl font-medium text-cream">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="transition hover:text-gold-bright"
            >
              {product.name}
            </Link>
          </h3>
          {product.reference_code && (
            <p className="mt-0.5 font-mono text-xs text-cream-muted">
              {product.reference_code}
            </p>
          )}
          {product.short_description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream-secondary">
              {product.short_description}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-gold/15 pt-4">
          {formattedPrice ? (
            <div className="flex flex-wrap items-baseline gap-2">
              {formattedOriginalPrice && (
                <span className="text-xs text-cream-muted line-through">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-base font-semibold tracking-wider text-gold-bright">
                {formattedPrice}
              </span>
              {discountBadge && (
                <span className="rounded border border-gold/40 bg-burgundy/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-bright">
                  {discountBadge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs uppercase tracking-[0.14em] text-cream-muted">
              Private Concierge
            </span>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${encodeURIComponent(product.slug)}`}
              className="btn-luxury rounded border border-gold/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-bright hover:border-gold-bright hover:bg-gold/10"
            >
              Details
            </Link>
            <Link
              href={`/concierge?product=${encodeURIComponent(product.slug)}&name=${encodeURIComponent(product.name)}`}
              className="btn-luxury rounded bg-gold px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-obsidian hover:bg-gold-bright"
            >
              Enquire
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
