"use client";

/**
 * PaywallModal
 *
 * Shown when a free user has used all 3 free generations.
 * Presents the 3 plan options and routes through Stripe checkout.
 */

import { useState } from "react";
import { X, Sparkles, Zap, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/app/actions/stripe";
import { PLANS, type PlanKey } from "@/lib/plans";

interface PaywallModalProps {
  onClose:         () => void;
  generationCount: number;
  freeLimit:       number;
}

export default function PaywallModal({ onClose, generationCount, freeLimit }: PaywallModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handlePlan = async (plan: PlanKey) => {
    try {
      setLoadingPlan(plan);
      const result = await createCheckoutSession(plan);
      if ("error" in result) {
        console.error("[paywall] checkout error:", result.error);
        setLoadingPlan(null);
      } else {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("[paywall] checkout error", err);
      setLoadingPlan(null);
    }
  };

  const plans: { key: PlanKey; badge?: string; badgeColor?: string; featured?: boolean }[] = [
    { key: "dayPass",  badge: "Quickest",  badgeColor: "bg-emerald-500" },
    { key: "monthly",  badge: "Most Popular", featured: true },
    { key: "annual",   badge: "Best Value", badgeColor: "bg-purple-500" },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-warm-xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-charcoal px-8 py-7 flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-terracotta/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={22} className="text-terracotta" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Unlock Unlimited Previews</h2>
            <p className="text-sm text-white/55 mt-1">
              You&apos;ve used <span className="text-terracotta font-bold">{generationCount}</span> of your{" "}
              <span className="font-bold text-white/80">{freeLimit} free</span> AI generations.
              Upgrade to keep designing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {plans.map(({ key, badge, badgeColor, featured }) => {
            const plan      = PLANS[key];
            const isLoading = loadingPlan === key;
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
                {badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap",
                    badgeColor ?? "bg-terracotta",
                  )}>
                    {badge}
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-1">
                    {key === "dayPass" ? "Day Pass" : key === "monthly" ? "Monthly" : "Annual"}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-charcoal">
                      ${plan.amountCents / 100}
                    </span>
                    <span className="text-xs text-charcoal/40 mb-1.5">
                      {key === "dayPass" ? "AUD · 24 hrs" : key === "monthly" ? "AUD/mo" : "AUD/yr"}
                    </span>
                  </div>
                </div>

                <ul className="flex flex-col gap-1.5 flex-1">
                  {(
                    key === "dayPass"
                      ? ["Unlimited renders for 24 hrs", "All materials & styles", "Cost estimates"]
                      : key === "monthly"
                      ? ["Unlimited renders", "Ultra HD previews", "Priority queue", "Email support"]
                      : ["Full year access", "Everything in Monthly", "Best per-preview value"]
                  ).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-charcoal/70">
                      <Check size={12} className="text-terracotta mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlan(key)}
                  disabled={!!loadingPlan}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                    "flex items-center justify-center gap-2",
                    featured
                      ? "bg-terracotta text-white hover:bg-terracotta/90 shadow-warm-sm"
                      : "bg-charcoal text-white hover:bg-charcoal/80",
                    !!loadingPlan && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                  ) : (
                    <><Zap size={14} /> Get Access</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-charcoal/35 pb-5">
          Secure checkout via Stripe · Cancel anytime · 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}
