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

/**
 * Downloads a private Storage object, always fresh (server only).
 *
 * Storage sits behind a CDN that can keep serving the previous version of a
 * file after it's been overwritten, even with cacheControl "0" (seen with
 * share.json: a rewrite showed up through a signed URL but not .download()).
 * A unique query string on each read skips the cached copy.
 */
export async function downloadFresh(bucket: string, path: string): Promise<Blob | null> {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Service-role env vars missing");
  const objectPath = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}?fresh=${Date.now()}${Math.random().toString(36).slice(2, 8)}`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) return null;   // Storage answers 400 "not found" for missing objects
  if (!res.ok) throw new Error(`Storage ${bucket}/${path}: ${res.status}`);
  return res.blob();
}

/** downloadFresh for JSON records; null when missing or unreadable */
export async function readStorageJson<T>(bucket: string, path: string): Promise<T | null> {
  const blob = await downloadFresh(bucket, path);
  if (!blob) return null;
  try { return JSON.parse(await blob.text()) as T; } catch { return null; }
}
