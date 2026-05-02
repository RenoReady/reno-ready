"use client";

/**
 * HygieneAdvisoryModal
 *
 * Shown when a user indicates this is their only bathroom (bathroomCount === 1).
 * Surfaces the "mobile ensuite" pro-tip so they plan toilet/shower access
 * during the 2-4 week construction window.
 */

import { X, ShowerHead, CheckCircle2, ArrowRight } from "lucide-react";

interface HygieneAdvisoryModalProps {
  onDismiss: () => void;
}

export default function HygieneAdvisoryModal({ onDismiss }: HygieneAdvisoryModalProps) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="relative bg-white rounded-3xl shadow-warm-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Amber header stripe ── */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShowerHead size={20} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Pro Tip · Single Bathroom</p>
            <h2 className="text-base font-bold text-amber-900 leading-snug">
              Have you planned your hygiene access during the build?
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Body copy */}
          <p className="text-sm text-charcoal/70 leading-relaxed">
            Since this is your only bathroom, most of our clients use a{" "}
            <strong className="text-charcoal">Mobile Ensuite</strong> — a self-contained trailer
            with shower and toilet — to maintain hygiene during the 2–4 week construction window.
          </p>

          {/* Checklist */}
          <div className="flex flex-col gap-2.5">
            {[
              "Arrange a mobile ensuite hire (typically $150–$300/week) before build starts",
              "Confirm with your builder which days access is completely cut off",
              "Check neighbours or a nearby gym/pool as a backup shower option",
              "Block this out in your project timeline — don't assume quick access",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={12} className="text-amber-600" strokeWidth={2.5} />
                </div>
                <p className="text-xs text-charcoal/70 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Mobile ensuite info banner */}
          <div className="rounded-2xl bg-charcoal/4 border border-charcoal/8 px-4 py-3.5">
            <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-wider mb-1">Typical Cost to Budget</p>
            <p className="text-sm font-semibold text-charcoal">
              $150 – $300 <span className="text-charcoal/40 font-normal text-xs">/ week · mobile ensuite hire (SE QLD avg.)</span>
            </p>
            <p className="text-[11px] text-charcoal/40 mt-1 leading-snug">
              Most bathroom renos run 2–3 weeks on-site. Factor this into your full project budget.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-charcoal text-white text-sm font-bold hover:bg-charcoal/90 transition-all"
          >
            Got it — I&apos;ve got access sorted <ArrowRight size={15} />
          </button>

          <p className="text-center text-[10px] text-charcoal/30 -mt-2">
            This tip is added to your project brief · Discuss with your builder at quoting stage
          </p>
        </div>
      </div>
    </div>
  );
}
