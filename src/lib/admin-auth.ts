import crypto from "crypto";
import { cookies, headers } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured
} from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE = "stepup_admin_session";
const OWNER_ADMIN_EMAIL = "dasaridamu9418@gmail.com";
const OWNER_CREDENTIAL_SHA256 =
  "ef5fff85213450debf19a1f97c35f00a5908b674d6703e33e56218271dcb4475";

function getSigningSecret(): string {
  const configured =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.INITIAL_ADMIN_PASSWORD?.trim();

  if (configured) {
    return configured;
  }

  return crypto
    .createHmac("sha256", OWNER_CREDENTIAL_SHA256)
    .update("stepup_admin_cookie_key_v1")
    .digest("hex");
}

export function signAdminToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(normalized)
    .digest("hex");
  return `${Buffer.from(normalized).toString("base64url")}.${hmac}`;
}

export function verifySignedAdminToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const email = Buffer.from(parts[0], "base64url").toString("utf8");
    const expected = signAdminToken(email);
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return email;
    }
    return null;
  } catch {
    return null;
  }
}

export function getApprovedAdminEmails(): Set<string> {
  const list = new Set<string>([OWNER_ADMIN_EMAIL]);
  const initial = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (initial) list.add(initial);

  const extra = process.env.APPROVED_ADMIN_EMAILS?.split(",") ?? [];
  for (const item of extra) {
    const trimmed = item.trim().toLowerCase();
    if (trimmed) list.add(trimmed);
  }
  return list;
}

export function verifyAdminPasswordCredential(
  email: string,
  password: string
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const approvedEmails = getApprovedAdminEmails();
  if (!approvedEmails.has(normalizedEmail)) {
    return false;
  }

  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (initialPassword && password === initialPassword) {
    return true;
  }

  const candidateHash = crypto
    .createHash("sha256")
    .update(`stepup_admin_v1:${normalizedEmail}:${password}`)
    .digest("hex");

  const a = Buffer.from(candidateHash, "utf8");
  const b = Buffer.from(OWNER_CREDENTIAL_SHA256, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verifies on the server that the current request belongs to an approved administrator.
 * Being logged in alone is NOT sufficient: the user must exist in `public.admins`,
 * carry a verified server `app_metadata.role === 'admin'` claim, or hold a valid
 * server-signed session token for an approved admin email.
 */
export async function verifyAdminRequest(
  explicitAuthHeader?: string | null
): Promise<{
  authorized: boolean;
  email: string | null;
}> {
  // 1. Check Supabase Auth + `public.admins` table authorisation
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (!error && user && user.email) {
        const roleClaim = user.app_metadata?.role;
        if (roleClaim === "admin" || roleClaim === "superadmin") {
          return { authorized: true, email: user.email.toLowerCase() };
        }

        const service = createSupabaseServiceClient() ?? supabase;
        const { data: adminRow } = await service
          .from("admins")
          .select("id, email, role")
          .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
          .maybeSingle();

        if (adminRow) {
          return { authorized: true, email: user.email.toLowerCase() };
        }
      }
    }
  }

  const approvedEmails = getApprovedAdminEmails();

  // 2. Check Authorization: Bearer <signed_token> header (for mobile app / API clients)
  try {
    const authHeader =
      explicitAuthHeader ?? headers().get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const bearerToken = authHeader.slice(7).trim();
      const verifiedEmail = verifySignedAdminToken(bearerToken);
      if (verifiedEmail && approvedEmails.has(verifiedEmail)) {
        return { authorized: true, email: verifiedEmail };
      }
    }
  } catch {
    // headers() outside request context
  }

  // 3. Check signed HTTP-only server session cookie
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (sessionCookie) {
      const email = verifySignedAdminToken(sessionCookie);
      if (email && approvedEmails.has(email)) {
        return { authorized: true, email };
      }
    }
  } catch {
    // cookies() outside request context
  }

  return { authorized: false, email: null };
}

export function setAdminFallbackCookie(email: string): string {
  const token = signAdminToken(email);
  const cookieStore = cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return token;
}

export function clearAdminFallbackCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
