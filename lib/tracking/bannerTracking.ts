/**
 * Client-side banner/ad event tracking.
 *
 * Records IMPRESSION / CLICK / CONVERSION events against a banner via the
 * public tracking endpoint (`PATCH|POST /api/banners/[id]`). Events are
 * fire-and-forget (beacon when available, keepalive fetch otherwise) so they
 * never block user interactions or navigation.
 *
 * Identity:
 *  - A stable per-browser `visitorId` is persisted in localStorage so unique
 *    counts can be derived for unauthenticated visitors.
 *  - Authenticated users are resolved server-side via the session cookie; the
 *    client does not need to know the user id.
 */
const VISITOR_ID_KEY = "myharvesthub.visitor.v1";

export type BannerTrackingSource =
  | "top"
  | "hero"
  | "hero-modal"
  | "sidebar"
  | "sidebar-modal";

export type TrackedBannerEvent = "IMPRESSION" | "CLICK" | "CONVERSION";

const TRACKING_URL = (bannerId: string) => `/api/banners/${bannerId}`;

/** In-memory dedupe so a rotating rail counts one impression per banner/session. */
const seenImpressions = new Set<string>();

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return null;
    const storage = window.localStorage;
    if (typeof storage.getItem !== "function" || typeof storage.setItem !== "function") return null;
    const probe = "__hh_tracking_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function generateVisitorId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to timestamp-based id
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getVisitorId(): string {
  const storage = safeStorage();
  if (!storage) return "";
  try {
    const existing = storage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = generateVisitorId();
    storage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

function sendEvent(bannerId: string, type: TrackedBannerEvent, source?: string) {
  if (!bannerId) return;
  const visitorId = getVisitorId();
  const payload = JSON.stringify({ type, visitorId, source });

  // Beacon is the most reliable at navigation/unload time.
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(TRACKING_URL(bannerId), blob);
      if (sent) return;
    }
  } catch {
    // fall through to fetch
  }

  // Keepalive fetch fallback (PATCH method, survives unload).
  try {
    void fetch(TRACKING_URL(bannerId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* ignore tracking errors */
  }
}

/**
 * Records an IMPRESSION (a banner was shown to the visitor). Deduplicated per
 * banner + session so auto-rotating carousels do not inflate view counts.
 */
export function trackBannerImpression(bannerId: string, source?: BannerTrackingSource) {
  if (!bannerId) return;
  const dedupeKey = `${bannerId}:${source ?? "default"}`;
  if (seenImpressions.has(dedupeKey)) return;
  seenImpressions.add(dedupeKey);
  sendEvent(bannerId, "IMPRESSION", source);
}

/**
 * Records a CLICK (and, when `conversion` is true, a CONVERSION) on a banner.
 * A click that navigates to the banner destination counts as a conversion.
 */
export function trackBannerClick(
  bannerId: string,
  source?: BannerTrackingSource,
  options?: { conversion?: boolean }
) {
  if (!bannerId) return;
  sendEvent(bannerId, "CLICK", source);
  if (options?.conversion) {
    sendEvent(bannerId, "CONVERSION", source);
  }
}

/** Records a standalone CONVERSION (e.g. a modal CTA that reached the destination). */
export function trackBannerConversion(bannerId: string, source?: BannerTrackingSource) {
  if (!bannerId) return;
  sendEvent(bannerId, "CONVERSION", source);
}
