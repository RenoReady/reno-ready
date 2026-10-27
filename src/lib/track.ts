/**
 * Reports a journey step from the browser to /api/track (see src/lib/funnel.ts).
 * Each step (with its room/detail) is sent once per tab session, since the
 * dashboard counts people, not clicks. Fire-and-forget: never throws, never waits.
 */

export type ClientStep = "visit" | "room" | "photo" | "style" | "generate" | "signin_shown" | "paywall" | "checkout" | "postcode";

export function track(step: ClientStep, data: { room?: string | null; detail?: string | null; postcode?: string; returning?: boolean } = {}): void {
  if (typeof window === "undefined") return;
  const key = `rr_t:${step}:${data.room ?? ""}:${data.detail ?? ""}:${data.postcode ?? ""}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* storage blocked: send anyway */ }
  const body = JSON.stringify({ step, ...data, page: window.location.pathname });
  try {
    if (navigator.sendBeacon?.("/api/track", body)) return;
  } catch { /* fall through */ }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

const POSTCODE_KEY = "rr_postcode";

/** The property postcode they gave on this device, if any */
export function savedPostcode(): string {
  try { return localStorage.getItem(POSTCODE_KEY) ?? ""; } catch { return ""; }
}

export function savePostcode(pc: string): void {
  try { localStorage.setItem(POSTCODE_KEY, pc); } catch { /* private mode */ }
}
