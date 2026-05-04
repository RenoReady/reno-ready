"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Design",  href: "/builder" },
  { label: "Preview", href: "/preview" },
  { label: "Connect", href: "/connect" },
];

export default function ProgressNav() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.href === pathname);

  return (
    <nav className="flex items-center gap-0" aria-label="Progress">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIndex;
        const isActive  = i === currentIndex;
        const isFuture  = i > currentIndex;

        return (
          <div key={step.href} className="flex items-center">
            {/* Step pill */}
            <Link
              href={step.href}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-tight",
                "transition-all duration-200",
                isActive && "bg-terracotta text-white shadow-warm-sm",
                isDone   && "text-charcoal/70 hover:text-charcoal",
                isFuture && "text-charcoal/35 hover:text-charcoal/70 hover:bg-charcoal/5",
              )}
            >
              {/* Step number / check — hidden on mobile to save space */}
              <span
                className={cn(
                  "hidden sm:flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                  "transition-all duration-200",
                  isActive && "bg-white/20",
                  isDone   && "bg-terracotta/15 text-terracotta",
                  isFuture && "bg-charcoal/10 text-charcoal/30",
                )}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>

              {/* On mobile show a tiny dot for done steps instead */}
              {isDone && (
                <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-terracotta/60 flex-shrink-0" />
              )}

              {step.label}
            </Link>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-3 sm:w-8 h-px mx-0.5 sm:mx-1 rounded-full transition-all duration-300",
                  i < currentIndex ? "bg-terracotta/40" : "bg-charcoal/15",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
