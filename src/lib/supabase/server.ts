/**
 * Supabase server client — for use in Server Components, Route Handlers,
 * and Server Actions. Reads the session from request cookies so middleware
 * and the admin dashboard can identify the signed-in user.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component context — cookies cannot be set here.
          // Session refresh handled by middleware.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS, used ONLY for admin reads of the
 * profiles table and storage bucket. Requires SUPABASE_SERVICE_ROLE_KEY
 * in env (never expose to the browser).
 */
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServiceRoleClient() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Service-role env vars missing — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
