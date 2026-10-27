/**
 * Visitor journey events (server only) — what the admin funnel, the room /
 * location / device breakdowns and the daily health email are built from.
 *
 * Every visitor gets an anonymous first-party cookie (rr_vid, set in
 * src/proxy.ts). Steps that happen in the browser arrive through /api/track;
 * the ones the server can see for certain (signed in, preview made or failed,
 * edit, paid, builder brief) are logged where they happen.
 *
 * Location is Vercel's approximate IP city/region, plus a postcode only when
 * someone types one in. Nothing here ever blocks or fails a request.
 */

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ATTRIBUTION_COOKIE, decodeAttribution } from "@/lib/attribution";
import { VISITOR_COOKIE } from "@/lib/visitor";

/** The journey in order (what the admin funnel shows) */
export const FUNNEL_STEPS = [
  "visit", "room", "photo", "style", "generate", "signin_shown", "signed_in",
  "preview", "edit", "paywall", "checkout", "paid", "brief",
] as const;
export const OTHER_STEPS = ["preview_failed", "postcode"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number] | (typeof OTHER_STEPS)[number];

/** Steps the browser may report through /api/track (the rest are server-side only) */
export const CLIENT_STEPS: ReadonlySet<FunnelStep> = new Set<FunnelStep>([
  "visit", "room", "photo", "style", "generate", "signin_shown", "paywall", "checkout", "postcode",
]);

export const STEP_LABEL: Record<FunnelStep, string> = {
  visit: "Visited the site", room: "Opened the design tool", photo: "Added a photo", style: "Chose a style",
  generate: "Clicked Generate", signin_shown: "Saw the sign-in", signed_in: "Signed in",
  preview: "Got a preview", edit: "Made an edit", paywall: "Saw an upgrade offer",
  checkout: "Started checkout", paid: "Paid", brief: "Sent a builder brief",
  preview_failed: "Preview failed", postcode: "Gave a postcode",
};

const ROOMS = new Set(["bathroom", "kitchen", "bedroom"]);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor/i;

export function deviceFrom(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|Nexus (7|9|10)|SM-T/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

const clip = (s: unknown, n = 80) => (typeof s === "string" && s.trim() ? s.trim().slice(0, n) : null);
const header = (h: Headers, name: string) => {
  const v = h.get(name);
  if (!v) return null;
  try { return decodeURIComponent(v); } catch { return v; }
};

/** Local testing writes to the same database, so only production logs unless TRACK_DEV=1 */
const enabled = () => process.env.VERCEL_ENV === "production" || process.env.TRACK_DEV === "1";

interface RequestLike {
  headers: Headers;
  cookies: { get(name: string): { value: string } | undefined };
}

export interface EventInput {
  step: FunnelStep;
  userId?: string | null;
  room?: string | null;
  detail?: string | null;
  page?: string | null;
  returning?: boolean | null;
  postcode?: string | null;
}

/**
 * Records one step. `req` gives the visitor cookie, location, device and ad source;
 * without it (e.g. the Stripe webhook) the event is keyed to the account instead.
 */
export async function logEvent(req: RequestLike | null, e: EventInput): Promise<void> {
  if (!enabled()) return;
  try {
    const ua = req?.headers.get("user-agent") ?? "";
    if (req && BOT.test(ua)) return;
    const visitor = clip(req?.cookies.get(VISITOR_COOKIE)?.value, 64) ?? (e.userId ? `u:${e.userId}` : null);
    if (!visitor) return;
    const src = req ? decodeAttribution(req.cookies.get(ATTRIBUTION_COOKIE)?.value) : null;
    const { error } = await createSupabaseServiceRoleClient().from("funnel_events").insert({
      visitor_id: visitor,
      user_id:    e.userId ?? null,
      step:       e.step,
      room:       e.room && ROOMS.has(e.room) ? e.room : null,
      detail:     clip(e.detail),
      page:       clip(e.page, 120),
      source:     src?.source ?? null,
      device:     req ? deviceFrom(ua) : null,
      is_returning: typeof e.returning === "boolean" ? e.returning : null,
      city:       req ? clip(header(req.headers, "x-vercel-ip-city"), 60) : null,
      region:     req ? clip(header(req.headers, "x-vercel-ip-country-region"), 10) : null,
      country:    req ? clip(header(req.headers, "x-vercel-ip-country"), 4) : null,
      postcode:   e.postcode && /^\d{4}$/.test(e.postcode) ? e.postcode : null,
    });
    if (error) console.warn("[funnel] insert failed:", error.message);
  } catch (err) {
    console.warn("[funnel] logEvent:", err instanceof Error ? err.message : err);
  }
}

// ── Reading (admin dashboard + health email) ──────────────────────

export interface FunnelEvent {
  created_at: string; visitor_id: string; user_id: string | null; step: FunnelStep;
  room: string | null; detail: string | null; page: string | null; source: string | null;
  device: string | null; is_returning: boolean | null; city: string | null; region: string | null;
  country: string | null; postcode: string | null;
}

/** Events since `sinceIso`, oldest first (paged: PostgREST returns at most 1,000 rows per call) */
export async function fetchEvents(sinceIso: string, cap = 50_000): Promise<FunnelEvent[]> {
  const svc = createSupabaseServiceRoleClient();
  const out: FunnelEvent[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data, error } = await svc.from("funnel_events")
      .select("created_at, visitor_id, user_id, step, room, detail, page, source, device, is_returning, city, region, country, postcode")
      .gte("created_at", sinceIso).order("created_at", { ascending: true }).range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as FunnelEvent[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export interface Person {
  key: string; userId: string | null; visitors: Set<string>;
  steps: Set<FunnelStep>; room: string | null; events: FunnelEvent[];
  first: string; last: string;
}

/**
 * Groups events into people: a browser's events before sign-in join the account
 * they signed in to, and server-only events ("u:<id>") join that account too.
 * `exclude` drops accounts (the admin's own testing).
 */
export function groupPeople(events: FunnelEvent[], exclude: string[] = []): Person[] {
  const userOfVisitor = new Map<string, string>();
  for (const e of events) if (e.user_id) userOfVisitor.set(e.visitor_id, e.user_id);
  const skip = new Set(exclude);
  const people = new Map<string, Person>();
  for (const e of events) {
    const uid = e.user_id ?? userOfVisitor.get(e.visitor_id) ?? (e.visitor_id.startsWith("u:") ? e.visitor_id.slice(2) : null);
    if (uid && skip.has(uid)) continue;
    const key = uid ? `u:${uid}` : `v:${e.visitor_id}`;
    let p = people.get(key);
    if (!p) { p = { key, userId: uid, visitors: new Set(), steps: new Set(), room: null, events: [], first: e.created_at, last: e.created_at }; people.set(key, p); }
    p.visitors.add(e.visitor_id);
    p.steps.add(e.step);
    if (e.room) p.room = e.room;          // the last room they worked on
    p.events.push(e);
    p.last = e.created_at;
  }
  return [...people.values()];
}

/** The furthest step in the journey someone reached */
export function furthestStep(p: Person): FunnelStep | null {
  for (let i = FUNNEL_STEPS.length - 1; i >= 0; i--) if (p.steps.has(FUNNEL_STEPS[i])) return FUNNEL_STEPS[i];
  return null;
}
