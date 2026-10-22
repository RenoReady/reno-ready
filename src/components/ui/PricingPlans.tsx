"use client";

/**
 * PricingPlans — Free / 7-Day Project Pass / Pro cards with a monthly-annual
 * switch for Pro, plus the feature comparison table.
 *
 * Used on the landing page (#pricing), /pricing, and (compact) in the upgrade
 * pop-up, where the Free card and the table are left out.
 */

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Crown, Sparkles, ArrowRight, BadgeCheck, ShieldCheck, Lock } from "lucide-react";
import BuyButton from "@/components/ui/BuyButton";
import { PLAN_CARDS, PLAN_COMPARISON, PRO_PRICING, TIER_LIMITS } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

function BillingSwitch({ billing, onChange, dark = false }: { billing: Billing; onChange: (b: Billing) => void; dark?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Pro billing" className={cn("inline-flex items-center gap-1 rounded-full p-1", dark ? "bg-white/10" : "bg-white border border-sand-200 shadow-warm-sm")}>
      {(["monthly", "annual"] as const).map((b) => (
        <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => onChange(b)}
          className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
            billing === b ? (dark ? "bg-white text-charcoal" : "bg-charcoal text-white") : (dark ? "text-white/60 hover:text-white" : "text-charcoal/55 hover:text-charcoal"))}>
          {b === "monthly" ? "Monthly" : "Annual"}
          {b === "annual" && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", billing === b ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700")}>-32%</span>}
        </button>
      ))}
    </div>
  );
}

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className={cn("flex items-start gap-2.5 text-sm", dark ? "text-white/80" : "text-charcoal/75")}>
      <span className={cn("mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full p-0.5", dark ? "bg-terracotta text-white" : "bg-terracotta/10 text-terracotta")}>
        <Check size={11} strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

