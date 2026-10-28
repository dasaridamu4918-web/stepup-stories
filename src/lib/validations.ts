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
  original_price_amount: z.number().nonnegative().nullable().optional(),
  stock_count: z.number().int().nonnegative().optional().default(10),
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

// 7. STORE ORDER CREATION SCHEMA (Shared Website & Mobile App — Collects ONLY fulfillment info)
export const storeOrderItemSchema = z.object({
  product_id: z.string().min(1),
  slug: sanitizedString(1, 160, "Product slug"),
  name: sanitizedString(1, 200, "Product name"),
  collection_name: optionalSanitizedString(120, "Collection name").nullable().optional(),
  selected_options: optionalSanitizedString(160, "Selected options").nullable().optional(),
  quantity: z.number().int().min(1).max(20),
  unit_price: z.number().nonnegative(),
  original_unit_price: z.number().nonnegative().optional(),
  image_url: z.string().max(600).optional().nullable()
});

export const createStoreOrderSchema = z.object({
  user_id: z.string().max(120).optional().nullable(),
  customer_name: sanitizedString(2, 120, "Customer full name"),
  customer_email: z
    .string()
    .trim()
    .max(160)
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  customer_phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "").slice(-10))
    .refine((v) => /^[6-9][0-9]{9}$/.test(v), {
      message: "Please enter a valid 10-digit Indian mobile number."
    }),
  delivery_address: z.object({
    address_line1: sanitizedString(3, 200, "Address line 1"),
    address_line2: optionalSanitizedString(200, "Address line 2"),
    landmark: optionalSanitizedString(160, "Landmark"),
    city: sanitizedString(2, 100, "City"),
    state: sanitizedString(2, 100, "State"),
    pincode: z
      .string()
      .trim()
      .refine((v) => /^[1-9][0-9]{5}$/.test(v), {
        message: "Please enter a valid 6-digit Indian PIN code."
      })
  }),
  items: z.array(storeOrderItemSchema).min(1, "Order must contain at least one watch."),
  delivery_fee: z.number().nonnegative().default(0),
  payment_method: z.enum(["cod", "razorpay"]).default("cod"),
  // Only safe provider transaction reference IDs may be passed — never card numbers or secrets
  payment_reference: optionalSanitizedString(160, "Payment reference"),
  source: z.enum(["website", "mobile_app"]).default("website")
});

export type CreateStoreOrderInput = z.infer<typeof createStoreOrderSchema>;

// 8. ADMIN ORDER STATUS & TRACKING UPDATE SCHEMA
export const adminOrderStatusUpdateSchema = z.object({
  id: z.string().min(1),
  order_status: z.enum([
    "new",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refund_requested"
  ]),
  payment_status: z
    .enum(["pending", "paid", "failed", "refunded"])
    .optional(),
  courier_name: optionalSanitizedString(120, "Courier name"),
  tracking_number: optionalSanitizedString(120, "Tracking number"),
  note: optionalSanitizedString(500, "Status change note")
});
