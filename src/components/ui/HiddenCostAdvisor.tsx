"use client";

/**
 * HiddenCostAdvisor
 *
 * Displays a room-specific "Pro-Tip" alert before the user hits Generate,
 * surfacing hidden trade costs that builders never mention upfront.
 *
 * Kitchen: island bench plumbing/gas relocation
 * Bedroom: VJ paneling + bedside pendant electrical re-wiring
 */

import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RoomType } from "@/lib/roomTypes";

const ADVISORIES: Record<string, { headline: string; body: string; cost: string } | null> = {
  kitchen_island: {
    headline: "Island Bench — Plumbing / Gas Advisory",
    body:     "Moving plumbing or gas lines for an island bench can add $2,500+ to your trade costs. Ensure your layout stays 'run-ready' to avoid budget blowouts — confirm exact routing with your licensed plumber before finalising the design.",
    cost:     "+$2,500+",
  },
  bedroom_electrical: {
    headline: "Electrical Re-wiring Advisory",
    body:     "High-end VJ paneling and electrical re-wiring for bedside pendants often add $1,500–$3,000 to a standard cosmetic refresh. A licensed electrician must be engaged before any wiring work — this can't be DIY'd.",
    cost:     "+$1,500–$3,000",
  },
};

interface HiddenCostAdvisorProps {
  roomType:  RoomType;
  hasIsland: boolean;         // kitchen island
  hasElectrical: boolean;     // bedroom pendant/cove
}

export default function HiddenCostAdvisor({ roomType, hasIsland, hasElectrical }: HiddenCostAdvisorProps) {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const active: { key: string; advisory: NonNullable<typeof ADVISORIES[string]> }[] = [];

  if (roomType === "kitchen" && hasIsland && ADVISORIES.kitchen_island && !dismissed.kitchen_island) {
    active.push({ key: "kitchen_island", advisory: ADVISORIES.kitchen_island });
  }
  if (roomType === "bedroom" && hasElectrical && ADVISORIES.bedroom_electrical && !dismissed.bedroom_electrical) {
    active.push({ key: "bedroom_electrical", advisory: ADVISORIES.bedroom_electrical });
  }

  if (active.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {active.map(({ key, advisory }) => (
        <div
          key={key}
          className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <TriangleAlert size={16} className="text-amber-600" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-amber-800 leading-tight">{advisory.headline}</p>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-200 rounded-lg px-2 py-0.5 flex-shrink-0 tabular-nums">
                {advisory.cost}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">{advisory.body}</p>
          </div>
          <button
            onClick={() => setDismissed((d) => ({ ...d, [key]: true }))}
            className="p-1 rounded-lg text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
