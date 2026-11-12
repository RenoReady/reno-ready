/**
 * One free preview before signing in (server only).
 *
 * A signed-out visitor can generate one watermarked 1K preview, so they see
 * their room transformed before being asked for an account. Limits, checked
 * against the anon_previews table (supabase/migrations/20261112_anon_previews.sql):
 *   - 1 successful preview per browser (the rr_vid visitor cookie), ever
 *   - 3 attempts per browser and 6 per internet connection in 24 hours
 *   - ANON_PREVIEW_DAILY_CAP attempts site-wide in 24 hours (default 60)
 *
 * Fails closed: if the table is missing or anything errors, the visitor is
 * asked to sign in, exactly as before.
 *
 * After sign-in, claimAnonPreviews() attaches the browser's preview to the
 * account so it counts as the free one.
 */
import { createHash } from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { VISITOR_COOKIE } from "@/lib/visitor";

const DAY = 86_400_000;
const PER_VISITOR_PER_DAY = 3;
const PER_CONNECTION_PER_DAY = 6;
const dailyCap = () => Number(process.env.ANON_PREVIEW_DAILY_CAP) || 60;

interface RequestLike {
  headers: Headers;
  cookies: { get(name: string): { value: string } | undefined };
}

const visitorOf = (req: RequestLike) => req.cookies.get(VISITOR_COOKIE)?.value?.slice(0, 64) || null;

function connectionHash(req: RequestLike): string | null {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim();
  if (!ip) return null;
  const salt = process.env.REMINDER_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`anon-preview:${ip}:${salt}`).digest("hex").slice(0, 32);
}

/** Reserves one signed-out preview, or says why not (then they're asked to sign in) */
export async function startAnonPreview(req: RequestLike, room: string | undefined): Promise<{ id: number } | { reason: string }> {
  try {
    const visitor = visitorOf(req), conn = connectionHash(req);
    if (!visitor || !conn) return { reason: "no_visitor" };
    const svc = createSupabaseServiceRoleClient();
    const since = new Date(Date.now() - DAY).toISOString();
    const count = () => svc.from("anon_previews").select("id", { count: "exact", head: true });
    const [done, mine, fromConn, all] = await Promise.all([
      count().eq("visitor_id", visitor).eq("succeeded", true),
      count().eq("visitor_id", visitor).gte("created_at", since),
      count().eq("ip_hash", conn).gte("created_at", since),
      count().gte("created_at", since),
    ]);
    for (const r of [done, mine, fromConn, all]) if (r.error) throw new Error(r.error.message);
    if ((done.count ?? 0) >= 1) return { reason: "used" };
    if ((mine.count ?? 0) >= PER_VISITOR_PER_DAY) return { reason: "visitor_limit" };
    if ((fromConn.count ?? 0) >= PER_CONNECTION_PER_DAY) return { reason: "connection_limit" };
    if ((all.count ?? 0) >= dailyCap()) return { reason: "daily_cap" };

    const { data, error } = await svc.from("anon_previews")
      .insert({ visitor_id: visitor, ip_hash: conn, room: room ?? null })
      .select("id").single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    return { id: data.id as number };
  } catch (err) {
    console.warn("[anon-preview] unavailable, asking to sign in:", err instanceof Error ? err.message : err);
    return { reason: "unavailable" };
  }
}

export async function markAnonPreviewDone(id: number): Promise<void> {
  const { error } = await createSupabaseServiceRoleClient().from("anon_previews").update({ succeeded: true }).eq("id", id);
  if (error) console.warn("[anon-preview] couldn't mark done:", error.message);
}

/**
 * Attaches this browser's signed-out preview(s) to the account, then returns
 * how many signed-out previews the account has used (on any device).
 * Never throws: on an error it counts 0 rather than blocking a paying path.
 */
export async function claimAnonPreviews(req: RequestLike, userId: string): Promise<number> {
  try {
    const svc = createSupabaseServiceRoleClient();
    const visitor = visitorOf(req);
    if (visitor) {
      await svc.from("anon_previews").update({ claimed_by: userId })
        .eq("visitor_id", visitor).eq("succeeded", true).is("claimed_by", null);
    }
    const { count, error } = await svc.from("anon_previews")
      .select("id", { count: "exact", head: true }).eq("claimed_by", userId).eq("succeeded", true);
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (err) {
    console.warn("[anon-preview] claim failed:", err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Signed-out previews this browser has made (for the on-screen counter). Never throws. */
export async function anonPreviewsUsed(req: RequestLike): Promise<number> {
  const visitor = visitorOf(req);
  if (!visitor) return 0;
  try {
    const { count, error } = await createSupabaseServiceRoleClient().from("anon_previews")
      .select("id", { count: "exact", head: true }).eq("visitor_id", visitor).eq("succeeded", true);
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch {
    return 0;
  }
}
