import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, AlertTriangle, TrendingUp, Droplets,
  Zap, ShieldCheck, Package, Wrench,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Hidden Costs of Australian Bathroom Renovations",
  description:
    "The costs that blow out Australian bathroom renovation budgets — based on real 2026 invoices. Hardware, glass, asbestos, waterproofing, and more. Know before you start.",
  keywords: [
    "hidden costs bathroom renovation Australia",
    "bathroom renovation budget blowout",
    "bathroom renovation cost breakdown",
    "bathroom renovation unexpected costs",
    "shower screen cost Australia",
    "bathroom hardware cost Australia",
    "asbestos removal cost bathroom",
    "waterproofing cost bathroom renovation",
  ],
};

// ── Helper components ──────────────────────────────────────────────
function CostCard({
  icon: Icon,
  title,
  range,
  real,
  realLabel,
  description,
  tip,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  range: string;
  real?: string;
  realLabel?: string;
  description: string;
  tip: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 p-7 rounded-3xl border-2 ${
      accent
        ? "border-terracotta/30 bg-terracotta/5"
        : "border-sand-200 bg-white/70"
    } shadow-warm-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="w-11 h-11 rounded-2xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-terracotta" />
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-charcoal">{range}</p>
          {real && (
            <p className="text-xs text-charcoal/50 mt-0.5">{realLabel ?? "Real invoice 2026"}: <span className="font-semibold text-terracotta">{real}</span></p>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-charcoal mb-2">{title}</h2>
        <p className="text-sm text-charcoal/60 leading-relaxed">{description}</p>
      </div>
      <div className="mt-auto bg-sand-50 border border-sand-200 rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-1">Budget tip</p>
        <p className="text-xs text-charcoal/65 leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function HiddenCostsPage() {
  return (
    <main className="min-h-screen bg-sand">

      {/* Hero */}
      <section className="py-16 px-6 bg-white/40 border-b border-sand-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 w-fit mx-auto mb-5">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">Based on real 2026 Australian invoices</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal mb-5 text-balance">
            Hidden Costs of Australian Bathroom Renovations
          </h1>
          <p className="text-xl text-charcoal/55 leading-relaxed max-w-2xl mx-auto">
            The costs most homeowners don&apos;t find out about until mid-renovation. We&apos;ve
            analysed real invoices from a 2026 Brisbane bathroom reno — here&apos;s what
            actually costs money.
          </p>
        </div>
      </section>

      {/* Quick cheat sheet */}
      <section className="py-12 px-6 bg-charcoal">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-terracotta/70 uppercase tracking-widest text-center mb-6">
            2026 Budget Cheat Sheet — Real Brisbane Invoices
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Hardware & fittings",    value: "$3,484",  sub: "BDW quote #235561"               },
              { label: "Shower screen (custom)",  value: "$1,925",  sub: "Millennium Glass invoice"        },
              { label: "Asbestos removal",        value: "$2,272",  sub: "Cleanaway INV2652"               },
              { label: "Total hidden line items", value: "$7,681+", sub: "Before tiling, labour, or vanity" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white/8 border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-2xl font-bold text-terracotta">{value}</p>
                <p className="text-sm text-white font-semibold mt-1">{label}</p>
                <p className="text-xs text-white/40 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost cards */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-bold text-terracotta uppercase tracking-widest text-center mb-3">
            The Hidden Costs, Explained
          </p>
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">
            What blows out bathroom budgets in Australia
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <CostCard
              icon={AlertTriangle}
              title="Asbestos Testing & Removal"
              range="$1,200–$3,500"
              real="$2,271.50 inc. GST"
              realLabel="Cleanaway INV2652"
              description="Homes built or renovated before 1990 frequently contain asbestos in bathroom walls, floor adhesives, and ceiling materials. Professional testing is mandatory before demolition, and removal must be performed by a licensed contractor with safe disposal certificates."
              tip="Budget this as a fixed cost if your home is pre-1990 — don't wait for test results before building it into your estimate. In QLD the average is $2,000–$2,500 for a standard bathroom."
              accent
            />

            <CostCard
              icon={Package}
              title="Hardware, Fittings & Accessories"
              range="$2,000–$4,500"
              real="$3,484.44 inc. GST"
              realLabel="BDW quote #235561"
              description="This covers toilet suite, tapware, shower head and arm, waste fittings, towel rails, toilet roll holder, soap dishes, and mirror cabinet. Most quotes from builders don't include fixtures at this level of specificity — they assume a 'standard' allowance that's often well below what good fittings actually cost."
              tip="Get an itemised hardware quote before signing your builder contract. The $1,000 'fixtures allowance' in many builder quotes won't cover quality tapware alone."
            />

            <CostCard
              icon={ShieldCheck}
              title="Custom Shower Screen & Glass"
              range="$900–$2,500"
              real="$1,925.00 inc. GST"
              realLabel="Millennium Glass invoice"
              description="A frameless or semi-frameless shower screen made to measure for your bathroom. Off-the-shelf screens rarely fit properly — most bathrooms require custom glass, which means a separate quote from a glazier after tiling is complete (so exact dimensions can be measured)."
              tip="Don't let your builder include a generic shower screen allowance. Get a separate quote from a glazier early — they can measure from drawings and provide a firm figure."
            />

            <CostCard
              icon={Droplets}
              title="Waterproofing & Membrane"
              range="$600–$1,400"
              description="Waterproofing to AS 3740 is non-negotiable in Australia, and it's a separate trade that happens after substrate preparation but before tiling. Many builder quotes bundle this in at a low allowance — if your bathroom has any structural issues or rotted substrate, the cost jumps significantly."
              tip="Ensure your quote specifies 'waterproofing to AS 3740 with certificate of compliance.' If it doesn't, ask why — it could mean they're cutting corners."
            />

            <CostCard
              icon={Zap}
              title="Electrical (Exhaust, Lighting, Heated Rails)"
              range="$400–$1,200"
              description="A licensed electrician is required for any new circuits. A quality 3-in-1 heat/exhaust/light unit (like the Marvel units common in Brisbane bathrooms) costs $280–$350 for the fixture plus $150–$200 for installation. Heated towel rails and LED mirror lighting add another $300–$600."
              tip="Exhaust fans are mandatory under the National Construction Code. Budget at minimum $400 for a decent unit and install — or $900+ for a 3-in-1 heat exhaust with LED lighting."
            />

            <CostCard
              icon={Wrench}
              title="Plumbing Repositioning"
              range="$800–$3,000"
              description="If you're moving your toilet, shower, or basin drain points — even slightly — your plumber will need to cut into the slab or concrete floor. This is charged per hour plus materials, and the cost scales sharply with the distance fixtures are moved. In older homes with cast-iron pipes, it can be significantly higher."
              tip="Cosmetic renovations that keep all plumbing in its existing position avoid this cost entirely. If your design moves a fixture, get a specific plumbing quote before locking in the design."
            />

            <CostCard
              icon={TrendingUp}
              title="Substrate Repairs & Unexpected Demo"
              range="$500–$2,500"
              description="Behind old tiles, bathrooms often reveal water damage, rotted timber framing, failed old waterproofing, or movement cracks that must be repaired before retiling. This is impossible to quote accurately before demolition — which is why a 15–20% contingency buffer is essential."
              tip="Treat substrate repairs as a 'when, not if' item for renovations of bathrooms older than 15 years. Set aside $1,000–$1,500 before you start and celebrate if you don't spend it."
            />

            <CostCard
              icon={Package}
              title="Skip Bin & Demolition Waste"
              range="$300–$800"
              description="Tiles, concrete, old vanity, and bathroom fixtures generate significant waste. A mini skip bin (2–3m³) for a standard bathroom costs $300–$500 in most Australian cities. Some builder quotes include this; many don't. Confirm before signing."
              tip="Ask your builder explicitly: 'Is skip bin and waste disposal included in your quote?' A clear yes or no prevents an invoice surprise at the end of the job."
            />

          </div>
        </div>
      </section>

      {/* Summary table */}
      <section className="py-16 px-6 bg-white/40 border-y border-sand-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-charcoal mb-2 text-center">
            The honest all-in estimate
          </h2>
          <p className="text-charcoal/50 text-center mb-8 text-sm">
            A realistic medium bathroom renovation in Brisbane or Sydney, 2026
          </p>

          <div className="bg-white/70 border border-sand-200 rounded-3xl overflow-hidden">
            <div className="divide-y divide-sand-200">
              {[
                { item: "Design & project planning",       low: "$0",      high: "$2,000",  note: "Free with Reno Ready; or $1,500+ architect fee" },
                { item: "Demolition & skip bin",           low: "$800",    high: "$2,000",  note: "Includes licensed disposal if asbestos-free"     },
                { item: "Asbestos removal (pre-1990)",     low: "$1,200",  high: "$3,500",  note: "Skip if home built after 1990"                    },
                { item: "Waterproofing (AS 3740)",         low: "$600",    high: "$1,400",  note: "Certified contractor, includes membrane"          },
                { item: "Tiling (floor + walls)",          low: "$3,500",  high: "$8,000",  note: "Materials + labour, standard to premium tiles"    },
                { item: "Vanity, basin & mirror cabinet",  low: "$1,200",  high: "$4,000",  note: "Wide range depending on quality"                  },
                { item: "Toilet suite",                    low: "$500",    high: "$1,800",  note: "Wall-hung concealed cistern at top end"           },
                { item: "Tapware & shower fittings",       low: "$600",    high: "$2,500",  note: "Chrome to brushed gold, standard to premium"      },
                { item: "Shower screen (custom frameless)", low: "$900",   high: "$2,500",  note: "Real invoice: $1,925 inc. GST"                    },
                { item: "Hardware & accessories",          low: "$1,200",  high: "$3,500",  note: "Real invoice: $3,484 inc. GST"                    },
                { item: "Electrical (exhaust, lighting)",  low: "$400",    high: "$1,200",  note: "3-in-1 unit + LED mirror, licensed electrician"   },
                { item: "Plumbing (fixtures + labour)",    low: "$1,500",  high: "$4,000",  note: "Higher if relocating drains"                      },
                { item: "Painting (ceiling + walls)",      low: "$400",    high: "$900",    note: "Often overlooked in quotes"                       },
                { item: "Contingency (15%)",               low: "$1,700",  high: "$4,500",  note: "Industry standard — non-negotiable"               },
              ].map(({ item, low, high, note }) => (
                <div key={item} className="flex items-start gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal">{item}</p>
                    {note && <p className="text-xs text-charcoal/45 mt-0.5">{note}</p>}
                  </div>
                  <p className="text-sm font-bold text-charcoal whitespace-nowrap">{low}–{high}</p>
                </div>
              ))}
            </div>
            <div className="bg-charcoal px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">All-in realistic total</p>
                <p className="text-xs text-white/40 mt-0.5">Medium bathroom, Brisbane/Sydney, 2026</p>
              </div>
              <p className="text-2xl font-bold text-terracotta">$15k–$42k</p>
            </div>
          </div>

          <p className="text-xs text-charcoal/40 text-center mt-4">
            Estimates based on current Australian market rates and real 2026 invoices. Obtain three qualified builder quotes before committing.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-charcoal">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Know your costs before you start
          </h2>
          <p className="text-white/55 mb-8 text-lg">
            Reno Ready automatically includes hidden costs like asbestos removal and custom glass
            in your estimate — so you&apos;re never surprised mid-renovation.
          </p>
          <Link href="/builder">
            <Button size="xl" variant="primary" className="group">
              Get My Cost Estimate Free
              <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-white/30 text-sm mt-4">Includes asbestos, hardware, and glass line items automatically</p>
        </div>
      </section>

      {/* Footer links */}
      <div className="py-8 px-6 border-t border-sand-200 bg-sand">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 text-sm text-charcoal/40">
          <Link href="/"       className="hover:text-charcoal/70 transition-colors">← Home</Link>
          <Link href="/guide"  className="hover:text-charcoal/70 transition-colors">Renovation Guide</Link>
          <Link href="/gallery" className="hover:text-charcoal/70 transition-colors">Design Gallery</Link>
          <Link href="/builder" className="hover:text-charcoal/70 transition-colors">Design Tool</Link>
        </div>
      </div>

    </main>
  );
}
