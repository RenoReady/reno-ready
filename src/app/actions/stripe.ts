"use server";

/**
 * Stripe Server Actions
 *
 * Requires in .env.local:
 *   STRIPE_SECRET_KEY=sk_live_...   (or sk_test_... for testing)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
 *
 * Base URL is derived dynamically from the request headers so the
 * server action automatically works on any host (renoready.com.au,
 * preview deploys, localhost). NEXT_PUBLIC_BASE_URL is used as an
 * override only.
 */

import Stripe from "stripe";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/plans";

// Re-export PlanKey so any server-side code that already imported it
// from here continues to work without changes.
export type { PlanKey };

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

// ── Create checkout session ────────────────────────────────────────

/**
 * Build an absolute base URL for Stripe redirects.
 *
 * Order of preference:
 *  1. NEXT_PUBLIC_BASE_URL  (explicit override, useful for local dev)
 *  2. Headers from the incoming request (host + protocol) — works on
 *     renoready.com.au, *.vercel.app preview URLs, and localhost.
 */
async function getBaseUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim() !== "") return explicit.replace(/\/$/, "");

  const h = await headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createCheckoutSession(
  plan: PlanKey,
): Promise<{ url: string } | { error: string }> {
  try {
    const stripe = getStripe();
    const base   = await getBaseUrl();
    const { mode, priceId } = PLANS[plan];

    // ── Resolve the current user ID so the webhook can attribute the purchase ──
    let userId: string | undefined;
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch { /* not signed in — allow anyway, webhook will log */ }

    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: userId,   // passed back in checkout.session.completed webhook
      metadata: { plan },            // lets the webhook know which plan was purchased
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/builder?payment_success=true&plan=${plan}`,
      cancel_url:  `${base}/#pricing`,
      billing_address_collection: "auto",
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[stripe] createCheckoutSession failed for plan "${plan}":`, message);
    return { error: message };
  }
}
