/**
 * POST /api/stripe-webhook
 *
 * Handles Stripe checkout + subscription events and keeps the user's
 * plan in Supabase up to date.
 *
 * Setup (one-time):
 *  1. stripe listen --forward-to localhost:3000/api/stripe-webhook
 *  2. Add the webhook secret to .env.local:
 *       STRIPE_WEBHOOK_SECRET=whsec_...
 *  3. In production, register the endpoint in the Stripe Dashboard:
 *       https://dashboard.stripe.com/webhooks
 *     pointing at https://renoready.com.au/api/stripe-webhook
 *     and subscribe to:
 *       checkout.session.completed
 *       customer.subscription.updated   (renewals, trial ending, cancel at period end)
 *       customer.subscription.deleted   (cancelled or unpaid)
 *
 * Plans:
 *  projectPass  one-time $19      → "project_pass", access for 7 days
 *  proMonthly   $29/mo, 7-day trial → "monthly", access until the end of the
 *               current period (the trial end during the trial), extended on
 *               every renewal by customer.subscription.updated
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { PLANS, isPlanKey, type PlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Slack after a period ends so a renewal a few minutes late doesn't lock anyone out */
const RENEWAL_GRACE_MS = DAY_MS;

/**
 * profiles.subscription_plan value for each plan (legacy checkouts included).
 * The column's check constraint only allows free/paid/day_pass/monthly/annual,
 * so the 7-Day Project Pass is stored as "day_pass"; its 7-day expiry date is
 * what sets the length.
 */
function planValue(plan: string): string {
  if (plan === "projectPass" || plan === "dayPass") return "day_pass";
  if (plan === "proMonthly"  || plan === "monthly") return "monthly";
  if (plan === "annual") return "annual";
  return "paid";
}

/** When a live subscription's access should run out */
function subscriptionAccessEnd(sub: Stripe.Subscription): Date | null {
  if (!["trialing", "active", "past_due"].includes(sub.status)) return null;
  const periodEnd = sub.items.data[0]?.current_period_end ?? sub.trial_end;
  return periodEnd ? new Date(periodEnd * 1000 + RENEWAL_GRACE_MS) : null;
}

function customerId(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY not set");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[stripe-webhook] Signature verification failed: ${msg}`);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  const svc = createSupabaseServiceRoleClient();

  // ── New purchase ─────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session          = event.data.object as Stripe.Checkout.Session;
    const userId           = session.client_reference_id;
    const rawPlan          = session.metadata?.plan ?? "projectPass";
    const plan: PlanKey    = isPlanKey(rawPlan) ? rawPlan : rawPlan === "monthly" ? "proMonthly" : "projectPass";
    const stripeCustomerId = customerId(session.customer);

    if (!userId) {
      console.warn("[stripe-webhook] No client_reference_id — cannot update profile");
      return NextResponse.json({ received: true });
    }

    // One-off pass: 7 days from now. Subscription: to the end of the trial / first period.
    let expiresAt = new Date(Date.now() + PLANS[plan].accessDays * DAY_MS);
    if (session.mode === "subscription" && session.subscription) {
      try {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const end   = subscriptionAccessEnd(await stripe.subscriptions.retrieve(subId));
        if (end) expiresAt = end;
      } catch (err) {
        console.warn("[stripe-webhook] Couldn't read the subscription, using the default period:", err instanceof Error ? err.message : err);
      }
    }

    const planLabel = planValue(rawPlan);
    const { error } = await svc
      .from("profiles")
      .update({
        subscription_plan:       planLabel,
        subscription_expires_at: expiresAt.toISOString(),
        ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
      })
      .eq("id", userId);

    if (error) {
      console.error("[stripe-webhook] Profile update failed:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.info(`[stripe-webhook] ✓ User ${userId} upgraded to ${planLabel} (expires ${expiresAt.toISOString()}, customer ${stripeCustomerId ?? "guest"})`);
  }

  // ── Renewal, trial converting, cancellation ─────────────────────
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub      = event.data.object as Stripe.Subscription;
    const customer = customerId(sub.customer);
    if (!customer) return NextResponse.json({ received: true });

    // Cancelled or unpaid: access stops now. Otherwise it runs to the end of this period.
    const end = event.type === "customer.subscription.deleted" ? null : subscriptionAccessEnd(sub);
    const expiresAt = end ?? new Date();

    const { error } = await svc
      .from("profiles")
      .update({ subscription_expires_at: expiresAt.toISOString() })
      .eq("stripe_customer_id", customer)
      .eq("subscription_plan", "monthly");

    if (error) {
      console.error("[stripe-webhook] Subscription sync failed:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
    console.info(`[stripe-webhook] ✓ Subscription ${sub.id} (${sub.status}) for ${customer}: access until ${expiresAt.toISOString()}`);
  }

  return NextResponse.json({ received: true });
}
