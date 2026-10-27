import { z } from "zod";

/**
 * Strips dangerous HTML/script tags and trims control characters from user input.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

const sanitizedString = (minLen: number, maxLen: number, fieldName: string) =>
  z
    .string()
    .max(maxLen, `${fieldName} must be ${maxLen} characters or fewer.`)
    .transform(sanitizeText)
    .refine((val) => val.length >= minLen, {
      message:
        minLen > 0
          ? `${fieldName} must be at least ${minLen} characters.`
          : `${fieldName} is required.`
    });

const optionalSanitizedString = (maxLen: number, fieldName: string) =>
  z
    .string()
    .max(maxLen, `${fieldName} must be ${maxLen} characters or fewer.`)
    .transform(sanitizeText)
    .optional()
    .or(z.literal(""));

// 1. PUBLIC ENQUIRY & PRIVATE VIEWING SCHEMA (Shared Client/Server)
export const enquiryFormSchema = z.object({
  enquiry_type: z.enum(["product_enquiry", "private_viewing", "general_concierge"], {
    required_error: "Please select an enquiry type."
  }),
  product_id: optionalSanitizedString(120, "Product ID"),
  product_name: optionalSanitizedString(160, "Timepiece Name"),
  full_name: sanitizedString(2, 100, "Full name"),
  email: z
    .string()
    .trim()
    .max(160, "Email address is too long.")
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  phone: optionalSanitizedString(40, "Phone number"),
  preferred_contact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  preferred_date: optionalSanitizedString(80, "Preferred date"),
  preferred_location: optionalSanitizedString(120, "Preferred viewing preference"),
  message: sanitizedString(10, 2000, "Message"),
  // Spam protection fields:
  website_honeypot: z.string().max(200).optional().default(""),
  turnstile_token: z.string().max(2048).optional().default("")
});

export type EnquiryFormInput = z.infer<typeof enquiryFormSchema>;

// 2. NEWSLETTER SUBSCRIPTION SCHEMA (Shared Client/Server)
export const newsletterFormSchema = z.object({
  email: z
    .string()
    .trim()
    .max(160, "Email address is too long.")
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  full_name: optionalSanitizedString(100, "Name"),
  consent: z.boolean().refine((val) => val === true, {
    message: "Please confirm you wish to receive dispatches from STEPUP STORIES."
  }),
  source: optionalSanitizedString(60, "Source"),
  website_honeypot: z.string().max(200).optional().default(""),
  turnstile_token: z.string().max(2048).optional().default("")
});

export type NewsletterFormInput = z.infer<typeof newsletterFormSchema>;

// 3. ADMIN PRODUCT UPSERT SCHEMA
export const productSpecItemSchema = z.object({
  key: sanitizedString(1, 80, "Specification label"),
  value: sanitizedString(1, 240, "Specification value")
});

export const adminProductSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  name: sanitizedString(2, 160, "Product name"),
  reference_code: optionalSanitizedString(80, "Reference code"),
  collection_id: z.string().optional().nullable(),
  short_description: optionalSanitizedString(320, "Short description"),
  description: optionalSanitizedString(5000, "Full description"),
  price_amount: z.number().nonnegative().nullable().optional(),
  price_currency: optionalSanitizedString(10, "Currency"),
  price_display: optionalSanitizedString(80, "Display price"),
  availability_status: z.enum([
    "available",
    "private_viewing_only",
    "waitlist",
    "archived"
  ]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  specs: z.array(productSpecItemSchema).default([])
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

// 4. ADMIN COLLECTION UPSERT SCHEMA
export const adminCollectionSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  name: sanitizedString(2, 120, "Collection name"),
  subtitle: optionalSanitizedString(160, "Subtitle"),
  description: optionalSanitizedString(2000, "Description"),
  cover_image_url: optionalSanitizedString(500, "Cover image URL"),
  cover_image_alt: optionalSanitizedString(200, "Cover image alt text"),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(true)
});

export type AdminCollectionInput = z.infer<typeof adminCollectionSchema>;

// 5. ADMIN SITE SETTINGS SCHEMA
export const adminSiteSettingsSchema = z.object({
  business_name: sanitizedString(2, 120, "Business name"),
  tagline: optionalSanitizedString(200, "Tagline"),
  hero_headline: optionalSanitizedString(200, "Hero headline"),
  hero_subheadline: optionalSanitizedString(500, "Hero subheadline"),
  hero_backdrop_url: optionalSanitizedString(500, "Hero backdrop URL"),
  story_backdrop_url: optionalSanitizedString(500, "Story backdrop URL"),
  og_image_url: optionalSanitizedString(500, "Open Graph image URL"),
  about_story_title: optionalSanitizedString(200, "About story title"),
  about_story_body: optionalSanitizedString(5000, "About story body"),
  contact_email: z
    .string()
    .trim()
    .email("Must be a valid email address.")
    .optional()
    .or(z.literal("")),
  contact_phone: optionalSanitizedString(60, "Contact phone"),
  address: optionalSanitizedString(400, "Address"),
  opening_hours: optionalSanitizedString(200, "Opening hours"),
  private_viewing_details: optionalSanitizedString(1000, "Private viewing details"),
  footer_text: optionalSanitizedString(500, "Footer text"),
  social_links: z
    .array(
      z.object({
        label: sanitizedString(1, 60, "Platform label"),
        url: z.string().trim().url("Social link must be a valid URL.")
      })
    )
    .default([])
});

export type AdminSiteSettingsInput = z.infer<typeof adminSiteSettingsSchema>;

// 6. ADMIN ENQUIRY UPDATE SCHEMA
export const adminEnquiryUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "closed"]),
  internal_notes: z.string().max(4000).transform(sanitizeText)
});
