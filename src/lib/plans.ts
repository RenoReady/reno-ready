/**
 * Reno Ready — Stripe plan catalogue
 *
 * Intentionally NOT a "use server" file so this config can be imported
 * freely by client components, server actions, and API routes alike.
 */

export const PLANS = {
  dayPass: {
    label:       "Day Pass — 24hr Unlimited",
    amountCents: 1900,   // $19.00 AUD
    currency:    "aud",
    mode:        "payment" as const,
    priceId:     "price_1TREaM2FxVTY1dEy3nYZMGSC",
  },
  monthly: {
    label:       "Monthly — Unlimited Access",
    amountCents: 2900,   // $29.00 AUD
    currency:    "aud",
    mode:        "subscription" as const,
    priceId:     "price_1TREaM2FxVTY1dEyZ1EfvImi",
  },
  annual: {
    label:       "Annual — Best Value",
    amountCents: 6900,   // $69.00 AUD
    currency:    "aud",
    mode:        "subscription" as const,
    priceId:     "price_1TREy52FxVTY1dEyQyUqLHLm",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
