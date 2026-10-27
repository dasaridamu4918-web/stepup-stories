import React from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/repository";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Private Concierge & Viewing Appointments",
  description:
    "Enquire about a STEPUP STORIES timepiece or book a private viewing with our horological concierge."
};

export const revalidate = 60;

export default async function ConciergePage({
  searchParams
}: {
  searchParams?: {
    type?: string;
    product?: string;
    name?: string;
  };
}) {
  const settings = await getSiteSettings();

  const defaultType =
    searchParams?.type === "private_viewing"
      ? "private_viewing"
      : searchParams?.product
        ? "product_enquiry"
        : "general_concierge";

  const hasContactDetails = Boolean(
    settings.contact_email ||
      settings.contact_phone ||
      settings.address ||
      settings.opening_hours ||
      settings.private_viewing_details
  );

  return (
    <div className="bg-obsidian py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Concierge Introduction & Real Salon Details (Only shows non-empty fields) */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Client Services
            </p>
            <h1 className="mt-2 font-serif text-4xl font-medium text-cream sm:text-5xl">
              Private Concierge &amp; Viewings
            </h1>
            <p className="mt-4 text-base leading-relaxed text-cream-secondary">
              Whether you wish to enquire about a specific timepiece or arrange a private viewing, our concierge team provides personal guidance tailored to your preferences.
            </p>

            {settings.private_viewing_details && (
              <div className="mt-8 rounded-xl border border-gold/30 bg-surface p-6">
                <h2 className="font-serif text-xl text-gold-bright">
                  Private Viewing Appointments
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-cream-secondary">
                  {settings.private_viewing_details}
                </p>
              </div>
            )}

            {hasContactDetails && (
              <div className="mt-8 rounded-xl border border-gold/25 bg-charcoal p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Direct Contact
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {settings.contact_email && (
                    <div>
                      <dt className="text-xs text-cream-muted">Email</dt>
                      <dd className="font-medium text-gold-bright">
                        <a href={`mailto:${settings.contact_email}`}>
                          {settings.contact_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {settings.contact_phone && (
                    <div>
                      <dt className="text-xs text-cream-muted">Telephone</dt>
                      <dd className="font-medium text-cream">
                        <a href={`tel:${settings.contact_phone}`}>
                          {settings.contact_phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {settings.address && (
                    <div>
                      <dt className="text-xs text-cream-muted">Salon Location</dt>
                      <dd className="text-cream-secondary">{settings.address}</dd>
                    </div>
                  )}
                  {settings.opening_hours && (
                    <div>
                      <dt className="text-xs text-cream-muted">Hours</dt>
                      <dd className="text-cream-secondary">{settings.opening_hours}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Right Column: Validated Enquiry / Private Viewing Form */}
          <div className="lg:col-span-7">
            <EnquiryForm
              defaultType={defaultType}
              defaultProductId={searchParams?.product || ""}
              defaultProductName={searchParams?.name || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
