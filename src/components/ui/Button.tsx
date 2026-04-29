import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize    = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-terracotta text-white shadow-warm hover:bg-terracotta-600 active:bg-terracotta-700 " +
    "focus-visible:ring-terracotta/40",
  secondary:
    "bg-charcoal text-white shadow-warm hover:bg-charcoal-600 active:bg-charcoal-700 " +
    "focus-visible:ring-charcoal/30",
  outline:
    "bg-transparent border-2 border-charcoal text-charcoal hover:bg-charcoal/5 " +
    "focus-visible:ring-charcoal/20",
  ghost:
    "bg-transparent text-charcoal hover:bg-charcoal/8 " +
    "focus-visible:ring-charcoal/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  "px-4 py-2 text-sm   rounded-xl  gap-1.5",
  md:  "px-6 py-3 text-base rounded-xl  gap-2",
  lg:  "px-8 py-4 text-lg   rounded-2xl gap-2.5",
  xl:  "px-10 py-5 text-xl  rounded-2xl gap-3",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size    = "md",
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-semibold tracking-tight",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-4",
          "disabled:opacity-50 disabled:pointer-events-none",
          "select-none cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
