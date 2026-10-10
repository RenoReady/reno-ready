"use client";

/**
 * The visualiser's 3-step guided flow:
 *   StepTracker — progress pills at the top ("Step 2 of 3: Choose Style")
 *   PhotoStep   — Step 1, the photo upload (or a sample room)
 *   StepPanel   — a titled card used to group Step 2 options
 */

import { useRef, useState } from "react";
import { Check, ArrowLeftRight, ArrowRight, Camera, ChevronDown, Loader2, AlertCircle, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_ROOMS } from "@/lib/roomPhoto";
import type { RoomType } from "@/lib/roomTypes";

export type FlowStep = 1 | 2 | 3;

export const STEP_COPY = [
  { short: "Upload Photo" },
  { short: "Choose Style" },
  { short: "Get Estimate" },
] as const;

// ── Progress tracker ──────────────────────────────────────────────

export function StepTracker({ current, canOpen, onStep, onChangeRoom, savedCount }: {
  current:      FlowStep;
  /** Whether a step can be opened yet (2 and 3 need a photo) */
  canOpen:      (step: FlowStep) => boolean;
  onStep:       (step: FlowStep) => void;
  onChangeRoom: () => void;
  savedCount:   number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta" aria-live="polite">
          Step {current} of 3: {STEP_COPY[current - 1].short}
        </p>
        <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Visualiser steps">
          {STEP_COPY.map((step, i) => {
            const n       = (i + 1) as FlowStep;
            const active  = n === current;
            const done    = n < current;
            const enabled = canOpen(n);
            return (
              <li key={step.short} className="flex items-center gap-1.5 sm:gap-2">
                {i > 0 && <span className={cn("h-px w-4 sm:w-8", done || active ? "bg-charcoal/40" : "bg-charcoal/15")} />}
                <button
                  type="button"
                  onClick={() => onStep(n)}
                  disabled={!enabled || active}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Step ${n}: ${step.short}`}
                  className={cn(
                    "flex min-h-[40px] items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-semibold transition-colors",
                    active
                      ? "border-charcoal bg-charcoal text-white"
                      : done
                        ? "border-sand-300 bg-white/70 text-charcoal/70 hover:border-charcoal/30"
                        : "border-sand-200 bg-white/40 text-charcoal/45",
                    enabled && !active && "hover:border-charcoal/30",
                    !enabled && "cursor-not-allowed",
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    active ? "bg-white text-charcoal" : done ? "bg-emerald-600 text-white" : "bg-sand-200 text-charcoal/50",
                  )}>
                    {done ? <Check size={12} strokeWidth={3} /> : n}
                  </span>
                  {/* Phones show the label for the current step only */}
                  <span className={cn(!active && "hidden sm:inline")}>{step.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {savedCount > 0 && (
          <span className="flex items-center gap-1 font-semibold text-terracotta">
            <Check size={12} strokeWidth={3} />
            {savedCount} room{savedCount > 1 ? "s" : ""} saved to project
          </span>
        )}
        <button
          type="button"
          onClick={onChangeRoom}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-sand-200 px-3 py-1.5 font-bold text-charcoal/50 transition-colors hover:border-terracotta/40 hover:text-terracotta"
        >
          <ArrowLeftRight size={12} />
          Change room
        </button>
      </div>
    </div>
  );
}

// ── Step 1: photo upload ──────────────────────────────────────────

export function PhotoStep({ room, photoUrl, busy, error, onFile, onSample, onContinue }: {
  room:       RoomType;
  /** A photo already chosen (the user came back to Step 1) */
  photoUrl:   string | null;
  busy:       boolean;
  error:      string | null;
  onFile:     (file: File) => void;
  onSample:   () => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const roomName = room;
  const sample   = SAMPLE_ROOMS[room];
  const browse   = () => { if (!busy) inputRef.current?.click(); };

  return (
    <div className="step-enter mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">Upload a photo of your space</h2>
        <p className="mt-1.5 text-sm text-charcoal/60 sm:text-base">We&apos;ll design on top of your real {roomName}.</p>
      </div>

      {/* image/* lets phones offer the camera roll and the camera */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";   // so picking the same file again still fires
          if (f) onFile(f);
        }}
      />

      {photoUrl && !busy ? (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-charcoal/15 bg-white p-3 shadow-warm-sm">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-sand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={`Your ${roomName}`} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onContinue}
              className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-terracotta px-6 text-base font-bold text-white shadow-warm transition-colors hover:bg-terracotta-600"
            >
              Continue with this photo <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={browse}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-charcoal/20 px-6 text-base font-bold text-charcoal transition-colors hover:border-charcoal/40"
            >
              <ImagePlus size={18} /> Use a different photo
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Upload a photo of your ${roomName}`}
          aria-busy={busy}
          onClick={browse}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); browse(); } }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f && !busy) onFile(f);
          }}
          className={cn(
            "flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-[3px] border-dashed bg-white px-6 py-10 text-center outline-none transition-all duration-200 sm:min-h-[320px]",
            "focus-visible:ring-4 focus-visible:ring-terracotta/30",
            dragging ? "scale-[1.01] border-terracotta bg-terracotta/5" : "border-charcoal/30 hover:border-terracotta",
            busy && "cursor-wait",
          )}
        >
          {busy ? (
            <>
              <Loader2 size={40} className="animate-spin text-terracotta" />
              <p className="text-lg font-bold text-charcoal">Preparing your photo…</p>
            </>
          ) : (
            <>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal text-white">
                <Camera size={30} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-lg font-bold text-charcoal sm:text-xl">
                  <span className="sm:hidden">Tap to add a photo</span>
                  <span className="hidden sm:inline">Drag &amp; drop your photo here</span>
                </p>
                <p className="mt-1 text-sm text-charcoal/55">From your camera roll or a new shot · JPG, PNG, HEIC</p>
              </div>
              <span className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-terracotta px-7 text-base font-bold text-white shadow-warm">
                <ImagePlus size={18} /> Choose photo
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-sand-300" />
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal/45">No photo handy?</span>
        <span className="h-px flex-1 bg-sand-300" />
      </div>

      <button
        type="button"
        onClick={onSample}
        disabled={busy}
        className="flex min-h-[72px] items-center gap-4 rounded-2xl border-2 border-sand-300 bg-white/80 p-2.5 pr-5 text-left transition-colors hover:border-terracotta disabled:cursor-wait disabled:opacity-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sample.src} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-charcoal">Try with a sample {roomName}</span>
          <span className="block text-xs text-charcoal/50">{sample.label}</span>
        </span>
        <ArrowRight size={18} className="flex-shrink-0 text-terracotta" />
      </button>
    </div>
  );
}

// ── Step 2 group ──────────────────────────────────────────────────

export function StepPanel({ title, hint, collapsible = false, children }: {
  title:        string;
  hint?:        string;
  /** Starts closed behind a tap target — for optional detail */
  collapsible?: boolean;
  children:     React.ReactNode;
}) {
  const [open, setOpen] = useState(!collapsible);
  const heading = (
    <span className="min-w-0">
      <span className="block text-base font-bold text-charcoal">{title}</span>
      {hint && <span className="block text-xs font-medium text-charcoal/50">{hint}</span>}
    </span>
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-sand-200 bg-white/70 shadow-warm-sm">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "flex min-h-[64px] w-full items-center justify-between gap-3 bg-sand-50/80 px-5 py-4 text-left sm:px-6",
            open && "border-b border-sand-200",
          )}
        >
          {heading}
          <ChevronDown size={20} className={cn("flex-shrink-0 text-charcoal/50 transition-transform", open && "rotate-180")} />
        </button>
      ) : (
        <h3 className="border-b border-sand-200 bg-sand-50/80 px-5 py-4 sm:px-6">{heading}</h3>
      )}
      {open && <div className="flex flex-col gap-6 p-5 sm:p-6">{children}</div>}
    </section>
  );
}
