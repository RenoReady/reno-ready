import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, AlertTriangle, CheckCircle2, DollarSign,
  Ruler, Palette, HardHat, ClipboardList,
} from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Bathroom Renovation: Where to Start in Australia",
  description:
    "A step-by-step guide to starting your Australian bathroom renovation — from asbestos testing ($2,271) to design and builder quotes. Real costs, real advice.",
  keywords: [
    "where to start bathroom renovation",
    "bathroom renovation guide Australia",
    "bathroom renovation checklist",
    "bathroom renovation cost Australia",
    "asbestos bathroom renovation",
    "bathroom reno first steps",
  ],
};

// ── Helper components ──────────────────────────────────────────────
function StepCard({
  number, icon: Icon, title, children, warning,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  warning?: string;
}) {
  return (
    <div className="flex gap-6 pb-12 relative">
      {/* Vertical connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-terracotta flex items-center justify-center shadow-warm-sm z-10">
          <Icon size={22} className="text-white" />
        </div>
        <div className="w-px flex-1 bg-sand-200 mt-3" />
      </div>

      <div className="pb-2 flex-1 min-w-0">
        <p className="text-xs font-bold text-terracotta/70 uppercase tracking-widest mb-1">Step {number}</p>
        <h2 className="text-2xl font-bold text-charcoal mb-3">{title}</h2>
        <div className="text-charcoal/65 leading-relaxed space-y-3">
          {children}
        </div>
        {warning && (
          <div className="mt-4 flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">{warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CostRow({ label, amount, note }: { label: string; amount: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-sand-200 last:border-0">
      <div>
        <p className="text-sm font-semibold text-charcoal">{label}</p>
        {note && <p className="text-xs text-charcoal/50 mt-0.5">{note}</p>}
      </div>
      <span className="text-sm font-bold text-charcoal whitespace-nowrap">{amount}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function GuidePage() {
  return (
    <main className="min-h-screen bg-sand">

      {/* Hero */}
      <section className="py-16 px-6 bg-white/40 border-b border-sand-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-4">
            Free Renovation Guide
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal mb-5 text-balance">
            Bathroom Renovation: Where to Start?
          </h1>
          <p className="text-xl text-charcoal/55 leading-relaxed max-w-2xl mx-auto">
            A practical, no-fluff guide for Australian homeowners — covering the steps most
            people skip that end up costing thousands.
          </p>
        </div>
      </section>

      {/* Quick stat bar */}
      <section className="bg-charcoal py-6 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-8">
          {[
            { label: "Average bathroom reno", value: "$18k–$30k+" },
            { label: "Average overrun (no brief)", value: "23%" },
            { label: "Asbestos homes pre-1990", value: ">40%" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-terracotta">{value}</p>
              <p className="text-xs text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">

          <StepCard number="01" icon={AlertTriangle} title="Test for Asbestos (Pre-1990 Homes)"
            warning="If your home was built or renovated before 1990, asbestos-containing materials (ACM) may be present in bathroom walls, floor adhesives, and ceiling sheeting. Starting demolition without testing is illegal in Australia and extremely dangerous. Budget $300–$600 for professional testing before any other work begins."
          >
            <p>
              This is the step most homeowners overlook — and it&apos;s the one that can derail
              an entire renovation budget if discovered mid-demolition.
            </p>
            <p>
              In a real 2026 Brisbane bathroom renovation we analysed, asbestos removal and
              disposal (certified contractor, safe disposal) came to{" "}
              <strong className="text-charcoal">$2,271.50 including GST</strong>. This is now a
              line item we automatically include in cost estimates for pre-1990 homes on Reno Ready.
            </p>
            <div className="bg-white/70 border border-sand-200 rounded-2xl p-5 mt-4">
              <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-3">
                Typical asbestos cost breakdown (QLD, 2026)
              </p>
              <CostRow label="Asbestos testing (licensed assessor)" amount="$300–$600" />
              <CostRow label="Removal & safe disposal (licensed contractor)" amount="$800–$1,800" />
              <CostRow label="Clearance certificate" amount="$200–$400" />
              <CostRow label="Real-world example (Cleanaway, Feb 2026)" amount="$2,271.50 inc. GST" note="Full bathroom strip-out, Brisbane" />
            </div>
          </StepCard>

          <StepCard number="02" icon={Palette} title="Design Before You Call a Builder">
            <p>
              The most common mistake is calling builders before you know what you want. Without
              a design brief, you&apos;ll get wildly different quotes, spend weeks chasing
              tradespeople for clarifications, and likely end up with a bathroom that&apos;s
              &ldquo;fine&rdquo; rather than exactly what you envisioned.
            </p>
            <p>
              Use Reno Ready to configure your tiles, vanity, tapware, and structural changes —
              then generate an AI preview. This becomes your design brief. Builders can quote
              faster and more accurately when they can see exactly what you want.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                "Choose floor & wall tiles",
                "Tapware finish (chrome / matte black / brushed gold)",
                "Vanity style (floating or freestanding)",
                "Structural changes (remove bath, walk-in shower)",
                "Lighting upgrades",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-charcoal/70 bg-white/60 border border-sand-200 rounded-full px-3 py-1.5">
                  <CheckCircle2 size={13} className="text-terracotta flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard number="03" icon={DollarSign} title="Set a Realistic Budget (With Room for Surprises)">
            <p>
              A standard Australian bathroom renovation (medium-sized, full strip-out) typically
              costs between <strong className="text-charcoal">$18,000 and $30,000</strong> for
              quality finishes. Premium materials and structural changes push this higher.
            </p>
            <p>
              The &ldquo;surprises&rdquo; budget is real — industry rule of thumb is 15–20% above
              your baseline estimate. Common culprits include waterproofing failures, rotted
              substrate behind tiles, and plumbing relocation that wasn&apos;t apparent until
              walls were opened.
            </p>
            <div className="bg-white/70 border border-sand-200 rounded-2xl p-5 mt-4">
              <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-3">
                Budget ranges by renovation type
              </p>
              <CostRow label="Cosmetic refresh (no structural changes)" amount="$8,000–$15,000" note="New tiles, tapware, vanity only" />
              <CostRow label="Full strip-out (medium bathroom)" amount="$18,000–$28,000" note="New everything, waterproofing, plumbing" />
              <CostRow label="Premium / large bathroom" amount="$28,000–$50,000+" note="Natural stone, structural changes, custom joinery" />
              <CostRow label="Contingency (always include)" amount="+15–20%" />
            </div>
          </StepCard>

          <StepCard number="04" icon={Ruler} title="Understand What Requires a Permit">
            <p>
              In Australia, plumbing work must be carried out by a licensed plumber — this
              isn&apos;t optional. Moving plumbing fixtures (toilet, shower, basin) requires a
              plumbing permit in most states, which your contractor should organise.
            </p>
            <p>
              Electrical work (new circuits, exhaust fans, heated towel rails) similarly requires
              a licensed electrician and certificate of compliance. Budget for these as separate
              line items — they&apos;re not usually included in a builder&apos;s base quote.
            </p>
          </StepCard>

          <StepCard number="05" icon={ClipboardList} title="Get Three Comparable Quotes">
            <p>
              Never accept the first quote. Get at least three from licensed bathroom renovation
              specialists — not general builders. Specialist bathroom renovators carry appropriate
              waterproofing certifications and understand the tolerances required for wet areas.
            </p>
            <p>
              When comparing quotes, ensure each covers: demolition, waterproofing (to AS 3740),
              tiling (floor and walls), plumbing and fixtures, electrical (exhaust fan, lighting),
              painting, and a completion certificate. A quote missing these line items is
              hiding costs.
            </p>
          </StepCard>

          <StepCard number="06" icon={HardHat} title="Plan for 2–4 Weeks Without a Bathroom">
            <p>
              A professional full-strip bathroom renovation takes 10–20 working days. Plan
              accordingly — organise access to another bathroom, communicate clearly with your
              contractor about staging, and don&apos;t schedule the renovation around immovable
              dates (holidays, guests staying).
            </p>
            <p>
              The biggest delays come from: tile orders not arriving on time, plumbing inspections
              requiring re-booking, and waterproofing cure times (minimum 24–48 hours before
              tiling can begin). A good contractor will sequence these into the schedule — ask
              about this in your initial meeting.
            </p>
          </StepCard>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-charcoal">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start with a design, not a guess
          </h2>
          <p className="text-white/55 mb-8 text-lg">
            Use Reno Ready to visualise your renovation and get a real cost estimate before
            you speak to a single builder.
          </p>
          <Link href="/builder">
            <Button size="xl" variant="primary" className="group">
              Design My Bathroom Free
              <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-white/30 text-sm mt-4">3 free AI previews — no credit card required</p>
        </div>
      </section>

      {/* Footer links */}
      <div className="py-8 px-6 border-t border-sand-200 bg-sand">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 text-sm text-charcoal/40">
          <Link href="/"             className="hover:text-charcoal/70 transition-colors">← Home</Link>
          <Link href="/hidden-costs" className="hover:text-charcoal/70 transition-colors">Hidden Renovation Costs</Link>
          <Link href="/gallery"      className="hover:text-charcoal/70 transition-colors">Design Gallery</Link>
          <Link href="/builder"      className="hover:text-charcoal/70 transition-colors">Design Tool</Link>
        </div>
      </div>

    </main>
  );
}
