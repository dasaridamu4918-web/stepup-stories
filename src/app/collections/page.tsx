import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedCollections, getPublishedProducts } from "@/lib/repository";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Curated Collections",
  description:
    "Explore the five timepiece collections of STEPUP STORIES: Signature, Automatic Classics, Modern Minimal, Limited Editions, and Everyday Icons."
};

export const revalidate = 60;

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([
    getPublishedCollections(),
    getPublishedProducts()
  ]);

  return (
    <div>
      <section className="border-b border-gold/20 bg-charcoal py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Horological Pillars
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-cream sm:text-5xl">
            The Collections
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream-secondary">
            Five distinct expressions of the STEPUP STORIES philosophy—each defined by geometric restraint, warm champagne-gold accents, and enduring presence.
          </p>
        </div>
      </section>

      <section className="bg-obsidian py-16 sm:py-24">
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          {collections.map((col, idx) => {
            const count = products.filter(
              (p) => p.collection_id === col.id || p.collection?.slug === col.slug
            ).length;

            return (
              <article
                key={col.id}
                className="grid grid-cols-1 items-center gap-10 rounded-2xl border border-gold/25 bg-surface p-6 shadow-2xl lg:grid-cols-12 sm:p-10"
              >
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-gold/30 bg-obsidian lg:col-span-5 ${
                    idx % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  {col.cover_image_url && (
                    <Image
                      src={col.cover_image_url}
                      alt={col.cover_image_alt || col.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                </div>

                <div
                  className={`lg:col-span-7 ${
                    idx % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {col.subtitle && (
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                        {col.subtitle}
                      </span>
                    )}
                    {count > 0 && (
                      <span className="rounded-full border border-gold/30 bg-obsidian px-3 py-0.5 text-[11px] uppercase tracking-[0.14em] text-gold-bright">
                        {count} {count === 1 ? "Timepiece" : "Timepieces"}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 font-serif text-3xl text-cream sm:text-4xl">
                    {col.name}
                  </h2>

                  {col.description && (
                    <p className="mt-4 text-base leading-relaxed text-cream-secondary">
                      {col.description}
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      href={`/catalog?collection=${encodeURIComponent(col.slug)}`}
                      className="inline-flex rounded bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:bg-gold-bright"
                    >
                      Explore {col.name} Timepieces
                    </Link>
                    <Link
                      href={`/concierge?type=private_viewing`}
                      className="inline-flex rounded border border-gold/45 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright transition hover:border-gold-bright hover:bg-gold/10"
                    >
                      Book a Private Viewing
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <NewsletterForm source="collections_page" />
    </div>
  );
}
