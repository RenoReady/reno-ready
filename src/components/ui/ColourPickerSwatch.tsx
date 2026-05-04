"use client";

/**
 * ColourPickerSwatch — shared colour picker used by Bedroom and Kitchen sidebars.
 *
 * Matches the bathroom's CustomHexSwatch exactly:
 *  - Rainbow conic-gradient when no colour selected
 *  - Selected colour fill when chosen
 *  - Fixed-positioned popover (escapes sidebar overflow) with:
 *      native <input type="color"> + hex text input + Apply + Clear
 *
 * Variants:
 *  "square" — aspect-square grid cell (kitchen 3-col grid)
 *  "row"    — full-width list row (bedroom sidebar)
 */

import { useState, useEffect, useRef } from "react";
import { Palette, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RAINBOW =
  "conic-gradient(from 0deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)";

interface Props {
  label:       string;
  value:       string | null;
  onChange:    (c: string | null) => void;
  variant?:    "square" | "row";
  defaultHex?: string;
}

export default function ColourPickerSwatch({
  label,
  value,
  onChange,
  variant    = "square",
  defaultHex = "#D2B48C",
}: Props) {
  const [open,   setOpen]   = useState(false);
  const [hex,    setHex]    = useState(value ?? defaultHex);
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef  = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reposition popover to right of button, flip left if near viewport edge
  useEffect(() => {
    if (!open) return;

    const POPOVER_W = 224;   // matches w-56
    const POPOVER_H = 180;
    const GAP       = 10;

    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const vw   = window.innerWidth;
      const vh   = window.innerHeight;

      let left = rect.right + GAP;
      let top  = rect.top;

      if (left + POPOVER_W > vw - 8) left = rect.left - POPOVER_W - GAP;
      if (top  + POPOVER_H > vh - 8) top  = Math.max(8, vh - POPOVER_H - 8);
      if (top < 8) top = 8;

      setPopPos({ top, left });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node))  return;
      if (popoverRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Popover (shared by both variants)
  const popover = open && popPos && (
    <div
      ref={popoverRef}
      className="fixed z-[300] w-56 p-3.5 rounded-2xl bg-white border border-sand-200 shadow-warm-xl"
      style={{ top: popPos.top, left: popPos.left }}
    >
      <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2.5">{label}</p>
      <div className="flex items-center gap-2.5 mb-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-sand-200 bg-transparent p-0.5 flex-shrink-0"
        />
        <input
          type="text"
          value={hex}
          maxLength={7}
          placeholder="#D2B48C"
          onChange={(e) => {
            setHex(e.target.value);
            const n = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(n)) { onChange(n); setHex(n); }
          }}
          className="flex-1 text-xs font-mono px-2.5 py-2 rounded-lg border-2 border-sand-200 focus:border-terracotta/60 focus:outline-none text-charcoal/80"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onChange(hex); setOpen(false); }}
          className="flex-1 text-xs font-bold py-2 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 transition-colors"
        >
          Apply
        </button>
        {value && (
          <button
            onClick={() => { onChange(null); setHex(defaultHex); setOpen(false); }}
            className="px-3 text-xs text-charcoal/45 hover:text-charcoal transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  // ── Square variant (kitchen grid / bathroom tile grid) ─────────────────────
  if (variant === "square") {
    return (
      <div className="relative w-full aspect-square">
        <button
          ref={buttonRef}
          onClick={() => setOpen((o) => !o)}
          title={label}
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden transition-all duration-200 outline-none",
            value
              ? "ring-2 ring-terracotta ring-offset-2"
              : "ring-1 ring-dashed ring-sand-300 hover:ring-terracotta/50",
          )}
        >
          {value ? (
            <div className="absolute inset-0" style={{ background: value }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: RAINBOW }}>
              <div className="absolute inset-[18%] rounded-full bg-white/95 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                <Palette size={14} className="text-charcoal/70" strokeWidth={2.5} />
              </div>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 px-1 py-1 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-[9px] font-bold text-white text-center drop-shadow truncate">Custom</p>
          </div>
          {value && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center shadow-warm-sm">
              <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
        </button>
        {popover}
      </div>
    );
  }

  // ── Row variant (bedroom sidebar full-width list item) ─────────────────────
  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        title={label}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 text-left transition-all duration-200",
          value
            ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
            : "border-sand-200 bg-white/50 hover:border-terracotta/30",
        )}
      >
        {/* Swatch circle: rainbow when empty, selected colour when set */}
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center relative"
          style={{ background: value ? value : RAINBOW }}
        >
          {!value && (
            <div className="absolute inset-[22%] rounded-full bg-white/90 flex items-center justify-center">
              <Palette size={10} className="text-charcoal/60" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Label + hex or placeholder */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wide">{label}</p>
          {value ? (
            <p className="text-[11px] font-semibold text-terracotta mt-0.5">{value.toUpperCase()}</p>
          ) : (
            <p className="text-[10px] text-charcoal/35 mt-0.5">Click to pick a custom colour</p>
          )}
        </div>

        {/* Clear button (stops propagation so it doesn't re-open picker) */}
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); setHex(defaultHex); }}
            className="text-[10px] font-bold text-charcoal/30 hover:text-charcoal/60 flex-shrink-0 transition-colors relative z-10"
          >
            Clear
          </button>
        )}

        {/* Checkmark when colour selected */}
        {value && (
          <div className="w-4 h-4 rounded-full border-2 border-terracotta bg-terracotta flex-shrink-0" />
        )}
      </button>
      {popover}
    </div>
  );
}
