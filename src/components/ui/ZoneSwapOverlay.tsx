"use client";

/**
 * ZoneSwapOverlay
 *
 * Semi-transparent hotspot zones overlaid on the AI-generated image.
 * Clicking a zone fires onZoneClick(zoneName) so the parent can
 * open a targeted refinement prompt for that specific area.
 *
 * Zones: Floor · Walls · Vanity
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

export type ZoneId = "floor" | "walls" | "vanity";

export interface Zone {
  id:    ZoneId;
  label: string;
  hint:  string;
  // Percentage-based position/size for responsive scaling
  style: React.CSSProperties;
}

const ZONES: Zone[] = [
  {
    id:    "floor",
    label: "Floor",
    hint:  "Change tile or colour",
    style: { bottom: "5%", left: "10%", width: "80%", height: "18%" },
  },
  {
    id:    "walls",
    label: "Walls",
    hint:  "Swap tile or paint",
    style: { top: "12%", left: "0%", width: "38%", height: "55%" },
  },
  {
    id:    "vanity",
    label: "Vanity",
    hint:  "Swap style or finish",
    style: { top: "12%", right: "0%", width: "42%", height: "55%" },
  },
];

interface ZoneSwapOverlayProps {
  onZoneClick: (zone: ZoneId) => void;
  activeZone?: ZoneId | null;
}

export default function ZoneSwapOverlay({ onZoneClick, activeZone }: ZoneSwapOverlayProps) {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {ZONES.map((zone) => {
        const isActive  = activeZone  === zone.id;
        const isHovered = hoveredZone === zone.id;
        return (
          <div
            key={zone.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={zone.style}
            onClick={() => onZoneClick(zone.id)}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            {/* Zone highlight */}
            <div
              className={cn(
                "absolute inset-0 border-2 rounded-xl transition-all duration-200",
                isActive
                  ? "border-blue-400 bg-blue-400/15"
                  : isHovered
                  ? "border-terracotta/80 bg-terracotta/10"
                  : "border-white/20 bg-white/5 hover:border-white/40",
              )}
            />

            {/* Zone label chip */}
            <div
              className={cn(
                "absolute top-2 left-2 flex flex-col gap-0.5 px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200",
                isActive
                  ? "bg-blue-600/90"
                  : isHovered
                  ? "bg-terracotta/90"
                  : "bg-charcoal/60",
              )}
            >
              <p className="text-[10px] font-bold text-white leading-none">{zone.label}</p>
              {isHovered && (
                <p className="text-[9px] text-white/80 leading-none">{zone.hint}</p>
              )}
            </div>

            {/* Edit icon — appears on hover */}
            {isHovered && (
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-warm-sm">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="#2C3E50" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend strip at bottom of overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 pb-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-charcoal/70 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-warm-sm">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M7 1.5L8.5 3L3.5 8H2V6.5L7 1.5Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[9px] font-semibold text-white/80">Click a zone to swap materials</span>
        </div>
      </div>
    </div>
  );
}
