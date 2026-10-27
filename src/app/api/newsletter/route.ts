import { NextResponse } from "next/server";
import { newsletterFormSchema } from "@/lib/validations";
import {
  checkRateLimit,
  getClientIp,
  hashIpAddress,
  verifyTurnstileToken
} from "@/lib/rate-limit";
import { upsertNewsletterSubscriber } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);
    const ipHash = hashIpAddress(clientIp);

    const rate = checkRateLimit(`newsletter:${ipHash}`, 6, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many subscription requests. Please try again shortly."
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
    const parsed = newsletterFormSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check your subscription details.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot check
    if (data.website_honeypot && data.website_honeypot.trim().length > 0) {
      return NextResponse.json({
        ok: true,
        message: "Thank you for joining the STEPUP STORIES private register."
      });
    }

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

    const result = await upsertNewsletterSubscriber({
      email: data.email,
      full_name: data.full_name || undefined,
      source: data.source || "website"
    });

    return NextResponse.json({
      ok: true,
      alreadySubscribed: result.alreadySubscribed,
      message: result.alreadySubscribed
        ? "This email address is already registered with the STEPUP STORIES journal."
        : "Welcome to the STEPUP STORIES private register."
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to process your subscription right now. Please try again."
      },
      { status: 500 }
    );
  }
}
