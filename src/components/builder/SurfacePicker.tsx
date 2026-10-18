"use client";

/**
 * Shared pickers for the surfaces in every tool:
 *   StylePicker   — style first, tone second: four popular style cards, "View more" for the rest, and a
 *                   tone drawer that opens when a card is tapped (floor tiles, wall tiles, wall colour)
 *   FormatGrid / ToneGrid — the two-step grids still used for bedroom flooring and walls
 *   CeilingPicker — Standard Crisp White or a Custom Paint Colour
 */

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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

// ══════════════════════════════════════════════════════════════════
//  STYLE FIRST, TONE SECOND
// ══════════════════════════════════════════════════════════════════

export interface PickerStyle {
  id:    string;
  label: string;
  sub:   string;
  cost:  number;
  /** Behind "View more" rather than in the top four */
  more?: boolean;
  /** A cheaper alternative, shown as a wide card under the popular four */
  budget?: boolean;
}

export interface PickerTone {
  id:     string;
  label:  string;
  sub?:   string;
  /** Swatch image id in /public/tiles, or a "#RRGGBB" colour for a flat paint swatch */
  swatch: string;
}

/** A swatch: an image from /public/tiles, or a flat colour when given "#RRGGBB" */
function Swatch({ id, size, className }: { id: string; size: number; className?: string }) {
  if (id.startsWith("#")) return <div aria-hidden="true" className={cn("absolute inset-0", className)} style={{ background: id }} />;
  return <TileTexture tileId={id} size={size} className={cn("absolute inset-0 h-full w-full", className)} style={{ width: "100%", height: "100%" }} />;
}

const price = (n: number) => (n > 0 ? `+$${n.toLocaleString("en-AU")}` : "Included");

/**
 * Style cards (2 × 2, with the rest behind "View more"); tapping a card opens the tone drawer.
 * Choosing a tone selects the style and the tone together.
 */
export function StylePicker({
  styles, value, tone, toneLabel, tonesFor, thumbFor, popularLabel, moreLabel, drawerTitle,
  onPick, onClear, custom,
}: {
  styles:      PickerStyle[];
  /** Selected style id */
  value:       string | null;
  /** Selected tone id (null when a custom colour is used) */
  tone:        string | null;
  /** Shown on the selected card, e.g. "Light Grey" or "Custom #AABBCC" */
  toneLabel:   string | null;
  tonesFor:    (styleId: string) => PickerTone[];
  /** Card thumbnail for a style — in the chosen tone when it is the selected style */
  thumbFor:    (styleId: string, toneId: string | null) => string;
  /** Heading over the first four, e.g. "Popular floor tiles" */
  popularLabel: string;
  moreLabel:   string;
  /** Small heading in the drawer, e.g. "Floor tiles" */
  drawerTitle: string;
  onPick:      (styleId: string, toneId: string) => void;
  onClear:     () => void;
  /** Optional custom colour inside the drawer */
  custom?:     { label: string; value: string | null; onChange: (styleId: string, hex: string | null) => void };
}) {
  const top    = styles.filter((s) => !s.more && !s.budget);
  const budget = styles.filter((s) => s.budget);
  const rest   = styles.filter((s) => s.more);
  const activeIsMore = rest.some((s) => s.id === value);
  const [showMore, setShowMore] = useState(activeIsMore);
  const [open, setOpen] = useState<string | null>(null);
  const moreId = useId();

  // a selection in a "more" style made elsewhere (restored design, sample) stays visible
  useEffect(() => { if (activeIsMore) setShowMore(true); }, [activeIsMore]);

  const card = (s: PickerStyle) => {
    const active = s.id === value;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => setOpen(s.id)}
        aria-pressed={active}
        aria-haspopup="dialog"
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
          active
            ? "border-terracotta shadow-warm-sm"
            : "border-sand-200 bg-white/60 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-warm-sm",
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100">
          <Swatch id={thumbFor(s.id, active ? tone : null)} size={200} className="transition-transform duration-500 group-hover:scale-105" />
          {active && (
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
              <Check size={11} strokeWidth={3} />
            </span>
          )}
        </div>
        <div className={cn("flex flex-1 flex-col gap-0.5 px-3 py-2", active && "bg-terracotta/5")}>
          <p className={cn("text-xs font-bold leading-tight", active ? "text-terracotta" : "text-charcoal/85")}>{s.label}</p>
          <p className="text-[10px] leading-snug text-charcoal/45">{s.sub}</p>
          {active && toneLabel ? (
            <p className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold text-charcoal/70">
              <span className="truncate">{toneLabel}</span>
              <span className="flex-shrink-0 text-terracotta underline-offset-2 group-hover:underline">Change</span>
            </p>
          ) : (
            <p className={cn("mt-1 text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/35")}>{price(s.cost)}</p>
          )}
        </div>
      </button>
    );
  };

  // the budget option: one wide card with a small swatch, so it reads as an alternative, not a fifth style
  const budgetCard = (s: PickerStyle) => {
    const active = s.id === value;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => setOpen(s.id)}
        aria-pressed={active}
        aria-haspopup="dialog"
        className={cn(
          "group mt-2.5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 p-2 pr-3 text-left transition-all duration-200",
          active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/60 hover:border-terracotta/40 hover:shadow-warm-sm",
        )}
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-sand-100">
          <Swatch id={thumbFor(s.id, active ? tone : null)} size={112} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-0.5 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">Budget saver</span>
          <p className={cn("text-xs font-bold leading-tight", active ? "text-terracotta" : "text-charcoal/85")}>{s.label}</p>
          <p className="text-[10px] leading-snug text-charcoal/45">{active && toneLabel ? toneLabel : s.sub}</p>
        </div>
        <span className={cn("flex-shrink-0 text-[10px] font-bold tabular-nums", active ? "text-terracotta" : "text-charcoal/35")}>
          {active ? <Check size={14} strokeWidth={3} /> : price(s.cost)}
        </span>
      </button>
    );
  };

  const openStyle = styles.find((s) => s.id === open) ?? null;

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal/45">{popularLabel}</p>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{top.map(card)}</div>
      {budget.map(budgetCard)}
      {rest.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            aria-controls={moreId}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-sand-300 py-2 text-[11px] font-bold text-charcoal/60 transition-colors hover:border-terracotta/50 hover:text-terracotta"
          >
            {showMore ? "Show fewer styles" : moreLabel}
            <ChevronDown size={13} className={cn("transition-transform duration-200", showMore && "rotate-180")} />
          </button>
          <div id={moreId} hidden={!showMore} className="mt-2.5">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{rest.map(card)}</div>
          </div>
        </>
      )}
      {openStyle && (
        <ToneDrawer
          style={openStyle}
          title={drawerTitle}
          tones={tonesFor(openStyle.id)}
          selectedTone={openStyle.id === value ? tone : null}
          isActive={openStyle.id === value}
          onPick={(t) => { onPick(openStyle.id, t); setOpen(null); }}
          onClear={() => { onClear(); setOpen(null); }}
          onClose={() => setOpen(null)}
          custom={custom && {
            label:    custom.label,
            value:    openStyle.id === value ? custom.value : null,
            onChange: (hex) => custom.onChange(openStyle.id, hex),
          }}
        />
      )}
    </div>
  );
}

