"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  enquiryFormSchema,
  type EnquiryFormInput
} from "@/lib/validations";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export function EnquiryForm({
  defaultType = "product_enquiry",
  defaultProductId = "",
  defaultProductName = ""
}: {
  defaultType?: "product_enquiry" | "private_viewing" | "general_concierge";
  defaultProductId?: string;
  defaultProductName?: string;
}) {
  const [serverStatus, setServerStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EnquiryFormInput>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      enquiry_type: defaultType,
      product_id: defaultProductId,
      product_name: defaultProductName,
      full_name: "",
      email: "",
      phone: "",
      preferred_contact: "email",
      preferred_date: "",
      preferred_location: "",
      message: defaultProductName
        ? `I would like to enquire about the ${defaultProductName}.`
        : "",
      website_honeypot: "",
      turnstile_token: ""
    }
  });

  const selectedType = watch("enquiry_type");

  const onSubmit = async (values: EnquiryFormInput) => {
    setServerStatus(null);
    try {
      const res = await fetch("/api/enquiries", {
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
        setServerStatus({
          type: "error",
          message: data.error || "Unable to submit your request. Please check your details."
        });
        return;
      }

      setServerStatus({
        type: "success",
        message:
          data.message ||
          "Thank you. Your enquiry has been registered with our concierge."
      });
      reset({
        enquiry_type: selectedType,
        product_id: defaultProductId,
        product_name: defaultProductName,
        full_name: "",
        email: "",
        phone: "",
        preferred_contact: "email",
        preferred_date: "",
        preferred_location: "",
        message: "",
        website_honeypot: "",
        turnstile_token: ""
      });
    } catch {
      setServerStatus({
        type: "error",
        message: "Network error while submitting your request. Please try again."
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-xl border border-gold/30 bg-surface p-6 shadow-2xl sm:p-8"
    >
      {/* Enquiry Type Selector */}
      <fieldset className="mb-6">
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Consultation Type
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { value: "product_enquiry", label: "Timepiece Enquiry" },
            { value: "private_viewing", label: "Book a Private Viewing" },
            { value: "general_concierge", label: "General Concierge" }
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center justify-center rounded border px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] transition ${
                selectedType === opt.value
                  ? "border-gold bg-gold text-obsidian"
                  : "border-gold/25 bg-obsidian/70 text-cream-secondary hover:border-gold/60"
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                {...register("enquiry_type")}
                className="sr-only"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Pre-filled or editable Timepiece Name */}
      <div className="mb-5">
        <label
          htmlFor="enquiry-product-name"
          className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
        >
          Timepiece of Interest (Optional)
        </label>
        <input
          id="enquiry-product-name"
          type="text"
          {...register("product_name")}
          placeholder="e.g. Signature Edition I"
          className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream placeholder:text-cream-muted focus:border-gold-bright"
        />
        <input type="hidden" {...register("product_id")} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="enquiry-full-name"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
          >
            Full Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="enquiry-full-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            {...register("full_name")}
            className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-[#ff8a9e]" role="alert">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="enquiry-email"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
          >
            Email Address <span aria-hidden="true">*</span>
          </label>
          <input
            id="enquiry-email"
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

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="enquiry-phone"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
          >
            Telephone / WhatsApp (Optional)
          </label>
          <input
            id="enquiry-phone"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-[#ff8a9e]" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="enquiry-preferred-contact"
            className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
          >
            Preferred Contact Channel
          </label>
          <select
            id="enquiry-preferred-contact"
            {...register("preferred_contact")}
            className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream focus:border-gold-bright"
          >
            <option value="email">Email</option>
            <option value="phone">Telephone</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {selectedType === "private_viewing" && (
        <div className="mt-5 grid grid-cols-1 gap-5 rounded-lg border border-gold/20 bg-obsidian/60 p-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="enquiry-preferred-date"
              className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
            >
              Preferred Date &amp; Time Window
            </label>
            <input
              id="enquiry-preferred-date"
              type="text"
              placeholder="e.g. Friday Afternoon or Weekend"
              {...register("preferred_date")}
              className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
            />
          </div>

          <div>
            <label
              htmlFor="enquiry-preferred-location"
              className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
            >
              Viewing Format
            </label>
            <input
              id="enquiry-preferred-location"
              type="text"
              placeholder="Private Salon or Live Video Presentation"
              {...register("preferred_location")}
              className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-3.5 py-2 text-sm text-cream"
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <label
          htmlFor="enquiry-message"
          className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold"
        >
          Your Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="enquiry-message"
          rows={4}
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
          placeholder="Share any questions or preferences for your consultation..."
          className="mt-1.5 w-full rounded border border-gold/30 bg-obsidian px-4 py-2.5 text-sm text-cream placeholder:text-cream-muted focus:border-gold-bright"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-[#ff8a9e]" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Honeypot field hidden from human visitors */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="enquiry-website-hp">Leave this field empty</label>
        <input
          id="enquiry-website-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website_honeypot")}
        />
      </div>

      <TurnstileWidget
        onVerify={(token) => setValue("turnstile_token", token)}
      />

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded bg-gradient-to-r from-gold-bright to-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting
            ? "Transmitting Request..."
            : selectedType === "private_viewing"
              ? "Request Private Viewing"
              : "Submit Concierge Enquiry"}
        </button>
      </div>

      <div aria-live="polite" className="mt-4">
        {serverStatus && (
          <div
            role="status"
            className={`rounded border px-4 py-3 text-sm ${
              serverStatus.type === "success"
                ? "border-gold bg-gold/10 text-gold-bright"
                : "border-burgundy-bright bg-burgundy/25 text-cream"
            }`}
          >
            {serverStatus.message}
          </div>
        )}
      </div>
    </form>
  );
}
