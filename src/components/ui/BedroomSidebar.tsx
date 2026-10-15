"use client";

/**
 * BedroomSidebar
 *
 * Design selection panel for Living / Master Bedroom renovations.
 *
 * Rendered in two parts by the visualiser:
 *   part="finishes" (Step 1) — flooring, wall treatment, ceiling, lighting,
 *                              storage, window treatments, additional request
 *   part="layout"   (Step 2) — room size, budget
 */

import { cn } from "@/lib/utils";
import {
  type BedroomSelections,
  type BedroomRoomSize,
  type BedroomFloorFormat,
  BEDROOM_SIZE_OPTIONS,
  BEDROOM_FLOOR_FORMATS,
  BEDROOM_FLOOR_TONES,
  KITCHEN_WALL_OPTIONS,
  WALL_TREATMENT_OPTIONS,
  BEDROOM_LIGHTING_OPTIONS,
  STORAGE_OPTIONS,
  WINDOW_TREATMENT_OPTIONS,
  BEDROOM_BUDGET_MIN,
  BEDROOM_BUDGET_MAX,
  BEDROOM_BUDGET_STEP,
} from "@/lib/roomTypes";
import { Ruler, SlidersHorizontal } from "lucide-react";
import ColourPickerSwatch from "@/components/ui/ColourPickerSwatch";
import KeepExistingToggle from "@/components/ui/KeepExistingToggle";
import { isKept, keepPatch, BEDROOM_KEEP_FIELDS, type BedroomKeepKey } from "@/lib/keepExisting";
import { tonesFor } from "@/lib/types";
import { StepLabel, FormatGrid, ToneGrid, CeilingPicker } from "@/components/builder/SurfacePicker";

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
  part:       "finishes" | "layout" | "budget";
}

