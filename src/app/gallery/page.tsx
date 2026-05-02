import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Palette, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "AI Bathroom Design Gallery — Better Than Pinterest",
  description:
    "Browse AI-generated Australian bathroom designs across every style — from Zellige and Terrazzo to Marble and Travertine. See what's possible before you renovate.",
  keywords: [
    "bathroom design ideas Australia",
    "AI bathroom design",
    "bathroom renovation inspiration",
    "bathroom design gallery",
    "modern Australian bathroom",
    "bathroom tile ideas Australia",
    "bathroom reno design ideas",
    "zellige bathroom Australia",
    "terrazzo bathroom Australia",
    "travertine bathroom Australia",
  ],
};

// ── Gallery data ───────────────────────────────────────────────────
const GALLERY_ITEMS = [
  {
    style:       "Zellige & Brushed Gold",
    description: "Hand-glazed zellige wall tiles with brushed gold tapware and a honed travertine floor. A favourite for Brisbane and Melbourne renovations.",
    floor:       "Nude Travertine",
    wall:        "Zellige White",
    tapware:     "Brushed Gold",
    vanity:      "Floating",
    budget:      "$28,000–$36,000",
    tags:        ["Premium", "Warm", "Handcrafted"],
    bgFloor:     "bg-travertine",
    bgWall:      "bg-zellige-white",
  },
  {
    style:       "Marble Blanc & Chrome",
    description: "Large-format Marble Blanc wall tiles with minimal grout lines, chrome tapware, and a terrazzo blanc floor for a clean, spa-like result.",
    floor:       "Terrazzo Blanc",
    wall:        "Marble Blanc",
    tapware:     "Chrome",
    vanity:      "Floating",
    budget:      "$24,000–$32,000",
    tags:        ["Modern", "Spa", "Minimal"],
    bgFloor:     "bg-terrazzo-blanc",
    bgWall:      "bg-marble-blanc",
  },
  {
    style:       "Desert Stone & Matte Black",
    description: "Australian sandstone-inspired Desert Stone floors with smoked concrete feature wall, matte black tapware, and a freestanding vanity.",
    floor:       "Desert Stone",
    wall:        "Smoked Concrete",
    tapware:     "Matte Black",
    vanity:      "Freestanding",
    budget:      "$20,000–$28,000",
    tags:        ["Industrial", "Australian", "Bold"],
    bgFloor:     "bg-desert-stone",
    bgWall:      "bg-smoked-concrete",
  },
  {
    style:       "Sage Subway & Brushed Gold",
    description: "Classic sage green subway tiles in a vertical stack pattern with brushed gold fittings — a warm, nature-forward take on the bathroom refresh.",
    floor:       "Honed Limestone",
    wall:        "Sage Subway",
    tapware:     "Brushed Gold",
    vanity:      "Floating",
    budget:      "$18,000–$25,000",
    tags:        ["Natural", "Warm", "Coastal"],
    bgFloor:     "bg-honed-limestone",
    bgWall:      "bg-sage-subway",
  },
  {
    style:       "Herringbone Terrazzo & Chrome",
    description: "Zellige ivory floor tiles in a herringbone pattern with coastal terrazzo feature wall and chrome tapware. Great for light-filled Sydney bathrooms.",
    floor:       "Zellige Ivory",
    wall:        "Coastal Terrazzo",
    tapware:     "Chrome",
    vanity:      "Floating",
    budget:      "$22,000–$30,000",
    tags:        ["Textured", "Sydney", "Light"],
    bgFloor:     "bg-zellige-ivory",
    bgWall:      "bg-coastal-terrazzo",
  },
  {
    style:       "Charcoal Slate & Matte Black",
    description: "Bold charcoal slate floors, fluted white feature wall tiles, and matte black fixtures for a high-contrast industrial bathroom that photographs beautifully.",
    floor:       "Charcoal Slate",
    wall:        "Fluted White",
    tapware:     "Matte Black",
    vanity:      "Freestanding",
    budget:      "$26,000–$34,000",
    tags:        ["Bold", "Industrial", "High-contrast"],
    bgFloor:     "bg-charcoal-slate",
    bgWall:      "bg-fluted-white",
  },
];

// ── Tag pill ───────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-terracotta/10 text-terracotta text-xs font-semibold">
      {label}
    </span>
  );
}

