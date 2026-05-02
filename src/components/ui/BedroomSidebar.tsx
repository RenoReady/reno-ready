"use client";

/**
 * BedroomSidebar
 *
 * The 5-category design selection panel for Living / Master Bedroom renovations.
 */

import { cn } from "@/lib/utils";
import {
  type BedroomSelections,
  BEDROOM_FLOORING_OPTIONS,
  WALL_TREATMENT_OPTIONS,
  BEDROOM_LIGHTING_OPTIONS,
  STORAGE_OPTIONS,
  WINDOW_TREATMENT_OPTIONS,
} from "@/lib/roomTypes";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-2">{children}</p>
  );
}

interface BedroomSidebarProps {
  selections: BedroomSelections;
  onChange:   (s: Partial<BedroomSelections>) => void;
}

export default function BedroomSidebar({ selections, onChange }: BedroomSidebarProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* 1 — Flooring */}
      <div>
        <SectionLabel>1 — Flooring</SectionLabel>
        <div className="flex flex-col gap-2">
          {BEDROOM_FLOORING_OPTIONS.map((opt) => {
            const active = selections.flooring === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ flooring: opt.id })}
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
        </div>
      </div>

      {/* 2 — Wall Treatments */}
      <div>
        <SectionLabel>2 — Wall Treatment</SectionLabel>
        <div className="flex flex-col gap-2">
          {WALL_TREATMENT_OPTIONS.map((opt) => {
            const active = selections.wallTreatment === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ wallTreatment: opt.id })}
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
        </div>
      </div>

      {/* 3 — Lighting & Atmosphere */}
      <div>
        <SectionLabel>3 — Lighting &amp; Atmosphere</SectionLabel>
        <div className="flex flex-col gap-2">
          {BEDROOM_LIGHTING_OPTIONS.map((opt) => {
            const active = selections.lighting === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onChange({
                    lighting: opt.id,
                    // Auto-flag electrical work for options that need it
                    hasElectricalWork: !!opt.triggerElectrical,
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

      {/* 4 — Storage & Joinery */}
      <div>
        <SectionLabel>4 — Storage &amp; Joinery</SectionLabel>
        <div className="flex flex-col gap-2">
          {STORAGE_OPTIONS.map((opt) => {
            const active = selections.storage === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ storage: opt.id })}
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

      {/* 5 — Window Treatments */}
      <div>
        <SectionLabel>5 — Window Treatments</SectionLabel>
        <div className="flex flex-col gap-2">
          {WINDOW_TREATMENT_OPTIONS.map((opt) => {
            const active = selections.windowTreatment === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ windowTreatment: opt.id })}
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

      {/* Custom note */}
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
