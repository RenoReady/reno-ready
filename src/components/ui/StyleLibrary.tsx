"use client";

/**
 * StyleLibrary — "Start from a style" cards for any design tool.
 * Each card previews the look (upper and lower surface plus a fixture swatch);
 * picking one applies the room's preset, and every choice can still be changed.
 * Presets live in src/lib/stylePresets.ts.
 */

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StyleLook } from "@/lib/stylePresets";

interface StyleLibraryProps {
  looks:     StyleLook[];
  activeId?: string | null;
  onSelect:  (id: string) => void;
}

export default function StyleLibrary({ looks, activeId, onSelect }: StyleLibraryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-terracotta" />
        <p className="text-sm font-bold text-charcoal">Start from a style</p>
        <span className="ml-auto text-xs text-charcoal/40">Tap to apply · change anything after</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {looks.map((look) => {
          const active = activeId === look.id;
          return (
            <button
              key={look.id}
              type="button"
              onClick={() => onSelect(look.id)}
              aria-pressed={active}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
                active
                  ? "border-terracotta shadow-warm"
                  : "border-sand-200 bg-white/70 hover:border-terracotta/40 hover:shadow-warm-sm",
              )}
            >
              <div className="relative h-20 sm:h-24">
                <div className="absolute inset-x-0 top-0 h-[62%]" style={{ background: look.top }} />
                <div className="absolute inset-x-0 bottom-0 h-[38%] border-t border-black/10" style={{ background: look.bottom }} />
                {look.dot && (
                  <span className="absolute bottom-2 right-2 h-6 w-6 rounded-full ring-2 ring-white shadow-warm-sm" style={{ background: look.dot }} />
                )}
                {active && (
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className={cn("flex-1 px-3 py-2.5", active && "bg-terracotta/5")}>
                <p className={cn("text-sm font-bold leading-tight", active ? "text-terracotta" : "text-charcoal")}>{look.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-charcoal/50">{look.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
