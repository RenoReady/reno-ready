/**
 * GET /auth/callback
 *
 * Supabase redirects here after Google OAuth completes.
 * We exchange the one-time `code` for a persistent session cookie so the
 * Next.js middleware (and admin pages) can identify the signed-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/builder";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=no_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
    }

    // Success — redirect to builder (or wherever `next` points).
    // Append `?authed=1` so client-side gates can sync localStorage too.
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("authed", "1");
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "config";
    console.error("[auth/callback] Supabase init failed:", msg);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);
  }
}
