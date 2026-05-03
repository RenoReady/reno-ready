"use client";

/**
 * RoomRouter
 *
 * Two-step room selection:
 *  1. Click a card → highlights it (pending state).
 *  2. A slide-up confirmation popup appears — click it to confirm.
 *
 * This prevents accidental room switches and gives clear tactile feedback.
 */

import { useState } from "react";
import { ArrowRight, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RoomType, ROOM_LABELS, ROOM_DESCRIPTIONS } from "@/lib/roomTypes";
import type { SavedRoom } from "@/lib/roomTypes";

const ROOM_CARDS: {
  type:        RoomType;
  emoji:       string;
  label:       string;
  accentBorder: string;
  accentBg:    string;
  accentText:  string;
  confirmBg:   string;
  bgGrad:      string;
  features:    string[];
}[] = [
  {
    type:        "bathroom",
    emoji:       "🛁",
    label:       "Bathroom",
    accentBorder: "border-terracotta",
    accentBg:    "bg-terracotta/5",
    accentText:  "text-terracotta",
    confirmBg:   "bg-terracotta hover:bg-terracotta/90",
    bgGrad:      "from-terracotta/10 to-transparent",
    features:    ["Floor & wall tiles", "Vanity & tapware", "Structural changes", "Cost estimate"],
  },
  {
    type:        "kitchen",
    emoji:       "🏗️",
    label:       "Kitchen",
    accentBorder: "border-amber-500",
    accentBg:    "bg-amber-500/5",
    accentText:  "text-amber-600",
    confirmBg:   "bg-amber-500 hover:bg-amber-500/90",
    bgGrad:      "from-amber-500/10 to-transparent",
    features:    ["Cabinetry & benchtop", "Floor & wall colour", "Appliance layout", "Cost estimate"],
  },
  {
    type:        "bedroom",
    emoji:       "🛏️",
    label:       "Bedroom / Living",
    accentBorder: "border-blue-500",
    accentBg:    "bg-blue-500/5",
    accentText:  "text-blue-600",
    confirmBg:   "bg-blue-500 hover:bg-blue-500/90",
    bgGrad:      "from-blue-500/10 to-transparent",
    features:    ["Flooring & wall treatment", "Lighting & atmosphere", "Storage / joinery", "Cost estimate"],
  },
];

interface RoomRouterProps {
  selected?:   RoomType | null;
  onSelect:    (room: RoomType) => void;
  savedRooms?: SavedRoom[];
}

export default function RoomRouter({ onSelect, savedRooms = [] }: RoomRouterProps) {
  // Always start with no pending — user must make a deliberate click
  const [pending, setPending] = useState<RoomType | null>(null);

  const isAddingRoom = savedRooms.length > 0;
  const pendingCard  = ROOM_CARDS.find((c) => c.type === pending) ?? null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">

      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-[0.2em] mb-2">
          {isAddingRoom ? "Add a Room" : "Step 1 of 2"}
        </p>
        <h2 className="text-2xl font-bold text-charcoal">
          {isAddingRoom ? "Which room would you like to add?" : "Which room are you renovating?"}
        </h2>
        <p className="text-sm text-charcoal/50 mt-1.5">
          Tap a room to select it, then confirm to continue
        </p>
      </div>

      {/* Saved rooms — shown when adding another room */}
      {isAddingRoom && (
        <div className="bg-sand-50 border border-sand-200 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-2">
            Already in this project
          </p>
          <div className="flex flex-wrap gap-2">
            {savedRooms.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-sand-200 text-xs font-semibold text-charcoal/70"
              >
                <CheckCircle2 size={11} className="text-terracotta" />
                {r.roomLabel}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Room cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {ROOM_CARDS.map((card) => {
          const isHighlighted = pending === card.type;
          return (
            <button
              key={card.type}
              onClick={() => setPending(isHighlighted ? null : card.type)}
              className={cn(
                "relative flex flex-col gap-4 p-6 rounded-3xl border-2 text-left transition-all duration-200 overflow-hidden group",
                isHighlighted
                  ? `${card.accentBorder} ${card.accentBg} shadow-warm-lg scale-[1.02]`
                  : "border-sand-200 bg-white/60 hover:border-sand-300 hover:bg-white/80 hover:scale-[1.01]",
              )}
            >
              {/* Background gradient when highlighted */}
              {isHighlighted && (
                <div className={cn("absolute inset-0 bg-gradient-to-b", card.bgGrad, "pointer-events-none")} />
              )}

              {/* Emoji icon */}
              <div className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all",
                isHighlighted ? "bg-white/80 shadow-warm-sm" : "bg-sand-100 group-hover:bg-sand-200",
              )}>
                {card.emoji}
              </div>

              {/* Label & description */}
              <div className="relative">
                <p className={cn("text-base font-bold leading-tight", isHighlighted ? "text-charcoal" : "text-charcoal/80")}>
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
                      isHighlighted ? "bg-terracotta" : "bg-charcoal/30",
                    )} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Selected badge */}
              {isHighlighted && (
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

      {/* ── Slide-up confirmation popup ── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          pendingCard ? "max-h-32 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {pendingCard && (
          <div className="bg-white border-2 border-sand-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-warm-lg">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{pendingCard.emoji}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider">
                  {isAddingRoom ? "Add to project" : "You selected"}
                </p>
                <p className="text-sm font-bold text-charcoal truncate">
                  {pendingCard.label} Renovation
                </p>
              </div>
            </div>
            <button
              onClick={() => { if (pending) onSelect(pending); }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-150 active:scale-95 flex-shrink-0",
                pendingCard.confirmBg,
              )}
            >
              {isAddingRoom ? <Plus size={15} /> : null}
              {isAddingRoom ? "Add Room" : "Continue"}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Hint text */}
      <p className="text-center text-[10px] text-charcoal/30 -mt-2">
        {isAddingRoom
          ? "Each room gets its own AI design and cost estimate — combined into one project total."
          : "You can add more rooms to your project after completing each one."}
      </p>
    </div>
  );
}
