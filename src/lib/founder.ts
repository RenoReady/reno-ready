/**
 * Founding member offer: live status from Stripe (server only).
 *
 * The offer is the FOUNDER promotion code (see FOUNDER_OFFER in plans.ts and
 * scripts/stripe-founder-setup.mjs). Stripe enforces the 10-spot cap itself;
 * this only reads how many are left so the page can say so, and hands
 * checkout the code's id so the discount is already applied.
 *
 * Nothing here throws: no key, no code, or Stripe being down all read as
 * "no offer", and the site simply shows normal pricing.
 */
import Stripe from "stripe";
import { FOUNDER_OFFER } from "@/lib/plans";

export interface FounderStatus {
  /** Stripe promotion code id, for Checkout's `discounts` */
  promotionCodeId: string;
  left:  number;
  total: number;
}

export async function founderStatus(): Promise<FounderStatus | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
    const { data } = await stripe.promotionCodes.list({ code: FOUNDER_OFFER.code, active: true, limit: 1 });
    const promo = data[0];
    if (!promo) return null;
    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) return null;
    const total = promo.max_redemptions ?? FOUNDER_OFFER.spots;
    const left  = Math.max(0, total - promo.times_redeemed);
    return left > 0 ? { promotionCodeId: promo.id, left, total } : null;
  } catch (err) {
    console.warn("[founder] Couldn't read the founding member code:", err instanceof Error ? err.message : err);
    return null;
  }
}
