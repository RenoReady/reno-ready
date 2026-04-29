import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `elevated` adds a stronger shadow; `flat` uses border only; `ghost` is borderless */
  variant?: "default" | "elevated" | "flat" | "ghost";
  padding?:  "none" | "sm" | "md" | "lg";
}

const variantClasses = {
  default:  "bg-sand-50 border border-sand-200 shadow-warm-sm",
  elevated: "bg-sand-50 shadow-warm-lg",
  flat:     "bg-sand-50 border border-sand-300",
  ghost:    "bg-transparent",
};

const paddingClasses = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";
export default Card;
