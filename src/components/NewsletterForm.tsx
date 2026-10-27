"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newsletterFormSchema,
  type NewsletterFormInput
} from "@/lib/validations";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export function NewsletterForm({ source = "website" }: { source?: string }) {
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NewsletterFormInput>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
      full_name: "",
      consent: false,
      source,
      website_honeypot: "",
      turnstile_token: ""
    }
  });

  const onSubmit = async (values: NewsletterFormInput) => {
    setStatusMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Unable to complete registration."
        });
        return;
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Welcome to the STEPUP STORIES private register."
      });
      reset();
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error. Please try again in a moment."
      });
    }
  };

  return (
    <section
      id="journal"
      aria-labelledby="newsletter-heading"
      className="border-t border-gold/20 bg-charcoal py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 rounded-2xl border border-gold/35 bg-gradient-to-br from-surface via-charcoal to-obsidian p-8 shadow-2xl lg:grid-cols-12 sm:p-12">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              The Private Journal
            </p>
            <h2
              id="newsletter-heading"
              className="mt-2 font-serif text-3xl text-cream sm:text-4xl"
            >
              Receive Priority Access to New Chapters
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream-secondary sm:text-base">
              Join the STEPUP STORIES private register for early previews of Limited Editions, collector gatherings, and horological dispatches.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="lg:col-span-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="newsletter-name"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
                >
                  Your Name (Optional)
                </label>
                <input
                  id="newsletter-name"
                  type="text"
                  autoComplete="name"
                  {...register("full_name")}
                  className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
                />
              </div>

              <div>
                <label
                  htmlFor="newsletter-email"
                  className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
                >
                  Email Address <span aria-hidden="true">*</span>
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                  className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#ff8a9e]" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-start gap-2.5 text-xs text-cream-secondary">
                <input
                  type="checkbox"
                  {...register("consent")}
                  className="mt-0.5 h-4 w-4 rounded border-gold/40 bg-obsidian text-gold focus:ring-gold"
                />
                <span>
                  I consent to receive private dispatches and edition announcements from STEPUP STORIES. You may unsubscribe at any time.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-xs text-[#ff8a9e]" role="alert">
                  {errors.consent.message}
                </p>
              )}
            </div>

            {/* Honeypot */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="newsletter-hp">Leave empty</label>
              <input
                id="newsletter-hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("website_honeypot")}
              />
            </div>

            <TurnstileWidget
              onVerify={(token) => setValue("turnstile_token", token)}
            />

            <div className="mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded bg-gradient-to-r from-gold-bright to-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:brightness-110 disabled:opacity-60"
              >
                {isSubmitting ? "Registering..." : "Request Invitation"}
              </button>
            </div>

            <div aria-live="polite" className="mt-3">
              {statusMessage && (
                <p
                  role="status"
                  className={`rounded border px-3.5 py-2.5 text-xs ${
                    statusMessage.type === "success"
                      ? "border-gold bg-gold/10 text-gold-bright"
                      : "border-burgundy-bright bg-burgundy/25 text-cream"
                  }`}
                >
                  {statusMessage.text}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
