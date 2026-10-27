import { NextResponse } from "next/server";
import { enquiryFormSchema } from "@/lib/validations";
import {
  checkRateLimit,
  getClientIp,
  hashIpAddress,
  verifyTurnstileToken
} from "@/lib/rate-limit";
import { createEnquiryRecord } from "@/lib/repository";
import { sendEnquiryNotificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);
    const ipHash = hashIpAddress(clientIp);

    // 1. Server-side rate limiting per IP
    const rate = checkRateLimit(`enquiry:${ipHash}`, 8, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many enquiry requests. Please wait a few minutes before trying again."
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds)
          }
        }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = enquiryFormSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check the highlighted form fields.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 2. Honeypot trap check (if filled by a bot, return silent success without saving)
    if (data.website_honeypot && data.website_honeypot.trim().length > 0) {
      return NextResponse.json({
        ok: true,
        message: "Thank you. Your enquiry has been received by our concierge."
      });
    }

    // 3. Server-side Cloudflare Turnstile verification
    const turnstile = await verifyTurnstileToken(data.turnstile_token, clientIp);
    if (!turnstile.success) {
      return NextResponse.json(
        {
          ok: false,
          error: turnstile.error ?? "Security verification failed."
        },
        { status: 400 }
      );
    }

    // 4. Save enquiry via privileged server repository
    const created = await createEnquiryRecord({
      enquiry_type: data.enquiry_type,
      product_id: data.product_id || null,
      product_name: data.product_name || null,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      preferred_contact: data.preferred_contact || "email",
      preferred_date: data.preferred_date || null,
      preferred_location: data.preferred_location || null,
      message: data.message,
      ip_hash: ipHash
    });

    // 5. Trigger server-side email notification to concierge (non-blocking failure)
    await sendEnquiryNotificationEmail(created);

    return NextResponse.json({
      ok: true,
      id: created.id,
      message:
        data.enquiry_type === "private_viewing"
          ? "Thank you. Your Private Viewing request has been registered with our concierge."
          : "Thank you. Your enquiry has been registered and our concierge will respond shortly."
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "An unexpected error occurred while submitting your request. Please try again."
      },
      { status: 500 }
    );
  }
}
