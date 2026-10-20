"use client";

/**
 * "Pick up where you left off?" — offered when someone comes back to the
 * builder and a saved draft exists (this device's autosave, or the newest
 * one in their account).
 */

import { useEffect } from "react";
import Link from "next/link";
import { History, Plus, ArrowRight, Loader2 } from "lucide-react";

export interface ResumeOffer {
  roomType:  "bathroom" | "kitchen" | "bedroom";
  updatedAt: number;
  thumbUrl:  string | null;
  hasRender: boolean;
  estimate:  string | null;
}

export function timeAgo(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 90) return "just now";
  const m = s / 60, h = m / 60, d = h / 24;
  if (m < 60) return `${Math.round(m)} minutes ago`;
  if (h < 24) return `${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"} ago`;
  if (d < 14) return `${Math.round(d)} day${Math.round(d) === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function ResumeDraftModal({ offer, signedIn, busy, onContinue, onStartNew }: {
  offer: ResumeOffer;
  signedIn: boolean;
  busy: boolean;
  onContinue: () => void;
  onStartNew: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onContinue(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onContinue]);

  const room = offer.roomType[0].toUpperCase() + offer.roomType.slice(1);

  return (
    <div className="fixed inset-0 z-[320] flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="resume-title"
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-warm-xl">
        {offer.thumbUrl && (
          <div className="relative h-44 bg-sand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offer.thumbUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-lg bg-charcoal/80 px-2.5 py-1 text-[11px] font-bold text-white">
              {offer.hasRender ? "AI preview ready" : "Photo added"}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-5 p-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-terracotta">
              <History size={14} /> Draft saved
            </div>
            <h2 id="resume-title" className="text-xl font-bold text-charcoal">Pick up where you left off?</h2>
            <p className="mt-1 text-sm text-charcoal/60">
              Your {room.toLowerCase()} design from {timeAgo(offer.updatedAt)}
              {offer.estimate ? <> · estimate <span className="font-semibold text-charcoal">{offer.estimate}</span></> : null}.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" onClick={onContinue} disabled={busy} autoFocus
              className="flex items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 text-sm font-bold text-white shadow-warm-sm transition-colors hover:bg-terracotta/90 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Continue my draft
            </button>
            <button type="button" onClick={onStartNew} disabled={busy}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-sand-200 py-3 text-sm font-bold text-charcoal/70 transition-colors hover:border-terracotta/40 hover:text-terracotta disabled:opacity-60">
              <Plus size={16} /> Start a new design
            </button>
            <p className="text-center text-xs leading-snug text-charcoal/50">
              {!offer.hasRender
                ? "Starting new won’t use your free preview. You haven’t generated an image yet."
                : signedIn
                  ? "Your draft stays saved in My Account, so you can come back to it any time."
                  : "Starting new replaces the draft saved on this device."}
            </p>
          </div>

          {signedIn && (
            <Link href="/account#drafts" className="text-center text-xs font-semibold text-charcoal/50 underline underline-offset-2 hover:text-charcoal">
              See all my drafts
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
