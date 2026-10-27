import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getFeaturedProducts,
  getPublishedCollections,
  getSiteSettings
} from "@/lib/repository";
import { HeroEmblemMedia } from "@/components/HeroEmblemMedia";
import { ScrollStorySequence } from "@/components/ScrollStorySequence";
import { ProductCard } from "@/components/ProductCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { HorizontalCarousel } from "@/components/HorizontalCarousel";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, collections, featuredProducts] = await Promise.all([
    getSiteSettings(),
    getPublishedCollections(),
    getFeaturedProducts()
  ]);

  const heroBackdrop =
    settings.hero_backdrop_url || "/images/generated/hero-backdrop.webp";
  const storyBackdrop =
    settings.story_backdrop_url || "/images/generated/story-craftsmanship.webp";

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden border-b border-gold/25 bg-obsidian py-16 sm:py-24 lg:py-28"
      >
        {/* Replaceable Editorial Backdrop with WCAG AA Gradient Scrim */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={heroBackdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/90 to-obsidian/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/60" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <RevealOnScroll className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/35 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-bright">
              <span className="h-2 w-2 rounded-full bg-burgundy-bright" aria-hidden="true" />
              <span>{settings.business_name} HOROLOGY</span>
            </div>

            <h1
              id="hero-heading"
              className="mt-6 font-serif text-4xl font-medium leading-[1.08] tracking-tight text-cream sm:text-5xl lg:text-6xl"
            >
              {settings.hero_headline || "Timepieces Crafted for Defining Moments"}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream-secondary sm:text-lg">
              {settings.hero_subheadline ||
                "Explore the curated collections of STEPUP STORIES. Designed with architectural precision, understated warmth, and enduring character."}
            </p>

            {/* Two Primary Hero Actions required */}
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/collections"
                className="btn-luxury inline-flex items-center justify-center rounded bg-gradient-to-r from-gold-bright to-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian shadow-lg hover:brightness-110"
              >
                Explore Collections
              </Link>
              <Link
                href="/concierge?type=private_viewing"
                className="btn-luxury inline-flex items-center justify-center rounded border border-gold/60 bg-obsidian/65 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright backdrop-blur-sm hover:border-gold-bright hover:bg-gold/15"
              >
                Book a Private Viewing
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={100} className="lg:col-span-5">
            <HeroEmblemMedia />
          </RevealOnScroll>
        </div>
      </section>

      {/* 2. PRESERVED 240-FRAME SCROLL-CONTROLLED SEQUENCE STORY */}
      <ScrollStorySequence />

      {/* 3. CURATED COLLECTIONS SECTION (Smooth Horizontal Carousel) */}
      <section
        id="collections"
        aria-labelledby="home-collections-heading"
        className="border-b border-gold/20 bg-obsidian py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                  Curated Pillars
                </p>
                <h2
                  id="home-collections-heading"
                  className="mt-2 font-serif text-3xl text-cream sm:text-4xl"
                >
                  The Five Collections
                </h2>
              </div>
              <Link
                href="/collections"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright underline decoration-gold/50 underline-offset-8 transition-colors hover:text-cream"
              >
                View All Collections &rarr;
              </Link>
            </div>

            <div className="mt-8">
              <HorizontalCarousel
                ariaLabel="Curated watch collections"
                itemClassName="w-[80vw] sm:w-[300px] lg:w-[270px]"
              >
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/catalog?collection=${encodeURIComponent(col.slug)}`}
                    className="card-luxury group relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-xl border border-gold/25 bg-surface p-6"
                  >
                    {col.cover_image_url && (
                      <Image
                        src={col.cover_image_url}
                        alt={col.cover_image_alt || col.name}
                        fill
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 320px, 280px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-within:scale-[1.02]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent" />
                    <div className="relative z-10">
                      {col.subtitle && (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
                          {col.subtitle}
                        </p>
                      )}
                      <h3 className="mt-1 font-serif text-2xl font-medium text-cream">
                        {col.name}
                      </h3>
                      {col.description && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-cream-secondary">
                          {col.description}
                        </p>
                      )}
                      <span className="mt-4 inline-block border-b border-gold/50 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-bright transition-colors group-hover:border-gold-bright">
                        Explore {col.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </HorizontalCarousel>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 4. FEATURED WATCHES (Smooth Horizontal Carousel) */}
      <section
        id="featured"
        aria-labelledby="home-featured-heading"
        className="border-b border-gold/20 bg-charcoal py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                  Curator&apos;s Selection
                </p>
                <h2
                  id="home-featured-heading"
                  className="mt-2 font-serif text-3xl text-cream sm:text-4xl"
                >
                  Featured Timepieces
                </h2>
              </div>
              <Link
                href="/catalog"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright underline decoration-gold/50 underline-offset-8 transition-colors hover:text-cream"
              >
                Browse Complete Archive &rarr;
              </Link>
            </div>

            <div className="mt-8">
              <HorizontalCarousel
                ariaLabel="Featured timepieces"
                itemClassName="w-[84vw] sm:w-[330px] lg:w-[300px]"
              >
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </HorizontalCarousel>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 5. CONCISE BRAND STORY SECTION */}
      <section
        id="story"
        aria-labelledby="home-story-heading"
        className="relative overflow-hidden bg-obsidian py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <RevealOnScroll className="lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gold/40 bg-charcoal shadow-2xl">
              <Image
                src={storyBackdrop}
                alt="Abstract dark leather, velvet, and brushed champagne-gold craftsmanship textures"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-lg border border-gold/30 bg-obsidian/85 p-3 backdrop-blur-md">
                <Image
                  src="/assets/brand/logo.jpg"
                  alt="STEPUP STORIES Octagonal Crest"
                  width={64}
                  height={36}
                  className="rounded border border-gold/25 object-cover"
                />
                <span className="text-xs text-cream-secondary">
                  The Octagonal Crest &amp; Ascent Monogram of {settings.business_name}
                </span>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={80} className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Our Heritage &amp; Philosophy
            </p>
            <h2
              id="home-story-heading"
              className="mt-2 font-serif text-3xl text-cream sm:text-4xl lg:text-5xl"
            >
              {settings.about_story_title || "The Architecture of Personal Ascent"}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-cream-secondary sm:text-lg">
              {settings.about_story_body}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-lg border border-gold/25 bg-surface p-5">
                <h3 className="font-serif text-xl text-gold-bright">Octagonal Poise</h3>
                <p className="mt-1.5 text-sm text-cream-secondary">
                  Balanced proportions framed in warm champagne-gold tones and deep charcoal surfaces.
                </p>
              </div>
              <div className="rounded-lg border border-gold/25 bg-surface p-5">
                <h3 className="font-serif text-xl text-gold-bright">Private Concierge</h3>
                <p className="mt-1.5 text-sm text-cream-secondary">
                  Personal consultations and private viewings tailored to each collector.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="btn-luxury inline-flex rounded border border-gold/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright hover:bg-gold hover:text-obsidian"
              >
                Read the Full Story
              </Link>
              <Link
                href="/concierge?type=private_viewing"
                className="btn-luxury inline-flex rounded bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian hover:bg-gold-bright"
              >
                Book a Private Viewing
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 6. NEWSLETTER SIGNUP SECTION */}
      <RevealOnScroll>
        <NewsletterForm source="home_page" />
      </RevealOnScroll>
    </div>
  );
}
