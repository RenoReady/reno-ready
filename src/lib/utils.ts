/**
 * Lightweight classname utility — joins truthy class strings.
 * Avoids a `clsx` dependency for simple use cases.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a number as AUD currency, no cents */
export function formatAUD(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style:                 "currency",
    currency:              "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
