"use client";

/**
 * The custom design note — the last thing before Generate in every tool.
 * Whatever the user types goes into the AI prompt (as a must-show request)
 * and onto the builder brief, so this is where a design becomes theirs.
 */

import { MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomType } from "@/lib/roomTypes";

export const DESIGN_NOTE_MAX = 300;

const IDEAS: Record<RoomType, string[]> = {
  bathroom: ["I really want my basin to be blue", "Add an arched mirror", "Brass towel rail on the shower wall"],
  kitchen:  ["Make the island benchtop dark green", "Open shelves instead of top cupboards", "Add pendant lights over the island"],
  bedroom:  ["A reading nook by the window", "Make the bedhead wall deep green", "Add a built-in desk"],
};

export default function DesignNote({ room, value, onChange }: {
  room:     RoomType;
  value:    string;
  onChange: (note: string) => void;
}) {
  const add = (idea: string) => {
    const next = value.trim() ? `${value.trim().replace(/[.,;]?$/, ",")} ${idea.charAt(0).toLowerCase()}${idea.slice(1)}` : idea;
    onChange(next.slice(0, DESIGN_NOTE_MAX));
  };

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-terracotta/40 bg-gradient-to-b from-terracotta/[0.07] to-white/70 shadow-warm-sm">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-terracotta text-white shadow-warm-sm">
            <MessageSquareHeart size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Make it yours</p>
            <h3 className="text-lg font-bold leading-snug text-charcoal sm:text-xl">Anything specific you want?</h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/60">
              Type any unique request in your own words. We&apos;ll add it to your AI preview and your builder brief.
            </p>
          </div>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, DESIGN_NOTE_MAX))}
          maxLength={DESIGN_NOTE_MAX}
          rows={3}
          placeholder={`e.g. "${IDEAS[room][0]}" or "${IDEAS[room][1].toLowerCase()}"`}
          aria-label="Your specific design requests"
          className={cn(
            "w-full resize-none rounded-2xl border-2 border-sand-200 bg-white px-4 py-3.5 text-base text-charcoal",
            "placeholder:text-charcoal/35 focus:border-terracotta focus:outline-none transition-colors",
          )}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-charcoal/45">Ideas:</span>
          {IDEAS[room].map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => add(idea)}
              className="rounded-full border border-sand-300 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal/70 transition-colors hover:border-terracotta/50 hover:text-terracotta"
            >
              + {idea}
            </button>
          ))}
          <span className={cn("ml-auto text-xs tabular-nums", value.length >= DESIGN_NOTE_MAX ? "font-bold text-terracotta" : "text-charcoal/35")}>
            {value.length}/{DESIGN_NOTE_MAX}
          </span>
        </div>
      </div>
    </section>
  );
}
