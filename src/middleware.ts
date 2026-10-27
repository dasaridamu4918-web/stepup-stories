import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const pathname = request.nextUrl.pathname;

  // Refresh Supabase Auth session cookies when configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Protect /admin/dashboard and subroutes in middleware
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      const hasFallbackCookie = request.cookies.has("stepup_admin_session");
      if (!user && !hasFallbackCookie) {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }

      if (user && user.email) {
        const roleClaim = user.app_metadata?.role;
        const isRoleClaimAdmin = roleClaim === "admin" || roleClaim === "superadmin";

        if (!isRoleClaimAdmin) {
          const { data: adminRow } = await supabase
            .from("admins")
            .select("id")
            .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
            .maybeSingle();

          if (!adminRow && !hasFallbackCookie) {
            const loginUrl = new URL("/admin/login?error=unauthorized", request.url);
            return NextResponse.redirect(loginUrl);
          }
        }
      }
    }
  } else if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasFallbackCookie = request.cookies.has("stepup_admin_session");
    if (!hasFallbackCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
