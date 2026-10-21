/**
 * Reno Ready — plans, limits and pricing copy
 *
 * Intentionally NOT a "use server" file so this config can be imported
 * freely by client components, server actions, and API routes alike.
 *
 *   Free          1 preview + 1 edit, 1K, watermarked
 *   projectPass   $19 once  — 20 renders + 10 edits in 2K and PDF Pro Reports for 7 days
 *   proMonthly    $49/mo    — Pro: unlimited (fair use), 4K exports, commercial licence
 *   proAnnual     $399/yr   — Pro, billed yearly
 *
 * Live price IDs are below; a sandbox overrides them with
 * STRIPE_PRICE_PROJECT_PASS / _PRO_MONTHLY / _PRO_ANNUAL (see .env.development.local).
 */

export const PLANS = {
  projectPass: {
    label:       "7-Day Project Pass",
    amountCents: 1900,
    currency:    "aud",
    mode:        "payment" as const,
    priceId:     "price_1USrNi2FxVTY1dEyqbzxkDKT",
    priceEnv:    "STRIPE_PRICE_PROJECT_PASS",
    /** How long one-off access lasts */
    accessDays:  7,
  },
  proMonthly: {
    label:       "Reno Ready Pro (monthly)",
    amountCents: 4900,
    currency:    "aud",
    mode:        "subscription" as const,
    priceId:     "price_1USrNk2FxVTY1dEy5MzzA5r5",
    priceEnv:    "STRIPE_PRICE_PRO_MONTHLY",
    accessDays:  31,
  },
  proAnnual: {
    label:       "Reno Ready Pro (annual)",
    amountCents: 39900,
    currency:    "aud",
    mode:        "subscription" as const,
    priceId:     "price_1USrNk2FxVTY1dEyEqC84PcA",
    priceEnv:    "STRIPE_PRICE_PRO_ANNUAL",
    accessDays:  366,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && v in PLANS;
}

// ── Tiers + limits ─────────────────────────────────────────────────

export type Tier = "free" | "pass" | "pro" | "admin";

/**
 * Renders and edits allowed per period.
 *   free  — once, ever
 *   pass  — per pass (7 days)
 *   pro   — per calendar month (fair use; "unlimited" on the cards)
 */
export const TIER_LIMITS: Record<Exclude<Tier, "admin">, { renders: number; edits: number }> = {
  free: { renders: 1,   edits: 1 },
  pass: { renders: 20,  edits: 10 },
  pro:  { renders: 500, edits: 500 },
};

/** Kept for older imports: free previews per account */
export const FREE_GENERATION_LIMIT = TIER_LIMITS.free.renders;

/**
 * profiles.subscription_plan values. The column's check constraint only allows
 * free/paid/day_pass/monthly/annual, so the Project Pass is stored as "day_pass"
 * and Pro as "monthly" or "annual"; the expiry date sets the length.
 */
export const PAID_PLAN_VALUES = ["day_pass", "monthly", "annual", "paid", "project_pass"];
const PRO_PLAN_VALUES = ["monthly", "annual"];

/** True when a profile's plan is paid and hasn't run out */
export function hasActivePlan(plan: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if (!plan || !PAID_PLAN_VALUES.includes(plan)) return false;
  return !expiresAt || new Date(expiresAt) > new Date();
}

export function tierFor(plan: string | null | undefined, expiresAt: string | null | undefined, isAdmin = false): Tier {
  if (isAdmin) return "admin";
  if (!hasActivePlan(plan, expiresAt)) return "free";
  return PRO_PLAN_VALUES.includes(plan ?? "") ? "pro" : "pass";
}

/** Paid features (2K, PDF reports, no watermark) */
export const isPaidTier = (t: Tier) => t !== "free";
/** Pro-only features (4K exports, commercial licence) */
export const isProTier = (t: Tier) => t === "pro" || t === "admin";

// ── Pricing copy (pricing section, /pricing and the upgrade pop-up) ──

export interface PlanCard {
  id: "free" | "pass" | "pro";
  name: string;
  tagline: string;
  /** Short line for the upgrade pop-up */
  pitch: string;
  features: string[];
  cta: string;
  note: string;
}

export const PLAN_CARDS: Record<PlanCard["id"], PlanCard> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "See your room transformed before you spend a cent.",
    pitch: "Try it on your own room.",
    features: ["1 AI preview of your room", "1 “Not quite right?” edit", "Instant cost estimate", "Watermarked, standard quality"],
    cta: "Start free",
    note: "No credit card needed.",
  },
  pass: {
    id: "pass",
    name: "7-Day Project Pass",
    tagline: "Everything you need to plan one renovation.",
    pitch: "20 renders, 10 edits and PDF reports for one project.",
    features: [
      "20 HD renders in 2K",
      "10 “Not quite right?” edits",
      "Contractor-ready PDF Pro Reports",
      "No watermark",
      "Bathroom, kitchen and bedroom",
    ],
    cta: "Get the 7-Day Pass",
    note: "One-time payment. Nothing renews.",
  },
  pro: {
    id: "pro",
    name: "Reno Ready Pro",
    tagline: "For agents, designers, investors and multi-room renovators.",
    pitch: "Unlimited designs, 4K exports and a commercial licence.",
    features: [
      "Unlimited 2K renders and edits",
      "4 design variations per click",
      "Client share links (before/after)",
      "4K exports for print and listings",
      "PDF reports with your logo and details",
      "Multi-room PDF Pro Reports",
      "Commercial use licence",
      "Priority email support",
    ],
    cta: "Go Pro",
    note: "No contract. Cancel anytime in 1-click.",
  },
};

/** The comparison table under the cards: true / false / text */
export const PLAN_COMPARISON: { label: string; free: boolean | string; pass: boolean | string; pro: boolean | string; soon?: boolean }[] = [
  { label: "AI renders",                         free: "1",            pass: "20",           pro: "Unlimited*" },
  { label: "“Not quite right?” edits", free: "1",            pass: "10",           pro: "Unlimited*" },
  { label: "Image quality",                      free: "Standard",     pass: "2K HD",        pro: "2K HD + 4K export" },
  { label: "Watermark-free",                     free: false,          pass: true,           pro: true },
  { label: "Instant cost estimate",              free: true,           pass: true,           pro: true },
  { label: "Contractor PDF Pro Report",          free: false,          pass: true,           pro: true },
  { label: "Multi-room reports",                 free: false,          pass: false,          pro: true },
  { label: "Commercial use licence",             free: false,          pass: false,          pro: true },
  { label: "Access",                             free: "Forever",      pass: "7 days",       pro: "While subscribed" },
  { label: "Support",                            free: "Email",        pass: "Email",        pro: "Priority" },
  { label: "4 design variations per click",      free: false,          pass: false,          pro: true },
  { label: "Client share links",                 free: false,          pass: false,          pro: true },
  { label: "Your branding on PDF reports",       free: false,          pass: false,          pro: true },
];

/** Pro pricing, monthly vs yearly */
export const PRO_PRICING = {
  monthly: { plan: "proMonthly" as const, price: 49,  per: "/mo",  sub: "Billed monthly" },
  annual:  { plan: "proAnnual"  as const, price: 399, per: "/yr",  sub: "$33.25/mo billed yearly", saving: "Save $189 a year" },
};
