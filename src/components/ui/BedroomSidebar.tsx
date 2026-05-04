"use client";

/**
 * BedroomSidebar
 *
 * Design selection panel for Living / Master Bedroom renovations.
 *
 * Section order:
 *   0 — Room Size
 *   1 — Flooring          (+ custom colour picker)
 *   2 — Wall Treatment     (+ custom colour picker)
 *   3 — Ceiling Treatment  (+ custom colour picker) ← grouped with surfaces
 *   4 — Lighting & Atmosphere
 *   5 — Storage & Joinery
 *   6 — Window Treatments
 *   Additional Request
 */

import { cn } from "@/lib/utils";
import {
  type BedroomSelections,
  type BedroomRoomSize,
  type CeilingStyle,
  BEDROOM_SIZE_OPTIONS,
  BEDROOM_FLOORING_OPTIONS,
  WALL_TREATMENT_OPTIONS,
  BEDROOM_LIGHTING_OPTIONS,
  STORAGE_OPTIONS,
  WINDOW_TREATMENT_OPTIONS,
  CEILING_OPTIONS,
} from "@/lib/roomTypes";
import { Ruler } from "lucide-react";
import ColourPickerSwatch from "@/components/ui/ColourPickerSwatch";

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-2">{children}</p>
  );
}

// ColourPickerSwatch imported above — replaces the old inline ColourSwatch

// ── Main component ────────────────────────────────────────────────────────────

interface BedroomSidebarProps {
  selections: BedroomSelections;
  onChange:   (s: Partial<BedroomSelections>) => void;
}

