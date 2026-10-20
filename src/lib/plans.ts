/**
 * Reno Ready — Stripe plan catalogue
 *
 * Intentionally NOT a "use server" file so this config can be imported
 * freely by client components, server actions, and API routes alike.
 *
 * Two tiers:
 *   projectPass  $19 once  — 7 days of unlimited 2K renders, edits and Pro Reports
 *   proMonthly   $29/mo    — 7-day free trial (card required), then monthly
 */

/** Free accounts get this many previews (watermarked, 1K, no edits or Pro Reports) */
export const FREE_GENERATION_LIMIT = 1;

export const PLANS = {
  projectPass: {
    label:       "7-Day Project Pass",
    amountCents: 1900,   // $19.00 AUD
    currency:    "aud",
    mode:        "payment" as const,
    priceId:     "price_1TREaM2FxVTY1dEy3nYZMGSC",
    /** How long one-off access lasts */
    accessDays:  7,
    trialDays:   0,
  },
  proMonthly: {
    label:       "Pro Monthly / Unlimited",
    amountCents: 2900,   // $29.00 AUD
    currency:    "aud",
    mode:        "subscription" as const,
    priceId:     "price_1TREaM2FxVTY1dEyZ1EfvImi",
    accessDays:  30,
    /** Free trial before the first charge (Stripe collects the card up front) */
    trialDays:   7,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Card copy, shared by the pricing section and the upgrade pop-up */
export const PLAN_COPY: Record<PlanKey, {
  title: string; price: string; period: string; sub: string;
  features: string[]; cta: string; note?: string; badge: string;
}> = {
  projectPass: {
    title:  "7-Day Project Pass",
    price:  "$19",
    period: "AUD · one-time",
    sub:    "One-time payment. No subscription.",
    badge:  "Best for one project",
    features: [
      "7 days of unlimited 2K renders",
      "Unlimited “Not quite right?” edits",
      "Downloadable PDF Pro Reports",
      "No watermark on your designs",
      "Bathroom, kitchen and bedroom",
    ],
    cta:  "Get the 7-Day Pass",
    note: "Access ends after 7 days. Nothing renews.",
  },
  proMonthly: {
    title:  "Pro Monthly / Unlimited",
    price:  "$29",
    period: "AUD / mo",
    sub:    "7-day free trial. Card required.",
    badge:  "7-day free trial",
    features: [
      "Everything in the Project Pass",
      "Unlimited access, every month",
      "Multi-room PDF Pro Reports",
      "Contractor lead tools",
    ],
    cta:  "Start 7-Day Free Trial",
    note: "$0 today, then $29 AUD/mo. Cancel before day 7 and you won’t be charged.",
  },
};

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && v in PLANS;
}

/** profiles.subscription_plan values that unlock paid features (legacy plans included) */
export const PAID_PLAN_VALUES = ["project_pass", "monthly", "day_pass", "annual", "paid"];

/** True when a profile's plan is paid and hasn't run out */
export function hasActivePlan(plan: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if (!plan || !PAID_PLAN_VALUES.includes(plan)) return false;
  return !expiresAt || new Date(expiresAt) > new Date();
}
