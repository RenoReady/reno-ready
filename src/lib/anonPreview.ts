/**
 * One free AI preview for visitors who aren't signed in.
 *
 * Enforced twice so it can't be reset cheaply:
 *  - a cookie set on the browser once the free preview is used
 *  - a row in public.anon_previews keyed by an HMAC of the visitor's IP,
 *    so a private window or cleared cookies still count as used
 *
 * The slot is claimed before generating (so two tabs can't both use it)
 * and released if generation fails, so a failed preview doesn't cost it.
 * Schema: supabase/migrations/20261010_anon_previews.sql
 */

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const ANON_FREE_PREVIEWS = 1;
export const ANON_PREVIEW_COOKIE = "rr_free_preview_used";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const anonPreviewCookie = {
  name:     ANON_PREVIEW_COOKIE,
  value:    "1",
  httpOnly: true,
  sameSite: "lax" as const,
  secure:   process.env.NODE_ENV === "production",
  path:     "/",
  maxAge:   COOKIE_MAX_AGE,
};

/** Keyed hash of the caller's IP — the raw address is never stored */
function ipHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "reno-ready-anon-preview";
  return createHmac("sha256", key).update(ip).digest("hex");
}

/**
 * Claims this visitor's free preview. Returns the claim id to release on
 * failure, or null when it's already been used (or can't be checked —
 * this fails closed, since every preview costs money).
 */
export async function claimAnonPreview(req: NextRequest): Promise<string | null> {
  if (req.cookies.get(ANON_PREVIEW_COOKIE)) return null;

  const hash = ipHash(req);
  const { error } = await createSupabaseServiceRoleClient()
    .from("anon_previews")
    .insert({ ip_hash: hash });

  if (error) {
    // 23505 = unique violation: this IP has already had its free preview
    if (error.code !== "23505") console.warn("[anon-preview] claim failed:", error.message);
    return null;
  }
  return hash;
}

/** Gives the free preview back when generation didn't produce one */
export async function releaseAnonPreview(hash: string): Promise<void> {
  const { error } = await createSupabaseServiceRoleClient()
    .from("anon_previews")
    .delete()
    .eq("ip_hash", hash);
  if (error) console.warn("[anon-preview] release failed:", error.message);
}
