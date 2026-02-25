import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <svg
      className={cn("animate-spin text-ds-brand-primary", sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// ============================================================================
// PAGE LOADER — Full-page centered spinner with optional subtitle
// Replaces: <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>
// ============================================================================

export interface PageLoaderProps {
  /** Optional subtitle text shown below the spinner. */
  message?: string;
  /** Minimum height for the container. @default "min-h-screen" */
  minHeight?: string;
  className?: string;
}

/**
 * `PageLoader` — A full-page or section-level centered loading spinner.
 *
 * @example
 *   // Full-page (default)
 *   <PageLoader message="Loading…" />
 *
 *   // Section-level (e.g. detail page guard)
 *   <PageLoader minHeight="min-h-[400px]" />
 */
export function PageLoader({ message, minHeight = "min-h-screen", className }: PageLoaderProps) {
  return (
    <div className={cn("flex items-center justify-center", minHeight, className)}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-ds-text-tertiary animate-pulse">{message}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION LOADER — Smaller centered spinner for inline/section content
// Replaces: <div className="flex justify-center py-8"><Spin /></div>
// ============================================================================

export interface SectionLoaderProps {
  size?: LoadingSpinnerProps["size"];
  className?: string;
}

/**
 * `SectionLoader` — A centered spinner for use inside content areas.
 *
 * @example
 *   {loading && <SectionLoader />}
 */
export function SectionLoader({ size = "md", className }: SectionLoaderProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <LoadingSpinner size={size} />
    </div>
  );
}

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = "Loading...", className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-ds-md bg-ds-surface-base/80 p-8 backdrop-blur-sm",
        className
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium text-ds-text-secondary">{message}</p>
    </div>
  );
}

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
  const variants = {
    text: "h-4 w-full",
    circular: "h-12 w-12 rounded-full",
    rectangular: "h-4 w-full",
  };

  return (
    <div
      className={cn("animate-pulse rounded-md bg-ds-surface-sunken", variants[variant], className)}
    />
  );
}

export interface CardSkeletonProps {
  lines?: number;
}

export function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-3 rounded-ds-md border border-ds-border-base bg-ds-surface-base p-6">
      <Skeleton className="h-6 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
