"use client";

/**
 * StyleLibrary
 *
 * Four curated bathroom looks homeowners recognise straight away. Picking one
 * applies its floor tile, wall tile, vanity, tapware and tile layout to the
 * builder store; every choice can still be changed afterwards.
 */

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import TileTexture from "@/components/ui/TileTexture";
import type { VanityType, TapwareFinish, TileStyle } from "@/lib/types";

export interface StylePreset {
  id:          string;
  name:        string;
  description: string;
  floorTileId: string;
  wallTileId:  string;
  vanity:      VanityType;
  tapware:     TapwareFinish;
  tileStyle:   TileStyle | null;
  /** Tapware swatch shown on the card */
  tapSwatch:   string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id:          "modern-contemporary",
    name:        "Modern Contemporary",
    description: "Large-format slate, concrete walls, matte black tapware.",
    floorTileId: "matte-slate-lg",
    wallTileId:  "smoked-concrete",
    vanity:      "floating",
    tapware:     "matte-black",
    tileStyle:   "large-format",
    tapSwatch:   "linear-gradient(135deg,#3a3a3a,#111111)",
  },
  {
    id:          "warm-minimalist",
    name:        "Warm Minimalist",
    description: "Nude travertine, fluted white walls, soft white fixtures.",
    floorTileId: "travertine",
    wallTileId:  "fluted-white",
    vanity:      "floating",
    tapware:     "white",
    tileStyle:   "large-format",
    tapSwatch:   "linear-gradient(135deg,#ffffff,#e4e3df)",
  },
  {
    id:          "coastal-hamptons",
    name:        "Coastal Hamptons",
    description: "Honed limestone, white zellige, classic vanity, chrome.",
    floorTileId: "honed-limestone",
    wallTileId:  "zellige-white",
    vanity:      "freestanding",
    tapware:     "chrome",
    tileStyle:   "herringbone",
    tapSwatch:   "linear-gradient(135deg,#ededed,#a8a8a8)",
  },
  {
    id:          "luxurious-traditional",
    name:        "Luxurious Traditional",
    description: "Marble walls, checkerboard floor, brushed gold tapware.",
    floorTileId: "charcoal-slate",
    wallTileId:  "marble-blanc",
    vanity:      "freestanding",
    tapware:     "brushed-gold",
    tileStyle:   "checkerboard",
    tapSwatch:   "linear-gradient(135deg,#e8c97e,#b8962c)",
  },
];

interface StyleLibraryProps {
  activePresetId?: string | null;
  onSelect: (preset: StylePreset) => void;
}

export default function StyleLibrary({ activePresetId, onSelect }: StyleLibraryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-terracotta" />
        <p className="text-sm font-bold text-charcoal">Start from a style</p>
        <span className="ml-auto text-xs text-charcoal/40">Tap to apply · change anything after</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STYLE_PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              aria-pressed={active}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
                active
                  ? "border-terracotta shadow-warm"
                  : "border-sand-200 bg-white/70 hover:border-terracotta/40 hover:shadow-warm-sm",
              )}
            >
              {/* The look itself: wall tile over floor tile, with the tapware finish */}
              <div className="relative h-20 sm:h-24">
                <TileTexture tileId={preset.wallTileId}  className="absolute inset-x-0 top-0 h-[62%] w-full" style={{ width: "100%" }} />
                <TileTexture tileId={preset.floorTileId} className="absolute inset-x-0 bottom-0 h-[38%] w-full" style={{ width: "100%" }} />
                <span
                  className="absolute bottom-2 right-2 h-6 w-6 rounded-full ring-2 ring-white shadow-warm-sm"
                  style={{ background: preset.tapSwatch }}
                />
                {active && (
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className={cn("flex-1 px-3 py-2.5", active ? "bg-terracotta/5" : "")}>
                <p className={cn("text-sm font-bold leading-tight", active ? "text-terracotta" : "text-charcoal")}>{preset.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-charcoal/50">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
