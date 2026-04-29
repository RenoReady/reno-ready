"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, ImagePlus, Sparkles, SlidersHorizontal, Layers, Droplets,
  CheckCircle2, X, Info, Maximize2, Minimize2, ArrowLeftRight,
  RotateCcw, Loader2, AlertCircle, ArrowRight, Zap,
  ShieldCheck, BarChart2, Wrench, MessageSquare, Download, Palette,
} from "lucide-react";
import AuthModal, { isAuthed, markAuthed } from "@/components/auth/AuthModal";
import Button from "@/components/ui/Button";
import TileTexture from "@/components/ui/TileTexture";
import { useBuilderStore, saveBuilderStateForAuth, restoreBuilderStateFromAuth } from "@/lib/store";
import {
  FLOOR_TILES, WALL_TILES, VANITY_OPTIONS, TAPWARE_OPTIONS,
  TILE_STYLE_OPTIONS,
  COST_BREAKDOWN, BUDGET_MIN, BUDGET_MAX, BUDGET_STEP,
  BATHROOM_SIZE_OPTIONS,
  TileOption, VanityType, TapwareFinish, TileStyle, ShowerNiche, ShowerFixtures,
  BathroomSize,
  calcEstimatedCost, getBathroomBaseCost,
} from "@/lib/types";
import PaywallModal from "@/components/ui/PaywallModal";
import { useUserStatus, bustUserStatusCache } from "@/lib/useUserStatus";
import { cn, formatAUD } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════
//  DESIGN CONCIERGE  — cycling tips during generation
// ══════════════════════════════════════════════════════════════════

function getDesignTips(
  floorTile: TileOption | null,
  wallTile:  TileOption | null,
  vanity:    VanityType,
  tapware:   TapwareFinish,
): string[] {
  const tips: string[] = [];

  // ── Selection-specific tips ──────────────────────────────────
  if (floorTile?.id === "terracotta-feature")
    tips.push("Terracotta brings a timeless warmth. Pair it with warm white walls to let the floor be the hero of the space.");
  if (tapware === "matte-black")
    tips.push("Matte black fixtures add a modern architectural edge. Ensure generous lighting — these fixtures absorb light rather than reflect it.");
  if (tapware === "brushed-gold")
    tips.push("Brushed gold tapware adds understated luxury. Pair with travertine or marble to let the warmth of the metal really sing.");
  if (floorTile?.id === "zellige-ivory" || wallTile?.id === "zellige-white")
    tips.push("Zellige tiles scatter light in ways no factory tile can replicate. A single feature wall behind the vanity is enough to transform the whole space.");
  if (wallTile?.id === "marble-blanc")
    tips.push("Marble demands restraint from everything around it. Keep fixtures minimal, accessories tonal, and let the natural veining do the talking.");
  if (floorTile?.id === "charcoal-slate")
    tips.push("Dark slate floors are bold and grounding. Balance with lighter wall tiles and generous task lighting to keep the space open and airy.");
  if (vanity === "floating")
    tips.push("A floating vanity opens up the floor plane and creates a sense of more space — it also makes everyday cleaning genuinely effortless.");
  if (wallTile?.id === "sage-subway")
    tips.push("Sage subway tile is a rare chameleon — it pairs beautifully with both brushed gold and matte black tapware without missing a beat.");
  if (floorTile?.id === "travertine")
    tips.push("Travertine is porous by nature — a quality penetrating sealer applied annually keeps it looking fresh and prevents staining in wet zones.");
  if (vanity === "freestanding")
    tips.push("A freestanding vanity anchors the room with permanence. Maximise cabinet storage to keep the benchtop surfaces uncluttered.");
  if (tapware === "chrome")
    tips.push("Chrome is enduringly versatile and the easiest finish to keep pristine — a quick wipe removes watermarks instantly.");

  // ── Universal design tips ────────────────────────────────────
  const universal = [
    "In Australian bathrooms, natural light takes priority above all else. Position your vanity mirror to reflect your best light source.",
    "The 60-30-10 rule: 60% dominant colour (walls), 30% secondary (floor), 10% accent (tapware and accessories). Discipline here pays off.",
    "Grout colour is the detail most people overlook — warm-grey grout softens natural stone; charcoal grout sharpens geometric tile patterns.",
    "Heated flooring is most cost-effective to install during a full renovation. A small luxury that genuinely transforms the daily experience.",
  ];

  // ── Australian renovation facts ──────────────────────────────
  const aussieFacts = [
    "Australian fact: The average bathroom renovation takes 2–3 weeks on-site — but most homeowners spend 3 months researching before a builder is booked.",
    "Australian fact: Labour accounts for 35–42% of a typical bathroom renovation budget in Australia — more in Sydney and Melbourne.",
    "Australian fact: 68% of Australian homeowners say they wish they'd allocated more budget to tiles and less to fittings once the job was done.",
    "Australian fact: The subway tile has been a staple of Australian bathrooms for over 100 years — and it continues to outsell every other tile format.",
    "Australian fact: Bathroom renovations in Australia return an average of 80–90 cents for every dollar spent in resale value, making them one of the best home investments.",
    "Australian fact: A recent survey found the average Australian spends 47 minutes per week thinking about bathroom design before committing to a renovation.",
    "Australian fact: Over 60% of Australians decide on their bathroom colour palette before they've spoken to a single builder or tradesperson.",
    "Australian fact: Water-efficient showerheads are now mandatory in all Australian bathroom renovations — they can cut water usage by up to 45% vs. older fittings.",
    "Australian fact: Brisbane and Perth have the fastest-growing rate of bathroom renovations in the country, driven by the sea-change and property upgrade boom.",
  ];

  // ── Cost transparency tips ───────────────────────────────────
  const costTips = [
    "Cost note: The estimate you see is based on current Australian market averages. Always collect 2–3 quotes from licensed builders — actual costs vary by location and condition.",
    "Cost note: Material prices can vary up to 30% depending on your state. Regional QLD or WA may differ from our eastern seaboard baseline.",
    "Cost note: Structural changes like removing a bathtub or adding a walk-in shower are the biggest cost drivers — they often involve waterproofing, plumbing reroutes, and tiling extras.",
    "Cost note: The best way to stay on budget is to lock in your tile selection before getting quotes. A fixed specification prevents scope creep on the builder's side.",
  ];

  // Fill remaining slots: first universal, then Aussie facts, then cost tips
  for (const tip of [...universal, ...aussieFacts, ...costTips]) {
    if (tips.length >= 8) break;
    tips.push(tip);
  }

  return tips;
}

