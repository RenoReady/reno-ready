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

export async function fetchRevenue(excludeEmail: string): Promise<Revenue | { error: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "Stripe isn't configured" };
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
    const monthKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Australia/Brisbane" }).slice(0, 7);
    const nowMonth = monthKey(new Date());
    const skip = excludeEmail.toLowerCase();
    // the admin's own Stripe customers, in case a charge carries no email
    const skipCustomers = new Set((await stripe.customers.list({ email: excludeEmail, limit: 20 })).data.map((c) => c.id));

    let gross = 0, refunded = 0, thisMonth = 0, payments = 0, seen = 0, partial = false;
    for await (const c of stripe.charges.list({ limit: 100 })) {
      if (++seen > MAX_CHARGES) { partial = true; break; }
      if (c.status !== "succeeded" || !c.paid) continue;
      const email = (c.billing_details?.email ?? c.receipt_email ?? "").toLowerCase();
      const customer = typeof c.customer === "string" ? c.customer : c.customer?.id;
      if ((email && email === skip) || (customer && skipCustomers.has(customer))) continue;
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
