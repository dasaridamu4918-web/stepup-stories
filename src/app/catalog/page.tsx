import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedCollections, getPublishedProducts } from "@/lib/repository";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Timepiece Archive & Catalog",
  description:
    "Browse and filter the complete STEPUP STORIES timepiece archive by collection, availability, or search query."
};

export const revalidate = 60;

export default async function CatalogPage() {
  const [collections, products] = await Promise.all([
    getPublishedCollections(),
    getPublishedProducts()
  ]);

  return (
    <div>
      <section className="border-b border-gold/20 bg-charcoal py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Complete Archive
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-cream sm:text-5xl">
            Explore Timepieces
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-cream-secondary">
            Filter by collection or search by timepiece name. Select any piece to view its full profile or request a private consultation.
          </p>
        </div>
      </section>

      <section className="bg-obsidian py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div
                role="status"
                aria-live="polite"
                className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-[440px] animate-pulse rounded-lg border border-gold/20 bg-surface p-6"
                  />
                ))}
              </div>
            }
          >
            <CatalogExplorer collections={collections} products={products} />
          </Suspense>
        </div>
      </section>

      <NewsletterForm source="catalog_page" />
    </div>
  );
}
