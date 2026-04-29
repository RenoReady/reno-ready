"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// ── Text / Email / Tel / etc. ──────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:     string;
  hint?:      string;
  error?:     string;
  leftIcon?:  React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, id, ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-charcoal/80 tracking-tight"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-white/80 px-4 py-3 text-charcoal",
              "placeholder:text-charcoal/30 text-base",
              "transition-all duration-150 outline-none",
              "border-sand-300",
              "focus:border-terracotta focus:ring-2 focus:ring-terracotta/20",
              error && "border-red-400 focus:ring-red-200",
              !!leftIcon && "pl-11",
              className,
            )}
            {...props}
          />
        </div>

        {hint && !error && (
          <p className="text-xs text-charcoal/50">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

// ── Textarea ──────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string;
  hint?:     string;
  error?:    string;
  leftIcon?: React.ReactNode;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-charcoal/80 tracking-tight"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            "w-full rounded-xl border bg-white/80 px-4 py-3 text-charcoal",
            "placeholder:text-charcoal/30 text-base resize-none",
            "transition-all duration-150 outline-none",
            "border-sand-300",
            "focus:border-terracotta focus:ring-2 focus:ring-terracotta/20",
            error && "border-red-400 focus:ring-red-200",
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-charcoal/50">{hint}</p>}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";
