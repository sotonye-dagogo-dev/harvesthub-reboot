"use client";

/**
 * BannerCarousel → re-exported as HeroBanner
 * ─────────────────────────────────────────────────────────────────
 * Dual-section hero carousel designed for the landing page.
 *
 * Layout (≥ md screens):
 *   ┌─────────────────────────────┬────────────────┐
 *   │   Display panel             │  Action panel  │
 *   │   (image + overlay text)    │  (CTA buttons) │
 *   └─────────────────────────────┴────────────────┘
 *
 * Layout (< md / small screens):
 *   ┌──────────────────────────────────────────────┐
 *   │   Full-width image with overlay title        │
 *   │   "Know More" chip → opens action modal      │
 *   └──────────────────────────────────────────────┘
 *
 * Fallback (banner has no actions):
 *   - Large screen: image fills full width with gradient overlay text
 *   - Small screen:  same full image; "Know More" chip is hidden (no modal)
 *
 * All timing, labels, and theme tokens come from BANNER_CONFIG so
 * the component is theme-agnostic and easy to extend.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { BANNER_CONFIG } from "@/lib/constants";

// ─── Public types ─────────────────────────────────────────────────

/** Single call-to-action button config */
export interface BannerActionItem {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  openInNewTab?: boolean;
}

/** One banner item fed into HeroBanner */
export interface BannerItem {
  id: string;
  title: string;
  /** Short tagline shown in the action panel */
  subtitle?: string;
  image: string;
  /** @deprecated use `actions` for full control */
  link?: string;
  description?: string;
  /** Structured CTA list (up to 2 rendered prominently) */
  actions?: BannerActionItem[];
  /** Thematic colour key – drives action-panel styling */
  theme?: "BUSINESS" | "CHURCH" | "EVENT" | "PROMOTION";
  /** Inline CSS colour override for the action panel accent (optional) */
  accentColor?: string;
  /** Extra information (date, address, speaker) shown in action panel */
  details?: string;
  /** Label for the small-screen "know more" chip */
  knowMoreLabel?: string;
}

export interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlay?: boolean;
  /** Auto-advance interval in ms (default: BANNER_CONFIG.HERO_DISPLAY_INTERVAL) */
  interval?: number;
  className?: string;
}

// ─── Theme helpers ────────────────────────────────────────────────

type ThemeKey = "BUSINESS" | "CHURCH" | "EVENT" | "PROMOTION";

interface ThemeTokens {
  actionBg: string;
  actionText: string;
  primaryBtn: string;
  secondaryBtn: string;
  badge: string;
  knowMoreChip: string;
  overlayFrom: string;
}

const THEME_MAP: Record<ThemeKey, ThemeTokens> = {
  BUSINESS: {
    actionBg: "bg-ds-brand-primary-hover ",
    actionText: "text-white",
    primaryBtn:
      "bg-ds-surface-base text-ds-palette-purple-700 hover:bg-ds-brand-surface focus-visible:ring-ds-focus-ring/30",
    secondaryBtn:
      "border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10 focus-visible:ring-white/40",
    badge: "bg-ds-brand-primary-light/20 text-ds-palette-purple-100",
    knowMoreChip:
      "bg-ds-brand-primary/90 text-white hover:bg-ds-brand-primary-hover focus-visible:ring-ds-focus-ring/30",
    overlayFrom: "from-ds-palette-purple-900/80",
  },
  CHURCH: {
    actionBg: "bg-ds-status-warning-text ",
    actionText: "text-white",
    primaryBtn:
      "bg-ds-surface-base text-ds-status-warning-text hover:bg-ds-status-warning-bg focus-visible:ring-ds-status-warning/30",
    secondaryBtn:
      "border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10 focus-visible:ring-white/40",
    badge: "bg-ds-status-warning/20 text-ds-palette-amber-100",
    knowMoreChip:
      "bg-ds-status-warning/90 text-white hover:bg-ds-status-warning-text focus-visible:ring-ds-status-warning/30",
    overlayFrom: "from-ds-palette-amber-900/80",
  },
  EVENT: {
    actionBg: "bg-rose-700 dark:bg-rose-900",
    actionText: "text-white",
    primaryBtn: "bg-ds-surface-base text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-300",
    secondaryBtn:
      "border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10 focus-visible:ring-white/40",
    badge: "bg-rose-500/20 text-rose-100",
    knowMoreChip: "bg-rose-600/90 text-white hover:bg-rose-700 focus-visible:ring-rose-300",
    overlayFrom: "from-rose-900/80",
  },
  PROMOTION: {
    actionBg: "bg-ds-status-success-text ",
    actionText: "text-white",
    primaryBtn:
      "bg-ds-surface-base text-ds-status-success-text hover:bg-ds-status-success-bg focus-visible:ring-ds-status-success/30",
    secondaryBtn:
      "border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10 focus-visible:ring-white/40",
    badge: "bg-ds-status-success/20 text-ds-palette-green-100",
    knowMoreChip:
      "bg-ds-status-success/90 text-white hover:bg-ds-status-success-text focus-visible:ring-ds-status-success/30",
    overlayFrom: "from-ds-palette-green-900/80",
  },
};

