import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { CollectionRecord, SiteSettingsRecord } from "@/types/database";

export function SiteFooter({
  settings,
  collections
}: {
  settings: SiteSettingsRecord;
  collections: CollectionRecord[];
}) {
  const hasContactDetails = Boolean(
    settings.contact_email ||
      settings.contact_phone ||
      settings.address ||
      settings.opening_hours
  );
  const hasSocialLinks =
    Array.isArray(settings.social_links) && settings.social_links.length > 0;

  return (
    <footer className="border-t border-gold/25 bg-[#050709] text-cream-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/assets/brand/logo.jpg"
                alt={`${settings.business_name} Emblem`}
                width={160}
                height={90}
                className="mb-4 rounded border border-gold/25 object-cover"
              />
            </Link>
            <p className="font-serif text-xl tracking-[0.16em] text-gold">
              {settings.business_name}
            </p>
            {settings.footer_text && (
              <p className="mt-3 text-sm leading-relaxed text-cream-muted">
                {settings.footer_text}
              </p>
            )}
          </div>

          {/* Collections Column */}
          <div>
            <h2 className="font-serif text-lg font-medium tracking-wider text-gold-bright">
              Collections
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {collections.map((col) => (
                <li key={col.id}>
                  <Link
                    href={`/catalog?collection=${encodeURIComponent(col.slug)}`}
                    className="transition hover:text-gold-bright"
                  >
                    {col.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation & Concierge */}
          <div>
            <h2 className="font-serif text-lg font-medium tracking-wider text-gold-bright">
              Maison &amp; Concierge
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/catalog" className="transition hover:text-gold-bright">
                  Timepiece Archive
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-gold-bright">
                  Brand Story &amp; Craft
                </Link>
              </li>
              <li>
                <Link
                  href="/concierge?type=private_viewing"
                  className="transition hover:text-gold-bright"
                >
                  Book a Private Viewing
                </Link>
              </li>
              <li>
                <Link href="/concierge" className="transition hover:text-gold-bright">
                  Concierge Enquiry
                </Link>
              </li>
            </ul>
          </div>

          {/* Dynamic Business Contact & Socials (Hides empty fields automatically) */}
          <div>
            <h2 className="font-serif text-lg font-medium tracking-wider text-gold-bright">
              Private Salon
            </h2>
            {hasContactDetails ? (
              <ul className="mt-4 space-y-2.5 text-sm">
                {settings.address && <li>{settings.address}</li>}
                {settings.contact_email && (
                  <li>
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="text-gold transition hover:text-gold-bright"
                    >
                      {settings.contact_email}
                    </a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li>
                    <a
                      href={`tel:${settings.contact_phone}`}
                      className="transition hover:text-gold-bright"
                    >
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
                {settings.opening_hours && (
                  <li className="text-cream-muted">{settings.opening_hours}</li>
                )}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-cream-muted">
                Private consultations and timepiece viewings are arranged by appointment through our online concierge.
              </p>
            )}

            {hasSocialLinks && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Connect</p>
                <ul className="mt-2 flex flex-wrap gap-4 text-sm">
                  {settings.social_links.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-gold/40 underline-offset-4 transition hover:text-gold-bright"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gold/15 pt-8 text-xs text-cream-muted sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings.business_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/concierge" className="hover:text-gold-bright">
              Enquiries
            </Link>
            <Link href="/admin" className="hover:text-gold-bright">
              Maison Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
