/**
 * GET /auth/callback
 *
 * Supabase redirects here after Google OAuth completes.
 * We exchange the one-time `code` for a persistent session cookie so the
 * Next.js middleware (and admin pages) can identify the signed-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ATTRIBUTION_COOKIE, decodeAttribution } from "@/lib/attribution";
import { RETURN_COOKIE, safeReturnPath } from "@/lib/authReturn";
import { logEvent } from "@/lib/funnel";

/** Accounts created within this window count as new sign-ups (an older account signing in again keeps no source) */
const NEW_ACCOUNT_MS = 15 * 60_000;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // the page they signed in from (cookie set by AuthModal); ?next= still honoured for old links
  const fromCookie = request.cookies.get(RETURN_COOKIE)?.value;
  let cookieNext: string | null = null;
  try { cookieNext = fromCookie ? decodeURIComponent(fromCookie) : null; } catch { /* mangled cookie: use the default */ }
  const next = safeReturnPath(searchParams.get("next") ?? cookieNext);

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=no_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
    }

    // A brand-new account: record where they came from (first touch), or "direct" when we can't tell
    const user = data.user;
    if (user && !user.app_metadata?.attribution && Date.now() - Date.parse(user.created_at) < NEW_ACCOUNT_MS) {
      const src = decodeAttribution(request.cookies.get(ATTRIBUTION_COOKIE)?.value)
        ?? { source: "direct", medium: null, campaign: null, content: null, landing: "/", at: new Date().toISOString() };
      await createSupabaseServiceRoleClient().auth.admin.updateUserById(user.id, {
        app_metadata: { ...(user.app_metadata ?? {}), attribution: src },
      }).catch((e) => console.error("[auth/callback] attribution:", e));
    }

    if (user) await logEvent(request, { step: "signed_in", userId: user.id, page: next.split("?")[0], detail: Date.now() - Date.parse(user.created_at) < NEW_ACCOUNT_MS ? "new account" : null });

    // Success — redirect to builder (or wherever `next` points).
    // Append `?authed=1` so client-side gates can sync localStorage too.
    const redirectUrl = new URL(next, origin);
    redirectUrl.searchParams.set("authed", "1");
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(RETURN_COOKIE);
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "config";
    console.error("[auth/callback] Supabase init failed:", msg);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(msg)}`);
  }
}
