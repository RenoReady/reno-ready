"use client";

/**
 * RoomRouter
 *
 * Two-step room selection: click a card to highlight, then press
 * "Start Designing →" to confirm. This prevents accidental room
 * switches when the user is still browsing options.
 *
 * Also surfaces saved rooms so users can clearly add another area.
 */

import { useState } from "react";
import { ArrowRight, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RoomType, ROOM_LABELS, ROOM_DESCRIPTIONS } from "@/lib/roomTypes";
import type { SavedRoom } from "@/lib/roomTypes";

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
    features:    ["Cabinetry & benchtop", "Floor & wall colour", "Appliance layout", "Cost estimate"],
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
  selected?:   RoomType | null;
  onSelect:    (room: RoomType) => void;
  savedRooms?: SavedRoom[];
}

export default function RoomRouter({ selected, onSelect, savedRooms = [] }: RoomRouterProps) {
  // Local "pending" — click highlights the card, Next confirms
  const [pending, setPending] = useState<RoomType | null>(selected ?? null);

  const isAddingRoom = savedRooms.length > 0;

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
          Select a room to highlight it, then press <strong>Start Designing</strong> to continue
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
              onClick={() => setPending(card.type)}
              className={cn(
                "relative flex flex-col gap-4 p-6 rounded-3xl border-2 text-left transition-all duration-200 overflow-hidden group",
                isHighlighted
                  ? card.accentColor + " shadow-warm-lg scale-[1.02]"
                  : "border-sand-200 bg-white/60 hover:border-sand-300 hover:bg-white/80 hover:scale-[1.01]",
              )}
            >
              {/* Background gradient on highlight */}
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

              {/* Selected indicator */}
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

      {/* Confirm button */}
      <button
        onClick={() => { if (pending) onSelect(pending); }}
        disabled={!pending}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-200",
          pending
            ? "bg-terracotta text-white shadow-warm-lg hover:bg-terracotta/90 hover:scale-[1.01] active:scale-100"
            : "bg-sand-200 text-charcoal/35 cursor-not-allowed",
        )}
      >
        {isAddingRoom ? <Plus size={18} /> : null}
        {pending
          ? `${isAddingRoom ? "Add" : "Start Designing"} — ${ROOM_LABELS[pending]}`
          : "Select a room above to continue"}
        {pending && <ArrowRight size={18} />}
      </button>

      {/* Multi-room hint */}
      <p className="text-center text-[10px] text-charcoal/30">
        {isAddingRoom
          ? "Each room gets its own AI design and cost estimate — combined into one project total."
          : "You can add more rooms to this project after completing each one."}
      </p>
    </div>
  );
}
