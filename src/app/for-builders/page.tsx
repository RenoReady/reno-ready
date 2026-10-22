/**
 * /for-builders — landing page for builders, renovators and designers (the
 * contractor ad, "Show them the reno before they sign"), leading into Pro.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Camera, CheckCircle2, FileText, Images, Layers, Link2, MessageSquareQuote, Palette, Printer, ShieldCheck,
} from "lucide-react";
import HeroVideo from "@/components/ui/HeroVideo";
import BuyButton from "@/components/ui/BuyButton";
import { CONTRACTOR_VIDEO } from "@/lib/roomPages";
import { PRO_PRICING } from "@/lib/plans";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "For Builders & Renovators: Show Them the Reno Before They Sign",
  description:
    "Snap your client's room, pick the finishes together and hand them an AI before-and-after with an itemised estimate in seconds. Branded PDF reports, client share links and 4 variations per click with Reno Ready Pro.",
  alternates: { canonical: "/for-builders" },
  openGraph: {
    title: "Reno Ready for Builders: Show Them the Reno Before They Sign",
    description: "AI before-and-afters, itemised estimates, branded reports and client share links that help close renovation quotes.",
    url: "/for-builders",
    images: [{ url: "/videos/renoready-contractor-video-poster.jpg", width: 720, height: 1280, alt: "Show them the reno before they sign." }],
  },
};

const STEPS = [
  { icon: Camera, title: "Snap the room on site", body: "Take a photo of the client's bathroom, kitchen or bedroom on your phone while you're measuring up." },
  { icon: Palette, title: "Pick the finishes together", body: "Tiles, tapware, vanity, benchtops, flooring. Tap through options at the kitchen table, not in three follow-up emails." },
  { icon: Images, title: "Show them the new room", body: "An AI before-and-after of their actual room in seconds, with an itemised estimate alongside it." },
];

const TOOLKIT = [
  { icon: Layers, title: "4 variations per click", body: "Four takes on the design at once. Edit any of them, and every version stays a tap away." },
  { icon: Link2, title: "Client share links", body: "Send a private page with the before/after and estimate. They approve it or ask a question, and you see when they opened it." },
  { icon: FileText, title: "Reports with your branding", body: "PDF reports with your logo, licence number and contact details, ready to attach to a quote." },
  { icon: Printer, title: "4K exports", body: "Print-quality renders for presentations, proposals and your portfolio." },
  { icon: MessageSquareQuote, title: "Multi-room project totals", body: "Add the bathroom, kitchen and bedrooms to one project and send a whole-home report." },
  { icon: ShieldCheck, title: "Commercial use licence", body: "Use the renders in your quotes, marketing and socials." },
];

const FAQ = [
  { q: "Is the estimate a quote?", a: "No. It's an indicative, itemised estimate based on Australian market rates, there to start the conversation. You set the final price after you've seen the site." },
  { q: "Do my clients need an account?", a: "No. Share links open on any phone or computer, no sign-up. They can approve the design or ask you a question straight from the page." },
  { q: "Will my clients see Reno Ready or my business?", a: "Your business. Add your logo, licence and contact details once under My Account, and they appear on your PDF reports and share links." },
  { q: "Which rooms does it work for?", a: "Bathrooms, kitchens, and bedrooms and living areas. Start from a photo of the real room, or a sample if you don't have one handy." },
  { q: "How many designs can I make?", a: "Pro includes unlimited 2K renders and edits under fair use, plus 4K exports, for one monthly or yearly price." },
  { q: "Can I cancel?", a: "Yes. No contracts, cancel anytime in 1-click from My Account. You keep Pro until the end of the period you've paid for." },
];

export default function ForBuildersPage() {
  const monthly = PRO_PRICING.monthly, annual = PRO_PRICING.annual;
  return (
    <div className="min-h-screen bg-sand">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-6 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-terracotta/6 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-terracotta/20 bg-terracotta/10 px-4 py-2 text-sm font-semibold text-terracotta">
              <span className="h-2 w-2 rounded-full bg-terracotta" /> For builders, renovators &amp; designers
            </span>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] text-charcoal lg:text-6xl xl:text-7xl">
              Show them the reno <span className="text-terracotta">before they sign.</span>
            </h1>
            <p className="max-w-[560px] text-xl leading-relaxed text-charcoal/60">
              Clients stall on quotes because they can&apos;t picture the finished room. Snap it, pick the finishes together, and hand
              them an AI before-and-after with an itemised estimate, in seconds.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="sm:w-64">
                <BuyButton plan={monthly.plan} variant="primary" className="py-4 text-base" label={<>Go Pro, ${monthly.price}/mo <ArrowRight size={18} /></>} />
              </div>
              <Link href="/builder" className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-sand-300 bg-white/70 px-6 py-4 text-base font-bold text-charcoal hover:border-terracotta/50 hover:text-terracotta">
                Try a free preview first
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              {["No contracts, cancel anytime in 1-click", "Your branding on reports and links", "Bathrooms · Kitchens · Bedrooms"].map((b) => (
                <span key={b} className="flex items-center gap-2 text-sm font-medium text-charcoal/60"><CheckCircle2 size={15} className="text-terracotta" />{b}</span>
              ))}
            </div>
          </div>
          <HeroVideo {...CONTRACTOR_VIDEO} className="order-first lg:order-none lg:mr-6"
            label="Reno Ready for builders in 30 seconds: quotes that stall, then a before-and-after with the cost that gets the job signed" />
        </div>
      </section>

      {/* ── The problem ────────────────────────────────────── */}
      <section className="bg-charcoal px-6 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-terracotta">Sound familiar?</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">&ldquo;We need to think about it.&rdquo;</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/65">
              You measured up, priced it properly and sent the quote. Then it goes quiet. Most of the time they&apos;re not shopping on price:
              they just can&apos;t see past the room they&apos;ve already got.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {["Quotes sit unsigned while clients scroll Pinterest", "Follow-up texts go unanswered", "Someone else's quote wins with a nicer picture"].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 px-5 py-4 text-base text-white/80">
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-terracotta">On site, in minutes</p>
          <h2 className="mt-2 text-center text-3xl font-bold text-charcoal sm:text-4xl">Win the job at the kitchen table</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-warm-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta"><s.icon size={20} /></span>
                  <span className="text-sm font-bold text-charcoal/35">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-charcoal">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pro toolkit ────────────────────────────────────── */}
      <section className="border-y border-sand-200 bg-white/50 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-terracotta">Reno Ready Pro</p>
          <h2 className="mt-2 text-center text-3xl font-bold text-charcoal sm:text-4xl">Everything you need to close the quote</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLKIT.map((t) => (
              <div key={t.title} className="flex gap-4 rounded-3xl border border-sand-200 bg-white p-6 shadow-warm-sm">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-charcoal text-white"><t.icon size={19} /></span>
                <div>
                  <h3 className="text-base font-bold text-charcoal">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/60">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-28 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-charcoal sm:text-4xl">One job pays for a year of Pro</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-charcoal/60">Unlimited designs under fair use, your branding on everything, and no contract.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-3xl border border-sand-200 bg-white p-7 shadow-warm-sm">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-charcoal/45">Monthly</p>
                <p className="mt-2 text-4xl font-bold text-charcoal">${monthly.price}<span className="text-lg font-semibold text-charcoal/45">{monthly.per}</span></p>
                <p className="text-sm text-charcoal/50">{monthly.sub}</p>
              </div>
              <BuyButton plan={monthly.plan} variant="primary" className="py-3.5" label={<>Go Pro monthly <ArrowRight size={15} /></>} />
            </div>
            <div className="relative flex flex-col gap-5 rounded-3xl bg-charcoal p-7 text-white shadow-warm-lg">
              <span className="absolute right-5 top-5 rounded-full bg-terracotta px-3 py-1 text-xs font-bold">{annual.saving}</span>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/45">Yearly</p>
                <p className="mt-2 text-4xl font-bold">${annual.price}<span className="text-lg font-semibold text-white/45">{annual.per}</span></p>
                <p className="text-sm text-white/55">{annual.sub}</p>
              </div>
              <BuyButton plan={annual.plan} variant="light" className="py-3.5" label={<>Go Pro yearly <ArrowRight size={15} /></>} />
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-charcoal/50">
            Prices in AUD. No contracts, cancel anytime in 1-click. <Link href="/pricing" className="font-semibold text-charcoal/70 underline underline-offset-2">Compare all plans</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-charcoal">Questions from builders</h2>
          <div className="mt-8 flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-sand-200 bg-white/80 px-5 py-4 shadow-warm-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-charcoal">
                  {f.q}<ArrowRight size={16} className="flex-shrink-0 text-terracotta transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-terracotta/20 bg-terracotta/5 px-6 py-8 text-center">
            <p className="text-xl font-bold text-charcoal">See it on a real room first</p>
            <p className="max-w-md text-sm text-charcoal/60">Your first preview and edit are free. No card needed.</p>
            <Link href="/builder" className="mt-1 flex items-center gap-2 rounded-2xl bg-terracotta px-6 py-3 text-sm font-bold text-white shadow-warm-sm hover:bg-terracotta/90">
              Try a free preview <ArrowRight size={15} />
            </Link>
            <p className="text-xs text-charcoal/45">Questions? <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a></p>
          </div>
        </div>
      </section>
    </div>
  );
}
