import { describe, it, expect, beforeEach } from "vitest";
import {
  enquiryFormSchema,
  newsletterFormSchema,
  adminProductSchema,
  sanitizeText
} from "@/lib/validations";
import { resetRateLimitsForTest } from "@/lib/rate-limit";
import { POST as postEnquiry } from "@/app/api/enquiries/route";
import { POST as postNewsletter } from "@/app/api/newsletter/route";
import { buildMobileCatalog } from "@/lib/mobile-catalog";

describe("STEPUP STORIES Zod Validation & Input Sanitization", () => {
  it("strips HTML/script tags from user input", () => {
    const dirty = `<script>alert("xss")</script>Hello <b>Concierge</b>`;
    expect(sanitizeText(dirty)).toBe(`alert("xss")Hello Concierge`);
  });

  it("validates a well-formed timepiece enquiry and normalizes email", () => {
    const res = enquiryFormSchema.safeParse({
      enquiry_type: "product_enquiry",
      product_name: "Signature Edition I",
      full_name: "Aarav Sharma",
      email: "AARAV@EXAMPLE.COM",
      preferred_contact: "email",
      message: "I would like to arrange a private consultation for this piece."
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("aarav@example.com");
    }
  });

  it("rejects enquiry with short message or invalid email", () => {
    const res = enquiryFormSchema.safeParse({
      enquiry_type: "general_concierge",
      full_name: "A",
      email: "invalid-email",
      message: "Too short"
    });
    expect(res.success).toBe(false);
  });

  it("requires explicit consent boolean for newsletter signup", () => {
    const invalid = newsletterFormSchema.safeParse({
      email: "collector@example.com",
      consent: false
    });
    expect(invalid.success).toBe(false);

    const valid = newsletterFormSchema.safeParse({
      email: "collector@example.com",
      consent: true
    });
    expect(valid.success).toBe(true);
  });

  it("validates admin product schema with flexible key/value specifications", () => {
    const prod = adminProductSchema.safeParse({
      slug: "signature-edition-i",
      name: "Signature Edition I",
      availability_status: "available",
      featured: true,
      published: true,
      specs: [{ key: "Case Material", value: "Brushed Gold" }]
    });
    expect(prod.success).toBe(true);
  });
});

describe("STEPUP STORIES Form API Routes (Enquiry & Newsletter)", () => {
  beforeEach(() => {
    resetRateLimitsForTest();
  });

  it("POST /api/enquiries creates an enquiry and returns 200", async () => {
    const req = new Request("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10"
      },
      body: JSON.stringify({
        enquiry_type: "private_viewing",
        product_name: "Signature Edition I",
        full_name: "Vikramaditya Rao",
        email: "vikram@example.com",
        preferred_contact: "email",
        preferred_date: "Saturday 4 PM",
        message: "I would like to book a private viewing for Signature Edition I."
      })
    });

    const res = await postEnquiry(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; id?: string };
    expect(json.ok).toBe(true);
    expect(json.id).toBeDefined();
  });

  it("POST /api/enquiries blocks invalid payloads with 400", async () => {
    const req = new Request("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enquiry_type: "product_enquiry",
        full_name: "",
        email: "not-an-email",
        message: "short"
      })
    });

    const res = await postEnquiry(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/newsletter prevents duplicate active subscriptions", async () => {
    const makeReq = () =>
      new Request("http://localhost:3000/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.55"
        },
        body: JSON.stringify({
          email: "unique.collector@example.com",
          full_name: "Meera Nair",
          consent: true
        })
      });

    const firstRes = await postNewsletter(makeReq());
    expect(firstRes.status).toBe(200);
    const firstJson = (await firstRes.json()) as {
      ok: boolean;
      alreadySubscribed: boolean;
    };
    expect(firstJson.ok).toBe(true);
    expect(firstJson.alreadySubscribed).toBe(false);

    const secondRes = await postNewsletter(makeReq());
    expect(secondRes.status).toBe(200);
    const secondJson = (await secondRes.json()) as {
      ok: boolean;
      alreadySubscribed: boolean;
    };
    expect(secondJson.ok).toBe(true);
    expect(secondJson.alreadySubscribed).toBe(true);
  });

  it("buildMobileCatalog returns 20 photo-backed watches with accurate INR savings and generic names when brand_verified is false", () => {
    const catalog = buildMobileCatalog("https://stepup-stories.vercel.app");
    expect(catalog.collections.length).toBe(5);
    expect(catalog.products.length).toBe(20);

    for (const prod of catalog.products) {
      expect(prod.price_currency).toBe("INR");
      expect(prod.price_amount).toBeGreaterThan(0);
      expect(prod.original_price_amount).toBeGreaterThanOrEqual(prod.price_amount);
      expect(prod.savings_amount).toBe(
        prod.original_price_amount - prod.price_amount
      );
      expect(prod.images.length).toBeGreaterThan(0);
      expect(prod.brand_verified).toBe(false);
      expect(prod.name).toBe(prod.generic_name);
    }
  });
});
