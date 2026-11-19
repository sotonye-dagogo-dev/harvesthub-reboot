import type { Banner } from "@/lib/types";

/**
 * Placement rules for TOP-format adverts (wide strips):
 *  - House campaigns (not sponsored) → the top strip above the header.
 *  - Sponsored (third-party) adverts → an in-feed "Sponsored" slot on the home page,
 *    unless the admin has sold them premium top placement.
 *  - Sponsored adverts are always labelled and can be dismissed for the session.
 */

type BannerLike = Pick<
  Banner,
  "id" | "isActive" | "position" | "startDate" | "endDate" | "imageUrl" | "title" | "displayOrder"
> &
  Partial<Pick<Banner, "isSponsored" | "displayStyle" | "premiumTopPlacement">>;

export function isBannerLive(banner: BannerLike, now: Date = new Date()): boolean {
  if (!banner.isActive) return false;
  if (banner.startDate && new Date(banner.startDate) > now) return false;
  if (banner.endDate && new Date(banner.endDate) < now) return false;
  return true;
}

/** DESIGNED banners need a title; IMAGE banners need an image. */
export function hasRenderableCreative(banner: BannerLike): boolean {
  if (banner.displayStyle === "DESIGNED") return typeof banner.title === "string" && banner.title.trim().length > 0;
  return typeof banner.imageUrl === "string" && banner.imageUrl.trim().length > 0;
}

function sortByOrder<T extends BannerLike>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function selectTopStripBanners<T extends BannerLike>(list: T[], now: Date = new Date()): T[] {
  return sortByOrder(
    list.filter(
      (banner) =>
        banner.position === "TOP" &&
        isBannerLive(banner, now) &&
        hasRenderableCreative(banner) &&
        (!banner.isSponsored || banner.premiumTopPlacement === true)
    )
  );
}

export function selectInlineSponsoredBanners<T extends BannerLike>(list: T[], now: Date = new Date()): T[] {
  return sortByOrder(
    list.filter(
      (banner) =>
        banner.position === "TOP" &&
        banner.isSponsored === true &&
        banner.premiumTopPlacement !== true &&
        isBannerLive(banner, now) &&
        hasRenderableCreative(banner)
    )
  );
}

// ── Session dismissal (sponsored adverts only) ─────────────────────────────

const DISMISS_KEY = "myharvesthub.ads.dismissed.v1";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(DISMISS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isAdDismissed(bannerId: string): boolean {
  return readDismissed().includes(bannerId);
}

export function dismissAd(bannerId: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = Array.from(new Set([...readDismissed(), bannerId])).slice(-50);
    window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode etc.) — dismissal just won't persist across pages.
  }
}
