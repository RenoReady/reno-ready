/**
 * Next.js proxy (called "middleware" before Next 16) — runs on every request that matches `config.matcher`.
 *
 * Responsibilities:
 *   1. Refresh the Supabase auth cookie on every request so server pages
 *      see an up-to-date session.
 *   2. Gate /admin/* — only the email defined in src/lib/config.ts may enter.
 *   3. Remember where a first-time visitor came from (ad tags / referrer) in
 *      the rr_src cookie, for the admin "where customers come from" report.
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { ADMIN_EMAIL } from "@/lib/config";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, attributionFrom, encodeAttribution } from "@/lib/attribution";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);

  const pathname = request.nextUrl.pathname;

  // ── /admin gate ────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Not signed in → bounce to home with a soft error
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/";
      loginUrl.searchParams.set("admin_error", "signin_required");
      return NextResponse.redirect(loginUrl);
    }

    // Signed in but not the admin email → 404 to avoid leaking the route's
    // existence to other users
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      const notFoundUrl = request.nextUrl.clone();
      notFoundUrl.pathname = "/";
      notFoundUrl.searchParams.set("admin_error", "forbidden");
      return NextResponse.redirect(notFoundUrl);
    }
  }

  // ── First-touch attribution (page visits only, never overwritten) ──
  if (request.method === "GET" && !pathname.startsWith("/api/") && !request.cookies.has(ATTRIBUTION_COOKIE)) {
    const src = attributionFrom(request.nextUrl, request.headers.get("referer"), request.nextUrl.hostname);
    if (src) {
      response.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution(src), {
        maxAge: ATTRIBUTION_MAX_AGE, path: "/", sameSite: "lax", httpOnly: true, secure: request.nextUrl.protocol === "https:",
      });
    }
  }

  return response;
}

export const config = {
  /**
   * Matcher — exclude static assets, image files, and the auth callback so
   * the OAuth flow can complete unimpeded.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|mp4|webm)$|auth/callback).*)",
  ],
};