export default function BedroomSidebar({ selections, onChange }: BedroomSidebarProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* 0 — Room Size */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Ruler size={12} className="text-charcoal/40" />
          <SectionLabel>0 — Room Size</SectionLabel>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BEDROOM_SIZE_OPTIONS.map((opt) => {
            const active = selections.roomSize === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ roomSize: selections.roomSize === opt.id ? null : opt.id as BedroomRoomSize, customLength: 0, customWidth: 0 })}
                className={cn(
                  "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/40",
                )}
              >
                <p className={cn("text-xs font-bold", active ? "text-terracotta" : "text-charcoal/80")}>{opt.label}</p>
                <p className="text-[10px] text-charcoal/45 leading-snug">{opt.sub}</p>
                {opt.approxSqm && (
                  <p className={cn("text-[10px] font-semibold mt-0.5", active ? "text-terracotta/70" : "text-charcoal/35")}>{opt.approxSqm}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom dimension inputs */}
        {selections.roomSize === "custom" && (
          <div className="flex flex-col gap-2 mt-3">
            <p className="text-[11px] text-charcoal/50 font-medium">Enter dimensions (metres):</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wide">Length</label>
                <input
                  type="number" min={1} max={30} step={0.1}
                  value={selections.customLength || ""}
                  onChange={(e) => onChange({ customLength: Number(e.target.value) })}
                  placeholder="e.g. 4.5"
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-2 border-sand-200 focus:outline-none focus:border-terracotta/60 bg-white/70 text-charcoal/80"
                />
              </div>
              <div>
                <label className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wide">Width</label>
                <input
                  type="number" min={1} max={30} step={0.1}
                  value={selections.customWidth || ""}
                  onChange={(e) => onChange({ customWidth: Number(e.target.value) })}
                  placeholder="e.g. 3.5"
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm border-2 border-sand-200 focus:outline-none focus:border-terracotta/60 bg-white/70 text-charcoal/80"
                />
              </div>
            </div>
            {selections.customLength > 0 && selections.customWidth > 0 && (
              <p className="text-[11px] text-terracotta font-semibold">
                {(selections.customLength * selections.customWidth).toFixed(1)} m² — AI will maintain these exact proportions
              </p>
            )}
          </div>
        )}
      </div>

      {/* 1 — Flooring */}
      <div>
        <SectionLabel>1 — Flooring</SectionLabel>
        <div className="flex flex-col gap-2">
          {BEDROOM_FLOORING_OPTIONS.map((opt) => {
            const active = selections.flooring === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ flooring: selections.flooring === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="flex rounded-xl overflow-hidden w-9 h-9 flex-shrink-0">
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {opt.palette.slice(0, 4).map((col, i) => <div key={i} style={{ background: col }} />)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                    ~${(opt.cost / 1000).toFixed(1)}k
                  </span>
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}

          {/* Custom flooring colour */}
          <ColourPickerSwatch
            label="Custom Flooring Colour"
            value={selections.flooringColor ?? null}
            onChange={(hex) => onChange({ flooringColor: hex })}
            variant="row"
          />
        </div>
      </div>

      {/* 2 — Wall Treatment */}
      <div>
        <SectionLabel>2 — Wall Treatment</SectionLabel>
        <div className="flex flex-col gap-2">
          {WALL_TREATMENT_OPTIONS.map((opt) => {
            const active = selections.wallTreatment === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ wallTreatment: selections.wallTreatment === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5">{opt.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                    ~${(opt.cost / 1000).toFixed(1)}k
                  </span>
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}

          {/* Custom wall colour */}
          <ColourPickerSwatch
            label="Custom Wall Colour"
            value={selections.wallColor ?? null}
            onChange={(hex) => onChange({ wallColor: hex })}
            variant="row"
          />
        </div>
      </div>

      {/* 3 — Ceiling Treatment (moved up to group with surfaces) */}
      <div>
        <SectionLabel>3 — Ceiling Treatment</SectionLabel>
        <div className="flex flex-col gap-2">
          {CEILING_OPTIONS.map((opt) => {
            const active = selections.ceilingStyle === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ ceilingStyle: selections.ceilingStyle === opt.id ? null : opt.id as CeilingStyle })}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {opt.cost > 0 && (
                    <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                      +${(opt.cost / 1000).toFixed(1)}k
                    </span>
                  )}
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}

          {/* Custom ceiling colour */}
          <ColourPickerSwatch
            label="Custom Ceiling Colour"
            value={selections.ceilingColor ?? null}
            onChange={(hex) => onChange({ ceilingColor: hex })}
            variant="row"
          />
        </div>
      </div>

      {/* 4 — Lighting & Atmosphere */}
      <div>
        <SectionLabel>4 — Lighting &amp; Atmosphere</SectionLabel>
        <div className="flex flex-col gap-2">
          {BEDROOM_LIGHTING_OPTIONS.map((opt) => {
            const active = selections.lighting === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  const deselecting = selections.lighting === opt.id;
                  onChange({
                    lighting: deselecting ? null : opt.id,
                    hasElectricalWork: deselecting ? false : !!opt.triggerElectrical,
                  });
                }}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                    {opt.triggerElectrical && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-1 py-0.5">
                        Electrical
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                    ~${(opt.cost / 1000).toFixed(1)}k
                  </span>
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 — Storage & Joinery */}
      <div>
        <SectionLabel>5 — Storage &amp; Joinery</SectionLabel>
        <div className="flex flex-col gap-2">
          {STORAGE_OPTIONS.map((opt) => {
            const active = selections.storage === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ storage: selections.storage === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                    ~${(opt.cost / 1000).toFixed(0)}k
                  </span>
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 — Window Treatments */}
      <div>
        <SectionLabel>6 — Window Treatments</SectionLabel>
        <div className="flex flex-col gap-2">
          {WINDOW_TREATMENT_OPTIONS.map((opt) => {
            const active = selections.windowTreatment === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ windowTreatment: selections.windowTreatment === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug">{opt.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                    ~${(opt.cost / 1000).toFixed(1)}k
                  </span>
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Request */}
      <div>
        <SectionLabel>Additional Request</SectionLabel>
        <textarea
          value={selections.customNote}
          onChange={(e) => onChange({ customNote: e.target.value })}
          placeholder="e.g. I want dark walls with limewash texture and a reading nook..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border-2 border-sand-200 bg-white/60 text-xs text-charcoal focus:outline-none focus:border-terracotta/50 resize-none transition-all"
        />
      </div>
    </div>
  );
}
