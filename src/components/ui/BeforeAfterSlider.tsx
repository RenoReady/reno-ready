"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ── Panel helpers ─────────────────────────────────────────────────

interface PanelProps {
  src?:   string;   // override image source
  label?: string;   // override badge text
  side:   "left" | "right";
}

function BeforePanel({ src = "/Reno-before.jpg", label = "Before", side }: PanelProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-label={`${label} — bathroom`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${label} bathroom`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className={cn(
        "absolute top-4 bg-charcoal text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-warm",
        side === "left" ? "left-4" : "right-4",
      )}>
        {label}
      </div>
    </div>
  );
}

function AfterPanel({ src = "/Reno-after.jpg", label = "After", side, showSwatches = true }: PanelProps & { showSwatches?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-label={`${label} — bathroom`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${label} bathroom`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {showSwatches && (
        <>
          {/* Subtle gradient vignette at bottom for swatch legibility */}
          <div
            className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)" }}
          />
          {/* Floating material swatch panels */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-warm-sm">
              <div className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: "linear-gradient(135deg, #C8A882 0%, #B89870 100%)" }} />
              <span className="text-[11px] font-semibold text-charcoal whitespace-nowrap">Floor: Natural Stone</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-warm-sm">
              <div className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: "linear-gradient(135deg, #7A8FA6 0%, #5C7389 100%)" }} />
              <span className="text-[11px] font-semibold text-charcoal whitespace-nowrap">Feature Wall: Slate Blue Stack</span>
            </div>
          </div>
        </>
      )}

      <div className={cn(
        "absolute top-4 bg-charcoal text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-warm",
        side === "right" ? "right-4" : "left-4",
      )}>
        {label}
      </div>
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────

interface BeforeAfterSliderProps {
  className?:    string;
  height?:       number;
  /** Override the "before" image (defaults to /Reno-before.jpg) */
  beforeSrc?:    string;
  /** Override the "after" image (defaults to /Reno-after.jpg) */
  afterSrc?:     string;
  /** Override the before badge label */
  beforeLabel?:  string;
  /** Override the after badge label */
  afterLabel?:   string;
  /** Hide the material swatches on the after panel (for PoC / custom sliders) */
  hideSwatches?: boolean;
}

export default function BeforeAfterSlider({
  className,
  height       = 420,
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
  hideSwatches = false,
}: BeforeAfterSliderProps) {
  const [position, setPosition]   = useState(42); // % from left where divider sits
  const [dragging, setDragging]   = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  const clamp = (v: number) => Math.min(Math.max(v, 2), 98);

  const updateFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    updateFromEvent(e.clientX);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => updateFromEvent(e.clientX);
    const onUp   = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [dragging, updateFromEvent]);

  // ── Touch handlers ────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    updateFromEvent(e.touches[0].clientX);
    setDragging(true);
  };
  const onTouchMove  = (e: React.TouchEvent) => updateFromEvent(e.touches[0].clientX);
  const onTouchEnd   = () => setDragging(false);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-3xl select-none shadow-warm-xl", className)}
      style={{ height }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* AFTER — full panel beneath */}
      <AfterPanel src={afterSrc} label={afterLabel} side="right" showSwatches={!hideSwatches} />

      {/* BEFORE — clipped to left of divider */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <BeforePanel src={beforeSrc} label={beforeLabel} side="left" />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-warm"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      />

      {/* Drag handle */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
          "w-10 h-10 rounded-full bg-white shadow-warm-lg",
          "flex items-center justify-center gap-1",
          "border-2 border-white/80",
          dragging ? "scale-110" : "scale-100",
          "transition-transform duration-100",
          "cursor-ew-resize",
        )}
        style={{ left: `${position}%` }}
      >
        {/* Left arrow */}
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M6 1L1 6L6 11" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Right arrow */}
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M2 1L7 6L2 11" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
