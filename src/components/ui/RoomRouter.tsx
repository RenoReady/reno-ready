"use client";

/**
 * RoomRouter
 *
 * The entry-point selection step shown before the builder sidebar loads.
 * Three high-fidelity cards: Bathroom · Kitchen · Living/Master Bedroom.
 * Selecting a room fires onSelect(roomType) and the builder renders
 * the appropriate feature set.
 */

import { cn } from "@/lib/utils";
import { type RoomType, ROOM_LABELS, ROOM_DESCRIPTIONS } from "@/lib/roomTypes";

const ROOM_CARDS: {
  type:        RoomType;
  emoji:       string;
  accentColor: string;
  bgGrad:      string;
  features:    string[];
}[] = [
  {
    type:        "bathroom",
    emoji:       "🛁",
    accentColor: "border-terracotta bg-terracotta/5",
    bgGrad:      "from-terracotta/10 to-transparent",
    features:    ["Floor & wall tiles", "Vanity & tapware", "Structural changes", "Cost estimate"],
  },
  {
    type:        "kitchen",
    emoji:       "🏗️",
    accentColor: "border-amber-500 bg-amber-500/5",
    bgGrad:      "from-amber-500/10 to-transparent",
    features:    ["Cabinetry style", "Benchtop & splashback", "Appliance layout", "Cost estimate"],
  },
  {
    type:        "bedroom",
    emoji:       "🛏️",
    accentColor: "border-blue-500 bg-blue-500/5",
    bgGrad:      "from-blue-500/10 to-transparent",
    features:    ["Flooring & wall treatment", "Lighting & atmosphere", "Storage / joinery", "Cost estimate"],
  },
];

interface RoomRouterProps {
  selected?:  RoomType | null;
  onSelect:   (room: RoomType) => void;
}

export default function RoomRouter({ selected, onSelect }: RoomRouterProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-[0.2em] mb-2">Step 1 of 2</p>
        <h2 className="text-2xl font-bold text-charcoal">Which room are you renovating?</h2>
        <p className="text-sm text-charcoal/50 mt-1.5">Select a room — the designer's toolset will load for that space</p>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {ROOM_CARDS.map((card) => {
          const isActive = selected === card.type;
          return (
            <button
              key={card.type}
              onClick={() => onSelect(card.type)}
              className={cn(
                "relative flex flex-col gap-4 p-6 rounded-3xl border-2 text-left transition-all duration-200 overflow-hidden group",
                isActive
                  ? card.accentColor + " shadow-warm-lg scale-[1.02]"
                  : "border-sand-200 bg-white/60 hover:border-sand-300 hover:bg-white/80 hover:scale-[1.01]",
              )}
            >
              {/* Background gradient on active */}
              {isActive && (
                <div className={cn("absolute inset-0 bg-gradient-to-b", card.bgGrad, "pointer-events-none")} />
              )}

              {/* Emoji icon */}
              <div className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all",
                isActive ? "bg-white/80 shadow-warm-sm" : "bg-sand-100 group-hover:bg-sand-200",
              )}>
                {card.emoji}
              </div>

              {/* Label & description */}
              <div className="relative">
                <p className={cn("text-base font-bold leading-tight", isActive ? "text-charcoal" : "text-charcoal/80")}>
                  {ROOM_LABELS[card.type]}
                </p>
                <p className="text-xs text-charcoal/50 mt-1 leading-snug">
                  {ROOM_DESCRIPTIONS[card.type]}
                </p>
              </div>

              {/* Feature list */}
              <ul className="relative flex flex-col gap-1">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-charcoal/60">
                    <span className={cn(
                      "w-1 h-1 rounded-full flex-shrink-0",
                      isActive ? "bg-terracotta" : "bg-charcoal/30",
                    )} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Selected indicator */}
              {isActive && (
                <div className="relative self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta text-white text-[10px] font-bold">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-charcoal/30">
        You can add more rooms to a single project after generating each one
      </p>
    </div>
  );
}
