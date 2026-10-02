"use client";

/**
 * "Keep the same as my current [room]" — sits at the top of a finish
 * category. Turning it on clears that category's selection, so it adds $0,
 * and tells the AI to leave that surface exactly as it is.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomType } from "@/lib/roomTypes";

export default function KeepExistingToggle({ room, thing, active, onToggle, className }: {
  room:       RoomType;
  /** What stays, e.g. "flooring" */
  thing:      string;
  active:     boolean;
  onToggle:   (on: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-200",
        active ? "border-terracotta bg-terracotta/5" : "border-dashed border-sand-300 bg-white/40 hover:border-terracotta/40",
        className,
      )}
    >
      <span className={cn(
        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        active ? "border-terracotta bg-terracotta text-white" : "border-charcoal/25 bg-white",
      )}>
        {active && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-xs font-bold", active ? "text-terracotta" : "text-charcoal/75")}>
          Keep the same as my current {room}
        </span>
        <span className="block text-[10px] leading-snug text-charcoal/45">
          {active ? `Your existing ${thing} stays as it is` : `Leave your existing ${thing} unchanged`}
        </span>
      </span>
      <span className={cn("flex-shrink-0 text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/35")}>
        $0
      </span>
    </button>
  );
}
