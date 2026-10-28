import { NextResponse } from "next/server";
import {
  clearAdminFallbackCookie,
  getApprovedAdminEmails,
  setAdminFallbackCookie
} from "@/lib/admin-auth";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured
} from "@/lib/supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      action?: "login" | "logout";
    };

    if (body.action === "logout") {
      clearAdminFallbackCookie();
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseServerClient();
        await supabase?.auth.signOut();
      }
      return NextResponse.json({ ok: true }, { headers: corsHeaders });
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Check Supabase Auth + `admins` table authorisation
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data.user) {
          const service = createSupabaseServiceClient() ?? supabase;
          const { data: adminRow } = await service
            .from("admins")
            .select("id, role")
            .or(`user_id.eq.${data.user.id},email.ilike.${email}`)
            .maybeSingle();

          const roleClaim = data.user.app_metadata?.role;
          if (!adminRow && roleClaim !== "admin" && roleClaim !== "superadmin") {
            await supabase.auth.signOut();
            return NextResponse.json(
              {
                ok: false,
                error:
                  "Your account is not listed in the authorised admins table. Access denied."
              },
              { status: 403, headers: corsHeaders }
            );
          }

          const token = setAdminFallbackCookie(email);
          return NextResponse.json({ ok: true, email, token }, { headers: corsHeaders });
        }
      }
    }

    // 2. Check INITIAL_ADMIN_EMAIL / APPROVED_ADMIN_EMAILS & INITIAL_ADMIN_PASSWORD env variables
    const approvedEmails = getApprovedAdminEmails();
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (approvedEmails.has(email) && initialPassword && password === initialPassword) {
      const token = setAdminFallbackCookie(email);
      return NextResponse.json({ ok: true, email, token }, { headers: corsHeaders });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid admin credentials or Supabase Auth / INITIAL_ADMIN_EMAIL is not configured."
      },
      { status: 401, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication service error." },
      { status: 500, headers: corsHeaders }
    );
  }
}
