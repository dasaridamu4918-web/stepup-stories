import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getPublishedProducts,
  getRazorpayConfigStatus,
  getSiteSettings,
  isOnlinePaymentProviderConfigured
} from "@/lib/repository";
import { ProductDetailGallery } from "@/components/ProductDetailGallery";
import { ProductCheckoutFlow } from "@/components/ProductCheckoutFlow";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return { title: "Timepiece Not Found" };
  }

  return {
    title: product.name,
    description:
      product.short_description ||
      product.description ||
      `${product.name} from STEPUP STORIES.`,
    openGraph: {
      title: product.name,
      description:
        product.short_description || `${product.name} — STEPUP STORIES`,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined
    }
  };
}

const availabilityLabels: Record<string, string> = {
  available: "In Stock • Ready for Insured Delivery",
  private_viewing_only: "Available Exclusively by Private Viewing",
  waitlist: "Edition Waitlist Open",
  archived: "Archived Collector Piece"
};

export default async function ProductDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const [product, settings] = await Promise.all([
    getProductBySlug(params.slug),
    getSiteSettings()
  ]);

  if (!product) {
    notFound();
  }

  // Only show specifications that have real non-empty key & value in the database
  const validSpecs = (product.specs ?? []).filter(
    (s) => Boolean(s.key?.trim() && s.value?.trim())
  );

  // Only show price if a real price or price_display exists in the database
  const formattedPrice =
    product.price_display?.trim() ||
    (typeof product.price_amount === "number" && product.price_amount > 0
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

  // Structured data (JSON-LD) only using real fields that exist in the database
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: {
      "@type": "Brand",
      name: settings.business_name
    },
    ...(product.description ? { description: product.description } : {}),
    ...(product.reference_code ? { sku: product.reference_code } : {}),
    ...(product.images.length > 0
      ? { image: product.images.map((img) => img.url) }
      : {}),
    ...(typeof product.price_amount === "number" && product.price_amount > 0
      ? {
          offers: {
            "@type": "Offer",
            price: product.price_amount,
            priceCurrency: product.price_currency || "INR",
            availability:
              product.availability_status === "available"
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder"
          }
        }
      : {})
  };

  return (
    <div className="bg-obsidian py-12 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs uppercase tracking-[0.16em] text-cream-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-gold-bright">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/catalog" className="hover:text-gold-bright">
                Timepieces
              </Link>
            </li>
            {product.collection && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/catalog?collection=${encodeURIComponent(product.collection.slug)}`}
                    className="hover:text-gold-bright"
                  >
                    {product.collection.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-gold-bright" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Gallery Column */}
          <div className="lg:col-span-6">
            <ProductDetailGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Details Column */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {product.collection && (
                <Link
                  href={`/catalog?collection=${encodeURIComponent(product.collection.slug)}`}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
                >
                  {product.collection.name} Collection
                </Link>
              )}
              {product.reference_code && (
                <span className="font-mono text-xs text-cream-muted">
                  {product.reference_code}
                </span>
              )}
            </div>

            <h1 className="mt-2 font-serif text-4xl font-medium text-cream sm:text-5xl">
              {product.name}
            </h1>

            {/* Availability Status Pill */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-gold-bright">
              <span className="h-2 w-2 rounded-full bg-burgundy-bright" aria-hidden="true" />
              <span>
                {availabilityLabels[product.availability_status] ??
                  "Available for Concierge Enquiry"}
              </span>
            </div>

            {/* Price (Only rendered if present in database) */}
            {formattedPrice && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {formattedOriginalPrice && (
                  <span className="font-serif text-xl text-cream-muted line-through">
                    {formattedOriginalPrice}
                  </span>
                )}
                <p className="font-serif text-3xl font-semibold text-gold-bright">
                  {formattedPrice}
                </p>
                {discountBadge && (
                  <span className="rounded border border-gold/50 bg-burgundy/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">
                    {discountBadge}
                  </span>
                )}
                {product.savings_label && (
                  <span className="rounded border border-gold/45 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">
                    {product.savings_label}
                  </span>
                )}
              </div>
            )}

            {product.description && (
              <p className="mt-6 text-base leading-relaxed text-cream-secondary">
                {product.description}
              </p>
            )}

            {/* Specifications Table (Only rendered when real specifications exist in DB) */}
            {validSpecs.length > 0 && (
              <div className="mt-8 rounded-xl border border-gold/25 bg-surface p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Specifications
                </h2>
                <dl className="mt-4 divide-y divide-gold/15 text-sm">
                  {validSpecs.map((spec) => (
                    <div
                      key={spec.key}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <dt className="text-cream-muted">{spec.key}</dt>
                      <dd className="text-right font-medium text-cream">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Primary Actions */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a
                href="#checkout-section"
                className="btn-luxury inline-flex items-center justify-center rounded bg-gradient-to-r from-gold-bright to-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:brightness-110"
              >
                Buy Now
              </a>
              <Link
                href={`/concierge?type=private_viewing&product=${encodeURIComponent(product.slug)}&name=${encodeURIComponent(product.name)}`}
                className="btn-luxury inline-flex items-center justify-center rounded border border-gold/50 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright hover:bg-gold/10"
              >
                Book a Private Viewing
              </Link>
              <Link
                href="/concierge"
                className="btn-luxury inline-flex items-center justify-center rounded border border-gold/25 bg-surface px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-cream-secondary hover:border-gold hover:text-gold-bright"
              >
                General Concierge
              </Link>
            </div>
          </div>
        </div>

        {/* Direct Checkout Flow on the Product Detail page */}
        <section
          id="checkout-section"
          aria-labelledby="product-checkout-heading"
          className="mt-20 scroll-mt-24 border-t border-gold/20 pt-16"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Direct Online Checkout
            </p>
            <h2
              id="product-checkout-heading"
              className="mt-2 font-serif text-3xl text-cream sm:text-4xl"
            >
              Buy {product.name}
            </h2>
            <p className="mt-2 mb-8 text-sm text-cream-secondary">
              Select your quantity, review your savings and order total in Indian Rupees (₹), and enter your Indian delivery address below to complete your order.
            </p>

            <ProductCheckoutFlow
              product={product}
              onlinePaymentConfigured={isOnlinePaymentProviderConfigured()}
              razorpayMode={getRazorpayConfigStatus().mode}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
