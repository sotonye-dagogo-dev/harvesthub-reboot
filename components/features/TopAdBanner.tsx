"use client";

/**
 * TopAdBanner — the strip above the header (below it on phones).
 * ─────────────────────────────────────────────────────────────────
 * Shows MyHarvestHub / Harvesters house campaigns. Third-party (sponsored) adverts only
 * appear here when an admin has sold them premium top placement; otherwise they are shown
 * in the in-feed "Sponsored" slot on the home page (see SponsoredAdSlot).
 *
 * Each banner is either an uploaded artwork (IMAGE) or a branded layout built from its
 * text (DESIGNED). Sponsored adverts are labelled and can be hidden for the session.
 * Multiple banners rotate on BANNER_CONFIG.TOP_DISPLAY_INTERVAL.
 * ─────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/types";
import { BANNER_CONFIG } from "@/lib/constants";
import { getTopBannersClient } from "@/lib/data/clientDataFetchers";
import { trackBannerImpression } from "@/lib/tracking/bannerTracking";
import { dismissAd, isAdDismissed, selectTopStripBanners } from "@/lib/utils/bannerPlacement";
import { AdStrip } from "@/components/features/ads/AdStrip";

export function TopAdBanner({ className }: { className?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await getTopBannersClient();
        const list = (Array.isArray(res) ? res : []) as Banner[];
        if (!mounted) return;
        setBanners(selectTopStripBanners(list).filter((banner) => !isAdDismissed(banner.id)));
      } catch {
        if (mounted) setBanners([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const startRotation = useCallback((count: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (count <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, BANNER_CONFIG.TOP_DISPLAY_INTERVAL);
  }, []);

  useEffect(() => {
    startRotation(banners.length);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length, startRotation]);

  const banner = banners.length > 0 ? banners[currentIndex % banners.length] : undefined;

  useEffect(() => {
    if (banner) trackBannerImpression(banner.id, "top");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner?.id]);

  if (!banner) return null;

  const handleDismiss = () => {
    dismissAd(banner.id);
    setBanners((prev) => prev.filter((entry) => entry.id !== banner.id));
    setCurrentIndex(0);
  };

  return (
    <div className={cn("w-full", className)}>
      <AdStrip
        key={banner.id}
        banner={banner}
        variant="top"
        trackingSource="top"
        onDismiss={banner.isSponsored ? handleDismiss : undefined}
      />
    </div>
  );
}
