"use client";

/**
 * KitchenSidebar
 *
 * The 5-category design selection panel for Kitchen renovations.
 * Mirrors the bathroom sidebar's UX pattern — card selectors with cost indicators.
 */

import { cn } from "@/lib/utils";
import {
  type KitchenSelections,
  CABINETRY_OPTIONS,
  BENCHTOP_OPTIONS,
  MIXER_OPTIONS,
  SPLASHBACK_OPTIONS,
  CEILING_OPTIONS,
} from "@/lib/roomTypes";
import { Flame, Zap, CheckCircle2, ToggleLeft, Info } from "lucide-react";
import { useState } from "react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-2">{children}</p>
  );
}

interface KitchenSidebarProps {
  selections:  KitchenSelections;
  onChange:    (s: Partial<KitchenSelections>) => void;
}

export default function KitchenSidebar({ selections, onChange }: KitchenSidebarProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* 1 — Cabinetry Style */}
      <div>
        <SectionLabel>1 — Cabinetry Style</SectionLabel>
        <div className="flex flex-col gap-2">
          {CABINETRY_OPTIONS.map((opt) => {
            const active = selections.cabinetry === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ cabinetry: selections.cabinetry === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                {/* Palette swatch */}
                <div className="flex rounded-xl overflow-hidden w-9 h-9 flex-shrink-0">
                  <div className="grid grid-cols-3 w-full h-full">
                    {opt.palette.map((col, i) => <div key={i} style={{ background: col }} />)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5 leading-snug truncate">{opt.sub}</p>
                </div>
                {opt.costAdj > 0 && (
                  <span className={cn("text-[10px] font-bold tabular-nums flex-shrink-0", active ? "text-terracotta" : "text-charcoal/30")}>
                    +${(opt.costAdj / 1000).toFixed(1)}k
                  </span>
                )}
                <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 — Benchtop Material */}
      <div>
        <SectionLabel>2 — Benchtop Material</SectionLabel>
        <div className="flex flex-col gap-2">
          {BENCHTOP_OPTIONS.map((opt) => {
            const active = selections.benchtop === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ benchtop: selections.benchtop === opt.id ? null : opt.id })}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="flex rounded-xl overflow-hidden w-9 h-9 flex-shrink-0">
                  <div className="grid grid-cols-3 w-full h-full">
                    {opt.palette.map((col, i) => <div key={i} style={{ background: col }} />)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className="text-[10px] text-charcoal/40 mt-0.5">{opt.sub}</p>
                </div>
                {opt.costAdj > 0 && (
                  <span className={cn("text-[10px] font-bold tabular-nums flex-shrink-0", active ? "text-terracotta" : "text-charcoal/30")}>
                    +${(opt.costAdj / 1000).toFixed(1)}k
                  </span>
                )}
                <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 — Work Triangle Finishes */}
      <div>
        <SectionLabel>3 — Mixer &amp; Sink Finish</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {MIXER_OPTIONS.map((opt) => {
            const active = selections.mixer === opt.id;
            const swatch =
              opt.id === "brushed-brass" ? "#C8A45A" :
              opt.id === "matte-black"   ? "#2C2C2C" : "#B8C0C8";
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ mixer: selections.mixer === opt.id ? null : opt.id })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <div className="w-8 h-8 rounded-full border-2 border-white/50 shadow-warm-sm" style={{ background: swatch }} />
                <p className={cn("text-[10px] font-bold leading-tight", active ? "text-charcoal" : "text-charcoal/60")}>
                  {opt.id === "brushed-brass" ? "Brushed Brass" : opt.id === "matte-black" ? "Matte Black" : "Chrome"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 — Splashback */}
      <div>
        <SectionLabel>4 — Splashback</SectionLabel>
        <div className="flex flex-col gap-2">
          {SPLASHBACK_OPTIONS.map((opt) => {
            const active = selections.splashback === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ splashback: selections.splashback === opt.id ? null : opt.id })}
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
                  {opt.costAdj > 0 && (
                    <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/30")}>
                      +${(opt.costAdj / 1000).toFixed(1)}k
                    </span>
                  )}
                  <div className={cn("w-4 h-4 rounded-full border-2", active ? "border-terracotta bg-terracotta" : "border-charcoal/20")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 — Appliance Integration */}
      <div>
        <SectionLabel>5 — Appliance Integration</SectionLabel>

        {/* Cooktop */}
        <p className="text-[10px] font-semibold text-charcoal/50 mb-1.5">Cooktop</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {([
            { id: "induction", label: "Induction", icon: <Zap size={14} />, sub: "+$1,800" },
            { id: "gas",       label: "Gas",        icon: <Flame size={14} />, sub: "+$2,400" },
          ] as { id: "induction" | "gas"; label: string; icon: React.ReactNode; sub: string }[]).map((opt) => {
            const active = selections.cooktop === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ cooktop: opt.id })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <span className={active ? "text-terracotta" : "text-charcoal/40"}>{opt.icon}</span>
                <div>
                  <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                  <p className={cn("text-[10px]", active ? "text-terracotta/70" : "text-charcoal/30")}>{opt.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dishwasher */}
        <p className="text-[10px] font-semibold text-charcoal/50 mb-1.5">Dishwasher</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            { id: "integrated",   label: "Integrated",   sub: "+$2,200" },
            { id: "freestanding", label: "Freestanding",  sub: "+$1,100" },
          ] as { id: "integrated" | "freestanding"; label: string; sub: string }[]).map((opt) => {
            const active = selections.dishwasher === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ dishwasher: opt.id })}
                className={cn(
                  "flex flex-col px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200",
                  active ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50 hover:border-terracotta/30",
                )}
              >
                <p className={cn("text-xs font-bold", active ? "text-charcoal" : "text-charcoal/70")}>{opt.label}</p>
                <p className={cn("text-[10px]", active ? "text-terracotta/70" : "text-charcoal/30")}>{opt.sub}</p>
              </button>
            );
          })}
        </div>

        {/* Island toggle */}
        <button
          onClick={() => onChange({ hasIsland: !selections.hasIsland })}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200",
            selections.hasIsland
              ? "border-amber-400 bg-amber-50"
              : "border-sand-200 bg-white/50 hover:border-sand-300",
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-xs font-bold", selections.hasIsland ? "text-amber-800" : "text-charcoal/70")}>
              Island Bench
            </p>
            <p className="text-[10px] text-charcoal/40 mt-0.5">Adds plumbing/gas advisory</p>
          </div>
          <div className="flex items-center gap-1.5">
            {selections.hasIsland && (
              <span className="text-[10px] font-bold text-amber-600">+$2,500</span>
            )}
            <div className={cn(
              "w-9 h-5 rounded-full transition-all duration-200 relative",
              selections.hasIsland ? "bg-amber-500" : "bg-sand-300",
            )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                selections.hasIsland ? "left-[18px]" : "left-0.5",
              )} />
            </div>
          </div>
        </button>
      </div>

      {/* 6 — Ceiling Style */}
      <div>
        <SectionLabel>6 — Ceiling Treatment</SectionLabel>
        <div className="flex flex-col gap-2">
          {CEILING_OPTIONS.map((opt) => {
            const active = selections.ceilingStyle === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ ceilingStyle: opt.id })}
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
        </div>
      </div>

      {/* Custom note */}
      <div>
        <SectionLabel>Additional Request</SectionLabel>
        <textarea
          value={selections.customNote}
          onChange={(e) => onChange({ customNote: e.target.value })}
          placeholder="e.g. I want a butler's pantry behind the main kitchen..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border-2 border-sand-200 bg-white/60 text-xs text-charcoal focus:outline-none focus:border-terracotta/50 resize-none transition-all"
        />
      </div>
    </div>
  );
}
