"use client";

import { useEffect, useMemo, useState } from "react";
import type { Banner } from "@/lib/types";
import { trackBannerImpression } from "@/lib/tracking/bannerTracking";
import { dismissAd, isAdDismissed, selectInlineSponsoredBanners } from "@/lib/utils/bannerPlacement";
import { AdStrip } from "@/components/features/ads/AdStrip";
import { cn } from "@/lib/utils";

interface SponsoredAdSlotProps {
  /** All banners the page already loaded; the slot picks sponsored TOP-format adverts itself. */
  banners: Banner[];
  /** Which sponsored advert to show when several share the page (0 = first slot). */
  slotIndex?: number;
  className?: string;
}

/**
 * In-feed "Sponsored" advert between home-page sections. Third-party wide adverts live here
 * instead of above the header, so they stay visible without competing with the brand.
 */
export function SponsoredAdSlot({ banners, slotIndex = 0, className }: SponsoredAdSlotProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Read session dismissals after mount (sessionStorage is client-only).
    setDismissedIds(banners.filter((banner) => isAdDismissed(banner.id)).map((banner) => banner.id));
  }, [banners]);

  const banner = useMemo(() => {
    const candidates = selectInlineSponsoredBanners(banners).filter((entry) => !dismissedIds.includes(entry.id));
    return candidates[slotIndex];
  }, [banners, dismissedIds, slotIndex]);

  useEffect(() => {
    if (banner) trackBannerImpression(banner.id, "sponsored-inline");
  }, [banner]);

  if (!banner) return null;

  return (
    <div className={cn("mb-4", className)}>
      <AdStrip
        banner={banner}
        variant="inline"
        trackingSource="sponsored-inline"
        onDismiss={() => {
          dismissAd(banner.id);
          setDismissedIds((prev) => [...prev, banner.id]);
        }}
      />
    </div>
  );
}

export default SponsoredAdSlot;