// ── Tile swatch ────────────────────────────────────────────────────
function Swatch({ bgClass, label }: { bgClass: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 rounded-xl ${bgClass} ring-1 ring-black/10 shadow-sm`} />
      <p className="text-[9px] text-charcoal/50 text-center leading-tight w-12">{label}</p>
    </div>
  );
}

// ── Gallery card ───────────────────────────────────────────────────
function GalleryCard({ item }: { item: typeof GALLERY_ITEMS[0] }) {
  return (
    <article className="flex flex-col bg-white/70 border border-sand-200 rounded-3xl overflow-hidden shadow-warm-sm hover:shadow-warm transition-shadow duration-300">

      {/* Visual mockup — tile swatches as a 'colour palette' */}
      <div className="relative h-44 bg-gradient-to-br from-sand-100 to-sand-200 flex items-center justify-center gap-4 px-6 overflow-hidden">
        {/* Background texture hint */}
        <div className={`absolute inset-0 opacity-15 ${item.bgWall}`} />
        <div className={`absolute bottom-0 left-0 right-0 h-16 opacity-20 ${item.bgFloor}`} />

        {/* Swatch cluster */}
        <div className="relative flex items-end gap-4 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-20 h-28 rounded-2xl ${item.bgWall} ring-2 ring-white/80 shadow-warm`} aria-label={`Wall tile: ${item.wall}`} />
            <p className="text-[9px] font-semibold text-charcoal/60">Wall</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-20 h-20 rounded-2xl ${item.bgFloor} ring-2 ring-white/80 shadow-warm`} aria-label={`Floor tile: ${item.floor}`} />
            <p className="text-[9px] font-semibold text-charcoal/60">Floor</p>
          </div>
        </div>

        {/* AI badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
          <Sparkles size={10} className="text-terracotta" />
          <span className="text-[9px] font-bold text-charcoal/70 uppercase tracking-wide">AI Render</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-6 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((t) => <Tag key={t} label={t} />)}
        </div>

        <h2 className="text-lg font-bold text-charcoal leading-tight">{item.style}</h2>
        <p className="text-sm text-charcoal/60 leading-relaxed flex-1">{item.description}</p>

        {/* Material spec */}
        <div className="flex items-center gap-3 pt-2">
          <Swatch bgClass={item.bgFloor} label={item.floor} />
          <Swatch bgClass={item.bgWall}  label={item.wall}  />
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-[9px] font-bold text-charcoal/40 uppercase tracking-widest">Est. budget</p>
            <p className="text-sm font-bold text-charcoal">{item.budget}</p>
          </div>
        </div>

        <Link
          href={`/builder`}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-terracotta/10 text-terracotta text-sm font-semibold hover:bg-terracotta/20 transition-colors"
        >
          Try this style
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-sand">

      {/* Hero */}
      <section className="py-16 px-6 bg-white/40 border-b border-sand-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-terracotta uppercase tracking-widest mb-4">
            AI Bathroom Design Gallery
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-charcoal mb-5 text-balance">
            Better Than Pinterest — Because You Can Build It
          </h1>
          <p className="text-xl text-charcoal/55 leading-relaxed max-w-2xl mx-auto">
            Every design below is achievable with current Australian materials at the estimated
            budget. Browse for inspiration, then click to recreate it in your own bathroom.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-charcoal/50">
            {[
              { icon: Sparkles,  label: "AI-generated renders" },
              { icon: Palette,   label: "Real Australian materials" },
              { icon: RefreshCw, label: "Customise any style" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/60 border border-sand-200 rounded-full px-4 py-2">
                <Icon size={14} className="text-terracotta" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_ITEMS.map((item) => (
              <GalleryCard key={item.style} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Why it's better than Pinterest */}
      <section className="py-16 px-6 bg-white/40 border-y border-sand-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-3">
            Why this beats Pinterest for Australian renovators
          </h2>
          <p className="text-charcoal/50 text-center mb-10">
            Pinterest shows you bathrooms you can&apos;t afford or can&apos;t build here. Reno Ready shows you what&apos;s actually possible.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Australian materials only",
                desc:  "Every tile and fixture in Reno Ready is sourced from Australian design trends and available from local suppliers — not a Scandinavian showroom you can&apos;t order from.",
              },
              {
                title: "Real cost estimates included",
                desc:  "Each style comes with a realistic budget range based on current Brisbane and Sydney market rates — not a vague 'contact for pricing' that hides the reality.",
              },
              {
                title: "Upload your room, see the result",
                desc:  "Upload a photo of your actual bathroom and Reno Ready&apos;s AI applies the new materials to your specific space — not a perfect studio bathroom that looks nothing like yours.",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="p-6 bg-white/70 border border-sand-200 rounded-2xl">
                <h3 className="font-bold text-charcoal mb-2">{title}</h3>
                <p className="text-sm text-charcoal/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-charcoal">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            See your bathroom transformed by AI
          </h2>
          <p className="text-white/55 mb-8 text-lg">
            Upload a photo, choose your style, and get an AI preview with a real cost estimate — all free.
          </p>
          <Link href="/builder">
            <Button size="xl" variant="primary" className="group">
              Start My Free Design
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
          <Link href="/guide"        className="hover:text-charcoal/70 transition-colors">Renovation Guide</Link>
          <Link href="/hidden-costs" className="hover:text-charcoal/70 transition-colors">Hidden Costs</Link>
          <Link href="/builder"      className="hover:text-charcoal/70 transition-colors">Design Tool</Link>
        </div>
      </div>

    </main>
  );
}
