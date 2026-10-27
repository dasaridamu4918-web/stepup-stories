import crypto from "crypto";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Hashes an IP address so raw visitor IPs are not stored in logs or database rows.
 */
export function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(`stepup-salt:${ip}`).digest("hex").slice(0, 24);
}

/**
 * Extracts client IP from standard Next.js / Vercel proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Sliding window server-side rate limiter per IP & route key.
 */
export function checkRateLimit(
  key: string,
  maxRequests = 8,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: 0
  };
}

/**
 * Resets rate limit buckets (used by automated tests).
 */
export function resetRateLimitsForTest(): void {
  rateLimitStore.clear();
}

/**
 * Verifies Cloudflare Turnstile token server-side.
 * If TURNSTILE_SECRET_KEY is not configured in environment, passes gracefully
 * so preview deployments without a Turnstile secret remain functional.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secretKey) {
    return { success: true };
  }

  if (!token || !token.trim()) {
    return {
      success: false,
      error: "Security verification is required. Please complete the challenge."
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    if (!res.ok) {
      return {
        success: false,
        error: "Unable to verify security token at this moment."
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return {
        success: false,
        error: "Security challenge verification failed. Please try again."
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Security verification service unavailable. Please try again."
    };
  }
}
