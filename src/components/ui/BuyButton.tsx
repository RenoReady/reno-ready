"use client";

import { Loader2 } from "lucide-react";
import { type PlanKey } from "@/lib/plans";
import { useCheckout } from "@/lib/useCheckout";
import { cn } from "@/lib/utils";

interface BuyButtonProps {
  plan:     PlanKey;
  label:    string;
  featured?: boolean;
  className?: string;
}

export default function BuyButton({ plan, label, featured, className }: BuyButtonProps) {
  const { start, pendingPlan, error, authModal } = useCheckout(plan);
  const isPending = pendingPlan === plan;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => start(plan)}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl",
          "text-sm font-semibold transition-all duration-200",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          featured
            ? "bg-terracotta text-white shadow-warm-sm hover:bg-terracotta-600"
            : "border-2 border-charcoal/20 text-charcoal/70 hover:border-charcoal/40 hover:bg-charcoal/3",
          className,
        )}
      >
        {isPending && <Loader2 size={15} className="animate-spin" />}
        {label}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      {authModal}
    </div>
  );
}
