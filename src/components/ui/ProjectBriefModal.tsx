"use client";

/**
 * ProjectBriefModal
 *
 * A minimalist 4-question brief that:
 *  1. Captures year of construction → triggers asbestos cost for pre-1990 + wall-disturbing work
 *  2. Sets plumbing & layout intention (keep existing / move plumbing) → adjusts cost + asbestos trigger
 *  3. Sets renovation scope (Full Strip-out / Cosmetic Refresh) → adjusts cost + prompt
 *  4. How many bathrooms? → if 1, shows hygiene advisory modal after save
 */

import { useState } from "react";
import { X, ClipboardList, TriangleAlert, CheckCircle2, Hammer, Sparkles, Wrench, ArrowRight, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ProjectBrief,
  type PlumbingLayout,
  type RenovationScope,
  ASBESTOS_THRESHOLD_YEAR,
} from "@/lib/projectBrief";

interface ProjectBriefModalProps {
  initial?: ProjectBrief | null;
  onSave:  (brief: ProjectBrief) => void;
  onClose: () => void;
  /** Called after save when bathroomCount === 1 so parent can show hygiene modal */
  onSingleBathroom?: () => void;
}

const PLUMBING_OPTIONS: {
  key:   PlumbingLayout;
  label: string;
  sub:   string;
  icon:  React.ReactNode;
  cost?: string;
}[] = [
  {
    key:   "keep-layout",
    label: "Keep Existing Layout",
    sub:   "All plumbing stays in place — lower cost, faster build",
    icon:  <CheckCircle2 size={18} className="text-terracotta" />,
  },
  {
    key:   "move-plumbing",
    label: "Moving Plumbing / Walls",
    sub:   "Relocating fixtures, drains, or removing walls",
    icon:  <Wrench size={18} className="text-terracotta" />,
    cost:  "+$2,500 est.",
  },
];

const SCOPE_OPTIONS: {
  key:   RenovationScope;
  label: string;
  sub:   string;
  icon:  React.ReactNode;
}[] = [
  {
    key:   "full-stripout",
    label: "Full Strip-out",
    sub:   "Complete gut renovation — walls back to bare studs",
    icon:  <Hammer size={18} className="text-terracotta" />,
  },
  {
    key:   "cosmetic-refresh",
    label: "Cosmetic Refresh",
    sub:   "Surfaces & finishes only — existing plumbing stays",
    icon:  <Sparkles size={18} className="text-terracotta" />,
  },
];

const BATHROOM_COUNT_OPTIONS: { count: 1 | 2 | 3; label: string; sub: string }[] = [
  { count: 1, label: "1 Bathroom",  sub: "Only bathroom in the home"          },
  { count: 2, label: "2 Bathrooms", sub: "Secondary bathroom available"        },
  { count: 3, label: "3+",          sub: "Multiple bathrooms / ensuite setup"  },
];

