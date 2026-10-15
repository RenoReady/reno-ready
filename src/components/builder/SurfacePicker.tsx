"use client";

/**
 * Shared pickers for the two-step surfaces in every tool:
 *   Step A — FormatGrid: the physical format or material (Large Format Tile, Herringbone, Subway…)
 *   Step B — ToneGrid:   the colour or tone that suits it, plus a custom colour slot
 *   CeilingPicker:       Standard Crisp White or a Custom Paint Colour
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import TileTexture from "@/components/ui/TileTexture";
import ColourPickerSwatch from "@/components/ui/ColourPickerSwatch";
import { CEILING_CUSTOM_COST, type CeilingStyle } from "@/lib/roomTypes";

export function StepLabel({ n, children, hint }: { n: 1 | 2; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-charcoal text-[10px] font-bold text-white">{n}</span>
      <p className="text-xs font-bold text-charcoal/75">{children}</p>
      {hint && <span className="ml-auto text-[10px] text-charcoal/40">{hint}</span>}
    </div>
  );
}

const k = (n: number) => `~$${(n / 1000).toFixed(1)}k`;

export interface FormatOption {
  id:      string;
  label:   string;
  sub?:    string;
  /** Swatch image id in /public/tiles */
  swatch?: string | null;
  /** CSS background when there is no image (e.g. a paint colour) */
  css?:    string;
  cost?:   number;
}

/** Step A — big, tappable format cards. Tapping the active card clears it. */
export function FormatGrid({ options, value, onChange }: {
  options:  FormatOption[];
  value:    string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(active ? null : o.id)}
            aria-pressed={active}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
              active ? "border-terracotta shadow-warm-sm" : "border-sand-200 bg-white/60 hover:border-terracotta/40",
            )}
          >
            <div className="relative h-16 w-full bg-sand-100">
              {o.swatch
                ? <TileTexture tileId={o.swatch} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} />
                : <div className="absolute inset-0" style={{ background: o.css ?? "#F3F0EA" }} />}
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </div>
            <div className={cn("flex flex-1 items-start justify-between gap-2 px-3 py-2", active && "bg-terracotta/5")}>
              <div className="min-w-0">
                <p className={cn("text-xs font-bold leading-tight", active ? "text-terracotta" : "text-charcoal/80")}>{o.label}</p>
                {o.sub && <p className="mt-0.5 text-[10px] leading-snug text-charcoal/45">{o.sub}</p>}
              </div>
              {o.cost !== undefined && (
                <span className={cn("flex-shrink-0 text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/35")}>
                  {o.cost > 0 ? k(o.cost) : "$0"}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export interface ToneOption {
  id:      string;
  label:   string;
  /** Swatch image id in /public/tiles */
  swatch?: string;
  /** Flat colour instead of an image */
  color?:  string;
}

/** Step B — tone swatches for the chosen format; `children` adds the custom-colour slot */
export function ToneGrid({ tones, value, onChange, children }: {
  tones:     ToneOption[];
  value:     string | null;
  onChange:  (id: string | null) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {tones.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(active ? null : t.id)}
            aria-pressed={active}
            title={t.label}
            className={cn(
              "group relative aspect-square w-full overflow-hidden rounded-2xl transition-all duration-200",
              active ? "scale-[1.04] shadow-warm ring-2 ring-terracotta ring-offset-2" : "ring-1 ring-sand-200 hover:ring-terracotta/40",
            )}
          >
            {t.swatch
              ? <TileTexture tileId={t.swatch} className="absolute inset-0 h-full w-full" style={{ width: "100%", height: "100%" }} />
              : <div className="absolute inset-0" style={{ background: t.color }} />}
            {active && (
              <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1.5">
              <span className="block truncate text-center text-[9px] font-bold leading-tight text-white drop-shadow">{t.label}</span>
            </span>
          </button>
        );
      })}
      {children}
    </div>
  );
}

/** Ceiling: Standard Crisp White (default) or a Custom Paint Colour from the colour wheel */
export function CeilingPicker({ style, color, onChange }: {
  style:    CeilingStyle | null;
  color:    string | null;
  onChange: (patch: { ceilingStyle: CeilingStyle; ceilingColor: string | null }) => void;
}) {
  const custom = style === "custom-paint";
  const option = (id: CeilingStyle, label: string, sub: string, cost: string, swatch: string, active: boolean) => (
    <button
      type="button"
      onClick={() => onChange({ ceilingStyle: id, ceilingColor: id === "custom-paint" ? color : null })}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all duration-200",
        active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/60 hover:border-terracotta/40",
      )}
    >
      <span className="h-9 w-9 flex-shrink-0 rounded-xl ring-1 ring-black/10" style={{ background: swatch }} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-xs font-bold", active ? "text-terracotta" : "text-charcoal/80")}>{label}</span>
        <span className="block text-[10px] leading-snug text-charcoal/45">{sub}</span>
      </span>
      <span className={cn("text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/35")}>{cost}</span>
    </button>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {option("standard-white", "Standard Crisp White", "The default — fresh flat white", "$0", "#FBFAF7", !custom)}
        {option("custom-paint", "Custom Paint Colour", "Pick any colour", `+$${CEILING_CUSTOM_COST}`,
          color ?? "conic-gradient(#ef4444,#f59e0b,#84cc16,#06b6d4,#6366f1,#ec4899,#ef4444)", custom)}
      </div>
      {custom && (
        <ColourPickerSwatch
          label="Ceiling colour"
          value={color}
          onChange={(c) => onChange({ ceilingStyle: "custom-paint", ceilingColor: c })}
          variant="row"
        />
      )}
    </div>
  );
}
