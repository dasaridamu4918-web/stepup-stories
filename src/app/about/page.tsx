import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/repository";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Brand Story & Horological Philosophy",
  description:
    "Discover the heritage, octagonal emblem, and design philosophy of STEPUP STORIES."
};

export const revalidate = 60;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const storyBackdrop =
    settings.story_backdrop_url || "/images/generated/story-craftsmanship.webp";

  return (
    <div>
      <section className="relative overflow-hidden border-b border-gold/25 bg-charcoal py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={storyBackdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/90 to-obsidian/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            The Maison
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-cream sm:text-5xl lg:text-6xl">
            {settings.about_story_title || "The Architecture of Personal Ascent"}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream-secondary">
            {settings.tagline || "Every Second Marks an Ascent"}
          </p>
        </div>
      </section>

      <section className="bg-obsidian py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-gold/40 bg-[#080b0c] shadow-2xl">
              <Image
                src="/assets/brand/logo.jpg"
                alt={`${settings.business_name} Official Octagonal Crest`}
                width={640}
                height={360}
                className="h-auto w-full object-cover"
              />
              <div className="border-t border-gold/25 p-4 text-xs text-cream-secondary">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-burgundy-bright" />
                The Octagonal Crest &amp; Ascent Monogram of {settings.business_name}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <h2 className="font-serif text-3xl text-cream sm:text-4xl">
              Crafted for Chapters of Growth
            </h2>
            <p className="text-base leading-relaxed text-cream-secondary">
              {settings.about_story_body}
            </p>

            <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gold/25 bg-surface p-6">
                <h3 className="font-serif text-xl text-gold-bright">
                  Geometric Restraint
                </h3>
                <p className="mt-2 text-sm text-cream-secondary">
                  Architectural lines inspired by our octagonal crest and ascending step monogram.
                </p>
              </div>
              <div className="rounded-xl border border-gold/25 bg-surface p-6">
                <h3 className="font-serif text-xl text-gold-bright">
                  Enduring Clarity
                </h3>
                <p className="mt-2 text-sm text-cream-secondary">
                  Balanced dial layouts pairing warm champagne-gold indices with deep obsidian contrast.
                </p>
              </div>
              <div className="rounded-xl border border-gold/25 bg-surface p-6">
                <h3 className="font-serif text-xl text-gold-bright">
                  Bespoke Attention
                </h3>
                <p className="mt-2 text-sm text-cream-secondary">
                  Every acquisition is guided personally through our private concierge.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/concierge?type=private_viewing"
                className="inline-flex rounded bg-gold px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:bg-gold-bright"
              >
                Arrange a Private Viewing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NewsletterForm source="about_page" />
    </div>
  );
}
