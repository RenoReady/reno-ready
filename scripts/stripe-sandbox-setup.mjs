// Creates the two Reno Ready plans in a Stripe SANDBOX and writes their price IDs
// into .env.development.local. Safe to re-run: it reuses products it made before.
//
//   node scripts/stripe-sandbox-setup.mjs
//
// Refuses to run with a live key, and never prints the key.
import fs from "node:fs";
import Stripe from "stripe";

const FILE = ".env.development.local";
const text = fs.readFileSync(FILE, "utf8");
const key = text.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim();
if (!key) { console.error(`Paste your sandbox secret key into ${FILE} first.`); process.exit(1); }
if (!key.startsWith("sk_test_")) { console.error("That key isn't a sandbox key (it must start with sk_test_). Nothing was changed."); process.exit(1); }

const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });

const PLANS = [
  { env: "STRIPE_PRICE_PROJECT_PASS", tag: "projectPass", name: "7-Day Project Pass",
    description: "7 days of unlimited 2K renders, edits and PDF Pro Reports.", amount: 1900, recurring: null },
  { env: "STRIPE_PRICE_PRO_MONTHLY", tag: "proMonthly", name: "Pro Monthly / Unlimited",
    description: "Unlimited access, multi-room PDF reports and contractor lead tools.", amount: 2900, recurring: { interval: "month" } },
];

let out = text;
for (const p of PLANS) {
  const found = await stripe.products.search({ query: `metadata['reno_plan']:'${p.tag}' AND active:'true'` });
  const product = found.data[0] ?? await stripe.products.create({ name: p.name, description: p.description, metadata: { reno_plan: p.tag } });
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  const price = prices.data.find((x) => x.unit_amount === p.amount && x.currency === "aud" && !!x.recurring === !!p.recurring)
    ?? await stripe.prices.create({ product: product.id, unit_amount: p.amount, currency: "aud", ...(p.recurring && { recurring: p.recurring }) });
  out = out.match(new RegExp(`^${p.env}=.*$`, "m")) ? out.replace(new RegExp(`^${p.env}=.*$`, "m"), `${p.env}=${price.id}`) : `${out.trimEnd()}\n${p.env}=${price.id}\n`;
  console.log(`${p.name}: ${price.id}`);
}
fs.writeFileSync(FILE, out);
console.log(`\nSaved to ${FILE}.`);
