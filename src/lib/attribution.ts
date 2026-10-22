/**
 * Where a visitor came from (first touch), so the admin dashboard can show
 * which ads bring sign-ups and sales.
 *
 *  - middleware.ts sets the `rr_src` cookie on the first visit that carries
 *    UTM tags, an ad click id (fbclid / gclid) or an outside referrer, and
 *    never overwrites it (90 days).
 *  - /auth/callback copies it onto brand-new accounts (app_metadata.attribution).
 *  - Stripe checkout carries it in the session metadata.
 *
 * Tag ad links like: https://www.renoready.com.au/for-builders?utm_source=facebook&utm_medium=paid&utm_campaign=builders
 */

export const ATTRIBUTION_COOKIE = "rr_src";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

export interface Attribution {
  source:   string;          // facebook, google, instagram, newsletter…
  medium:   string | null;   // paid, cpc, organic, referral, email…
  campaign: string | null;
  content:  string | null;   // which ad / creative
  landing:  string;          // first page they landed on
  at:       string;          // ISO time of that visit
}

const clean = (v: string | null | undefined, max = 60) =>
  v ? v.trim().toLowerCase().replace(/[^a-z0-9._ -]/g, "").slice(0, max) || null : null;

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\./;

/** Works out the source of a page visit, or null when there's nothing to go on (a direct visit, or a click within the site) */
export function attributionFrom(url: URL, referrer: string | null, ownHost: string): Attribution | null {
  const q = url.searchParams;
  const base = { landing: url.pathname.slice(0, 80), at: new Date().toISOString() };
  const utm = clean(q.get("utm_source"));
  if (utm) {
    return { source: utm, medium: clean(q.get("utm_medium")), campaign: clean(q.get("utm_campaign"), 80), content: clean(q.get("utm_content"), 80), ...base };
  }
  if (q.get("fbclid")) return { source: "facebook", medium: "paid", campaign: null, content: null, ...base };
  if (q.get("gclid")) return { source: "google", medium: "cpc", campaign: null, content: null, ...base };

  let host: string | null = null;
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : null; } catch { host = null; }
  if (!host || host === ownHost.replace(/^www\./, "") || host.endsWith(".renoready.com.au") || host === "localhost") return null;
  const search = host.match(SEARCH);
  if (search) return { source: search[2], medium: "organic", campaign: null, content: null, ...base };
  const social = /(^|\.)(facebook|instagram|linkedin|tiktok|pinterest|youtube|reddit)\.com$|^t\.co$|^l\.facebook\.com$|^lm\.facebook\.com$/.exec(host);
  return { source: social ? (social[2] ?? "twitter") : host.slice(0, 60), medium: social ? "social" : "referral", campaign: null, content: null, ...base };
}

/** Cookie value; Next.js URL-encodes cookie values itself, so this is plain JSON */
export function encodeAttribution(a: Attribution): string {
  return JSON.stringify(a);
}

export function decodeAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const a = JSON.parse(raw.startsWith("{") ? raw : decodeURIComponent(raw)) as Partial<Attribution>;
    return typeof a.source === "string" && a.source ? {
      source: a.source, medium: a.medium ?? null, campaign: a.campaign ?? null, content: a.content ?? null,
      landing: a.landing ?? "/", at: a.at ?? new Date().toISOString(),
    } : null;
  } catch {
    return null;
  }
}

/** Stripe metadata values (strings only) */
export function attributionMetadata(a: Attribution | null): Record<string, string> {
  if (!a) return {};
  const m: Record<string, string> = { src_source: a.source, src_landing: a.landing };
  if (a.medium) m.src_medium = a.medium;
  if (a.campaign) m.src_campaign = a.campaign;
  if (a.content) m.src_content = a.content;
  return m;
}
