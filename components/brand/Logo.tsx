import { cn } from "@/lib/utils";

/**
 * MyHarvestHub brand mark + lockups.
 *
 * The mark is a magenta shopping bag carrying a hand-drawn brush cross,
 * on a brand-purple tile. Wordmarks are rendered as live text so they
 * pick up the design-system tokens in light and dark mode.
 *
 * Static asset versions live in /public/brand (SVG + PNG).
 */

const CROSS_PATHS = [
  "M42 8 Q46 4 49 8 C44 40 36 70 33 99 Q31 101 29 99 C31 70 37 40 42 8 Z",
  "M8 47 Q6 44 10 43 C35 36 65 29 93 23 Q98 23 97 27 Q96 30 92 30 C65 34 37 41 12 49 Q9 50 8 47 Z",
  "M48 23 Q51 21 52 24 C52 32 52 40 51 47 Q50 50 48 47 C48 40 48 32 48 23 Z",
];

export const BRAND_COLORS = {
  purple: "#2B0B4E",
  magenta: "#B81D82",
  violet: "#8E24AA",
} as const;

interface MarkProps {
  size?: number;
  className?: string;
  title?: string;
}

/** Square app-icon mark (bag + brush cross). */
export function LogoMark({ size = 40, className, title = "MyHarvestHub" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("flex-shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill={BRAND_COLORS.purple} />
      <path
        d="M14 24 H50 L47.5 53 Q47 55 45 55 H19 Q17 55 16.5 53 Z"
        fill={BRAND_COLORS.magenta}
      />
      <path
        d="M24 24 V19 A8 8 0 0 1 40 19 V24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinejoin="round"
        transform="translate(18.8 26.6) scale(0.27)"
      >
        {CROSS_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** The brushstroke cross on its own; inherits `currentColor`. */
export function BrandCross({ size = 40, className, title = "Cross" }: MarkProps) {
  return (
    <svg
      width={size}
      height={(size * 102) / 100}
      viewBox="0 0 100 102"
      role="img"
      aria-label={title}
      className={cn("flex-shrink-0", className)}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    >
      {CROSS_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

interface LogoProps {
  /** `horizontal` = mark + MyHarvestHub wordmark; `church` = brush cross + capitals lockup */
  variant?: "horizontal" | "church";
  markSize?: number;
  showTagline?: boolean;
  /** Use on dark/brand-purple backgrounds */
  inverted?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function Logo({
  variant = "horizontal",
  markSize = 40,
  showTagline = false,
  inverted = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  if (variant === "church") {
    return (
      <span className={cn("inline-flex items-end gap-1", className)} aria-label="MyHarvestHub">
        <BrandCross
          size={markSize}
          className={inverted ? "text-white" : "text-ds-brand-deep dark:text-white"}
        />
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-xl font-semibold tracking-[0.12em]",
              inverted ? "text-white" : "text-ds-brand-deep dark:text-white",
              wordmarkClassName
            )}
          >
            MYHARVEST<span className="text-ds-palette-magenta-600 dark:text-ds-palette-magenta-300">HUB</span>
          </span>
          {showTagline ? (
            <span
              className={cn(
                "mt-1 text-[9px] tracking-[0.14em]",
                inverted ? "text-ds-palette-purple-200" : "text-ds-text-secondary"
              )}
            >
              THE FIELD THE LORD HAS BLESSED
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={markSize} title="" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-bold tracking-tight",
            inverted ? "text-white" : "text-ds-brand-deep dark:text-white",
            wordmarkClassName
          )}
        >
          MyHarvest
          <span
            className={
              inverted ? "text-ds-palette-magenta-300" : "text-ds-palette-magenta-600 dark:text-ds-palette-magenta-300"
            }
          >
            Hub
          </span>
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              inverted ? "text-ds-palette-purple-200" : "text-ds-text-secondary"
            )}
          >
            The field the Lord has blessed
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default Logo;
