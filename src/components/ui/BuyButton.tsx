"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/app/actions/stripe";
import { type PlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface BuyButtonProps {
  plan:     PlanKey;
  label:    string;
  featured?: boolean;
  className?: string;
}

export default function BuyButton({ plan, label, featured, className }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createCheckoutSession(plan);
        if ("error" in result) {
          setError(result.error);
        } else {
          window.location.href = result.url;
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
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
    </div>
  );
}
