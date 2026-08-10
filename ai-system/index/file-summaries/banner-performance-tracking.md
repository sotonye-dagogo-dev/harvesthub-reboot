# Banner Performance Tracking & Analytics (banners/ads)

## Purpose

End-to-end ads/banners performance tracking (impressions, clicks, conversions) with authenticated vs anonymous and unique counts, surfaced in the operations dashboards.

## Key Files

- `prisma/schema.prisma` — `BannerEvent` model + `BannerEventType` enum + `conversionCount` on `Banner`.
- `lib/analytics/bannerAnalytics.ts` — pure aggregation helper (`aggregateBannerAnalytics`, `computeBannerMetrics`, `isBannerEventType`).
- `app/api/banners/[id]/route.ts` — `PATCH|POST` public, IP-rate-limited event-tracking endpoint (`{ type, visitorId, source, metadata }`); best-effort `BannerEvent` insert + denormalized counter increment.
- `app/api/admin/analytics/banners/route.ts` — admin-only `GET` summary + per-banner metrics with `days`/`bannerId` filters.
- `lib/tracking/bannerTracking.ts` — client util: stable localStorage `visitorId`, `navigator.sendBeacon` with keepalive-fetch fallback, per-session impression dedupe.
- `components/features/TopAdBanner.tsx`, `components/features/BannerCarousel.tsx`, `app/components/HomeContent.tsx` — emit tracking events from all banner placements.
- `components/features/AnalyticsFeature.tsx` — admin "Banner & Ad Performance" section fed by `getBannerAnalyticsClient`.

## Contract

- Tracking endpoint is public + IP-rate-limited; authenticated identity resolved server-side from the session cookie.
- Event log insert is best-effort; counter increment is authoritative.
- Client events are fire-and-forget (never block UI/navigation).
- Analytics aggregation is pure and shared between route and tests.

## Tests

- `lib/analytics/__tests__/bannerAnalytics.test.ts`
- `app/api/banners/[id]/__tests__/tracking.route.test.ts`
- `app/api/admin/analytics/banners/__tests__/route.test.ts`
- `lib/tracking/__tests__/bannerTracking.test.ts`
- `components/__tests__/TopAdBanner.tracking.test.tsx`, `components/__tests__/BannerCarousel.tracking.test.tsx`