function getTheme(key?: string | null): ThemeTokens {
  return THEME_MAP[(key as ThemeKey) ?? "BUSINESS"] ?? THEME_MAP.BUSINESS;
}

// ─── Action button helper ─────────────────────────────────────────

interface ActionBtnProps {
  action: BannerActionItem;
  tokens: ThemeTokens;
  size?: "sm" | "md";
}

function ActionBtn({ action, tokens, size = "md" }: ActionBtnProps) {
  const isSecondary = action.variant === "secondary" || action.variant === "outline";
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-ds-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-sm" : "px-5 py-2.5 text-sm md:text-base";
  const colorClass = isSecondary ? tokens.secondaryBtn : tokens.primaryBtn;

  const inner = (
    <>
      {action.label}
      {action.openInNewTab && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
    </>
  );

  if (action.openInNewTab) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, sizeClass, colorClass)}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={action.href} className={cn(base, sizeClass, colorClass)}>
      {inner}
    </Link>
  );
}

// ─── Action Modal (small-screen) ─────────────────────────────────

interface ActionModalProps {
  banner: BannerItem;
  onClose: () => void;
}

function ActionModal({ banner, onClose }: ActionModalProps) {
  const tokens = getTheme(banner.theme);
  const hasActions = banner.actions && banner.actions.length > 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${banner.title} – details`}
    >
      {/* Sheet */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-t-ds-xl sm:rounded-2xl",
          tokens.actionBg,
          tokens.actionText,
          "p-6 pb-8 shadow-ds-xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-ds-full p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Thumbnail */}
        {banner.image && (
          <div className="relative mb-4 h-40 w-full overflow-hidden rounded-ds-lg">
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          {banner.subtitle && (
            <span
              className={cn(
                "inline-block rounded-ds-full px-2.5 py-0.5 text-xs font-medium",
                tokens.badge
              )}
            >
              {banner.subtitle}
            </span>
          )}
          <h2 className="text-xl font-bold leading-snug">{banner.title}</h2>
          {banner.description && <p className="text-sm opacity-90">{banner.description}</p>}
          {banner.details && (
            <p className="mt-1 flex items-start gap-1.5 text-sm opacity-80">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {banner.details}
            </p>
          )}
        </div>

        {/* CTA buttons */}
        {hasActions && (
          <div className="mt-5 flex flex-col gap-2">
            {banner.actions!.slice(0, 2).map((action, i) => (
              <ActionBtn key={i} action={action} tokens={tokens} size="md" />
            ))}
          </div>
        )}

        {/* Fallback when no actions: show a simple close */}
        {!hasActions && (
          <button
            onClick={onClose}
            className={cn(
              "mt-5 w-full rounded-ds-md py-2.5 text-sm font-semibold transition-colors",
              tokens.primaryBtn
            )}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Action Panel (large-screen sidebar) ─────────────────────────

interface ActionPanelProps {
  banner: BannerItem;
}

function ActionPanel({ banner }: ActionPanelProps) {
  const tokens = getTheme(banner.theme);
  const hasActions = banner.actions && banner.actions.length > 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-center gap-4 p-6 xl:p-8",
        tokens.actionBg,
        tokens.actionText
      )}
      // CSS custom property must be set via inline style (cannot be a Tailwind class)
      style={
        banner.accentColor ? ({ "--accent": banner.accentColor } as React.CSSProperties) : undefined
      }
    >
      {/* Badge / theme label */}
      {banner.subtitle && (
        <span
          className={cn("self-start rounded-ds-full px-3 py-1 text-xs font-semibold", tokens.badge)}
        >
          {banner.subtitle}
        </span>
      )}

      {/* Title */}
      <h2 className="text-2xl font-bold leading-tight xl:text-3xl">{banner.title}</h2>

      {/* Description */}
      {banner.description && (
        <p className="text-sm leading-relaxed opacity-90 xl:text-base">{banner.description}</p>
      )}

      {/* Details line (date / address / info) */}
      {banner.details && (
        <p className="flex items-start gap-1.5 text-xs opacity-75 xl:text-sm">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          {banner.details}
        </p>
      )}

      {/* CTA buttons */}
      {hasActions && (
        <div className="flex flex-col gap-2 pt-1">
          {banner.actions!.slice(0, 2).map((action, i) => (
            <ActionBtn key={i} action={action} tokens={tokens} size="md" />
          ))}
        </div>
      )}

      {/* Fallback (no actions): simple link */}
      {!hasActions && (banner.link ?? null) && (
        <Link
          href={banner.link!}
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline",
            tokens.actionText
          )}
        >
          {BANNER_CONFIG.KNOW_MORE_LABEL} →
        </Link>
      )}
    </div>
  );
}

// ─── Slide ────────────────────────────────────────────────────────

interface SlideProps {
  banner: BannerItem;
  isActive: boolean;
  onKnowMore: () => void;
}

function Slide({ banner, isActive, onKnowMore }: SlideProps) {
  const tokens = getTheme(banner.theme);
  const hasActions = banner.actions && banner.actions.length > 0;
  const knowMoreLabel = banner.knowMoreLabel ?? BANNER_CONFIG.KNOW_MORE_LABEL;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity",
        BANNER_CONFIG.TRANSITION_MS === 400 ? "duration-400" : "duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      )}
      aria-hidden={!isActive ? "true" : "false"}
    >
      {/* ── LARGE SCREEN: dual panel layout ── */}
      <div className="hidden md:flex h-full">
        {/* Display panel */}
        <div className="relative w-[65%] overflow-hidden">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority={isActive}
            sizes="(min-width: 768px) 65vw, 100vw"
          />
          {/* Gradient overlay with title — fallback for no-action banners */}
          <div
            className={cn(
              "absolute inset-0 flex items-end bg-gradient-to-t to-transparent p-6",
              tokens.overlayFrom,
              // When there's an action panel, we still show title for context but lighter
              hasActions ? "from-black/30" : "from-black/70"
            )}
          >
            <div className="text-white">
              <h2 className="text-2xl font-bold drop-shadow-ds-md xl:text-4xl">{banner.title}</h2>
              {!hasActions && banner.description && (
                <p className="mt-1 max-w-lg text-sm text-white/90 xl:text-base">
                  {banner.description}
                </p>
              )}
              {/* Fallback link on large screen when no actions */}
              {!hasActions && (banner.link ?? null) && (
                <Link
                  href={banner.link!}
                  className="mt-3 inline-flex items-center gap-1 rounded-ds-md bg-ds-surface-base/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-ds-surface-base/30"
                >
                  {knowMoreLabel} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Action panel */}
        <div className="flex-shrink-0 w-[35%]">
          <ActionPanel banner={banner} />
        </div>
      </div>

      {/* ── SMALL SCREEN: stacked dual-section — image panel + action strip ── */}
      <div className="flex h-full flex-col md:hidden">
        {/* ▌ Display section – image fills remaining height */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            priority={isActive}
            sizes="100vw"
          />
          {/* Subtle vignette for visual depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* ▌ Action strip – themed colour, fixed height, always visible */}
        <div
          className={cn(
            "flex min-h-[64px] flex-shrink-0 items-center gap-3 px-4 py-2",
            tokens.actionBg,
            tokens.actionText
          )}
        >
          {/* Info block */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-snug">{banner.title}</p>
            {banner.subtitle && <p className="truncate text-xs opacity-75">{banner.subtitle}</p>}
          </div>

          {/* "Know More" CTA — only shown when there is content / actions to reveal;
               suppressed when banner has no actions AND no description/details (fallback). */}
          {(hasActions || banner.description || banner.details) && (
            <button
              onClick={onKnowMore}
              className={cn(
                "flex-shrink-0 whitespace-nowrap rounded-ds-md px-3 py-1.5 text-xs font-semibold",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                tokens.primaryBtn
              )}
              aria-label={`${knowMoreLabel} about ${banner.title}`}
            >
              {knowMoreLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function BannerCarousel({
  banners,
  autoPlay = true,
  interval = BANNER_CONFIG.HERO_DISPLAY_INTERVAL,
  className,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!autoPlay || banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);
  }, [autoPlay, banners.length, interval]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  // Pause rotation when modal is open
  useEffect(() => {
    if (modalOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      startAutoPlay();
    }
  }, [modalOpen, startAutoPlay]);

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex(idx);
      startAutoPlay();
    },
    [startAutoPlay]
  );

  const goToPrev = useCallback(
    () => goTo((currentIndex - 1 + banners.length) % banners.length),
    [currentIndex, banners.length, goTo]
  );

  const goToNext = useCallback(
    () => goTo((currentIndex + 1) % banners.length),
    [currentIndex, banners.length, goTo]
  );

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null;

  return (
    <>
      <div className={cn("relative overflow-hidden rounded-ds-lg", className)}>
        {/*
         * Height breakdown:
         *   < md  → image flex-1 + action-strip min-h-[64px] inside the Slide
         *          280px = ~216px image + 64px strip (mobile)
         *   sm    → 336px = ~272px image + 64px strip (large phone / tablet-portrait)
         *   md+   → dual-panel (no strip) so plain height for the whole card
         */}
        <div className="relative h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[360px]">
          {banners.map((banner, index) => (
            <Slide
              key={banner.id}
              banner={banner}
              isActive={index === currentIndex}
              onKnowMore={() => setModalOpen(true)}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-3 top-[38%] z-20 -translate-y-1/2 rounded-ds-full bg-ds-surface-base/90 p-1.5 text-ds-text-primary shadow-ds-md transition-all hover:bg-ds-surface-base md:top-1/2 /90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-[38%] z-20 -translate-y-1/2 rounded-ds-full bg-ds-surface-base/90 p-1.5 text-ds-text-primary shadow-ds-md transition-all hover:bg-ds-surface-base md:top-1/2 /90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot Indicators
             On small screens the action strip is at the bottom (~64 px), so dots
             are nudged up above it. On md+ the strip is gone → back to bottom-3. */}
        {banners.length > 1 && (
          <div className="absolute bottom-[76px] left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:bottom-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  "h-2 rounded-ds-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  index === currentIndex
                    ? "w-6 bg-ds-surface-base"
                    : "w-2 bg-ds-surface-base/50 hover:bg-ds-surface-base/80"
                )}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Modal (small screens only, triggered by Know More) */}
      {modalOpen && <ActionModal banner={currentBanner} onClose={() => setModalOpen(false)} />}
    </>
  );
}

// Named re-export alias for clarity at call sites
export { BannerCarousel as HeroBanner };
