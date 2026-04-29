/**
 * POST /api/stripe-webhook
 *
 * Handles Stripe checkout events and updates the user's subscription
 * in Supabase.
 *
 * Setup (one-time):
 *  1. stripe listen --forward-to localhost:3000/api/stripe-webhook
 *  2. Add the webhook secret to .env.local:
 *       STRIPE_WEBHOOK_SECRET=whsec_...
 *  3. In production, register the endpoint in the Stripe Dashboard:
 *       https://dashboard.stripe.com/webhooks
 *     pointing at https://renoready.com.au/api/stripe-webhook
 *     and subscribe to: checkout.session.completed
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { type PlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Stripe requires the raw request body for signature verification —
// the default Next.js body parser must be bypassed.
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

  if (event.type === "checkout.session.completed") {
    const session         = event.data.object as Stripe.Checkout.Session;
    const userId          = session.client_reference_id;
    const plan            = (session.metadata?.plan ?? "dayPass") as PlanKey;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

    if (!userId) {
      console.warn("[stripe-webhook] No client_reference_id — cannot update profile");
      return NextResponse.json({ received: true });
    }

    // Calculate subscription expiry
    const now     = new Date();
    let expiresAt: Date;
    if (plan === "dayPass") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);        // +24 hrs
    } else if (plan === "annual") {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);  // +365 days
    } else {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);   // +30 days
    }

    const planLabel =
      plan === "dayPass" ? "day_pass" :
      plan === "monthly" ? "monthly"  :
      plan === "annual"  ? "annual"   : "paid";

    const svc = createSupabaseServiceRoleClient();
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

  return NextResponse.json({ received: true });
}
