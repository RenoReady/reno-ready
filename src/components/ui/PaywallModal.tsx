"use client";

/**
 * PaywallModal — the upgrade pop-up.
 *
 * Opens when a free user has used their free preview, or taps a paid
 * feature ("Not quite right?" edits, the PDF Pro Report, removing the
 * watermark). Shows the two plans and routes through Stripe checkout.
 */

import { useEffect } from "react";
import { X, Sparkles, Zap, Check, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_COPY, type PlanKey } from "@/lib/plans";
import { useCheckout } from "@/lib/useCheckout";

export type PaywallReason = "limit" | "refine" | "report" | "watermark";

const REASON_COPY: Record<PaywallReason, string> = {
  limit:     "You’ve used your free preview. Upgrade to keep designing in full 2K.",
  refine:    "“Not quite right?” edits are included with every paid plan.",
  report:    "The contractor-ready PDF Pro Report is included with every paid plan.",
  watermark: "Upgrade to remove the watermark and unlock 2K exports.",
};

interface PaywallModalProps {
  onClose: () => void;
  reason?: PaywallReason;
}

const PLAN_ORDER: PlanKey[] = ["projectPass", "proMonthly"];

export default function PaywallModal({ onClose, reason = "limit" }: PaywallModalProps) {
  const { start, pendingPlan, error, authModal } = useCheckout();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-warm-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-charcoal px-6 sm:px-8 py-6 sm:py-7 flex items-start gap-4 sm:gap-5">
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-terracotta/20 items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={22} className="text-terracotta" />
          </div>
          <div className="flex-1">
            <h2 id="paywall-title" className="text-lg sm:text-xl font-bold text-white">
              Unlock Full 2K Designs &amp; Contractor PDF Reports
            </h2>
            <p className="text-sm text-white/60 mt-1">{REASON_COPY[reason]}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plans */}
        <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4 pt-7">
          {PLAN_ORDER.map((key) => {
            const plan      = PLAN_COPY[key];
            const featured  = key === "proMonthly";
            const isLoading = pendingPlan === key;
            return (
              <div
                key={key}
                className={cn(
                  "relative flex flex-col gap-4 p-5 rounded-2xl border-2 transition-all duration-200",
                  featured
                    ? "border-terracotta bg-terracotta/4 shadow-warm"
                    : "border-sand-200 bg-sand-50 hover:border-terracotta/40 hover:shadow-warm-sm",
                )}
              >
                <div className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap",
                  featured ? "bg-terracotta" : "bg-charcoal",
                )}>
                  {plan.badge}
                </div>

                <div>
                  <p className="text-[11px] font-bold text-charcoal/50 uppercase tracking-widest mb-1">{plan.title}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-charcoal">{plan.price}</span>
                    <span className="text-xs text-charcoal/45 mb-1.5">{plan.period}</span>
                  </div>
                  <p className="text-xs text-charcoal/55 mt-0.5">{plan.sub}</p>
                </div>

                <ul className="flex flex-col gap-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-charcoal/70">
                      <Check size={12} className="text-terracotta mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => start(key)}
                    disabled={!!pendingPlan}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                      "flex items-center justify-center gap-2",
                      featured
                        ? "bg-terracotta text-white hover:bg-terracotta/90 shadow-warm-sm"
                        : "bg-charcoal text-white hover:bg-charcoal/80",
                      !!pendingPlan && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    {isLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                      : <><Zap size={14} /> {plan.cta}</>}
                  </button>
                  {plan.note && <p className="text-[10px] leading-snug text-charcoal/45 text-center">{plan.note}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-xs text-red-500 text-center -mt-2 pb-3 px-6">{error}</p>}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-charcoal/55 px-6 pb-5">
          <BadgeCheck size={14} className="text-terracotta/70 flex-shrink-0" />
          No contracts, cancel anytime in 1-click · Secure checkout via Stripe
        </p>
      </div>
    </div>
    {authModal}
    </>
  );
}
