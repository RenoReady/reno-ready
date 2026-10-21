// Creates the Reno Ready plans in Stripe and prints their price IDs. Safe to
// re-run: it reuses products and prices it made before (matched by metadata).
//
//   node scripts/stripe-sandbox-setup.mjs          sandbox: reads .env.development.local, writes the IDs back
//   node scripts/stripe-sandbox-setup.mjs --live   live: reads .env.local, only prints the IDs (for src/lib/plans.ts)
//
// Never prints a key.
import fs from "node:fs";
import Stripe from "stripe";

const LIVE = process.argv.includes("--live");
const FILE = LIVE ? ".env.local" : ".env.development.local";
const text = fs.readFileSync(FILE, "utf8");
const key = text.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "");
if (!key) { console.error(`No STRIPE_SECRET_KEY in ${FILE}.`); process.exit(1); }
if (LIVE !== key.startsWith("sk_live_")) {
  console.error(LIVE ? "--live needs a live key (sk_live_)." : "That isn't a sandbox key (sk_test_). Nothing was changed.");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });

const PRODUCTS = [
  { tag: "projectPass", name: "7-Day Project Pass",
    description: "20 renders and 10 edits in 2K, plus PDF Pro Reports, for 7 days.",
    prices: [{ env: "STRIPE_PRICE_PROJECT_PASS", amount: 1900, recurring: null }] },
  { tag: "pro", name: "Reno Ready Pro",
    description: "Unlimited 2K renders and edits, 4K exports, multi-room reports and a commercial use licence.",
    prices: [
      { env: "STRIPE_PRICE_PRO_MONTHLY", amount: 4900,  recurring: { interval: "month" } },
      { env: "STRIPE_PRICE_PRO_ANNUAL",  amount: 39900, recurring: { interval: "year" } },
    ] },
];

let out = text;
for (const p of PRODUCTS) {
  const found = await stripe.products.search({ query: `metadata['reno_plan']:'${p.tag}' AND active:'true'` });
  const product = found.data[0] ?? await stripe.products.create({ name: p.name, description: p.description, metadata: { reno_plan: p.tag } });
  const existing = (await stripe.prices.list({ product: product.id, active: true, limit: 20 })).data;
  for (const pr of p.prices) {
    const price = existing.find((x) => x.unit_amount === pr.amount && x.currency === "aud" && (x.recurring?.interval ?? null) === (pr.recurring?.interval ?? null))
      ?? await stripe.prices.create({ product: product.id, unit_amount: pr.amount, currency: "aud", ...(pr.recurring && { recurring: pr.recurring }) });
    console.log(`${pr.env}=${price.id}   (${p.name}, $${pr.amount / 100}${pr.recurring ? "/" + pr.recurring.interval : " once"})`);
    if (!LIVE) {
      const line = new RegExp(`^${pr.env}=.*$`, "m");
      out = line.test(out) ? out.replace(line, `${pr.env}=${price.id}`) : `${out.trimEnd()}\n${pr.env}=${price.id}\n`;
    }
  }
}
if (!LIVE) { fs.writeFileSync(FILE, out); console.log(`\nSaved to ${FILE}.`); }
