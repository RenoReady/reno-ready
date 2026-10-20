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
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { PLANS, isPlanKey, type PlanKey } from "@/lib/plans";

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
): Promise<{ url: string } | { error: string; needsAuth?: true }> {
  try {
    if (!isPlanKey(plan)) return { error: "Unknown plan" };
    const stripe = getStripe();
    const base   = await getBaseUrl();
    const { mode, trialDays } = PLANS[plan];
    // A sandbox (see .env.development.local) brings its own price IDs; live uses the catalogue's
    const priceId = (plan === "projectPass" ? process.env.STRIPE_PRICE_PROJECT_PASS : process.env.STRIPE_PRICE_PRO_MONTHLY)?.trim() || PLANS[plan].priceId;

    // ── Resolve the current user so the webhook can attribute the purchase ──
    let userId: string | undefined;
    let email:  string | undefined;
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      email  = user?.email ?? undefined;
    } catch { /* not signed in — allow anyway, webhook will log */ }

    // Paid access is tied to the account, so buyers sign in first
    if (!userId) return { error: "Please sign in first so we can attach your plan to your account.", needsAuth: true };

    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: userId,   // passed back in checkout.session.completed webhook
      customer_email:      email,
      metadata: { plan },            // lets the webhook know which plan was purchased
      line_items: [{ price: priceId, quantity: 1 }],
      // Pro Monthly: 7-day free trial, card collected up front, first charge after the trial
      ...(mode === "subscription" && {
        payment_method_collection: "always" as const,
        subscription_data: {
          metadata: { plan, userId },
          ...(trialDays > 0 && { trial_period_days: trialDays }),
        },
      }),
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

// ── Manage / cancel subscription ───────────────────────────────────

/**
 * Opens Stripe's customer portal so the user can cancel (or update their card)
 * in one click. Needs the portal turned on once in the Stripe Dashboard:
 * Settings → Billing → Customer portal.
 */
export async function createBillingPortalSession(): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in to manage your plan." };

    const { data: profile } = await createSupabaseServiceRoleClient()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    const customer = profile?.stripe_customer_id as string | null | undefined;
    if (!customer) return { error: "We couldn't find a subscription on this account." };

    const session = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: `${await getBaseUrl()}/builder`,
    });
    return { url: session.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe] createBillingPortalSession failed:", message);
    return { error: "We couldn't open billing right now. Please try again." };
  }
}
