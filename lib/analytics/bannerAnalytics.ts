/**
 * Banner performance analytics aggregation.
 *
 * Pure, framework-agnostic helpers that convert raw `BannerEvent` rows into
 * per-banner and summary metrics. Kept side-effect free so it can be unit
 * tested deterministically and shared by the admin analytics API route.
 */

export const BANNER_EVENT_TYPES = ["IMPRESSION", "CLICK", "CONVERSION"] as const;
export type BannerEventKind = (typeof BANNER_EVENT_TYPES)[number];

export interface BannerAnalyticsEvent {
  bannerId: string;
  type: BannerEventKind;
  userId: string | null;
  visitorId: string | null;
  occurredAt?: Date | string | null;
}

export interface BannerMetrics {
  impressions: number;
  uniqueImpressions: number;
  authenticatedImpressions: number;
  anonymousImpressions: number;
  clicks: number;
  uniqueClicks: number;
  authenticatedClicks: number;
  anonymousClicks: number;
  conversions: number;
  uniqueConversions: number;
  authenticatedConversions: number;
  anonymousConversions: number;
  /** clicks / impressions (0..1, NaN-safe) */
  clickThroughRate: number;
  /** conversions / clicks (0..1, NaN-safe) */
  conversionRate: number;
}

export interface BannerAnalyticsRow extends BannerMetrics {
  bannerId: string;
}

export interface BannerAnalyticsAggregate {
  summary: BannerMetrics;
  byBanner: BannerAnalyticsRow[];
}

export function isBannerEventType(value: string | null | undefined): value is BannerEventKind {
  return !!value && (BANNER_EVENT_TYPES as readonly string[]).includes(value);
}

function safeRate(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / denominator;
}

function eventIdentity(event: BannerAnalyticsEvent, index: number): string {
  return event.userId ?? event.visitorId ?? `__unidentified__${index}`;
}

/**
 * Computes total / unique / authenticated / anonymous counts for one event
 * type across a list of events.
 */
function countEventKind(events: BannerAnalyticsEvent[], kind: BannerEventKind): {
  total: number;
  unique: number;
  authenticated: number;
  anonymous: number;
} {
  const seen = new Set<string>();
  let total = 0;
  let authenticated = 0;
  let anonymous = 0;

  events.forEach((event, index) => {
    if (event.type !== kind) return;
    total += 1;

    const identity = eventIdentity(event, index);
    if (!seen.has(identity)) {
      seen.add(identity);
    }

    if (event.userId) {
      authenticated += 1;
    } else {
      anonymous += 1;
    }
  });

  return {
    total,
    unique: seen.size,
    authenticated,
    anonymous,
  };
}

export function computeBannerMetrics(events: BannerAnalyticsEvent[]): BannerMetrics {
  const impressions = countEventKind(events, "IMPRESSION");
  const clicks = countEventKind(events, "CLICK");
  const conversions = countEventKind(events, "CONVERSION");

  return {
    impressions: impressions.total,
    uniqueImpressions: impressions.unique,
    authenticatedImpressions: impressions.authenticated,
    anonymousImpressions: impressions.anonymous,
    clicks: clicks.total,
    uniqueClicks: clicks.unique,
    authenticatedClicks: clicks.authenticated,
    anonymousClicks: clicks.anonymous,
    conversions: conversions.total,
    uniqueConversions: conversions.unique,
    authenticatedConversions: conversions.authenticated,
    anonymousConversions: conversions.anonymous,
    clickThroughRate: safeRate(clicks.total, impressions.total),
    conversionRate: safeRate(conversions.total, clicks.total),
  };
}

export function aggregateBannerAnalytics(events: BannerAnalyticsEvent[]): BannerAnalyticsAggregate {
  const grouped = new Map<string, BannerAnalyticsEvent[]>();

  events.forEach((event) => {
    const bucket = grouped.get(event.bannerId) ?? [];
    bucket.push(event);
    grouped.set(event.bannerId, bucket);
  });

  const byBanner: BannerAnalyticsRow[] = Array.from(grouped.entries()).map(([bannerId, rows]) => ({
    bannerId,
    ...computeBannerMetrics(rows),
  }));

  return {
    summary: computeBannerMetrics(events),
    byBanner,
  };
}
