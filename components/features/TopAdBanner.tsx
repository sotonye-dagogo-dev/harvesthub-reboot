"use client";

/**
 * TopAdBanner
 * ─────────────────────────────────────────────────────────────────
 * A full-width, non-dismissible ad strip rendered in normal document
 * flow below the navbar. It rotates through all active TOP banners
 * on a configurable interval, supports background images, and shows
 * navigation controls when multiple banners are present.
 *
 * Config lives in BANNER_CONFIG so interval / storage-key can be
 * changed from one place without touching this file.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";
import { BANNER_CONFIG } from "@/lib/constants";
import { getBannersClient } from "@/lib/data/clientDataFetchers";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ─── Helpers ──────────────────────────────────────────────────────

interface ThemeClasses {
  bg: string;
  text: string;
  indicator: string;
}

function getThemeClasses(theme: string | null | undefined): ThemeClasses {
  if (theme === "CHURCH")
    return {
      bg: "bg-gradient-to-r from-ds-status-warning-text to-ds-status-warning",
      text: "text-ds-palette-amber-50",
      indicator: "bg-ds-status-warning/50",
    };
  if (theme === "PROMOTION")
    return {
      bg: "bg-gradient-to-r from-ds-status-success-text to-ds-status-success",
      text: "text-ds-palette-green-50",
      indicator: "bg-ds-status-success/50",
    };
  if (theme === "EVENT")
    return {
      bg: "bg-gradient-to-r from-rose-700 to-rose-600",
      text: "text-rose-50",
      indicator: "bg-rose-300",
    };
  // BUSINESS (default)
  return {
    bg: "bg-gradient-to-r from-ds-palette-purple-700 to-ds-brand-primary",
    text: "text-ds-palette-purple-50",
    indicator: "bg-ds-brand-muted",
  };
}

// ─── Component ────────────────────────────────────────────────────

export function TopAdBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load active TOP banners ────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await getBannersClient();
        const list = Array.isArray(res) ? res : [];
        const activeTops = list
          .filter(
            (b) =>
              b.isActive &&
              b.position === "TOP" &&
              (!b.endDate || new Date(b.endDate) >= new Date())
          )
          .sort((a, b) => a.displayOrder - b.displayOrder);
        if (!mounted) return;
        setBanners(activeTops);
      } catch (e) {
        if (!mounted) return;
        setBanners([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
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

  if (banners.length === 0) return null;

  const banner = banners[currentIndex];
  if (!banner) return null;

  const themeClasses = getThemeClasses(banner.theme);
  const primaryAction = banner.actions?.[0];
  const hasLink = primaryAction?.href ?? banner.linkUrl ?? undefined;
  const hasImage = !!banner.imageUrl;

  // ── Inner strip markup ─────────────────────────────────────────
  const stripContent = (
    <div
      className={cn(
        "relative flex h-[72px] w-full items-center justify-between gap-2 overflow-hidden px-3 text-sm sm:h-[84px]",
        !hasImage && themeClasses.bg,
        themeClasses.text
      )}
      role="banner"
      aria-label={banner.title}
    >
      {/* Background image (when available) */}
      {hasImage && (
        <>
          <Image
            src={banner.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}

      {/* Left nav (multi-banner) */}
      {banners.length > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newIdx = (currentIndex - 1 + banners.length) % banners.length;
            goTo(newIdx, banners);
          }}
          className="relative z-10 flex-shrink-0 rounded-ds-xs p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Previous ad"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Message */}
      <p className="relative z-10 flex-1 truncate text-center text-sm font-semibold sm:text-base">
        {banner.title}
      </p>

      {/* Right side: CTA label + nav */}
      <div className="relative z-10 flex flex-shrink-0 items-center gap-1">
        {/* Inline CTA pill */}
        {(primaryAction?.label ?? banner.linkUrl) && (
          <span className="hidden rounded-ds-xs border border-current/40 px-2 py-0.5 text-[11px] font-semibold sm:inline-block">
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
            className="flex-shrink-0 rounded-ds-xs p-0.5 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next ad"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 z-10 flex w-full gap-0.5 px-1 pb-px">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i, banners);
              }}
              className={cn(
                "h-[2px] flex-1 rounded-ds-full transition-all duration-300",
                i === currentIndex
                  ? themeClasses.indicator
                  : "bg-ds-surface-base/30 hover:bg-ds-surface-base/50"
              )}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
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