function DesignConcierge({ tips }: { tips: string[] }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [visible,  setVisible]  = useState(true);

  useEffect(() => {
    if (tips.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => { setTipIndex((i) => (i + 1) % tips.length); setVisible(true); }, 400);
      return () => clearTimeout(swap);
    }, 6_500);   // 6.5 s per tip — slow enough to comfortably read
    return () => clearInterval(timer);
  }, [tips]);

  if (tips.length === 0) return null;

  return (
    <div className={cn("px-6 py-5", "bg-charcoal/88 backdrop-blur-xl", "border-t border-white/8")}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-5 h-5 rounded-md bg-terracotta/20 flex items-center justify-center">
          <Sparkles size={10} className="text-terracotta" />
        </div>
        <span className="text-[10px] font-bold text-white/45 uppercase tracking-[0.14em]">Design Concierge</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Live</span>
        </div>
      </div>
      <p className="text-[13px] font-medium text-white/85 leading-relaxed"
         style={{ minHeight: "3.2rem", opacity: visible ? 1 : 0, transition: "opacity 0.35s ease-in-out" }}>
        {tips[tipIndex] ?? ""}
      </p>
      <div className="flex items-center gap-1.5 mt-4">
        {tips.map((_, i) => (
          <div key={i} className="h-[3px] rounded-full transition-all duration-500 ease-out"
               style={{ width: i === tipIndex ? 28 : 10, background: i === tipIndex ? "#D27D5E" : "rgba(255,255,255,0.18)" }} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TILE MODAL
// ══════════════════════════════════════════════════════════════════
function TileModal({ tile, onClose }: { tile: TileOption; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-warm-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tile texture preview */}
        <div className="w-full rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1/1" }}>
          <TileTexture tileId={tile.id} size={300} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
        </div>
        <h3 className="text-base font-bold text-charcoal text-center">{tile.name}</h3>
        <p className="text-xs text-charcoal/60 text-center mt-2 leading-relaxed">{tile.description}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold bg-sand-100 text-charcoal/70 hover:bg-sand-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TILE CARD
// ══════════════════════════════════════════════════════════════════
function TileCard({ tile, selected, onSelect, onInfo }: {
  tile: TileOption; selected: boolean; onSelect: () => void; onInfo: () => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      onInfo();
    }, 300);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      onClick={onSelect}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      className={cn(
        "group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 outline-none",
        selected
          ? "ring-2 ring-terracotta ring-offset-2 shadow-warm scale-[1.04]"
          : "ring-1 ring-sand-200 hover:ring-terracotta/40 hover:shadow-warm-sm hover:scale-[1.02]",
      )}
    >
      {/* SVG texture thumbnail */}
      <TileTexture tileId={tile.id} size={80} className="absolute inset-0 w-full h-full" style={{ width: "100%", height: "100%" }} />

      {/* Info icon */}
      <div className="absolute top-1.5 left-1.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
          className="w-5 h-5 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          title="View details"
        >
          <Info size={9} className="text-white" />
        </button>
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center shadow-warm-sm">
          <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-0 inset-x-0 px-1.5 py-1.5 rounded-b-2xl bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-[9px] font-bold text-center leading-tight text-white drop-shadow truncate">
          {tile.name}
        </p>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CUSTOM HEX SWATCH  — per-surface color picker
// ══════════════════════════════════════════════════════════════════
function CustomHexSwatch({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (c: string | null) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [hex,  setHex]  = useState(value ?? "#D2B48C");
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position popover to the right of the swatch (with viewport-edge fallback)
  useEffect(() => {
    if (!open) return;
    const POPOVER_W = 224;   // matches w-56
    const POPOVER_H = 180;   // approx
    const GAP       = 10;

    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const vw   = window.innerWidth;
      const vh   = window.innerHeight;

      // Default: to the right of the button, top-aligned
      let left = rect.right + GAP;
      let top  = rect.top;

      // If it would clip the right edge, flip to the left
      if (left + POPOVER_W > vw - 8) left = rect.left - POPOVER_W - GAP;
      // If it would clip the bottom, push up
      if (top + POPOVER_H > vh - 8)  top = Math.max(8, vh - POPOVER_H - 8);
      // Never go off the top
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
      const target = e.target as Node;
      if (buttonRef.current?.contains(target))  return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative w-full aspect-square">
      {/* Swatch button */}
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
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "conic-gradient(from 0deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)",
            }}
          >
            {/* white inner ring with palette icon */}
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

      {/* Popover — fixed-positioned so it escapes the sidebar overflow */}
      {open && popPos && (
        <div
          ref={popoverRef}
          className="fixed z-[200] w-56 p-3.5 rounded-2xl bg-white border border-sand-200 shadow-warm-xl"
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
                const normalized = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) { onChange(normalized); setHex(normalized); }
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
                onClick={() => { onChange(null); setHex("#D2B48C"); setOpen(false); }}
                className="px-3 text-xs text-charcoal/45 hover:text-charcoal transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SMALL REUSABLE PIECES
// ══════════════════════════════════════════════════════════════════

function SidebarSection({ icon: Icon, title, children }: {
  icon:     React.FC<{ size?: number; className?: string; strokeWidth?: number }>;
  title:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-sand-200 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-terracotta" strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-charcoal tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  COST SUMMARY  — $12k base, independent of budget slider
// ══════════════════════════════════════════════════════════════════

function EstimateAccuracyBadge() {
  const { roomPhotoUrl, floorTile, wallTile } = useBuilderStore();
  const isHighConfidence = !!roomPhotoUrl && !!floorTile && !!wallTile;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
        isHighConfidence
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
          : "bg-white/8 text-white/35 ring-1 ring-white/10",
      )}
    >
      {isHighConfidence ? <ShieldCheck size={10} strokeWidth={2.5} /> : <BarChart2 size={10} strokeWidth={2.5} />}
      {isHighConfidence ? "High Confidence Estimate" : "General Estimate"}
    </div>
  );
}

function CostSummary() {
  const { budget, floorTile, wallTile, vanity, tapware, structuralChanges,
          bathroomSize, customLength, customWidth } = useBuilderStore();

  const baseCost  = getBathroomBaseCost(bathroomSize, customLength, customWidth);
  const estimated = calcEstimatedCost(floorTile, wallTile, vanity, tapware, structuralChanges, baseCost);
  const low  = Math.round(estimated * 0.88 / 500) * 500;
  const high = Math.round(estimated * 1.12 / 500) * 500;

  const isOverBudget = estimated > budget;

  return (
    <div className="rounded-2xl bg-charcoal p-6 flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Estimated Cost Range</p>
          <EstimateAccuracyBadge />
        </div>

        <div className="flex items-end gap-3">
          <p className={cn(
            "text-3xl font-bold transition-colors duration-300",
            isOverBudget ? "text-terracotta" : "text-white",
          )}>
            {formatAUD(low)}
            <span className={cn("text-2xl mx-2 transition-colors duration-300", isOverBudget ? "text-terracotta/50" : "text-white/40")}>–</span>
            {formatAUD(high)}
          </p>
          {isOverBudget && (
            <span className="text-xs font-bold px-2 py-1 rounded-full mb-1 bg-terracotta/20 text-terracotta">
              Over budget
            </span>
          )}
        </div>

        <p className={cn("text-xs mt-1 transition-colors duration-300", isOverBudget ? "text-terracotta/60" : "text-white/30")}>
          {isOverBudget
            ? `${formatAUD(estimated - budget)} over your ${formatAUD(budget)} target`
            : `Within your ${formatAUD(budget)} budget · Australian market rates`}
        </p>
      </div>

      <div className="h-px bg-white/10" />

      <div className="flex flex-col gap-3">
        {COST_BREAKDOWN.map((item) => {
          const amount = Math.round((estimated * item.pct) / 100) * 100;
          return (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/60">{item.label}</p>
              <p className="text-xs font-semibold text-white/80 tabular-nums">{formatAUD(amount)}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-white/25 pt-1 leading-snug">
        Estimates are indicative only. Obtain licensed builder quotes for accuracy.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CSS BATHROOM SCENE  (shown during generation)
// ══════════════════════════════════════════════════════════════════
function CSSBathroomScene({ floorTile, wallTile, vanity, tapware }: {
  floorTile: TileOption | null; wallTile: TileOption | null;
  vanity: VanityType; tapware: TapwareFinish;
}) {
  const tapwareBg =
    tapware === "chrome"      ? "linear-gradient(180deg,#e8e8e8,#c0c0c0,#a8a8a8)" :
    tapware === "matte-black" ? "linear-gradient(180deg,#3a3a3a,#1a1a1a)" :
                                "linear-gradient(180deg,#e8c97e,#c9a84c,#b8962c)";
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className={cn("flex-1 flex items-end justify-center", wallTile?.bgClass ?? "bg-marble-blanc")}>
        <div className="relative pb-0">
          <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-64 h-40
                          bg-white/20 rounded-2xl border border-white/30 backdrop-blur-sm
                          shadow-[inset_0_2px_8px_rgba(255,255,255,0.3)]" />
          <div className={cn("w-80 h-28 rounded-t-3xl border border-sand-200/60 shadow-warm-lg",
            vanity === "floating" ? "bg-sand-50 mt-10" : "bg-sand-100")}>
            <div className="flex gap-4 px-5 pt-5">
              <div className="flex-1 h-1.5 rounded-full bg-sand-200/80" />
              <div className="flex-1 h-1.5 rounded-full bg-sand-200/80" />
            </div>
            <div className="mx-auto mt-3 w-16 h-1.5 rounded-full" style={{ background: tapwareBg }} />
          </div>
          {vanity === "floating" && <div className="w-full h-7" />}
          <div className="absolute -top-3 left-0 right-0 h-3 bg-sand-300/80 rounded-t-lg shadow-sm" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-11 bg-white rounded-2xl border border-sand-100 shadow-[0_4px_16px_rgba(0,0,0,0.1)]" />
          <div className="absolute -top-[88px] left-1/2 -translate-x-1/2 w-3 h-14 rounded-full shadow-warm-sm"
               style={{ background: tapwareBg }} />
        </div>
      </div>
      <div className={cn("h-[38%]", floorTile?.bgClass ?? "bg-travertine")} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  BLUEPRINT BACKGROUND  — ambient grid used during generation
//  (no button, just the atmosphere)
// ══════════════════════════════════════════════════════════════════
function BlueprintBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#0D1B2A",
          backgroundImage: [
            "linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)",
            "linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        <rect x="60" y="40" width="280" height="220" stroke="#63B3ED" strokeWidth="2" />
        <rect x="60" y="40" width="110" height="90" stroke="#63B3ED" strokeWidth="1" strokeDasharray="6 3" />
        <rect x="250" y="40" width="90" height="100" stroke="#63B3ED" strokeWidth="1" strokeDasharray="6 3" />
        <ellipse cx="100" cy="220" rx="25" ry="18" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <rect x="75" y="225" width="50" height="30" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <rect x="170" y="215" width="80" height="40" rx="6" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <path d="M60 260 Q60 220 100 220" stroke="#63B3ED" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="60" y1="30" x2="340" y2="30" stroke="#63B3ED" strokeWidth="0.5" />
        <line x1="60" y1="26" x2="60" y2="34" stroke="#63B3ED" strokeWidth="0.5" />
        <line x1="340" y1="26" x2="340" y2="34" stroke="#63B3ED" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  BLUEPRINT IDLE VIEWPORT
// ══════════════════════════════════════════════════════════════════
function BlueprintIdle({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#0D1B2A",
          backgroundImage: [
            "linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)",
            "linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        <rect x="60" y="40" width="280" height="220" stroke="#63B3ED" strokeWidth="2" />
        <rect x="60" y="40" width="110" height="90" stroke="#63B3ED" strokeWidth="1" strokeDasharray="6 3" />
        <rect x="250" y="40" width="90" height="100" stroke="#63B3ED" strokeWidth="1" strokeDasharray="6 3" />
        <ellipse cx="100" cy="220" rx="25" ry="18" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <rect x="75" y="225" width="50" height="30" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <rect x="170" y="215" width="80" height="40" rx="6" stroke="#63B3ED" strokeWidth="1" strokeDasharray="4 2" />
        <path d="M60 260 Q60 220 100 220" stroke="#63B3ED" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="60" y1="30" x2="340" y2="30" stroke="#63B3ED" strokeWidth="0.5" />
        <line x1="60" y1="26" x2="60" y2="34" stroke="#63B3ED" strokeWidth="0.5" />
        <line x1="340" y1="26" x2="340" y2="34" stroke="#63B3ED" strokeWidth="0.5" />
      </svg>

      <div
        className="absolute left-0 right-0 h-px z-10 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(99,179,237,0.5) 20%, rgba(99,179,237,0.9) 50%, rgba(99,179,237,0.5) 80%, transparent 100%)",
          boxShadow: "0 0 14px 4px rgba(99,179,237,0.18)",
          animation: "scan-viewport 3.5s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <button
          onClick={onGenerate}
          className={cn(
            "group flex flex-col items-center gap-4 px-12 py-10 rounded-3xl text-center",
            "bg-white/4 backdrop-blur-md border border-blue-300/15",
            "hover:bg-white/8 hover:border-terracotta/40 transition-all duration-300",
          )}
          style={{
            boxShadow: "0 0 60px rgba(99,179,237,0.08), 0 0 120px rgba(99,179,237,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-terracotta/15 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-terracotta/20 border border-terracotta/30 flex items-center justify-center"
                 style={{ boxShadow: "0 0 24px rgba(210,125,94,0.25)" }}>
              <Sparkles size={28} className="text-terracotta" />
            </div>
          </div>

          <div>
            <p className="text-xl font-bold text-white tracking-tight">Ready to Render</p>
            <p className="text-sm text-blue-200/40 mt-1">Click to generate your AI preview</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-200/35">
            <div className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
            Analysing your selections…
          </div>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ARCHITECT VIEWPORT
// ══════════════════════════════════════════════════════════════════
type ViewportState = "idle" | "generating" | "ready" | "error";

function ArchitectViewport({
  onGenerate, onViewFullPreview, isGenerating, viewportState, generateDescription, generateError,
}: {
  onGenerate:          () => void;
  onViewFullPreview:   () => void;
  isGenerating:        boolean;
  viewportState:       ViewportState;
  generateDescription: string | null;
  generateError:       string | null;
}) {
  const { roomPhotoUrl, generatedImageUrl, floorTile, wallTile, vanity, tapware } = useBuilderStore();

  const viewportRef   = useRef<HTMLDivElement>(null);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [sliderPos,       setSliderPos]       = useState(50);

  // ── Auto before/after reveal when generation completes with a photo ──
  // Starts fully showing the AI result, then sweeps left to 50% so the
  // user gets an immediate wow-factor comparison against their original room.
  useEffect(() => {
    if (viewportState === "ready" && roomPhotoUrl) {
      setBeforeAfterMode(true);
      setSliderPos(100);

      // Short pause to let the image paint, then animate the reveal
      const raf = { id: 0 };
      const timeout = setTimeout(() => {
        const startTime  = performance.now();
        const duration   = 1_100; // ms — slow enough to be dramatic
        const startPos   = 100;
        const endPos     = 48;   // land slightly left of centre

        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          // Cubic ease-out: fast start, gentle landing
          const eased = 1 - Math.pow(1 - progress, 3);
          setSliderPos(Math.round(startPos + (endPos - startPos) * eased));
          if (progress < 1) raf.id = requestAnimationFrame(animate);
        };

        raf.id = requestAnimationFrame(animate);
      }, 350);

      return () => {
        clearTimeout(timeout);
        cancelAnimationFrame(raf.id);
      };
    }

    // Reset when a new generation starts so the reveal plays again
    if (viewportState === "generating") {
      setBeforeAfterMode(false);
      setSliderPos(50);
    }
  }, [viewportState, roomPhotoUrl]);

  const designTips = getDesignTips(floorTile, wallTile, vanity, tapware);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await viewportRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const hasGenerated = viewportState === "ready";

  return (
    <div
      ref={viewportRef}
      className={cn(
        "flex flex-col rounded-3xl overflow-hidden",
        "bg-[#1A1F28] shadow-warm-xl border border-white/5",
        isFullscreen && "fixed inset-0 z-[100] rounded-none",
      )}
    >
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#151920] flex-shrink-0">
        {/* Minimal brand header */}
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-terracotta/70" />
          <span className="text-xs font-bold text-white/35 tracking-widest uppercase">
            Reno Ready — Design Preview
          </span>
        </div>

        {hasGenerated && roomPhotoUrl && (
          <button
            onClick={() => setBeforeAfterMode((b) => !b)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
              beforeAfterMode ? "bg-terracotta text-white shadow-warm-sm" : "text-white/50 hover:text-white/80 hover:bg-white/8",
            )}
          >
            <ArrowLeftRight size={12} /> {beforeAfterMode ? "AI Only" : "Before / After"}
          </button>
        )}

        <button onClick={toggleFullscreen}
                className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
                title={isFullscreen ? "Exit fullscreen" : "Full screen"}>
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {hasGenerated && generatedImageUrl && (
          <button
            onClick={async () => {
              try {
                let href = generatedImageUrl;
                if (!generatedImageUrl.startsWith("data:")) {
                  const res = await fetch(generatedImageUrl);
                  const blob = await res.blob();
                  href = URL.createObjectURL(blob);
                }
                const a = document.createElement("a");
                a.href = href;
                a.download = "My-Reno-Ready-Design.png";
                a.click();
                if (!generatedImageUrl.startsWith("data:")) URL.revokeObjectURL(href);
              } catch {
                alert("Download failed — try right-clicking the image and saving manually.");
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
              "border border-white/20 text-white/70 hover:text-white hover:border-white/40",
              "hover:bg-white/8 transition-all duration-200",
            )}
          >
            <Download size={12} /> Download
          </button>
        )}

        {hasGenerated && (
          <button
            onClick={() => {
              useBuilderStore.getState().setGeneratedImageUrl(null);
              useBuilderStore.getState().setGenerateDescription(null);
            }}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            title="Reset preview"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <div className="relative w-full flex-1" style={{ minHeight: isFullscreen ? "calc(100vh - 145px)" : "460px" }}>

        {/* Floating "View Full Preview" FAB — appears once generation completes */}
        {hasGenerated && !isGenerating && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
            <button
              onClick={onViewFullPreview}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-2xl",
                "bg-terracotta text-white text-sm font-bold",
                "shadow-[0_8px_32px_rgba(210,125,94,0.45)]",
                "hover:bg-terracotta/90 hover:scale-105 active:scale-100",
                "transition-all duration-200",
              )}
            >
              <Sparkles size={15} />
              View Full Preview
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {viewportState === "error" && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div className="text-center max-w-xs px-4">
              <p className="text-sm font-bold text-white/80">Generation failed</p>
              <p className="text-xs text-white/40 mt-1 break-words">{generateError ?? "Check your API key and try again."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onGenerate}
                    className="border-white/20 text-white/70 hover:bg-white/10 hover:border-white/40">
              Retry
            </Button>
          </div>
        )}

        {hasGenerated && beforeAfterMode && !isGenerating && roomPhotoUrl ? (
          <div className="absolute inset-0 select-none">
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
              {generatedImageUrl
                ? <img src={generatedImageUrl} alt="AI redesign" className="w-full h-full object-cover" />  // eslint-disable-line
                : <CSSBathroomScene floorTile={floorTile} wallTile={wallTile} vanity={vanity} tapware={tapware} />
              }
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <div className="bg-terracotta/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-bold text-white tracking-wide shadow-warm-sm">AFTER</div>
                <p className="text-[10px] text-white/70 font-medium bg-black/40 backdrop-blur-sm rounded px-2 py-0.5">AI Redesign — Staged &amp; Decluttered</p>
              </div>
            </div>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              <img src={roomPhotoUrl} alt="Original room" className="w-full h-full object-cover" />  {/* eslint-disable-line */}
              <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
                <div className="bg-charcoal/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-bold text-white tracking-wide">BEFORE</div>
                <p className="text-[10px] text-white/70 font-medium bg-black/40 backdrop-blur-sm rounded px-2 py-0.5">Your current bathroom</p>
              </div>
            </div>
            <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: `calc(${sliderPos}% - 1px)` }}>
              <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-warm-xl flex items-center justify-center">
                <ArrowLeftRight size={15} className="text-charcoal" strokeWidth={2.5} />
              </div>
            </div>
            <input type="range" min={0} max={100} value={sliderPos}
                   onChange={(e) => setSliderPos(Number(e.target.value))}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize" />
          </div>

        ) : (
          <div className="absolute inset-0">
            {hasGenerated && generatedImageUrl ? (
              <img src={generatedImageUrl} alt="AI Preview" className="w-full h-full object-cover" />  /* eslint-disable-line */
            ) : viewportState === "idle" && !isGenerating ? (
              <BlueprintIdle onGenerate={onGenerate} />
            ) : roomPhotoUrl ? (
              /* Blur the uploaded room photo as the AI generation backdrop */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={roomPhotoUrl}
                alt="Room"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "blur(10px)", transform: "scale(1.08)" }}
              />
            ) : (
              /* No photo — show the architect blueprint background instead of CSS scene */
              <BlueprintBackground />
            )}

            {hasGenerated && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-terracotta/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-warm-sm">
                <Zap size={12} className="text-white" />
                <span className="text-xs font-bold text-white">AI Preview Ready</span>
              </div>
            )}
          </div>
        )}

        {isGenerating && (
          <>
            <div className="absolute left-0 right-0 h-px z-30 pointer-events-none"
                 style={{
                   background: "linear-gradient(90deg, transparent 0%, rgba(210,125,94,0.5) 15%, rgba(210,125,94,1) 50%, rgba(210,125,94,0.5) 85%, transparent 100%)",
                   boxShadow: "0 0 18px 6px rgba(210,125,94,0.28)",
                   animation: "scan-viewport 2s ease-in-out infinite",
                 }} />
            <div className="absolute inset-0 bg-[#1A1F28]/40 z-20 pointer-events-none" />
          </>
        )}
      </div>

      {isGenerating && <DesignConcierge tips={designTips} />}

      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#151920] border-t border-white/5 text-[10px] text-white/30 font-mono flex-shrink-0">
        {floorTile && (
          <span className="flex items-center gap-1.5">
            <span className={cn("inline-block w-2 h-2 rounded-sm flex-shrink-0", floorTile.bgClass)} />
            Floor: {floorTile.name}
          </span>
        )}
        {wallTile && (
          <span className="flex items-center gap-1.5">
            <span className={cn("inline-block w-2 h-2 rounded-sm flex-shrink-0", wallTile.bgClass)} />
            Wall: {wallTile.name}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full",
            isGenerating ? "bg-terracotta animate-pulse" : hasGenerated ? "bg-green-500" : "bg-white/20")} />
          {isGenerating ? "Generating…" : hasGenerated ? "Preview ready" : "Ready to render"}
        </span>
      </div>

      {generateDescription && !isGenerating && (
        <div className="px-4 pb-3 bg-[#151920]">
          <p className="text-[11px] text-white/40 leading-relaxed">{generateDescription}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function BuilderPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Set to true when returning from OAuth with a pending generate request
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  // Incremented to force useUserStatus to re-fetch after payment
  const [statusRefreshKey,     setStatusRefreshKey]     = useState(0);
  const [paymentBanner,        setPaymentBanner]         = useState(false);
  // Local bump so the counter decrements immediately without waiting for a re-fetch
  const [localGenerationBump,  setLocalGenerationBump]  = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("authed") === "1") {
      markAuthed();
      const clean = new URL(window.location.href);
      clean.searchParams.delete("authed");
      window.history.replaceState({}, "", clean.toString());
      // Restore builder state saved before the OAuth redirect
      const pending = restoreBuilderStateFromAuth();
      if (pending) setShouldAutoGenerate(true);
    }

    if (params.get("payment_success") === "true") {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("payment_success");
      clean.searchParams.delete("plan");
      window.history.replaceState({}, "", clean.toString());
      // Bust the user-status cache and show a success banner
      bustUserStatusCache();
      setStatusRefreshKey((k) => k + 1);
      setPaymentBanner(true);
      setTimeout(() => setPaymentBanner(false), 6_000);
    }
  }, []);

  const {
    roomPhotoUrl,       setRoomPhotoUrl,
    floorTile,          setFloorTile,
    wallTile,           setWallTile,
    vanity,             setVanity,
    tapware,            setTapware,
    budget,             setBudget,
    customNote,         setCustomNote,
    customFloorColor,   setCustomFloorColor,
    customWallColor,    setCustomWallColor,
    tileStyle,          setTileStyle,
    structuralChanges,  setStructuralChanges,
    bathroomSize,       setBathroomSize,
    useCustomDimensions, setUseCustomDimensions,
    customLength,       setCustomLength,
    customWidth,        setCustomWidth,
    setGeneratedImageUrl,
    setGenerateDescription,
    generateDescription,
  } = useBuilderStore();

  const userStatus = useUserStatus(statusRefreshKey);

  const [isDragging,       setIsDragging]      = useState(false);
  const [viewportState,    setViewportState]   = useState<ViewportState>("idle");
  const [isGenerating,     setIsGenerating]    = useState(false);
  const [generateError,    setGenerateError]   = useState<string | null>(null);
  const [showAuthModal,    setShowAuthModal]   = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [modalTile,        setModalTile]       = useState<TileOption | null>(null);
  const [refinementNote,   setRefinementNote]  = useState("");
  const [isRefining,       setIsRefining]      = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setRoomPhotoUrl(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [setRoomPhotoUrl]);

  const handleGenerate = useCallback(async () => {
    if (!isAuthed()) {
      saveBuilderStateForAuth(true); // snapshot before OAuth redirect
      setShowAuthModal(true);
      return;
    }

    // Validate custom bathroom dimensions before generating
    const store = useBuilderStore.getState();
    if (store.bathroomSize === "custom" && (!(store.customLength > 0) || !(store.customWidth > 0))) {
      setGenerateError("Please enter your bathroom length and width before generating.");
      setViewportState("error");
      return;
    }

    // Client-side early paywall — avoids a round-trip when we already know
    // the user is over the free limit. The API enforces this server-side too.
    if (!userStatus.loading && !userStatus.isAdmin && !userStatus.isPremium) {
      const effectiveCount = userStatus.generationCount + localGenerationBump;
      if (effectiveCount >= userStatus.freeLimit) {
        setShowPaywallModal(true);
        return;
      }
    }

    setIsGenerating(true);
    setViewportState("generating");
    setGeneratedImageUrl(null);
    setGenerateDescription(null);

    try {
      const prompt =
        `Transform bathroom: floor=${store.floorTile?.name ?? "stone"}` +
        (store.customFloorColor ? ` in ${store.customFloorColor}` : "") + `, ` +
        `wall=${store.wallTile?.name ?? "white tile"}` +
        (store.customWallColor ? ` in ${store.customWallColor}` : "") + `, ` +
        `vanity=${store.vanity}, tapware=${store.tapware}` +
        (store.tileStyle ? `, layout=${store.tileStyle}` : "") +
        (store.customNote ? `, custom: ${store.customNote}` : "");

      const res = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: store.roomPhotoUrl,
          prompt,
          selections: {
            floorTile:         store.floorTile,
            wallTile:          store.wallTile,
            vanity:            store.vanity,
            tapware:           store.tapware,
            budget:            store.budget,
            customNote:        store.customNote,
            customFloorColor:  store.customFloorColor,
            customWallColor:   store.customWallColor,
            tileStyle:         store.tileStyle,
            structuralChanges: store.structuralChanges,
          },
        }),
      });

      const data = await res.json();

      // Handle paywall responses from the API
      if (data.upgrade_required) {
        if (data.reason === "auth_required") {
          saveBuilderStateForAuth(true);
          setShowAuthModal(true);
        } else {
          setShowPaywallModal(true);
        }
        setIsGenerating(false);
        setViewportState("idle");
        return;
      }

      if (!data.success) throw new Error(data.error ?? "Generation failed");

      setGeneratedImageUrl(data.imageUrl ?? null);
      setGenerateDescription(data.description ?? null);
      setGenerateError(null);
      setViewportState("ready");
      // Instantly decrement the displayed free counter without waiting for a re-fetch
      if (!userStatus.isAdmin && !userStatus.isPremium) {
        setLocalGenerationBump((b) => b + 1);
      }
      // Also bust the cache so it syncs the real count in the background
      bustUserStatusCache();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[generate]", msg);
      setGenerateError(msg);
      setViewportState("error");
    } finally {
      setIsGenerating(false);
    }
  }, [setGeneratedImageUrl, setGenerateDescription, userStatus, localGenerationBump]);

  // Auto-trigger generation when returning from Google OAuth redirect.
  // Waits until userStatus has finished loading so the paywall check
  // inside handleGenerate uses real data (not the loading placeholder).
  useEffect(() => {
    if (!shouldAutoGenerate) return;
    if (userStatus.loading) return;   // hold until status is known
    setShouldAutoGenerate(false);
    handleGenerate();
  }, [shouldAutoGenerate, userStatus.loading, handleGenerate]);

  // ── Refinement: re-generate using the current AI image as the base ──
  const handleRefine = useCallback(async () => {
    const note = refinementNote.trim();
    if (!note) return;
    const store = useBuilderStore.getState();
    if (!store.generatedImageUrl) return;

    setIsRefining(true);
    setViewportState("generating");
    setGeneratedImageUrl(null);
    setGenerateDescription(null);
    setRefinementNote("");

    try {
      const basePrompt =
        `Refine this bathroom render: ${note}. ` +
        `Keep all existing finishes (floor=${store.floorTile?.name ?? "stone"}, ` +
        `wall=${store.wallTile?.name ?? "tile"}, vanity=${store.vanity}, ` +
        `tapware=${store.tapware}) unless the instruction specifically changes them.`;

      const res = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: store.generatedImageUrl,  // use previous render as input
          prompt:      basePrompt,
          selections: {
            floorTile:         store.floorTile,
            wallTile:          store.wallTile,
            vanity:            store.vanity,
            tapware:           store.tapware,
            budget:            store.budget,
            customNote:        note,
            structuralChanges: store.structuralChanges,
          },
        }),
      });

      const data = await res.json();
      if (data.upgrade_required) { setShowPaywallModal(true); return; }
      if (!data.success) throw new Error(data.error ?? "Refinement failed");

      setGeneratedImageUrl(data.imageUrl ?? null);
      setGenerateDescription(data.description ?? null);
      setGenerateError(null);
      setViewportState("ready");
      bustUserStatusCache();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[refine]", msg);
      setGenerateError(msg);
      setViewportState("error");
    } finally {
      setIsRefining(false);
    }
  }, [refinementNote, setGeneratedImageUrl, setGenerateDescription]);

  const budgetPct = ((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  const activeStructuralCount = [
    structuralChanges.removeBathtub,
    structuralChanges.addWalkinShower,
    structuralChanges.replaceToilet,
    structuralChanges.inWallCistern,
    structuralChanges.showerNiche  !== "none",
    structuralChanges.showerFixtures !== "single",
  ].filter(Boolean).length;

  const booleanToggles: { key: "removeBathtub" | "addWalkinShower" | "replaceToilet" | "inWallCistern"; label: string; sub: string }[] = [
    { key: "removeBathtub",   label: "Bathtub Removal",            sub: "+$2,500 est." },
    { key: "addWalkinShower", label: "Walk-in Shower Conversion",  sub: "+$4,500 est." },
    { key: "replaceToilet",   label: "Toilet Replacement",         sub: "+$1,200 est." },
    { key: "inWallCistern",   label: "In-Wall Cistern",            sub: "+$2,200 est." },
  ];

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Bathroom Configurator</h1>
          <p className="text-charcoal/50 mt-1">Choose your finishes, then generate your AI preview.</p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">

          {/* ══ LEFT SIDEBAR ══════════════════════════════════ */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-0.5">
            <div className="bg-white/70 rounded-3xl border border-sand-200 shadow-warm-sm p-6 flex flex-col gap-6">

              {/* 0. Bathroom Size */}
              <SidebarSection icon={SlidersHorizontal} title="Bathroom Size">
                <div className="grid grid-cols-2 gap-2">
                  {BATHROOM_SIZE_OPTIONS.map((opt) => {
                    const active = bathroomSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setBathroomSize(opt.id as BathroomSize);
                          setUseCustomDimensions(opt.id === "custom");
                        }}
                        className={cn(
                          "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all duration-200 outline-none",
                          active
                            ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
                            : "border-sand-200 bg-white/50 hover:border-terracotta/40",
                        )}
                      >
                        <p className={cn("text-sm font-bold", active ? "text-terracotta" : "text-charcoal/80")}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-charcoal/45">{opt.sub}</p>
                        {opt.baseCost && (
                          <p className={cn("text-[10px] font-semibold mt-0.5", active ? "text-terracotta/70" : "text-charcoal/35")}>
                            ~${(opt.baseCost / 1000).toFixed(0)}k base
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom dimension inputs */}
                {bathroomSize === "custom" && (
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-[11px] text-charcoal/50 font-medium">Enter dimensions (metres):</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wide">Length</label>
                        <input
                          type="number" min={0.5} max={20} step={0.1}
                          value={customLength || ""}
                          onChange={(e) => setCustomLength(Number(e.target.value))}
                          placeholder="e.g. 2.4"
                          className={cn(
                            "w-full mt-1 px-3 py-2 rounded-xl text-sm border-2 border-sand-200",
                            "focus:outline-none focus:border-terracotta/60 bg-white/70 text-charcoal/80",
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wide">Width</label>
                        <input
                          type="number" min={0.5} max={20} step={0.1}
                          value={customWidth || ""}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          placeholder="e.g. 1.8"
                          className={cn(
                            "w-full mt-1 px-3 py-2 rounded-xl text-sm border-2 border-sand-200",
                            "focus:outline-none focus:border-terracotta/60 bg-white/70 text-charcoal/80",
                          )}
                        />
                      </div>
                    </div>
                    {customLength > 0 && customWidth > 0 && (
                      <p className="text-[11px] text-terracotta font-semibold">
                        {(customLength * customWidth).toFixed(1)} m² · ~${((customLength * customWidth * 5_500) / 1000).toFixed(0)}k base estimate
                      </p>
                    )}
                  </div>
                )}
              </SidebarSection>

              {/* 1. Room Photo */}
              <SidebarSection icon={Upload} title="Room Photo — Optional">
                {roomPhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={roomPhotoUrl} alt="Bathroom" className="w-full h-full object-cover" />
                    <button onClick={() => setRoomPhotoUrl(null)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-charcoal/60 hover:bg-charcoal flex items-center justify-center transition-colors">
                      <X size={13} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center gap-3 p-7 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
                      isDragging ? "border-terracotta bg-terracotta/5" : "border-sand-300 hover:border-terracotta/50 hover:bg-terracotta/3",
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center">
                      <ImagePlus size={18} className="text-charcoal/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-charcoal/70">Drop a photo or <span className="text-terracotta">browse</span></p>
                      <p className="text-xs text-charcoal/40 mt-0.5">Used for AI overlay · JPG, PNG, WEBP</p>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </SidebarSection>

              {/* 2. Floor Tiles */}
              <SidebarSection icon={Layers} title="Floor Tiles (Colour)">
                <div className="grid grid-cols-4 gap-2">
                  {FLOOR_TILES.map((tile) => (
                    <TileCard key={tile.id} tile={tile}
                      selected={floorTile?.id === tile.id}
                      onSelect={() => setFloorTile(floorTile?.id === tile.id ? null : tile)}
                      onInfo={() => setModalTile(tile)} />
                  ))}
                  {/* Custom hex swatch */}
                  <CustomHexSwatch
                    value={customFloorColor}
                    onChange={setCustomFloorColor}
                    label="Custom Floor Colour"
                  />
                </div>
                {floorTile && (
                  <p className="text-[11px] text-charcoal/50 text-center">
                    <span className="font-semibold text-charcoal/70">{floorTile.name}</span>
                    {customFloorColor && <span className="text-terracotta font-semibold"> · {customFloorColor}</span>}
                    {" — "}{floorTile.description.split(".")[0]}.
                  </p>
                )}
                {!floorTile && customFloorColor && (
                  <p className="text-[11px] text-charcoal/50 text-center">
                    Custom colour <span className="font-semibold text-terracotta">{customFloorColor}</span> will be applied to the floor.
                  </p>
                )}
              </SidebarSection>

              {/* 3. Wall Tiles */}
              <SidebarSection icon={Layers} title="Wall Tiles (Colour)">
                <div className="grid grid-cols-4 gap-2">
                  {WALL_TILES.map((tile) => (
                    <TileCard key={tile.id} tile={tile}
                      selected={wallTile?.id === tile.id}
                      onSelect={() => setWallTile(wallTile?.id === tile.id ? null : tile)}
                      onInfo={() => setModalTile(tile)} />
                  ))}
                  {/* Custom hex swatch */}
                  <CustomHexSwatch
                    value={customWallColor}
                    onChange={setCustomWallColor}
                    label="Custom Wall Colour"
                  />
                </div>
                {wallTile && (
                  <p className="text-[11px] text-charcoal/50 text-center">
                    <span className="font-semibold text-charcoal/70">{wallTile.name}</span>
                    {customWallColor && <span className="text-terracotta font-semibold"> · {customWallColor}</span>}
                    {" — "}{wallTile.description.split(".")[0]}.
                  </p>
                )}
                {!wallTile && customWallColor && (
                  <p className="text-[11px] text-charcoal/50 text-center">
                    Custom colour <span className="font-semibold text-terracotta">{customWallColor}</span> will be applied to the walls.
                  </p>
                )}
              </SidebarSection>

              {/* 4. Tile Layout & Texture */}
              <SidebarSection icon={Layers} title="Tile Layout & Texture">
                <div className="grid grid-cols-4 gap-2">
                  {TILE_STYLE_OPTIONS.map((style) => {
                    const active = tileStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setTileStyle(active ? null : style.id as TileStyle)}
                        className={cn(
                          "group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200 outline-none",
                          active
                            ? "ring-2 ring-terracotta ring-offset-2 shadow-warm scale-[1.04]"
                            : "ring-1 ring-sand-200 hover:ring-terracotta/40 hover:shadow-warm-sm hover:scale-[1.02]",
                        )}
                      >
                        {/* Texture thumbnail */}
                        <TileTexture
                          tileId={style.id}
                          size={80}
                          className="absolute inset-0 w-full h-full"
                          style={{ width: "100%", height: "100%" }}
                        />
                        {/* Selected badge */}
                        {active && (
                          <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center shadow-warm-sm">
                            <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        {/* Label */}
                        <div className="absolute bottom-0 inset-x-0 px-1.5 py-1.5 rounded-b-2xl bg-gradient-to-t from-black/65 to-transparent">
                          <p className="text-[9px] font-bold text-white text-center drop-shadow truncate leading-tight">
                            {style.label}
                          </p>
                          <p className="text-[8px] text-white/60 text-center leading-none mt-0.5">{style.tag}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {tileStyle && (
                  <p className="text-[11px] text-charcoal/45 text-center">
                    {TILE_STYLE_OPTIONS.find((s) => s.id === tileStyle)?.promptPhrase}
                  </p>
                )}
              </SidebarSection>

              {/* 5. Vanity */}
              <SidebarSection icon={Layers} title="Vanity Style">
                <div className="grid grid-cols-2 gap-3">
                  {VANITY_OPTIONS.map((opt) => (
                    <button key={opt.id} onClick={() => setVanity(opt.id as VanityType)}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-2xl text-left border-2 transition-all duration-200 outline-none",
                        vanity === opt.id ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/50 hover:border-terracotta/40",
                      )}>
                      <div className={cn("w-9 h-5 rounded-md", vanity === opt.id ? "bg-terracotta/20" : "bg-sand-200", opt.id === "floating" && "mt-3")} />
                      <p className={cn("text-sm font-bold", vanity === opt.id ? "text-terracotta" : "text-charcoal")}>{opt.label}</p>
                      <p className="text-[11px] text-charcoal/50 leading-snug">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </SidebarSection>

              {/* 6. Tapware */}
              <SidebarSection icon={Droplets} title="Tapware Finish">
                <div className="grid grid-cols-3 gap-3">
                  {TAPWARE_OPTIONS.map((opt) => (
                    <button key={opt.id} onClick={() => setTapware(opt.id as TapwareFinish)}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-3 rounded-2xl border-2 transition-all duration-200 outline-none",
                        tapware === opt.id ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50 hover:border-terracotta/40",
                      )}>
                      <div className="w-10 h-10 rounded-full shadow-warm-sm ring-1 ring-black/10" style={{ background: opt.swatchBg }} />
                      <p className={cn("text-[11px] font-bold", tapware === opt.id ? "text-terracotta" : "text-charcoal/70")}>{opt.label}</p>
                      {opt.premium && (
                        <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full -mt-1">{opt.premium}</span>
                      )}
                    </button>
                  ))}
                </div>
              </SidebarSection>

              {/* 7. Budget */}
              <SidebarSection icon={SlidersHorizontal} title="Your Budget">
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-charcoal">{formatAUD(budget)}</p>
                    <p className="text-xs text-charcoal/40 pb-1">AUD target</p>
                  </div>
                  <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP}
                    value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                    className="range-terracotta w-full"
                    style={{ "--range-pct": `${budgetPct}%` } as React.CSSProperties} />
                  <div className="flex justify-between text-xs text-charcoal/40 font-medium">
                    <span>{formatAUD(BUDGET_MIN)}</span>
                    <span>{formatAUD(BUDGET_MAX)}</span>
                  </div>
                </div>
              </SidebarSection>

              {/* 8. Structural Changes */}
              <SidebarSection icon={Wrench} title="Structural Changes">
                <div className="flex flex-col gap-3">
                  {activeStructuralCount >= 2 && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <Zap size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 leading-snug">
                        Multiple structural changes selected — generation may take up to 60 seconds. One at a time gives faster, more accurate results.
                      </p>
                    </div>
                  )}

                  {/* Shower Niche — segmented toggle */}
                  <div className={cn(
                    "p-3.5 rounded-xl border-2 transition-all duration-200",
                    structuralChanges.showerNiche !== "none" ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50",
                  )}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className={cn("text-sm font-semibold", structuralChanges.showerNiche !== "none" ? "text-terracotta" : "text-charcoal/80")}>
                          Shower Niche
                        </p>
                        <p className="text-[11px] text-charcoal/40">
                          {structuralChanges.showerNiche === "single" ? "+$600 est." : structuralChanges.showerNiche === "double" ? "+$1,000 est." : "Recessed storage shelf"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { value: "none",   label: "None" },
                        { value: "single", label: "Single" },
                        { value: "double", label: "Double" },
                      ] as { value: ShowerNiche; label: string }[]).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setStructuralChanges({ showerNiche: value })}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold transition-all duration-200",
                            structuralChanges.showerNiche === value
                              ? "bg-terracotta text-white shadow-warm-sm"
                              : "bg-sand-100 text-charcoal/60 hover:bg-sand-200",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shower Fixtures — segmented toggle */}
                  <div className={cn(
                    "p-3.5 rounded-xl border-2 transition-all duration-200",
                    structuralChanges.showerFixtures === "dual" ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50",
                  )}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className={cn("text-sm font-semibold", structuralChanges.showerFixtures === "dual" ? "text-terracotta" : "text-charcoal/80")}>
                          Shower Fixtures
                        </p>
                        <p className="text-[11px] text-charcoal/40">
                          {structuralChanges.showerFixtures === "dual"
                            ? "+$1,200 est. · Includes plumbing split"
                            : "Standard single shower head"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { value: "single", label: "Single Head",         sub: "Standard" },
                        { value: "dual",   label: "Dual Heads",           sub: "Rain + Handheld" },
                      ] as { value: ShowerFixtures; label: string; sub: string }[]).map(({ value, label, sub }) => (
                        <button
                          key={value}
                          onClick={() => setStructuralChanges({ showerFixtures: value })}
                          className={cn(
                            "py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col gap-0.5 items-center",
                            structuralChanges.showerFixtures === value
                              ? "bg-terracotta text-white shadow-warm-sm"
                              : "bg-sand-100 text-charcoal/60 hover:bg-sand-200",
                          )}
                        >
                          <span>{label}</span>
                          <span className={cn(
                            "text-[9px] font-medium leading-none",
                            structuralChanges.showerFixtures === value ? "text-white/80" : "text-charcoal/40",
                          )}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Boolean toggles */}
                  {booleanToggles.map(({ key, label, sub }) => {
                    const checked = structuralChanges[key] as boolean;
                    return (
                      <label key={key}
                        className={cn(
                          "flex items-center justify-between gap-3 p-3.5 rounded-xl cursor-pointer border-2 transition-all duration-200",
                          checked ? "border-terracotta bg-terracotta/5" : "border-sand-200 bg-white/50 hover:border-terracotta/40",
                        )}
                      >
                        <div>
                          <p className={cn("text-sm font-semibold", checked ? "text-terracotta" : "text-charcoal/80")}>{label}</p>
                          <p className="text-[11px] text-charcoal/40">{sub}</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <input type="checkbox" className="sr-only" checked={checked}
                                 onChange={(e) => setStructuralChanges({ [key]: e.target.checked })} />
                          <div className={cn("w-10 h-6 rounded-full transition-colors duration-200", checked ? "bg-terracotta" : "bg-sand-300")}>
                            <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-warm-sm transition-transform duration-200",
                              checked ? "translate-x-5" : "translate-x-1")} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </SidebarSection>

              {/* 9. Custom Design Note */}
              <SidebarSection icon={MessageSquare} title="Custom Design Note">
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Add specific requests (e.g. add a handrail, change shower screen type, add under-vanity lighting)…"
                  maxLength={300}
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-xl px-4 py-3 text-sm",
                    "border-2 border-sand-200 bg-white/50",
                    "focus:outline-none focus:border-terracotta/60 focus:bg-white",
                    "text-charcoal/80 placeholder:text-charcoal/30 transition-colors duration-200",
                  )}
                />
                <p className="text-[11px] text-charcoal/35 text-right -mt-1">
                  {customNote.length}/300 · Sent directly to the AI
                </p>
              </SidebarSection>

            </div>

            {/* Free generation counter (hide for admin / premium) */}
            {!userStatus.loading && !userStatus.isAdmin && !userStatus.isPremium && (() => {
              const effectiveCount = userStatus.generationCount + localGenerationBump;
              const remaining      = Math.max(0, userStatus.freeLimit - effectiveCount);
              const isExhausted    = effectiveCount >= userStatus.freeLimit;
              return (
                <button
                  onClick={() => setShowPaywallModal(true)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold",
                    "transition-all duration-300",
                    isExhausted
                      ? "bg-terracotta/10 text-terracotta border border-terracotta/20 hover:bg-terracotta/15"
                      : "bg-sand-100 text-charcoal/55 border border-sand-200 hover:border-terracotta/30 cursor-default",
                  )}
                >
                  <span>
                    {isExhausted
                      ? "Free previews used — tap to upgrade"
                      : `${remaining} free ${remaining === 1 ? "preview" : "previews"} remaining`}
                  </span>
                  {isExhausted && (
                    <span className="font-bold text-terracotta underline underline-offset-2 whitespace-nowrap">
                      Upgrade ↑
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Generate */}
            <Button variant="primary" size="lg" fullWidth onClick={handleGenerate} disabled={isGenerating} className="group">
              {isGenerating
                ? <><Loader2 size={18} className="mr-2 animate-spin" />Generating…</>
                : <><Sparkles size={18} className="mr-2" />Generate AI Preview</>}
            </Button>

          </aside>

          {/* ══ RIGHT PANEL ═══════════════════════════════════ */}
          <div className="flex flex-col gap-6">
            <ArchitectViewport
              onGenerate={handleGenerate}
              onViewFullPreview={() => router.push("/preview")}
              isGenerating={isGenerating}
              viewportState={viewportState}
              generateDescription={generateDescription}
              generateError={generateError}
            />

            {/* ── Refinement panel — visible after first generation ── */}
            {viewportState === "ready" && (
              <div className="rounded-2xl border border-sand-200 bg-white/70 backdrop-blur-sm p-4 flex flex-col gap-3">
                <p className="text-xs font-bold text-charcoal/50 uppercase tracking-widest">
                  Not quite right?
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinementNote}
                    onChange={(e) => setRefinementNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
                    placeholder="Tell us what to fix… e.g. 'warmer lighting' or 'different vanity'"
                    disabled={isRefining}
                    className={cn(
                      "flex-1 text-sm px-4 py-2.5 rounded-xl",
                      "border border-sand-200 bg-white text-charcoal placeholder:text-charcoal/30",
                      "focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50",
                      "disabled:opacity-50 transition-all",
                    )}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={isRefining || !refinementNote.trim()}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold",
                      "bg-terracotta text-white transition-all duration-200",
                      "hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                  >
                    {isRefining
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Sparkles size={15} />}
                    {isRefining ? "Refining…" : "Apply"}
                  </button>
                </div>
              </div>
            )}

            <CostSummary />
          </div>
        </div>
      </div>

      {/* Payment success banner */}
      {paymentBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-500 text-white shadow-warm-xl animate-fade-in">
          <CheckCircle2 size={18} strokeWidth={2.5} />
          <span className="text-sm font-bold">Payment successful — unlimited previews unlocked!</span>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onSuccess={() => { setShowAuthModal(false); handleGenerate(); }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showPaywallModal && (
        <PaywallModal
          onClose={() => setShowPaywallModal(false)}
          generationCount={userStatus.generationCount}
          freeLimit={userStatus.freeLimit}
        />
      )}

      {/* Tile detail modal */}
      {modalTile && <TileModal tile={modalTile} onClose={() => setModalTile(null)} />}
    </div>
  );
}
