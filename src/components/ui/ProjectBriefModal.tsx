"use client";

/**
 * ProjectBriefModal
 *
 * A minimalist 3-question brief that:
 *  1. Captures year of construction → triggers asbestos cost injection for pre-1990 homes
 *  2. Sets budget tier (Value / Standard / Premium) → adjusts cost estimate + Gemini prompt
 *  3. Sets renovation scope (Full Strip-out / Cosmetic Refresh) → adjusts cost + prompt
 */

import { useState } from "react";
import { X, ClipboardList, TriangleAlert, CheckCircle2, Hammer, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ProjectBrief,
  type BudgetTier,
  type RenovationScope,
  ASBESTOS_THRESHOLD_YEAR,
} from "@/lib/projectBrief";

interface ProjectBriefModalProps {
  initial?: ProjectBrief | null;
  onSave:  (brief: ProjectBrief) => void;
  onClose: () => void;
}

const BUDGET_TIERS: {
  key:        BudgetTier;
  label:      string;
  sub:        string;
  range:      string;
  icon:       React.ReactNode;
  featured?:  boolean;
}[] = [
  {
    key:   "value",
    label: "Value",
    sub:   "Clean & functional",
    range: "$10k – $18k",
    icon:  <span className="text-lg">💧</span>,
  },
  {
    key:      "standard",
    label:    "Standard",
    sub:      "Quality upgrade",
    range:    "$18k – $30k",
    icon:     <span className="text-lg">⭐</span>,
    featured: true,
  },
  {
    key:   "premium",
    label: "Premium",
    sub:   "Luxury finish",
    range: "$30k+",
    icon:  <span className="text-lg">✨</span>,
  },
];

const SCOPE_OPTIONS: {
  key:    RenovationScope;
  label:  string;
  sub:    string;
  icon:   React.ReactNode;
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

export default function ProjectBriefModal({ initial, onSave, onClose }: ProjectBriefModalProps) {
  const [yearBuilt,   setYearBuilt]   = useState<string>(initial?.yearBuilt ? String(initial.yearBuilt) : "");
  const [budgetTier,  setBudgetTier]  = useState<BudgetTier>(initial?.budgetTier  ?? "standard");
  const [scope,       setScope]       = useState<RenovationScope>(initial?.scope ?? "full-stripout");

  const year      = parseInt(yearBuilt, 10);
  const validYear = !isNaN(year) && year >= 1900 && year <= new Date().getFullYear();
  const isOld     = validYear && year < ASBESTOS_THRESHOLD_YEAR;

  const canSave   = validYear;

  function handleSave() {
    if (!canSave) return;
    onSave({ yearBuilt: year, budgetTier, scope });
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-warm-xl max-w-lg w-full overflow-hidden"
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
              3 quick questions — sharpens your cost estimate and AI rendering
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
                  <span>Pre-1990 — asbestos risk added to estimate</span>
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
                Australian homes built before 1990 commonly contain asbestos in bathroom wall and floor sheeting.
                A licensed removal will be added as a line item (~$2,272 inc. GST).
              </p>
            )}
          </div>

          {/* ── Q2: Budget tier ── */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-2">
              2 — Budget tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUDGET_TIERS.map(({ key, label, sub, range, icon, featured }) => {
                const active = budgetTier === key;
                return (
                  <button
                    key={key}
                    onClick={() => setBudgetTier(key)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center",
                      active
                        ? featured
                          ? "border-terracotta bg-terracotta/6 shadow-warm-sm"
                          : "border-charcoal/60 bg-charcoal/4"
                        : "border-sand-200 bg-sand-50 hover:border-charcoal/20",
                    )}
                  >
                    {featured && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-terracotta text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    <span>{icon}</span>
                    <p className={cn("text-sm font-bold", active ? "text-charcoal" : "text-charcoal/60")}>{label}</p>
                    <p className="text-[10px] text-charcoal/40">{sub}</p>
                    <p className={cn("text-xs font-semibold mt-0.5", active ? "text-terracotta" : "text-charcoal/30")}>{range}</p>
                  </button>
                );
              })}
            </div>
            {budgetTier === "premium" && (
              <p className="mt-2 text-[11px] text-charcoal/50 leading-snug">
                Premium tier uses brushed brass / matte black tapware, high-end stone tiles, and
                hotel-grade staging in the AI render.
              </p>
            )}
          </div>

          {/* ── Q3: Scope ── */}
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

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "w-full py-3 rounded-2xl text-sm font-bold transition-all duration-200",
              canSave
                ? "bg-terracotta text-white hover:bg-terracotta/90 shadow-warm-sm"
                : "bg-sand-200 text-charcoal/30 cursor-not-allowed",
            )}
          >
            {canSave ? "Save Brief & Update Estimate" : "Enter year of construction to continue"}
          </button>

          <p className="text-center text-[10px] text-charcoal/30 -mt-2">
            Brief affects your cost breakdown and the AI rendering style · Can be updated anytime
          </p>
        </div>
      </div>
    </div>
  );
}
