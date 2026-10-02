"use client";

/**
 * The visualiser's 3-step guided flow:
 *   StepTracker — progress pills at the top, each jumps to its step
 *   StepCard    — a numbered section with a "Step N of 3" badge and helper text
 *   LayoutTemplatePicker — Step 3 sample layouts, drawn as small floor plans
 */

import { Check, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { templatesFor, type PlanShape } from "@/lib/layoutTemplates";
import type { RoomType } from "@/lib/roomTypes";

export const STEP_COPY = [
  {
    id:     "step-1",
    short:  "Finishes & Style",
    title:  "Step 1: Choose Your Finishes & Style",
    helper: "Select your preferred tiles, cabinetry, tapware, or color palette to set the design direction.",
  },
  {
    id:     "step-2",
    short:  "Room Layout",
    title:  "Step 2: Define Room Layout",
    helper: "Select your room configuration and approximate dimensions so we can structure your design accurately.",
  },
  {
    id:     "step-3",
    short:  "Your Space",
    title:  "Step 3: Add Your Space",
    helper: "Upload a photo of your existing room to overlay your design choices, or select a sample layout template below to proceed.",
  },
] as const;

// ── Progress tracker ──────────────────────────────────────────────

export function StepTracker({ done, onChangeRoom, savedCount }: {
  done:         [boolean, boolean, boolean];
  onChangeRoom: () => void;
  savedCount:   number;
}) {
  // The first unfinished step is the one to focus on
  const current = done.findIndex((d) => !d);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ol className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto" aria-label="Visualiser steps">
        {STEP_COPY.map((step, i) => (
          <li key={step.id} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {i > 0 && <span className={cn("h-px w-4 sm:w-8", done[i - 1] ? "bg-charcoal/40" : "bg-charcoal/15")} />}
            <a
              href={`#${step.id}`}
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-semibold transition-colors",
                i === current
                  ? "border-charcoal bg-charcoal text-white"
                  : done[i]
                    ? "border-sand-300 bg-white/70 text-charcoal/70 hover:border-charcoal/30"
                    : "border-sand-200 bg-white/40 text-charcoal/45 hover:border-charcoal/30",
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                i === current ? "bg-white text-charcoal" : done[i] ? "bg-emerald-600 text-white" : "bg-sand-200 text-charcoal/50",
              )}>
                {done[i] && i !== current ? <Check size={11} strokeWidth={3} /> : i + 1}
              </span>
              {step.short}
            </a>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 text-xs">
        {savedCount > 0 && (
          <span className="flex items-center gap-1 font-semibold text-terracotta">
            <Check size={12} strokeWidth={3} />
            {savedCount} room{savedCount > 1 ? "s" : ""} saved to project
          </span>
        )}
        <button
          onClick={onChangeRoom}
          className="flex items-center gap-1.5 rounded-full border border-sand-200 px-3 py-1.5 font-bold text-charcoal/50 transition-colors hover:border-terracotta/40 hover:text-terracotta"
        >
          <ArrowLeftRight size={12} />
          Change room
        </button>
      </div>
    </div>
  );
}

// ── Step section ──────────────────────────────────────────────────

export function StepCard({ step, done, children }: {
  step:     1 | 2 | 3;
  done:     boolean;
  children: React.ReactNode;
}) {
  const copy = STEP_COPY[step - 1];
  return (
    <section
      id={copy.id}
      aria-labelledby={`${copy.id}-title`}
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-sand-200 bg-white/70 shadow-warm-sm"
    >
      <header className="flex items-start gap-4 border-b border-sand-200 bg-sand-50/80 px-5 py-5 sm:px-6">
        <div className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
          done ? "bg-emerald-600 text-white" : "bg-charcoal text-white",
        )}>
          {done ? <Check size={18} strokeWidth={3} /> : step}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">
            Step {step} of 3{done && <span className="text-emerald-600"> · Complete</span>}
          </p>
          <h2 id={`${copy.id}-title`} className="mt-0.5 text-lg font-bold leading-snug text-charcoal">{copy.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-charcoal/55">{copy.helper}</p>
        </div>
      </header>
      <div className="flex flex-col gap-6 p-5 sm:p-6">{children}</div>
    </section>
  );
}

// ── Sample layouts ────────────────────────────────────────────────

const SHAPE_STYLE: Record<PlanShape["kind"], { fill: string; stroke: string; dash?: string }> = {
  wet:     { fill: "rgba(210,125,94,0.18)", stroke: "rgba(210,125,94,0.75)" },
  joinery: { fill: "rgba(44,62,80,0.12)",   stroke: "rgba(44,62,80,0.55)" },
  soft:    { fill: "rgba(196,179,148,0.35)", stroke: "rgba(139,115,85,0.6)" },
  glass:   { fill: "rgba(99,179,237,0.15)", stroke: "rgba(66,133,190,0.7)", dash: "2 1.5" },
};

function PlanThumb({ shapes }: { shapes: PlanShape[] }) {
  return (
    <svg viewBox="0 0 100 72" className="h-auto w-full" aria-hidden>
      <rect x="2" y="2" width="96" height="68" rx="2" fill="#FDFAF5" stroke="#2C3E50" strokeWidth="1.6" />
      {/* door gap */}
      <line x1="40" y1="70" x2="56" y2="70" stroke="#FDFAF5" strokeWidth="2.4" />
      <path d="M40 70 A14 14 0 0 1 54 56" fill="none" stroke="rgba(44,62,80,0.35)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      {shapes.map((s, i) => {
        const st = SHAPE_STYLE[s.kind];
        return (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.round ? Math.min(s.w, s.h) / 2.5 : 1.2}
            fill={st.fill} stroke={st.stroke} strokeWidth="0.8" strokeDasharray={st.dash} />
        );
      })}
    </svg>
  );
}

export function LayoutTemplatePicker({ room, value, onChange }: {
  room:     RoomType;
  value:    string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-sand-200" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-charcoal/40">No photo? Start from a sample layout</span>
        <span className="h-px flex-1 bg-sand-200" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {templatesFor(room).map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(active ? null : t.id)}
              aria-pressed={active}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all duration-200 sm:flex-col sm:items-stretch lg:flex-row lg:items-center xl:flex-col xl:items-stretch",
                active ? "border-terracotta bg-terracotta/5 shadow-warm-sm" : "border-sand-200 bg-white/60 hover:border-terracotta/40",
              )}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <div className="w-24 flex-shrink-0 sm:w-full lg:w-24 xl:w-full">
                <PlanThumb shapes={t.plan} />
              </div>
              <div className="min-w-0 px-0.5">
                <p className={cn("text-xs font-bold", active ? "text-terracotta" : "text-charcoal/80")}>{t.label}</p>
                <p className="text-[10px] leading-snug text-charcoal/50">{t.sub}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-charcoal/35">{t.size}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