export default function BedroomSidebar({ selections, onChange, part }: BedroomSidebarProps) {
  if (part === "layout") return <BedroomLayout selections={selections} onChange={onChange} />;
  if (part === "budget") return <BedroomBudget selections={selections} onChange={onChange} />;
  const keep = (key: BedroomKeepKey, on: boolean) =>
    onChange(keepPatch(BEDROOM_KEEP_FIELDS, selections.keepExisting, key, on) as Partial<BedroomSelections>);
  return (
    <div className="flex flex-col gap-6">

      {/* Flooring — format, then tone */}
      <div>
        <SectionLabel>Flooring</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="flooring" className="mb-3" active={isKept(selections.keepExisting, "flooring")} onToggle={(on) => keep("flooring", on)} />
        <StepLabel n={1} hint="Priced for a 16m² room">Choose a format</StepLabel>
        <FormatGrid
          options={BEDROOM_FLOOR_FORMATS.map((f) => ({ id: f.id, label: f.label, sub: f.sub, swatch: f.swatch, cost: f.cost }))}
          value={selections.flooringFormat}
          onChange={(id) => {
            const fmt = BEDROOM_FLOOR_FORMATS.find((f) => f.id === id);
            onChange({ flooringFormat: id as BedroomFloorFormat | null, flooringTone: fmt?.tones.includes(selections.flooringTone ?? "") ? selections.flooringTone : null });
          }}
        />
        {selections.flooringFormat && (
          <div className="mt-4">
            <StepLabel n={2}>Choose a colour or tone</StepLabel>
            <ToneGrid
              tones={tonesFor(BEDROOM_FLOOR_TONES, BEDROOM_FLOOR_FORMATS.find((f) => f.id === selections.flooringFormat)).map((t) => ({ id: t.id, label: t.name, swatch: t.id }))}
              value={selections.flooringColor ? null : selections.flooringTone}
              onChange={(id) => onChange({ flooringTone: id, flooringColor: null })}
            >
              <ColourPickerSwatch
                label="Custom Flooring Colour"
                value={selections.flooringColor ?? null}
                onChange={(hex) => onChange({ flooringColor: hex, flooringTone: hex ? null : selections.flooringTone })}
                variant="square"
              />
            </ToneGrid>
          </div>
        )}
      </div>

      {/* Wall Treatment */}
      <div>
        <SectionLabel>Walls</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="wall finish" className="mb-3" active={isKept(selections.keepExisting, "walls")} onToggle={(on) => keep("walls", on)} />
        <StepLabel n={1}>Choose a material or finish</StepLabel>
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

        </div>
        {selections.wallTreatment && (
          <div className="mt-4">
            <StepLabel n={2}>Choose a colour</StepLabel>
            <ToneGrid
              tones={KITCHEN_WALL_OPTIONS.map((o) => ({ id: o.color, label: o.label, color: o.color }))}
              value={selections.wallColor}
              onChange={(c) => onChange({ wallColor: c })}
            >
              <ColourPickerSwatch label="Custom Wall Colour" value={selections.wallColor ?? null} onChange={(hex) => onChange({ wallColor: hex })} variant="square" />
            </ToneGrid>
          </div>
        )}
      </div>

      {/* Ceiling */}
      <div>
        <SectionLabel>Ceiling</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="ceiling" className="mb-2" active={isKept(selections.keepExisting, "ceiling")} onToggle={(on) => keep("ceiling", on)} />
        <CeilingPicker style={selections.ceilingStyle} color={selections.ceilingColor} onChange={onChange} />
      </div>

      {/* Lighting & Atmosphere */}
      <div>
        <SectionLabel>Lighting &amp; Atmosphere</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="light fittings" className="mb-2" active={isKept(selections.keepExisting, "lighting")} onToggle={(on) => keep("lighting", on)} />
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

      {/* Storage & Joinery */}
      <div>
        <SectionLabel>Storage &amp; Joinery</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="wardrobe and storage" className="mb-2" active={isKept(selections.keepExisting, "storage")} onToggle={(on) => keep("storage", on)} />
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

      {/* Window Treatments */}
      <div>
        <SectionLabel>Window Treatments</SectionLabel>
        <KeepExistingToggle room="bedroom" thing="window coverings" className="mb-2" active={isKept(selections.keepExisting, "windows")} onToggle={(on) => keep("windows", on)} />
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

    </div>
  );
}

// ── Step 2 part: room size, budget ────────────────────────────────

function BedroomLayout({ selections, onChange }: Omit<BedroomSidebarProps, "part">) {
  return (
    <div className="flex flex-col gap-6">

      {/* Room Size */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Ruler size={12} className="text-charcoal/40" />
          <SectionLabel>Room Size</SectionLabel>
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

    </div>
  );
}

// ── Step 2 part, shown last: budget ───────────────────────────────

function BedroomBudget({ selections, onChange }: Omit<BedroomSidebarProps, "part">) {
  return (
    <>
      {/* Budget */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={12} className="text-charcoal/40" />
          <SectionLabel>Your Budget</SectionLabel>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-charcoal">
              {selections.budget.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-charcoal/40 pb-1">AUD target</p>
          </div>
          <input
            type="range"
            min={BEDROOM_BUDGET_MIN}
            max={BEDROOM_BUDGET_MAX}
            step={BEDROOM_BUDGET_STEP}
            value={selections.budget}
            onChange={(e) => onChange({ budget: Number(e.target.value) })}
            className="range-terracotta w-full"
            style={{ "--range-pct": `${((selections.budget - BEDROOM_BUDGET_MIN) / (BEDROOM_BUDGET_MAX - BEDROOM_BUDGET_MIN)) * 100}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-charcoal/40 font-medium">
            <span>$5k</span>
            <span>$40k</span>
          </div>
          <p className="text-[10px] text-charcoal/35 leading-snug">
            AU bedrooms: ~$5k cosmetic refresh · $15k–$25k mid-range · $40k+ luxury fit-out
          </p>
        </div>
      </div>
    </>
  );
}
