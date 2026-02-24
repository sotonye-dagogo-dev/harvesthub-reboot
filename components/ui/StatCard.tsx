import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";

// ============================================================================
// STAT CARD — Reusable dashboard metric card
//
// Two layout variants:
//   "prominent"  — large icon on the right, tinted card background (admin/vendor dashboard)
//   "compact"    — small icon in a circle on the left, neutral card background (analytics)
// ============================================================================

/** Pre-defined semantic colour presets for stat cards. */
export type StatColorPreset =
  | "brand"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "rating"
  | "pink";

interface PresetClasses {
  text: string;
  bg: string;
}

const COLOR_PRESETS: Record<StatColorPreset, PresetClasses> = {
  brand: {
    text: "text-ds-text-brand",
    bg: "bg-ds-brand-surface dark:bg-ds-brand-subtle",
  },
  success: {
    text: "text-ds-status-success-text",
    bg: "bg-ds-status-success-bg dark:bg-ds-status-success-bg/20",
  },
  info: {
    text: "text-ds-status-info-text",
    bg: "bg-ds-status-info-bg dark:bg-ds-status-info-bg/20",
  },
  warning: {
    text: "text-ds-status-warning-text",
    bg: "bg-ds-status-warning-bg dark:bg-ds-status-warning-bg/20",
  },
  error: {
    text: "text-ds-status-error-text",
    bg: "bg-ds-status-error-bg dark:bg-ds-status-error-bg/20",
  },
  rating: {
    text: "text-ds-status-warning-text dark:text-ds-rating-fill",
    bg: "bg-ds-status-warning-bg dark:bg-ds-status-warning-bg/20",
  },
  pink: {
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
  },
};

export interface StatCardProps {
  /** The metric label (e.g. "Total Revenue"). */
  title: string;
  /** The formatted metric value (e.g. "₦12,500" or "42"). */
  value: string;
  /** A Lucide icon component. */
  icon: LucideIcon;
  /**
   * Colour preset name, or a custom `{ text, bg }` pair.
   * Preset names: brand · success · info · warning · error · rating · pink
   */
  colorPreset: StatColorPreset | PresetClasses;
  /**
   * Layout variant:
   * - `"prominent"` — coloured card background, large icon right (default)
   * - `"compact"`   — neutral card, small icon in coloured circle left
   */
  variant?: "prominent" | "compact";
  /** Extra class names on the outer Card. */
  className?: string;
}

/**
 * Resolve a preset name or custom object to `{ text, bg }` classes.
 */
function resolveColor(input: StatColorPreset | PresetClasses): PresetClasses {
  if (typeof input === "string") {
    return COLOR_PRESETS[input];
  }
  return input;
}

/**
 * `StatCard` — A reusable stat/metric card for dashboards.
 *
 * @example
 *   // Prominent variant (admin dashboard)
 *   <StatCard
 *     title="Total Users"
 *     value="128"
 *     icon={Users}
 *     colorPreset="brand"
 *   />
 *
 *   // Compact variant (analytics)
 *   <StatCard
 *     title="Total Revenue"
 *     value="₦1,250,000"
 *     icon={TrendingUp}
 *     colorPreset="success"
 *     variant="compact"
 *   />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  colorPreset,
  variant = "prominent",
  className,
}: StatCardProps) {
  const { text, bg } = resolveColor(colorPreset);

  if (variant === "compact") {
    return (
      <Card className={className}>
        <div className="flex items-center gap-4">
          <div className={cn("rounded-full p-3", bg)}>
            <Icon className={cn("h-6 w-6", text)} />
          </div>
          <div>
            <div className="text-sm text-ds-text-secondary">{title}</div>
            <div className="text-2xl font-bold text-ds-text-primary">{value}</div>
          </div>
        </div>
      </Card>
    );
  }

  // Default: "prominent" variant
  return (
    <Card className={cn(bg, className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ds-text-secondary">{title}</p>
          <p className={cn("mt-2 text-3xl font-bold", text)}>{value}</p>
        </div>
        <Icon className={cn("h-12 w-12", text)} />
      </div>
    </Card>
  );
}
