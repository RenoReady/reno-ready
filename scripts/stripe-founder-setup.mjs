// Sets up the founding member offer in Stripe, and the abandoned-checkout email's webhook event.
// Safe to re-run: it reuses what it made before.
//
//   node scripts/stripe-founder-setup.mjs          sandbox: reads .env.development.local
//   node scripts/stripe-founder-setup.mjs --live   live: reads .env.local
//
// What it does:
//  1. Coupon "Founding member": $20 off Reno Ready Pro, every month, for as long as the
//     subscription lasts (so Pro monthly is $29 instead of $49). Pro product only.
//  2. Promotion code FOUNDER on that coupon, capped at 10 redemptions. The site shows the
//     offer on /for-builders only while this code is active and has spots left.
//  3. Adds checkout.session.expired to the webhook endpoint(s) pointing at
//     /api/stripe-webhook, so unpaid checkouts get one follow-up email.
//
// To end the offer early: Stripe Dashboard → Product catalogue → Coupons → Founding member →
// archive the FOUNDER code. Existing founders keep their price.
//
// Never prints a key.
import fs from "node:fs";
import Stripe from "stripe";

const LIVE = process.argv.includes("--live");
const FILE = LIVE ? ".env.local" : ".env.development.local";
const CODE = "FOUNDER";
const SPOTS = 10;
const COUPON_ID = "founding-member-29";
const EVENT = "checkout.session.expired";

const text = fs.readFileSync(FILE, "utf8");
const key = text.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "");
if (!key) { console.error(`No STRIPE_SECRET_KEY in ${FILE}.`); process.exit(1); }
if (LIVE !== key.startsWith("sk_live_")) {
  console.error(LIVE ? "--live needs a live key (sk_live_)." : "That isn't a sandbox key (sk_test_). Nothing was changed.");
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });

// The Pro monthly price: the sandbox's own, or the live one in src/lib/plans.ts
const priceId = LIVE
  ? fs.readFileSync("src/lib/plans.ts", "utf8").match(/proMonthly:\s*\{[\s\S]*?priceId:\s*"([^"]+)"/)?.[1]
  : text.match(/^STRIPE_PRICE_PRO_MONTHLY=(.*)$/m)?.[1]?.trim();
if (!priceId) { console.error("Couldn't find the Pro monthly price ID."); process.exit(1); }
const price = await stripe.prices.retrieve(priceId);
const product = typeof price.product === "string" ? price.product : price.product.id;
if (price.unit_amount !== 4900 || price.currency !== "aud") {
  console.error(`Pro monthly price ${priceId} is ${price.unit_amount / 100} ${price.currency}, expected 49 aud. Nothing was changed.`);
  process.exit(1);
}

// 1. Coupon
let coupon;
try { coupon = await stripe.coupons.retrieve(COUPON_ID); }
catch {
  coupon = await stripe.coupons.create({
    id: COUPON_ID, name: "Founding member", amount_off: 2000, currency: "aud",
    duration: "forever", applies_to: { products: [product] },
  });
}
console.log(`Coupon:          ${coupon.id} ($${coupon.amount_off / 100} off, ${coupon.duration})`);

// 2. Promotion code
const existing = (await stripe.promotionCodes.list({ code: CODE, active: true, limit: 1 })).data[0];
const promo = existing ?? await stripe.promotionCodes.create({
  promotion: { type: "coupon", coupon: COUPON_ID }, code: CODE, max_redemptions: SPOTS,
  metadata: { reno_offer: "founder" },
});
console.log(`Promotion code:  ${promo.code} (${promo.times_redeemed} of ${promo.max_redemptions ?? "unlimited"} used)`);

// 3. Webhook event for the abandoned-checkout email
const endpoints = (await stripe.webhookEndpoints.list({ limit: 100 })).data
  .filter((e) => e.url.includes("/api/stripe-webhook") && (!LIVE || e.url.includes("renoready.com.au")));
if (!endpoints.length) console.log(`Webhook:         none found for /api/stripe-webhook. Add "${EVENT}" to it by hand.`);
for (const e of endpoints) {
  if (e.enabled_events.includes("*") || e.enabled_events.includes(EVENT)) {
    console.log(`Webhook:         ${e.url} already gets ${EVENT}`);
  } else {
    await stripe.webhookEndpoints.update(e.id, { enabled_events: [...e.enabled_events, EVENT] });
    console.log(`Webhook:         ${e.url} now gets ${EVENT}`);
  }
}
if (!LIVE) console.log(`\n(Sandbox: "stripe listen" forwards every event, so local testing needs nothing else.)`);
