"use client";

/**
 * TopAdBanner
 * ─────────────────────────────────────────────────────────────────
 * A full-width, non-dismissible ad strip rendered in normal document
 * flow below the navbar. It rotates through all active TOP banners
 * on a configurable interval, supports background images, and keeps
 * the strip image-only without manual navigator controls.
 *
 * Config lives in BANNER_CONFIG so interval / storage-key can be
 * changed from one place without touching this file.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";
import { BANNER_CONFIG } from "@/lib/constants";
import { getTopBannersClient } from "@/lib/data/clientDataFetchers";
import { resolvePrimaryBannerAction } from "@/lib/utils/bannerActions";

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
        const res = await getTopBannersClient();
        const list = Array.isArray(res) ? res : [];
        const activeTops = list
          .filter(
            (b) =>
              b.isActive &&
              b.position === "TOP" &&
              (!b.endDate || new Date(b.endDate) >= new Date()) &&
              typeof b.imageUrl === "string" &&
              b.imageUrl.trim().length > 0
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

  if (banners.length === 0) return null;

  const banner = banners[currentIndex];
  if (!banner) return null;

  const themeClasses = getThemeClasses(banner.theme);
  const primaryAction = resolvePrimaryBannerAction({
    actions: banner.actions,
    linkUrl: banner.linkUrl,
    defaultLabel: "Open promotion",
  });
  const hasImage = !!banner.imageUrl;
  const ariaLabel = (banner.title || "").trim() || "Top advertisement banner";

  // ── Inner strip markup ─────────────────────────────────────────
  const stripContent = (
    <div
      data-testid="top-ad-strip"
      className={cn(
        "relative flex aspect-[64/10] min-h-[28px] max-h-[44px] w-full items-center justify-between gap-1 overflow-hidden px-2 text-xs",
        !hasImage && themeClasses.bg,
        themeClasses.text
      )}
      role="banner"
      aria-label={ariaLabel}
    >
      {/* Background image (when available) */}
      {hasImage && (
        <>
          <Image src={banner.imageUrl} alt="" fill className="object-fill" sizes="100vw" priority />
          <div className="absolute inset-0 bg-black/15" />
        </>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {primaryAction ? (
        primaryAction.openInNewTab || primaryAction.href.startsWith("http") ? (
          <a
            href={primaryAction.href}
            target={primaryAction.openInNewTab ? "_blank" : undefined}
            rel={primaryAction.openInNewTab ? "noopener noreferrer" : undefined}
            className="block transition-opacity hover:opacity-95"
          >
            {stripContent}
          </a>
        ) : (
          <Link href={primaryAction.href} className="block transition-opacity hover:opacity-95">
            {stripContent}
          </Link>
        )
      ) : (
        stripContent
      )}
    </div>
  );
}
