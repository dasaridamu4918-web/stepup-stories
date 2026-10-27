import crypto from "crypto";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured
} from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE = "stepup_admin_session";

function signToken(email: string): string {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.INITIAL_ADMIN_PASSWORD ||
    "stepup-local-secret-key";
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(email.toLowerCase())
    .digest("hex");
  return `${Buffer.from(email.toLowerCase()).toString("base64url")}.${hmac}`;
}

function verifySignedToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const email = Buffer.from(parts[0], "base64url").toString("utf8");
    const expected = signToken(email);
    if (expected === token) return email;
    return null;
  } catch {
    return null;
  }
}

/**
 * Verifies that the current request belongs to an authorised administrator.
 * Being logged in via Supabase Auth alone is NOT enough: the user must exist
 * in the `public.admins` table (or have an explicit `app_metadata.role === 'admin'` claim).
 */
export async function verifyAdminRequest(): Promise<{
  authorized: boolean;
  email: string | null;
}> {
  // 1. Check Supabase Auth + `admins` table authorisation
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
          return { authorized: true, email: user.email };
        }

        const service = createSupabaseServiceClient() ?? supabase;
        const { data: adminRow } = await service
          .from("admins")
          .select("id, email, role")
          .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
          .maybeSingle();

        if (adminRow) {
          return { authorized: true, email: user.email };
        }
      }
    }
  }

  // 2. Check signed server session cookie (when INITIAL_ADMIN_EMAIL / PASSWORD are used directly)
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (sessionCookie) {
    const email = verifySignedToken(sessionCookie);
    const allowedEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    if (email && allowedEmail && email === allowedEmail) {
      return { authorized: true, email };
    }
  }

  return { authorized: false, email: null };
}

export function setAdminFallbackCookie(email: string): void {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, signToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminFallbackCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
