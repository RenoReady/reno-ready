/**
 * RoomLanding — shared layout for /bathroom, /kitchen and /bedroom.
 *
 *   title
 *   configurator locked to the room — opens on Step 1, the photo upload
 *   ┌─ how it works: copy + links ─┬─ room reel (video, or a static panel) ─┐
 *   └──────────────────────────────┴────────────────────────────────────────┘
 */

import Link from "next/link";
import { ArrowRight, ArrowUp, Bath, BedDouble, CheckCircle2, ChefHat } from "lucide-react";
import HeroVideo from "@/components/ui/HeroVideo";
import RoomConfigurator from "@/components/builder/RoomConfigurator";
import { ROOM_PAGES, type RoomPage } from "@/lib/roomPages";
import type { RoomType } from "@/lib/roomTypes";

const ROOM_ICON = { bathroom: Bath, kitchen: ChefHat, bedroom: BedDouble } as const;

// Shown until a room has its own reel — matches the builder's blueprint viewport
function StaticReel({ page }: { page: RoomPage }) {
  const Icon = ROOM_ICON[page.room];
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-warm-xl"
      style={{
        backgroundColor: "#0D1B2A",
        backgroundImage:
          "linear-gradient(rgba(99,179,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.08) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-terracotta/25 blur-3xl" />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 sm:h-20 sm:w-20">
          <Icon size={34} strokeWidth={1.6} className="text-white/85" />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta">{page.eyebrow}</p>
        <div className="hidden flex-wrap justify-center gap-2 sm:flex">
          {page.features.slice(0, 3).map((f) => (
            <span key={f} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoomLanding({ room }: { room: RoomType }) {
  const page   = ROOM_PAGES[room];
  const others = Object.values(ROOM_PAGES).filter((p) => p.room !== room);

  return (
    <div className="bg-sand">
      {/* The tool comes first: visitors land straight on Step 1, the photo upload */}
      <section className="relative overflow-hidden px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-terracotta/6 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta sm:text-sm">{page.eyebrow}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold leading-[1.1] text-charcoal sm:text-4xl xl:text-5xl">
            {page.title}
          </h1>
        </div>
      </section>

      <section id="configurator" className="scroll-mt-24">
        <RoomConfigurator room={room} embedded />
      </section>

      {/* How it works — below the tool for anyone who wants the detail first */}
      <section className="border-t border-sand-200 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="flex flex-col gap-5">
            <p className="max-w-xl text-lg leading-relaxed text-charcoal/60">{page.intro}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {page.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-charcoal/70">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-terracotta" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#configurator"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-terracotta px-7 text-base font-bold text-white shadow-warm transition-colors hover:bg-terracotta-600"
              >
                Upload a photo <ArrowUp size={18} />
              </a>
              {others.map((o) => (
                <Link
                  key={o.room}
                  href={o.path}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-2 text-sm font-bold text-charcoal/60 transition-colors hover:text-terracotta"
                >
                  {o.exploreLabel} <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>

          {page.video ? (
            <HeroVideo {...page.video} label={`Reno Ready ${page.room} walkthrough: design, see the cost, then talk to a builder`} />
          ) : (
            <StaticReel page={page} />
          )}
        </div>
      </section>
    </div>
  );
}
