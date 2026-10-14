"use client";

/**
 * The visualiser's photo-first, 3-step flow:
 *   1. Upload Photo  — PhotoStart: dropzone + "Try with a sample room"
 *   2. Choose Style  — finishes, size and budget, applied to that photo
 *   3. Get Estimate  — the AI preview beside the itemised cost
 *
 *   StepTracker — progress pills; finished steps can be revisited
 *   StepCard    — a numbered section with a "Step N of 3" badge
 *   Panel       — an unnumbered section inside a step
 */

import { useState } from "react";
import { Check, ArrowLeftRight, Camera, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomType } from "@/lib/roomTypes";

export type Stage = "upload" | "design" | "estimate";
export const STAGES: Stage[] = ["upload", "design", "estimate"];

export const STEP_COPY = [
  {
    id:     "step-1",
    short:  "Upload Photo",
    title:  "Upload a photo of your space",
    helper: "We'll design on top of your actual room.",
  },
  {
    id:     "step-2",
    short:  "Choose Style",
    title:  "Choose your style",
    helper: "Pick finishes, or keep anything you love as it is.",
  },
  {
    id:     "step-3",
    short:  "Get Estimate",
    title:  "Your preview & estimate",
    helper: "Your AI preview beside the itemised cost.",
  },
] as const;

// ── Progress tracker ──────────────────────────────────────────────

export function StepTracker({ stage, reachable, onStep, onChangeRoom, savedCount }: {
  stage:        Stage;
  /** Furthest step the user can jump to (0–2) */
  reachable:    number;
  onStep:       (stage: Stage) => void;
  onChangeRoom: () => void;
  savedCount:   number;
}) {
  const current = STAGES.indexOf(stage);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Phones: one clear line */}
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta sm:hidden">
        Step {current + 1} of 3: <span className="text-charcoal">{STEP_COPY[current].short}</span>
      </p>
      <ol className="hidden items-center gap-2 sm:flex" aria-label="Design steps">
        {STEP_COPY.map((step, i) => {
          const done = i < current;
          const canGo = i <= reachable && i !== current;
          return (
            <li key={step.id} className="flex flex-shrink-0 items-center gap-2">
              {i > 0 && <span className={cn("h-px w-8", i <= current ? "bg-charcoal/40" : "bg-charcoal/15")} />}
              <button
                type="button"
                disabled={!canGo}
                onClick={() => onStep(STAGES[i])}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition-colors",
                  i === current
                    ? "border-charcoal bg-charcoal text-white"
                    : done
                      ? "border-sand-300 bg-white/70 text-charcoal/70 hover:border-charcoal/30"
                      : "border-sand-200 bg-white/40 text-charcoal/40",
                  !canGo && i !== current && "cursor-default",
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  i === current ? "bg-white text-charcoal" : done ? "bg-emerald-600 text-white" : "bg-sand-200 text-charcoal/50",
                )}>
                  {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                {step.short}
              </button>
            </li>
          );
        })}
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

export function StepCard({ step, children, aside }: {
  step:     1 | 2 | 3;
  children: React.ReactNode;
  /** Optional control shown at the right of the header */
  aside?:   React.ReactNode;
}) {
  const copy = STEP_COPY[step - 1];
  return (
    <section
      id={copy.id}
      aria-labelledby={`${copy.id}-title`}
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-sand-200 bg-white/70 shadow-warm-sm"
    >
      <header className="flex items-start gap-4 border-b border-sand-200 bg-sand-50/80 px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-bold text-white">
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Step {step} of 3</p>
          <h2 id={`${copy.id}-title`} className="mt-0.5 text-lg font-bold leading-snug text-charcoal sm:text-xl">{copy.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-charcoal/55">{copy.helper}</p>
        </div>
        {aside}
      </header>
      <div className="flex flex-col gap-6 p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-sand-200 bg-white/70 shadow-warm-sm">
      <h3 className="border-b border-sand-200 bg-sand-50/80 px-5 py-4 text-base font-bold text-charcoal sm:px-6">{title}</h3>
      <div className="flex flex-col gap-6 p-5 sm:p-6">{children}</div>
    </section>
  );
}

// ── Step 1: photo upload ──────────────────────────────────────────

const ROOM_NAME: Record<RoomType, string> = { bathroom: "bathroom", kitchen: "kitchen", bedroom: "bedroom" };

/** Sample "before" rooms in /public/samples, for people without a photo handy */
export const SAMPLE_ROOMS: Record<RoomType, string> = {
  bathroom: "/samples/bathroom.jpg",
  kitchen:  "/samples/kitchen.jpg",
  bedroom:  "/samples/bedroom.jpg",
};

export function PhotoStart({ room, onFile, onSample, busy, error }: {
  room:     RoomType;
  onFile:   (file: File) => void;
  onSample: () => void;
  /** True while a photo or sample is being prepared */
  busy:     boolean;
  error:    string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const name = ROOM_NAME[room];

  return (
    <div className="flex flex-col gap-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        className={cn(
          "group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-[3px] border-dashed px-6 py-10 text-center transition-all duration-200 sm:min-h-[320px]",
          dragging ? "border-terracotta bg-terracotta/10" : "border-charcoal/45 bg-white hover:border-terracotta hover:bg-terracotta/5",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {/* No `capture` attribute: phones offer both the camera and the photo library */}
        <input type="file" accept="image/*" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta text-white shadow-warm-lg transition-transform group-hover:scale-105">
          {busy ? <Loader2 size={28} className="animate-spin" /> : <ImagePlus size={28} />}
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="text-xl font-bold text-charcoal sm:text-2xl">Upload a photo of your {name}</span>
          <span className="hidden text-sm text-charcoal/55 sm:inline">
            Drag it here, or <span className="font-semibold text-terracotta">choose a photo</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-charcoal px-6 py-3.5 text-base font-bold text-white sm:hidden">
          <Camera size={18} /> Take or choose photo
        </span>
      </label>

      {error && <p className="text-center text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-sand-200" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/40">No photo handy?</span>
        <span className="h-px flex-1 bg-sand-200" />
      </div>

      <button
        type="button"
        onClick={onSample}
        disabled={busy}
        className="flex items-center gap-4 rounded-2xl border-2 border-sand-200 bg-white/70 p-3 pr-5 text-left transition-all hover:border-terracotta/50 hover:bg-white disabled:opacity-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SAMPLE_ROOMS[room]} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-charcoal">Try with a sample {name}</span>
          <span className="block text-sm text-charcoal/50">One tap — see how it works</span>
        </span>
        <span className="text-lg font-bold text-terracotta" aria-hidden>→</span>
      </button>
    </div>
  );
}
