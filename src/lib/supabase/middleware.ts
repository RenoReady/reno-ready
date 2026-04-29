/**
 * Supabase middleware client — for use inside Next.js middleware only.
 * Refreshes the session cookie on every request and gives middleware
 * code access to the current user for route gating.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No env config — let the request through and rely on the page-level
  // service-role check to surface the misconfiguration.
  if (!url || !key) return { response: supabaseResponse, user: null };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // CRITICAL: must call getUser() right after creating the client to refresh
  // the auth token. Don't read auth state any other way in middleware.
  const { data: { user } } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
