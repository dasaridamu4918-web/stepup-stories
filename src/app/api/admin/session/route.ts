import { NextResponse } from "next/server";
import {
  clearAdminFallbackCookie,
  setAdminFallbackCookie
} from "@/lib/admin-auth";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured
} from "@/lib/supabase/server";

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
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
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
              { status: 403 }
            );
          }

          return NextResponse.json({ ok: true, email });
        }
      }
    }

    // 2. Check INITIAL_ADMIN_EMAIL & INITIAL_ADMIN_PASSWORD env variables
    const initialEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (initialEmail && initialPassword && email === initialEmail && password === initialPassword) {
      setAdminFallbackCookie(email);
      return NextResponse.json({ ok: true, email });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid admin credentials or Supabase Auth / INITIAL_ADMIN_EMAIL is not configured."
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication service error." },
      { status: 500 }
    );
  }
}