function ToneDrawer({ style, title, tones, selectedTone, isActive, onPick, onClear, onClose, custom }: {
  style:        PickerStyle;
  title:        string;
  tones:        PickerTone[];
  selectedTone: string | null;
  isActive:     boolean;
  onPick:       (toneId: string) => void;
  onClear:      () => void;
  onClose:      () => void;
  custom?:      { label: string; value: string | null; onChange: (hex: string | null) => void };
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  // Escape closes, the page behind doesn't scroll, and focus moves into the drawer and back after
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const back = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      back?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-charcoal/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-sand-50 shadow-warm-xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-sand-200 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal/45">{title}</p>
            <h3 id={titleId} className="mt-0.5 text-lg font-bold leading-tight text-charcoal">{style.label}</h3>
            <p className="text-xs text-charcoal/50">{style.sub} · {price(style.cost)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-charcoal/50 transition-colors hover:bg-sand-100 hover:text-charcoal">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-3 text-xs font-semibold text-charcoal/60">{tones.length > 0 && tones.every((t) => t.swatch.startsWith("#")) ? "Choose a paint colour" : "Choose a tone"}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tones.map((t, i) => {
              const active = t.id === selectedTone;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-autofocus={i === 0 ? "" : undefined}
                  onClick={() => onPick(t.id)}
                  aria-pressed={active}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-terracotta/60",
                    active ? "border-terracotta shadow-warm-sm" : "border-sand-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-warm-sm",
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Swatch id={t.swatch} size={200} />
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white shadow-warm-sm">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className={cn("text-[11px] font-bold leading-tight", active ? "text-terracotta" : "text-charcoal/80")}>{t.label}</p>
                    {t.sub && <p className="mt-0.5 text-[10px] leading-snug text-charcoal/45">{t.sub}</p>}
                  </div>
                </button>
              );
            })}
          </div>
          {custom && (
            <div className="mt-4">
              <ColourPickerSwatch label={custom.label} value={custom.value} onChange={custom.onChange} variant="row" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-sand-200 px-5 py-3">
          {isActive ? (
            <button type="button" onClick={onClear} className="text-xs font-semibold text-charcoal/50 underline-offset-2 hover:text-charcoal hover:underline">
              Remove this style
            </button>
          ) : <span />}
          <button type="button" onClick={onClose} className="rounded-xl bg-charcoal px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-charcoal/90">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
