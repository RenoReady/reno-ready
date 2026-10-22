/**
 * Real revenue from Stripe for the admin dashboard (server only).
 *
 * Sums succeeded charges and subtracts refunds. Payments made by the admin's
 * own email are left out, so test purchases don't inflate the numbers.
 */

import Stripe from "stripe";

export interface Revenue {
  /** cents, after refunds */
  net:       number;
  gross:     number;
  refunded:  number;
  /** net for the current calendar month (Australia/Brisbane) */
  thisMonth: number;
  payments:  number;
  /** true when there were more charges than we looked at */
  partial:   boolean;
}

const MAX_CHARGES = 2_000;

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: "2026-03-25.dahlia" }) : null;
}

/** Every succeeded charge that counts as revenue (newest first), skipping the admin's own; `partial` once the cap is hit */
async function* countedCharges(stripe: Stripe, excludeEmail: string): AsyncGenerator<Stripe.Charge | { partial: true }> {
  const skip = excludeEmail.toLowerCase();
  // the admin's own Stripe customers, in case a charge carries no email
  const skipCustomers = new Set((await stripe.customers.list({ email: excludeEmail, limit: 20 })).data.map((c) => c.id));
  let seen = 0;
  for await (const c of stripe.charges.list({ limit: 100 })) {
    if (++seen > MAX_CHARGES) { yield { partial: true }; return; }
    if (c.status !== "succeeded" || !c.paid) continue;
    const email = (c.billing_details?.email ?? c.receipt_email ?? "").toLowerCase();
    const customer = typeof c.customer === "string" ? c.customer : c.customer?.id;
    if ((email && email === skip) || (customer && skipCustomers.has(customer))) continue;
    yield c;
  }
}

export async function fetchRevenue(excludeEmail: string): Promise<Revenue | { error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { error: "Stripe isn't configured" };
  try {
    const monthKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" }).slice(0, 7);
    const nowMonth = monthKey(new Date());
    let gross = 0, refunded = 0, thisMonth = 0, payments = 0, partial = false;
    for await (const c of countedCharges(stripe, excludeEmail)) {
      if ("partial" in c) { partial = true; break; }
      const net = c.amount_captured - c.amount_refunded;
      gross += c.amount_captured;
      refunded += c.amount_refunded;
      payments += 1;
      if (monthKey(new Date(c.created * 1000)) === nowMonth) thisMonth += net;
    }
    return { net: gross - refunded, gross, refunded, thisMonth, payments, partial };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stripe request failed" };
  }
}

/** Net revenue (cents, after refunds) per Stripe customer id, same rules as fetchRevenue */
export async function netByCustomer(excludeEmail: string): Promise<Map<string, number> | { error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { error: "Stripe isn't configured" };
  try {
    const out = new Map<string, number>();
    for await (const c of countedCharges(stripe, excludeEmail)) {
      if ("partial" in c) break;
      const customer = typeof c.customer === "string" ? c.customer : c.customer?.id;
      if (customer) out.set(customer, (out.get(customer) ?? 0) + c.amount_captured - c.amount_refunded);
    }
    return out;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stripe request failed" };
  }
}
