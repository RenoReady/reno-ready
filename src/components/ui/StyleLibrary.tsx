"use client";

/**
 * StyleLibrary
 *
 * A "Reference Gallery" of 3 curated bathroom style presets.
 * Clicking a preset auto-applies the floor tile, wall tile, vanity,
 * and tapware to the builder store — priming the AI generation.
 */

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VanityType, TapwareFinish, TileOption, TileStyle } from "@/lib/types";

export interface StylePreset {
  id:          string;
  name:        string;
  tag:         string;    // e.g. "Minimalist"
  description: string;
  palette:     string[];  // CSS colours for the swatch row
  floorTileId: string;
  wallTileId:  string;
  vanity:      VanityType;
  tapware:     TapwareFinish;
  tileStyle:   TileStyle | null;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id:          "minimalist",
    name:        "Minimalist",
    tag:         "Minimalist",
    description: "Crisp whites, floating vanity, chrome — effortless and timeless.",
    palette:     ["#F5F0E8", "#E8E0D5", "#C0B8B0", "#B8BCC0"],
    floorTileId: "travertine",
    wallTileId:  "white-subway",
    vanity:      "floating",
    tapware:     "chrome",
    tileStyle:   "large-format",
  },
  {
    id:          "industrial",
    name:        "Industrial",
    tag:         "Industrial",
    description: "Raw slate floors, concrete walls, matte black hardware — bold and edgy.",
    palette:     ["#4A4A4A", "#6B6B6B", "#2C2C2C", "#1A1A1A"],
    floorTileId: "charcoal-slate",
    wallTileId:  "concrete-look",
    vanity:      "floating",
    tapware:     "matte-black",
    tileStyle:   "vertical-stack",
  },
  {
    id:          "coastal",
    name:        "Coastal",
    tag:         "Coastal",
    description: "Warm sage green, travertine floors, brushed gold — relaxed Australian luxury.",
    palette:     ["#B8CCBC", "#D4C4A8", "#C8B898", "#D4A57C"],
    floorTileId: "travertine",
    wallTileId:  "sage-subway",
    vanity:      "floating",
    tapware:     "brushed-gold",
    tileStyle:   "herringbone",
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
        <Sparkles size={13} className="text-terracotta" />
        <p className="text-xs font-bold text-charcoal/60 uppercase tracking-widest">Style Library</p>
        <span className="ml-auto text-[10px] text-charcoal/30">Click to apply</span>
      </div>

      <div className="flex flex-col gap-2">
        {STYLE_PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200",
                active
                  ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
                  : "border-sand-200 bg-white/50 hover:border-terracotta/30 hover:bg-white/80",
              )}
            >
              {/* Palette swatches */}
              <div className="flex rounded-xl overflow-hidden flex-shrink-0 w-10 h-10">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                  {preset.palette.slice(0, 4).map((col, i) => (
                    <div key={i} style={{ background: col }} />
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold leading-tight", active ? "text-charcoal" : "text-charcoal/70")}>
                  {preset.name}
                </p>
                <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug truncate">
                  {preset.description}
                </p>
              </div>

              {active && (
                <div className="w-4 h-4 rounded-full bg-terracotta flex-shrink-0 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-charcoal/30 text-center">
        Presets apply tiles, vanity & tapware — you can customise any selection afterwards
      </p>
    </div>
  );
}
