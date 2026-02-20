"use client";

/**
 * TopAdBanner
 * ─────────────────────────────────────────────────────────────────
 * A fixed, full-width strip pinned to the very top of the viewport
 * (above the main navigation). It rotates through all active TOP
 * banners on a configurable interval (default: 5 s) and is
 * individually dismissible per banner session.
 *
 * Config lives in BANNER_CONFIG so interval / storage-key can be
 * changed from one place without touching this file.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BANNER_CONFIG } from "@/lib/constants";
import { mockBanners } from "@/lib/data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────

interface ThemeClasses {
  bg: string;
  text: string;
  indicator: string;
}

function getThemeClasses(theme: string | null | undefined): ThemeClasses {
  // Use explicit conditionals instead of Record lookup to keep TypeScript happy
  // (strict noUncheckedIndexedAccess makes Record<string, T>[key] return T | undefined)
  if (theme === "CHURCH")
    return {
      bg: "bg-gradient-to-r from-amber-700 to-amber-600",
      text: "text-amber-50",
      indicator: "bg-amber-300",
    };
  if (theme === "PROMOTION")
    return {
      bg: "bg-gradient-to-r from-emerald-700 to-emerald-600",
      text: "text-emerald-50",
      indicator: "bg-emerald-300",
    };
  if (theme === "EVENT")
    return {
      bg: "bg-gradient-to-r from-rose-700 to-rose-600",
      text: "text-rose-50",
      indicator: "bg-rose-300",
    };
  // BUSINESS (default)
  return {
    bg: "bg-gradient-to-r from-purple-700 to-purple-600",
    text: "text-purple-50",
    indicator: "bg-purple-300",
  };
}

// ─── Component ────────────────────────────────────────────────────

export function TopAdBanner() {
  const [banners, setBanners] = useState<(typeof mockBanners)[number][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load banners & persisted dismissals ───────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(BANNER_CONFIG.DISMISS_STORAGE_KEY);
    const dismissedIds: string[] = stored ? JSON.parse(stored) : [];
    const dismissedSet = new Set<string>(dismissedIds);
    setDismissed(dismissedSet);

    const activeTops = mockBanners
      .filter(
        (b) =>
          b.isActive &&
          b.position === "TOP" &&
          !dismissedSet.has(b.id) &&
          (!b.endDate || new Date(b.endDate) >= new Date())
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);

    setBanners(activeTops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-rotation ──────────────────────────────────────────────
  const startRotation = useCallback((list: typeof banners) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (list.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, BANNER_CONFIG.TOP_DISPLAY_INTERVAL);
  }, []);

  useEffect(() => {
    startRotation(banners);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners, startRotation]);

  // ── Manual navigation (restarts timer) ────────────────────────
  const goTo = useCallback(
    (idx: number, list: typeof banners) => {
      setCurrentIndex(idx);
      startRotation(list);
    },
    [startRotation]
  );

  // ── Dismiss current banner ─────────────────────────────────────
  const dismissCurrent = useCallback(() => {
    const current = banners[currentIndex];
    if (!current) return;

    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(current.id);
      localStorage.setItem(BANNER_CONFIG.DISMISS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });

    setBanners((prev) => {
      const next = prev.filter((b) => b.id !== current.id);
      const newIdx = Math.min(currentIndex, Math.max(0, next.length - 1));
      setCurrentIndex(newIdx);
      startRotation(next);
      return next;
    });
  }, [banners, currentIndex, startRotation]);

  // ── Dismiss entire strip ───────────────────────────────────────
  const dismissAll = useCallback(() => setVisible(false), []);

  if (!visible || banners.length === 0) return null;

  const banner = banners[currentIndex];
  if (!banner) return null;

  const theme = getThemeClasses(banner.theme);
  const primaryAction = banner.actions?.[0];
  const hasLink = primaryAction?.href ?? banner.linkUrl ?? undefined;

  // ── Inner strip markup ─────────────────────────────────────────
  const stripContent = (
    <div
      className={cn(
        "relative flex min-h-[40px] w-full items-center justify-between gap-2 px-3 py-2 text-sm",
        theme.bg,
        theme.text
      )}
      role="banner"
      aria-label={banner.title}
    >
      {/* Left nav (multi-banner) */}
      {banners.length > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newIdx = (currentIndex - 1 + banners.length) % banners.length;
            goTo(newIdx, banners);
          }}
          className="flex-shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Previous ad"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Message */}
      <p className="flex-1 truncate text-center text-xs font-medium sm:text-sm">{banner.title}</p>

      {/* Right side: CTA label + nav + close */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {/* Inline CTA pill */}
        {(primaryAction?.label ?? banner.linkUrl) && (
          <span className="hidden rounded border border-current/40 px-2 py-0.5 text-[11px] font-semibold sm:inline-block">
            {primaryAction?.label ?? BANNER_CONFIG.DEFAULT_CTA_LABEL} →
          </span>
        )}

        {/* Right nav */}
        {banners.length > 1 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newIdx = (currentIndex + 1) % banners.length;
              goTo(newIdx, banners);
            }}
            className="flex-shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next ad"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (banners.length === 1) { dismissAll(); } else { dismissCurrent(); }
          }}
          className="ml-1 rounded p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 flex w-full gap-0.5 px-1 pb-px">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i, banners);
              }}
              className={cn(
                "h-[2px] flex-1 rounded-full transition-all duration-300",
                i === currentIndex ? theme.indicator : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed left-0 right-0 top-0 z-[100]">
      {hasLink ? (
        <Link href={hasLink} className="block transition-opacity hover:opacity-95">
          {stripContent}
        </Link>
      ) : (
        stripContent
      )}
    </div>
  );
}