export default function ProjectBriefModal({ initial, onSave, onClose, onSingleBathroom }: ProjectBriefModalProps) {
  const [yearBuilt,       setYearBuilt]       = useState<string>(initial?.yearBuilt ? String(initial.yearBuilt) : "");
  const [plumbingLayout,  setPlumbingLayout]  = useState<PlumbingLayout>(initial?.plumbingLayout  ?? "keep-layout");
  const [scope,           setScope]           = useState<RenovationScope>(initial?.scope ?? "full-stripout");
  const [bathroomCount,   setBathroomCount]   = useState<1 | 2 | 3>(initial?.bathroomCount ?? 1);

  const year      = parseInt(yearBuilt, 10);
  const validYear = !isNaN(year) && year >= 1900 && year <= new Date().getFullYear();
  const isOld     = validYear && year < ASBESTOS_THRESHOLD_YEAR;

  // Asbestos is triggered when walls will be disturbed in a pre-1990 home
  const asbestosTriggered = isOld && (scope === "full-stripout" || plumbingLayout === "move-plumbing");

  const canSave = validYear;

  function handleSave() {
    if (!canSave) return;
    onSave({ yearBuilt: year, plumbingLayout, scope, bathroomCount });
    if (bathroomCount === 1) {
      onSingleBathroom?.();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-warm-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-charcoal px-8 py-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-terracotta/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ClipboardList size={20} className="text-terracotta" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Project Brief</h2>
            <p className="text-xs text-white/50 mt-0.5">
              4 quick questions — sharpens your cost estimate and AI rendering
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">

          {/* ── Q1: Year of construction ── */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-2">
              1 — Year of construction
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                placeholder="e.g. 1985"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                className={cn(
                  "w-36 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold text-charcoal",
                  "focus:outline-none transition-all duration-200",
                  isOld
                    ? "border-amber-400 bg-amber-50 focus:border-amber-500"
                    : validYear
                    ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500"
                    : "border-sand-200 bg-sand-50 focus:border-terracotta/50",
                )}
              />
              {isOld && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <TriangleAlert size={13} strokeWidth={2.5} />
                  <span>Pre-1990 — possible asbestos risk</span>
                </div>
              )}
              {validYear && !isOld && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  <span>No asbestos risk flagged</span>
                </div>
              )}
            </div>
            {isOld && (
              <p className="mt-2 text-[11px] text-amber-600 leading-snug">
                Australian homes built before 1990 may contain asbestos in bathroom sheeting.
                If you&apos;re doing a full strip-out or moving plumbing, removal will be added as a line item (~$2,272 inc. GST).
              </p>
            )}
          </div>

          {/* ── Q2: Plumbing & Layout ── */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-2">
              2 — Plumbing &amp; layout
            </label>
            <div className="flex flex-col gap-2.5">
              {PLUMBING_OPTIONS.map(({ key, label, sub, icon, cost }) => {
                const active = plumbingLayout === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPlumbingLayout(key)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                      active
                        ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
                        : "border-sand-200 bg-sand-50 hover:border-terracotta/30",
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      active ? "bg-terracotta/15" : "bg-sand-200",
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold", active ? "text-charcoal" : "text-charcoal/60")}>{label}</p>
                      <p className="text-xs text-charcoal/40 mt-0.5">{sub}</p>
                    </div>
                    {cost && (
                      <span className={cn("text-xs font-bold tabular-nums flex-shrink-0", active ? "text-terracotta" : "text-charcoal/30")}>
                        {cost}
                      </span>
                    )}
                    <div className={cn(
                      "ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                      active ? "border-terracotta bg-terracotta" : "border-charcoal/20",
                    )} />
                  </button>
                );
              })}
            </div>
            {/* Asbestos warning — shown when the combination triggers it */}
            {asbestosTriggered && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <TriangleAlert size={13} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-[11px] text-amber-700 leading-snug">
                  Pre-1990 home + wall disturbance = asbestos removal added to estimate (~$2,272 inc. GST)
                </p>
              </div>
            )}
          </div>

          {/* ── Q3: Renovation scope ── */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-2">
              3 — Renovation scope
            </label>
            <div className="flex flex-col gap-2.5">
              {SCOPE_OPTIONS.map(({ key, label, sub, icon }) => {
                const active = scope === key;
                return (
                  <button
                    key={key}
                    onClick={() => setScope(key)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                      active
                        ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
                        : "border-sand-200 bg-sand-50 hover:border-terracotta/30",
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      active ? "bg-terracotta/15" : "bg-sand-200",
                    )}>
                      {icon}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", active ? "text-charcoal" : "text-charcoal/60")}>{label}</p>
                      <p className="text-xs text-charcoal/40 mt-0.5">{sub}</p>
                    </div>
                    <div className={cn(
                      "ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                      active ? "border-terracotta bg-terracotta" : "border-charcoal/20",
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Q4: How many bathrooms? ── */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-2">
              4 — How many bathrooms are you renovating?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {BATHROOM_COUNT_OPTIONS.map(({ count, label, sub }) => {
                const active = bathroomCount === count;
                return (
                  <button
                    key={count}
                    onClick={() => setBathroomCount(count)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all duration-200 text-center",
                      active
                        ? "border-terracotta bg-terracotta/5 shadow-warm-sm"
                        : "border-sand-200 bg-sand-50 hover:border-terracotta/30",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                      active ? "bg-terracotta/15" : "bg-sand-200",
                    )}>
                      <Bath size={16} className={active ? "text-terracotta" : "text-charcoal/40"} />
                    </div>
                    <p className={cn("text-xs font-bold leading-tight", active ? "text-charcoal" : "text-charcoal/60")}>{label}</p>
                    <p className="text-[10px] text-charcoal/35 leading-tight">{sub}</p>
                  </button>
                );
              })}
            </div>
            {bathroomCount === 1 && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <TriangleAlert size={13} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-[11px] text-amber-700 leading-snug">
                  Single bathroom — we&apos;ll show you how to plan hygiene access during the build.
                </p>
              </div>
            )}
          </div>

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200",
              canSave
                ? "bg-terracotta text-white hover:bg-terracotta/90 shadow-warm-sm"
                : "bg-sand-200 text-charcoal/30 cursor-not-allowed",
            )}
          >
            {canSave ? (
              <>Save Brief &amp; Update Estimate <ArrowRight size={15} /></>
            ) : (
              "Enter year of construction to continue"
            )}
          </button>

          <p className="text-center text-[10px] text-charcoal/30 -mt-2">
            Brief affects your cost breakdown and AI rendering · Can be updated anytime
          </p>
        </div>
      </div>
    </div>
  );
}
