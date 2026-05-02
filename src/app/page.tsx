import Link from "next/link";
import {
  ArrowRight, Sparkles, DollarSign, Users, CheckCircle2,
  ChevronDown, PencilRuler, FileText, BadgeCheck,
  Zap, Repeat2, Check, TriangleAlert, Home,
} from "lucide-react";
import Button from "@/components/ui/Button";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BuyButton from "@/components/ui/BuyButton";
import PricingMotion from "@/components/ui/PricingMotion";
import Marquee from "@/components/ui/Marquee";
import { type PlanKey } from "@/lib/plans";

// ── Tile swatch preview ────────────────────────────────────────────
function TileSwatch({ bgClass }: { bgClass: string }) {
  return (
    <div className={`w-14 h-14 ${bgClass} rounded-xl shadow-warm-sm ring-1 ring-black/5`} />
  );
}

// ── FAQ item ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-sand-200 last:border-0">
      <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none">
        <span className="text-base font-semibold text-charcoal">{q}</span>
        <ChevronDown
          size={18}
          className="text-charcoal/40 flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
        />
      </summary>
      <p className="text-charcoal/65 text-sm leading-relaxed pb-5 pr-8">{a}</p>
    </details>
  );
}

// ── Pricing card ───────────────────────────────────────────────────
function PricingCard({
  badge, badgeColor, title, price, period, sub, features, cta, featured, plan,
}: {
  badge?:      string;
  badgeColor?: string;
  title:       string;
  price:       string;
  period:      string;
  sub:         string;
  features:    string[];
  cta:         string;
  featured?:   boolean;
  plan:        PlanKey;
}) {
  return (
    <div className={`relative flex flex-col gap-6 p-7 rounded-3xl border-2 transition-shadow ${
      featured
        ? "border-terracotta bg-terracotta/4 shadow-warm-lg"
        : "border-sand-200 bg-white/70 shadow-warm-sm hover:shadow-warm"
    }`}>
      {badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${badgeColor ?? "bg-terracotta"}`}>
          {badge}
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-3">{title}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold text-charcoal">{price}</span>
          <span className="text-charcoal/50 text-sm mb-1.5">{period}</span>
        </div>
        <p className="text-sm text-charcoal/55 mt-1">{sub}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-charcoal/75">
            <Check size={15} className="text-terracotta mt-0.5 flex-shrink-0" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <BuyButton plan={plan} label={cta} featured={featured} />
      </div>
    </div>
  );
}

// ── JSON-LD structured data ────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Reno Ready",
  "description": "AI-powered home renovation design and cost estimator for Australian homeowners. Visualise your bathroom, kitchen, or bedroom renovation with professional AI previews and real Australian cost breakdowns.",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "url": "https://renoready.com.au",
  "audience": {
    "@type": "Audience",
    "geographicArea": {
      "@type": "Country",
      "name": "Australia",
    },
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "AUD",
    "lowPrice": "0",
    "highPrice": "69",
    "offers": [
      { "@type": "Offer", "name": "Free",      "price": "0",  "priceCurrency": "AUD", "description": "3 free AI previews, no credit card required" },
      { "@type": "Offer", "name": "Day Pass",  "price": "19", "priceCurrency": "AUD", "description": "Unlimited AI renders for 24 hours"            },
      { "@type": "Offer", "name": "Monthly",   "price": "29", "priceCurrency": "AUD", "description": "Unlimited AI renders, cancel anytime"          },
      { "@type": "Offer", "name": "Annual",    "price": "69", "priceCurrency": "AUD", "description": "Full year of unlimited access"                 },
    ],
  },
  "featureList": [
    "AI bathroom, kitchen, and bedroom design visualisation",
    "Multi-room project planning and reporting",
    "Instant renovation cost estimation",
    "Australian market pricing with hidden cost alerts",
    "Upload your own room photo",
    "Structural change planning",
    "Builder-ready design brief export",
  ],
};

// ── Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-terracotta/6 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-[400px] h-[400px] rounded-full bg-sand-300/60 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left: copy */}
            <ScrollReveal>
              <div className="flex flex-col gap-7">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta/10 border border-terracotta/20 w-fit">
                  <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                  <span className="text-sm font-semibold text-terracotta tracking-tight">
                    Australia&apos;s #1 Home Renovation Design Engine
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-charcoal leading-[1.05] text-balance">
                  Visualize Your Dream Home Renovation{" "}
                  <span className="text-terracotta">in Seconds.</span>
                </h1>

                {/* Sub-headline */}
                <p className="text-xl text-charcoal/60 leading-relaxed max-w-[520px]">
                  Professional AI designs and realistic cost breakdowns for your{" "}
                  <span className="font-semibold text-charcoal/80">Bathroom</span>,{" "}
                  <span className="font-semibold text-charcoal/80">Kitchen</span>, and{" "}
                  <span className="font-semibold text-charcoal/80">Master Suite</span>.
                  Stop guessing and start building with Reno Ready.
                </p>

                {/* Primary CTA — Royal Blue */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link href="/builder">
                    <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:scale-[1.02] active:scale-100 transition-all duration-200">
                      Start My Free Preview
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </Link>
                </div>

                {/* Whole-home nudge */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 max-w-[480px]">
                  <Home size={14} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-sm text-blue-700 leading-snug">
                    <span className="font-semibold">Planning a whole-home refresh?</span>{" "}
                    Easily add multiple rooms to a single project report for your builder.
                  </p>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-5 pt-1">
                  {["3 free previews", "No credit card", "Bathrooms · Kitchens · Bedrooms"].map((b) => (
                    <div key={b} className="flex items-center gap-2 text-sm font-medium text-charcoal/60">
                      <CheckCircle2 size={15} className="text-terracotta" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Right: before/after slider */}
            <ScrollReveal variant="scaleIn" delay={0.15}>
              <div className="flex flex-col gap-4">
                <BeforeAfterSlider height={420} className="w-full" />
                <p className="text-xs text-charcoal/45 text-center leading-relaxed px-2">
                  <span className="font-semibold text-charcoal/60">Prompt used:</span>{" "}
                  Modernize this space with terracotta floor tiles, charcoal vanity, and brushed gold tapware.
                </p>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-4 bg-charcoal overflow-hidden">
        <Marquee duration={45}>
          <div className="flex items-center gap-8 px-10 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-terracotta", "bg-stone-300", "bg-sand-300", "bg-charcoal/40"].map((c, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 border-charcoal ${c}`} />
                ))}
              </div>
              <p className="text-white font-semibold text-sm">
                Join{" "}
                <span className="text-terracotta font-bold" style={{ textShadow: "0 0 18px rgba(210,125,94,0.55)" }}>
                  1,200+
                </span>{" "}
                Australians planning their renovations smarter
              </p>
            </div>
            <span className="text-white/20 text-base select-none">◆</span>
            <p className="text-white/45 text-xs">
              Bathrooms · Kitchens · Bedrooms —{" "}
              <span className="text-terracotta/75 font-semibold">one platform</span>
            </p>
            <span className="text-white/20 text-base select-none">◆</span>
            <p className="text-white/45 text-xs">3 free AI previews — no credit card required</p>
            <span className="text-white/20 text-base select-none">◆</span>
            <p className="text-white/45 text-xs">
              Average saving:{" "}
              <span className="text-terracotta/75 font-semibold">$2,400</span> in architect fees
            </p>
            <span className="text-white/20 text-base select-none">◆</span>
          </div>
        </Marquee>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CHOOSE YOUR SPACE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white/40 border-y border-sand-200">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Choose Your Space</p>
              <h2 className="text-4xl font-bold text-charcoal mb-4">Where does your renovation start?</h2>
              <p className="text-lg text-charcoal/55 max-w-xl mx-auto">
                Select a room — our AI loads a tailored design suite with prompts, materials, and costs specific to that space.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">

            {/* The Sanctuary — Bathroom */}
            <ScrollReveal delay={0}>
              <Link href="/builder" className="group block h-full">
                <div className="relative flex flex-col gap-5 p-8 rounded-3xl border-2 border-sand-200 bg-white/60 hover:border-terracotta/50 hover:shadow-warm-lg transition-all duration-300 h-full overflow-hidden cursor-pointer">
                  {/* Hover stat pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <span className="text-[10px] font-bold text-terracotta uppercase tracking-wide">2026 Trend: Nude Travertine</span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-terracotta/10 flex items-center justify-center text-4xl group-hover:bg-terracotta/20 transition-colors duration-300">
                    🛁
                  </div>

                  <div>
                    <p className="text-xs font-bold text-terracotta/70 uppercase tracking-widest mb-1">The Sanctuary</p>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">Bathroom</h3>
                    <p className="text-charcoal/55 leading-relaxed text-sm">
                      Spa-like finishes, wall-hung vanities, frameless shower screens. From a $15k cosmetic refresh to a $40k full strip-out.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2 mt-auto">
                    {["Nude Travertine & Zellige tile library", "Structural changes: walk-in shower, niches", "Tapware in chrome, matte black, brushed gold", "Avg. cost: $15k – $35k"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-charcoal/60">
                        <span className="w-1 h-1 rounded-full bg-terracotta flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-terracotta group-hover:gap-2.5 transition-all duration-200">
                    Design my bathroom <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            </ScrollReveal>

            {/* The Heart — Kitchen */}
            <ScrollReveal delay={0.1}>
              <Link href="/builder" className="group block h-full">
                <div className="relative flex flex-col gap-5 p-8 rounded-3xl border-2 border-sand-200 bg-white/60 hover:border-amber-500/50 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all duration-300 h-full overflow-hidden cursor-pointer">
                  {/* Hover stat pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Average ROI: 85%</span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-4xl group-hover:bg-amber-500/20 transition-colors duration-300">
                    🏗️
                  </div>

                  <div>
                    <p className="text-xs font-bold text-amber-600/80 uppercase tracking-widest mb-1">The Heart</p>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">Kitchen</h3>
                    <p className="text-charcoal/55 leading-relaxed text-sm">
                      Stone benchtops, shaker or handleless cabinetry, modern splashbacks. The room that sells a home.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2 mt-auto">
                    {["Cabinetry, benchtop & splashback combos", "Island bench design with cost advisor", "Integrated appliance planning", "Avg. cost: $22k – $45k"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-charcoal/60">
                        <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600 group-hover:gap-2.5 transition-all duration-200">
                    Design my kitchen <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            </ScrollReveal>

            {/* The Retreat — Bedroom */}
            <ScrollReveal delay={0.2}>
              <Link href="/builder" className="group block h-full">
                <div className="relative flex flex-col gap-5 p-8 rounded-3xl border-2 border-sand-200 bg-white/60 hover:border-blue-500/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)] transition-all duration-300 h-full overflow-hidden cursor-pointer">
                  {/* Hover stat pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Top Pick: VJ Paneling</span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-4xl group-hover:bg-blue-500/20 transition-colors duration-300">
                    🛏️
                  </div>

                  <div>
                    <p className="text-xs font-bold text-blue-600/80 uppercase tracking-widest mb-1">The Retreat</p>
                    <h3 className="text-2xl font-bold text-charcoal mb-2">Bedroom / Living</h3>
                    <p className="text-charcoal/55 leading-relaxed text-sm">
                      VJ paneling, architectural downlights, engineered oak flooring. The space that defines how you live.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2 mt-auto">
                    {["Flooring: oak herringbone to polished concrete", "Wall treatments: VJ, limewash, feature paint", "Lighting & joinery cost estimates", "Avg. cost: $8k – $28k"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-charcoal/60">
                        <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-blue-600 group-hover:gap-2.5 transition-all duration-200">
                    Design my bedroom <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            </ScrollReveal>

          </div>

          {/* Multi-room project nudge */}
          <ScrollReveal delay={0.25}>
            <div className="mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600/5 border border-blue-600/15 max-w-2xl mx-auto">
              <Home size={16} className="text-blue-600 flex-shrink-0" strokeWidth={2.5} />
              <p className="text-sm text-blue-800 text-center leading-snug">
                <span className="font-bold">Planning a whole-home refresh?</span>{" "}
                Easily add multiple rooms to a single project report for your builder.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BENEFITS / FEATURES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">What You Get</p>
              <h2 className="text-4xl font-bold text-charcoal mb-4">Design smarter before you spend a dollar</h2>
              <p className="text-lg text-charcoal/55 max-w-xl mx-auto">
                Walk into every builder conversation with clarity, confidence, and a realistic budget.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon:  Sparkles,
                title: "Room-Specific AI",
                sub:   "Tailored prompts per space",
                desc:  "Our AI engine uses a different prompt architecture for kitchens, bathrooms, and bedrooms — so every render reflects the materials, proportions, and lighting of that specific room type.",
                accent: "text-terracotta",
                bg:     "bg-terracotta/10",
              },
              {
                icon:  FileText,
                title: "Pre-Construction Reports",
                sub:   "A4 PDF for your builder",
                desc:  "Every project generates a multi-page PDF with a before/after image comparison, itemised materials specification, and a room-by-room cost breakdown — ready to hand to any contractor.",
                accent: "text-blue-600",
                bg:     "bg-blue-500/10",
              },
              {
                icon:  TriangleAlert,
                title: "Reality-Checked Costs",
                sub:   "Hidden traps surfaced upfront",
                desc:  "Real-world cost data on the things builders rarely mention — asbestos removal ($2,271 avg.), island bench plumbing (+$2,500), electrical rough-in for pendant lighting (+$1,500). No surprises on site.",
                accent: "text-amber-600",
                bg:     "bg-amber-500/10",
              },
            ].map(({ icon: Icon, title, sub, desc, accent, bg }, i) => (
              <ScrollReveal key={title} delay={i * 0.12}>
                <div className="flex flex-col gap-5 p-8 rounded-3xl bg-white/60 border border-sand-200 shadow-warm-sm hover:shadow-warm transition-shadow duration-300 h-full">
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon size={22} className={accent} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-charcoal mb-1">{title}</h3>
                    <p className={`text-xs font-bold ${accent} mb-3 uppercase tracking-wide`}>{sub}</p>
                    <p className="text-charcoal/60 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-white/40 border-y border-sand-200">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Simple Process</p>
              <h2 className="text-4xl font-bold text-charcoal mb-4">From idea to builder in minutes</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01", icon: Sparkles, title: "Choose Your Room & Style",
                desc: "Select your room type — bathroom, kitchen, or bedroom. Choose your materials, upload a photo, and configure finishes. Repeat for each room in your project.",
              },
              {
                n: "02", icon: DollarSign, title: "See the Preview & Cost",
                desc: "Get an AI-generated render and an itemised cost estimate per room, based on current Australian market rates — including the hidden trade costs most builders won't tell you upfront.",
              },
              {
                n: "03", icon: Users, title: "Share Your Builder Brief",
                desc: "Download a multi-room PDF report and share with pre-vetted local builders who can quote with confidence — no wasted meetings, no scope surprises.",
              },
            ].map(({ n, icon: Icon, title, desc }, i) => (
              <ScrollReveal key={n} delay={i * 0.14}>
                <div className="flex flex-col gap-5 p-8 rounded-3xl bg-white/60 border border-sand-200 shadow-warm-sm h-full">
                  <span className="text-xs font-bold text-terracotta/60 tracking-widest uppercase">Step {n}</span>
                  <div className="w-12 h-12 rounded-2xl bg-terracotta/10 flex items-center justify-center">
                    <Icon size={22} className="text-terracotta" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
                    <p className="text-charcoal/60 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          AI PROOF-OF-CONCEPT SLIDER
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Proof of Concept</p>
              <h2 className="text-4xl font-bold text-charcoal mb-4">
                From AI render to real build
              </h2>
              <p className="text-lg text-charcoal/55 max-w-xl mx-auto">
                See how closely the AI preview matches the finished renovation.
                Drag the slider to compare.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scaleIn" delay={0.1}>
            <BeforeAfterSlider
              height={480}
              className="w-full"
              beforeSrc="/ai-render-sample.png"
              afterSrc="/final-build-sample.jpg"
              beforeLabel="AI Render"
              afterLabel="Real Result"
              hideSwatches
            />
          </ScrollReveal>

          {/* Designer Note */}
          <ScrollReveal delay={0.15}>
            <div className="mt-6 bg-charcoal/5 border border-charcoal/10 rounded-2xl px-6 py-5 flex flex-col sm:flex-row gap-4 sm:items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center">
                <Sparkles size={17} className="text-terracotta" />
              </div>
              <div>
                <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-1.5">
                  Designer Note — prompt sent to AI
                </p>
                <p className="text-sm text-charcoal/70 leading-relaxed font-mono">
                  &ldquo;Renovate this Australian bathroom with large-format Marble Blanc wall tiles,
                  Nude Travertine herringbone floor, a floating white oak vanity with brushed gold tapware,
                  and a frameless walk-in shower. Remove the freestanding bath. Budget: $28,000 AUD.
                  Photorealistic render, natural light.&rdquo;
                </p>
                <p className="text-xs text-charcoal/40 mt-2">
                  These selections are made in the Reno Ready builder — the prompt is generated automatically.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TILE SWATCH PREVIEW
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">16 Curated Bathroom Options</p>
            <h2 className="text-3xl font-bold text-charcoal mb-4">Australia&apos;s trending tile selections, built in</h2>
            <p className="text-charcoal/60 leading-relaxed max-w-md">
              From Zellige to Terrazzo, Honed Limestone to Natural Oak Look — every bathroom option is sourced from current Australian design trends. Kitchen and bedroom finishes load automatically when you switch rooms.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-charcoal/40 uppercase tracking-widest w-14">Floor</span>
              <div className="flex gap-2 flex-wrap">
                {["bg-travertine","bg-desert-stone","bg-charcoal-slate","bg-zellige-ivory","bg-terrazzo-blanc","bg-honed-limestone","bg-natural-oak","bg-matte-slate-lg"].map((c) => (
                  <TileSwatch key={c} bgClass={c} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-charcoal/40 uppercase tracking-widest w-14">Wall</span>
              <div className="flex gap-2 flex-wrap">
                {["bg-marble-blanc","bg-sage-subway","bg-terracotta-feature","bg-zellige-white","bg-zellige-sage","bg-fluted-white","bg-coastal-terrazzo","bg-smoked-concrete"].map((c) => (
                  <TileSwatch key={c} bgClass={c} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          "ADD A ROOM" REVENUE STRATEGY BANNER
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-charcoal p-10 flex flex-col md:flex-row items-center gap-8">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-terracotta/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

              {/* Room count visual */}
              <div className="relative flex items-center gap-3 flex-shrink-0">
                {[
                  { emoji: "🛁", label: "Bathroom", color: "bg-terracotta/20 border-terracotta/30" },
                  { emoji: "🏗️", label: "Kitchen",  color: "bg-amber-500/20 border-amber-500/30" },
                  { emoji: "🛏️", label: "Bedroom",  color: "bg-blue-500/20 border-blue-500/30" },
                ].map((r, i) => (
                  <div key={r.label} className={`relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${r.color}`}
                       style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{r.label}</span>
                  </div>
                ))}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-terracotta text-white text-[10px] font-bold whitespace-nowrap shadow-warm-sm">
                  1 Project Report
                </div>
              </div>

              {/* Copy */}
              <div className="relative text-center md:text-left">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Multi-Room Projects</p>
                <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                  One project. Every room. A single brief for your builder.
                </h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5 max-w-md">
                  Planning a whole-home refresh? Design each room separately, then bundle them into one consolidated PDF report — with a combined cost estimate your builder can actually use.
                </p>
                <Link href="/builder">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-[0_4px_16px_rgba(37,99,235,0.4)]">
                    Start your project
                    <ArrowRight size={15} />
                  </button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 bg-white/40 border-y border-sand-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Simple, Transparent Pricing</p>
            <h2 className="text-4xl font-bold text-charcoal mb-4">Start free. Upgrade when you&apos;re ready.</h2>
            <p className="text-lg text-charcoal/55">
              Get 3 free previews on sign-up. Design any room. No contracts, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start mt-8">
            <PricingMotion index={0}>
              <PricingCard
                plan="dayPass"
                badge="$19 First Access"
                badgeColor="bg-emerald-500"
                title="DAY PASS"
                price="$19"
                period="AUD · 24 hrs"
                sub="Unlimited generations for the day"
                features={[
                  "Unlimited AI renders for 24 hours",
                  "All rooms: bathroom, kitchen, bedroom",
                  "High Definition previews",
                  "Instant cost estimate per room",
                  "Download your Reno Brief",
                ]}
                cta="Try it today"
              />
            </PricingMotion>
            <PricingMotion index={1}>
              <PricingCard
                plan="monthly"
                badge="Most Popular"
                title="MONTHLY"
                price="$29"
                period="AUD / mo"
                sub="Unlimited generations, cancel anytime"
                features={[
                  "Everything in Day Pass",
                  "Unlimited AI renders all month",
                  "Ultra HD previews (2K)",
                  "Multi-room project PDF reports",
                  "Priority generation queue",
                  "Email support",
                ]}
                cta="Get Started — Most Popular"
                featured
              />
            </PricingMotion>
            <PricingMotion index={2}>
              <PricingCard
                plan="annual"
                title="ANNUAL"
                price="$69"
                period="AUD / yr"
                sub="Best value · save 80% vs monthly"
                features={[
                  "Everything in Monthly",
                  "Full year of unlimited access",
                  "Builder-share links",
                  "Best per-preview value",
                  "Dedicated support",
                ]}
                cta="Get Annual Access"
              />
            </PricingMotion>
          </div>

          {/* Guarantee strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-sm text-charcoal/50">
            {["30-Day Money-Back Guarantee", "No Contracts", "Cancel Anytime"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-terracotta/60" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-3">Common Questions</p>
              <h2 className="text-4xl font-bold text-charcoal">Everything you need to know</h2>
            </div>
          </ScrollReveal>

          <div className="bg-white/70 rounded-3xl border border-sand-200 shadow-warm-sm px-8 py-2">
            {[
              { q: "Which rooms can I design with Reno Ready?",
                a: "Reno Ready supports three room types: Bathroom, Kitchen, and Bedroom/Living. Each room has its own tailored AI prompt engine, material library, and cost model. You can add multiple rooms to a single project and generate a consolidated builder brief at the end." },
              { q: "How much does a typical Australian renovation cost?",
                a: "It varies significantly by room. Bathrooms typically run $15,000–$35,000. Kitchens range from $22,000–$50,000 depending on cabinetry and benchtop choices. Bedrooms are more cosmetic — usually $8,000–$28,000. Reno Ready gives you an itemised estimate per room based on current QLD/Australian market averages." },
              { q: "Can I show this design to my builder?",
                a: "Absolutely. The AI preview and cost breakdown are designed to start the conversation. You can download a Pro Report — a multi-page A4 PDF with your room render, materials specification, and itemised cost breakdown — and hand it directly to any builder or architect to get an accurate quote faster." },
              { q: "How accurate is the cost estimate?",
                a: "Our estimates use current Australian market averages for materials and labour, including real invoice data from QLD projects. While every home is unique, the estimate gives you a realistic baseline. We also surface hidden costs — like asbestos removal, plumbing relocations, and electrical rough-ins — that most builders don't mention upfront." },
              { q: "Does the AI understand my specific room layout?",
                a: "Yes. When you upload a photo of your current room, our AI analyses the image to identify plumbing points, walls, windows, and structural elements — ensuring the redesign fits your actual space. Without a photo, we generate a high-quality concept room using your selected materials from scratch." },
              { q: "What are the 3 free previews?",
                a: "Every account starts with 3 complimentary AI generation credits — no credit card required. Each credit can be used on any room type. Once used, upgrade to a Day Pass ($19), Monthly ($29/mo), or Annual ($69/yr) plan for unlimited access across all rooms." },
            ].map(({ q, a }, i) => (
              <ScrollReveal key={q} delay={i * 0.07}>
                <FaqItem q={q} a={a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-charcoal">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta/20 border border-terracotta/30 w-fit mx-auto mb-8">
            <Zap size={14} className="text-terracotta" />
            <span className="text-sm font-semibold text-terracotta">3 free previews on sign-up · Any room</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
            Ready to reimagine your home?
          </h2>
          <p className="text-xl text-white/55 mb-4">
            Join 1,200+ Australians who planned smarter before they renovated.
          </p>
          <p className="text-sm text-white/35 mb-10">
            Bathrooms · Kitchens · Master Suites — one platform, one project report.
          </p>
          <Link href="/builder">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold shadow-[0_8px_32px_rgba(37,99,235,0.45)] hover:bg-blue-700 hover:scale-[1.02] active:scale-100 transition-all duration-200">
              Start My Free Preview
              <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-sand-200 py-10 px-6 bg-sand">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-charcoal/40">© {new Date().getFullYear()} Reno Ready. Renovation planning made simple.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal/40">
              <Link href="#pricing"      className="hover:text-charcoal/70 transition-colors">Pricing</Link>
              <Link href="#how-it-works" className="hover:text-charcoal/70 transition-colors">How it works</Link>
              <Link href="/guide"        className="hover:text-charcoal/70 transition-colors">Renovation Guide</Link>
              <Link href="/gallery"      className="hover:text-charcoal/70 transition-colors">Design Gallery</Link>
              <Link href="/hidden-costs" className="hover:text-charcoal/70 transition-colors">Hidden Costs</Link>
            </div>
          </div>
          <p className="text-xs text-charcoal/30 border-t border-sand-200 pt-4">
            Cost estimates are indicative only and based on current Australian market averages. Always obtain qualified builder quotes before committing to a renovation.
          </p>
        </div>
      </footer>

    </div>
  );
}