export default function PricingPlans({ compact = false, showTable = !compact }: { compact?: boolean; showTable?: boolean }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const pro = PRO_PRICING[billing];
  const free = PLAN_CARDS.free, pass = PLAN_CARDS.pass, proCard = PLAN_CARDS.pro;
  const perRender = (19 / TIER_LIMITS.pass.renders).toFixed(2).replace(/^0\./, "") + "c";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center"><BillingSwitch billing={billing} onChange={setBilling} /></div>

      <div className={cn("grid gap-5 items-stretch", compact ? "sm:grid-cols-2" : "md:grid-cols-3")}>
        {/* ── Free ── */}
        {!compact && (
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-warm-sm">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-charcoal/25" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-charcoal/45">{free.name}</p>
              <p className="mt-1 text-sm text-charcoal/60 min-h-[2.5rem]">{free.tagline}</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-charcoal">$0</p>
              <p className="mt-1 text-xs font-semibold text-charcoal/45">Forever</p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">{free.features.map((f) => <Feature key={f}>{f}</Feature>)}</ul>
            <div className="flex flex-col gap-1.5">
              <Link href="/builder" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-charcoal/20 py-3 text-sm font-bold text-charcoal/75 transition-colors hover:border-charcoal/40">
                {free.cta} <ArrowRight size={15} />
              </Link>
              <p className="text-center text-xs text-charcoal/45">{free.note}</p>
            </div>
          </div>
        )}

        {/* ── 7-Day Project Pass ── */}
        <div className={cn("relative flex flex-col gap-5 overflow-hidden rounded-3xl border-2 border-terracotta bg-gradient-to-b from-terracotta/10 to-white p-6 shadow-warm-lg", !compact && "md:-mt-2 md:mb-2")}>
          <div className="absolute inset-x-0 top-0 h-1.5 bg-terracotta" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-terracotta">{pass.name}</p>
              <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Most popular</span>
            </div>
            <p className="mt-1 text-sm text-charcoal/65 min-h-[2.5rem]">{pass.tagline}</p>
          </div>
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-bold text-charcoal">$19</span>
              <span className="mb-1.5 text-sm font-semibold text-charcoal/50">AUD once</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-700">Just {perRender} a render · 7 days of access</p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">{pass.features.map((f) => <Feature key={f}>{f}</Feature>)}</ul>
          <div className="flex flex-col gap-1.5">
            <BuyButton plan="projectPass" variant="primary" label={<>{pass.cta} <ArrowRight size={15} /></>} className="py-3.5" />
            <p className="text-center text-xs text-charcoal/50">{pass.note}</p>
          </div>
        </div>

        {/* ── Pro ── */}
        <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-charcoal p-6 text-white shadow-warm-xl">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-300 via-terracotta to-amber-300" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-terracotta/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300"><Crown size={14} /> {proCard.name}</p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/75">For pros</span>
            </div>
            <p className="mt-1 text-sm text-white/60 min-h-[2.5rem]">{proCard.tagline}</p>
          </div>
          <div className="relative">
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-bold">${pro.price}</span>
              <span className="mb-1.5 text-sm font-semibold text-white/50">AUD{pro.per}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/55">
              {pro.sub}
              {billing === "annual" && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">{PRO_PRICING.annual.saving}</span>}
              {billing === "monthly" && (
                <button type="button" onClick={() => setBilling("annual")} className="text-amber-300 underline underline-offset-2 hover:text-amber-200">Save $189 yearly</button>
              )}
            </p>
          </div>
          <div className="relative flex-1">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-white/40">Everything in the pass, plus</p>
            <ul className="flex flex-col gap-2.5">{proCard.features.map((f) => <Feature key={f} dark>{f}</Feature>)}</ul>
          </div>
          <div className="relative flex flex-col gap-1.5">
            <BuyButton plan={pro.plan} variant="light" label={<><Sparkles size={15} /> {proCard.cta} {billing === "annual" ? "yearly" : "monthly"}</>} className="py-3.5" />
            <p className="text-center text-xs text-white/50">{proCard.note}</p>
          </div>
        </div>
      </div>

      {compact && (
        <Link href="/pricing" target="_blank" className="-mt-3 text-center text-xs font-semibold text-charcoal/55 underline underline-offset-2 hover:text-charcoal">
          Compare every feature
        </Link>
      )}

      {/* ── Comparison ── */}
      {showTable && (
        <div className="overflow-x-auto rounded-3xl border border-sand-200 bg-white/80 shadow-warm-sm">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="px-3 sm:px-5 py-4 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-charcoal/45">What you get</th>
                {[["Free", "Free", "w-[17%] border-charcoal/25 text-charcoal/60"], ["Project Pass", "Pass", "w-[17%] border-terracotta text-terracotta"], ["Pro", "Pro", "w-[25%] border-amber-400 text-charcoal"]].map(([name, short, cls]) => (
                  <th key={name} className={cn("sm:w-auto border-t-4 px-1.5 sm:px-3 py-4 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest", cls)}>
                    <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.label} className="border-t border-sand-100">
                  <td className="px-3 sm:px-5 py-3 font-medium text-charcoal/75">
                    {row.label}
                    {row.soon && <span className="mt-1 inline-block sm:mt-0 sm:ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Coming soon</span>}
                  </td>
                  {([row.free, row.pass, row.pro] as const).map((v, i) => (
                    <td key={i} className={cn("px-1.5 sm:px-3 py-3 text-center", i === 1 && "bg-terracotta/[0.04]", i === 2 && "bg-amber-50/60")}>
                      {v === true ? <Check size={17} strokeWidth={2.5} className={cn("mx-auto", i === 2 ? "text-amber-600" : "text-terracotta")} />
                        : v === false ? <Minus size={15} className="mx-auto text-charcoal/20" />
                        : <span className="text-[11px] sm:text-sm font-semibold leading-tight text-charcoal">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-semibold text-charcoal/60">
          <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-terracotta" /> No contracts, cancel anytime in 1-click</span>
          <span className="flex items-center gap-2"><Lock size={15} className="text-terracotta" /> Secure checkout with Stripe</span>
          {!compact && <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-terracotta" /> Try it free before you pay</span>}
        </div>
        {compact && (
          <p className="text-center text-[11px] text-charcoal/45">
            Pro renews automatically until you cancel. By buying you agree to our{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-charcoal/70">Terms of Use</Link>.
          </p>
        )}
        {!compact && (
          <p className="text-center text-xs text-charcoal/40">
            Pro includes up to {TIER_LIMITS.pro.renders} renders and {TIER_LIMITS.pro.edits} edits each calendar month. Prices in AUD. Pro renews automatically until you cancel.
            {" "}By buying a plan you agree to our <Link href="/terms" className="underline underline-offset-2 hover:text-charcoal/70">Terms of Use</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
