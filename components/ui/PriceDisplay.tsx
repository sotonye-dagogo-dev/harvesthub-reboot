import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ============================================================================
// PRICE DISPLAY — Consistent currency rendering
// ============================================================================

export interface PriceDisplayProps {
  /** The numeric amount to display. */
  amount: number;
  /** Visual size preset. */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Show a strikethrough style (for original prices next to discounted ones). */
  strikethrough?: boolean;
  /** Extra Tailwind / CSS classes. */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<PriceDisplayProps["size"]>, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
};

/**
 * `PriceDisplay` — Renders a formatted Naira price using the canonical
 * `formatCurrency` utility. Replaces inline `₦${x.toLocaleString()}` patterns.
 *
 * @example
 *   <PriceDisplay amount={12500} />              // ₦12,500.00
 *   <PriceDisplay amount={15000} strikethrough /> // ₦15,000.00 (line-through)
 */
export function PriceDisplay({
  amount,
  size = "md",
  strikethrough = false,
  className,
}: PriceDisplayProps) {
  return (
    <span
      className={cn(
        SIZE_CLASSES[size],
        strikethrough ? "text-ds-text-tertiary line-through" : "text-ds-text-primary",
        className
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
}
