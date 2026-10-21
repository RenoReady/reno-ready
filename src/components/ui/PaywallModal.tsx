"use client";

/**
 * PaywallModal — the upgrade pop-up.
 *
 * Opens when someone runs out of renders or edits, or taps a paid feature
 * (the PDF Pro Report, removing the watermark, 4K export). Shows the
 * 7-Day Project Pass and Pro, and routes through Stripe checkout.
 */

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import PricingPlans from "@/components/ui/PricingPlans";

export type PaywallReason = "limit" | "pass_limit" | "refine" | "report" | "watermark" | "upgrade" | "4k" | "variations" | "share";

const REASON_COPY: Record<PaywallReason, { title: string; body: string }> = {
  limit:      { title: "Unlock Full 2K Designs & Contractor PDF Reports", body: "You’ve used your free preview. Keep designing in full 2K, with no watermark." },
  pass_limit: { title: "Keep going with Reno Ready Pro",                   body: "You’ve used everything in your Project Pass. Pro gives you unlimited renders and edits." },
  refine:     { title: "Unlock more “Not quite right?” edits",   body: "You’ve used your free edit. Every paid plan includes more." },
  report:     { title: "Unlock Full 2K Designs & Contractor PDF Reports", body: "The contractor-ready PDF Pro Report is included with every paid plan." },
  watermark:  { title: "Unlock Full 2K Designs & Contractor PDF Reports", body: "Upgrade to remove the watermark and unlock 2K exports." },
  upgrade:    { title: "Unlock Full 2K Designs & Contractor PDF Reports", body: "Pick the plan that fits your project." },
  "4k":       { title: "4K exports are part of Reno Ready Pro",            body: "Print-quality 4K images for listings, brochures and client presentations." },
  variations: { title: "4 variations per click is part of Reno Ready Pro", body: "See four takes on the same room at once, so you and your clients can compare options." },
  share:      { title: "Client share links are part of Reno Ready Pro",   body: "Send a private before/after page to a client. No account needed to view it." },
};

interface PaywallModalProps {
  onClose: () => void;
  reason?: PaywallReason;
}

export default function PaywallModal({ onClose, reason = "limit" }: PaywallModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = REASON_COPY[reason];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative bg-sand rounded-t-3xl sm:rounded-3xl shadow-warm-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-charcoal px-6 sm:px-8 py-6 flex items-start gap-4 sm:gap-5">
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-terracotta/20 items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={22} className="text-terracotta" />
          </div>
          <div className="flex-1">
            <h2 id="paywall-title" className="text-lg sm:text-xl font-bold text-white">{copy.title}</h2>
            <p className="text-sm text-white/60 mt-1">{copy.body}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-7">
          <PricingPlans compact />
        </div>
      </div>
    </div>
  );
}
