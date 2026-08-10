# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature (ads/banners performance tracking + analytics)
> - last-verified-against-code: 2026-08-10

**Status:** Complete — delivered in Session 2026-08-10 (see `session-log.md`).

**Session:** Ad/Banner Performance Tracking & Analytics

---

## Goal

Ensure the performance of ads/banners (views, clicks, conversions) is tracked end-to-end —
accounting for authenticated vs unauthenticated and unique counts — and surfaced in the existing
dashboards/analytics surfaces. Follow existing optimal implementations (denormalized counters on
`Banner`, Redis/IP rate limiting, admin-gated analytics, client fetchers via API routes, focused
vitest suites).

## Plan

### 1. Schema (Prisma)
- Add `BannerEventType` enum (`IMPRESSION | CLICK | CONVERSION`).
- Add `BannerEvent` model (bannerId, type, userId?, visitorId?, source?, metadata?, occurredAt,
  indexed by [bannerId,type,occurredAt], [bannerId,type,visitorId], [bannerId,type,userId]).
- Add `conversionCount` denormalized counter to `Banner` + `events BannerEvent[]` relation.
- Create migration `20260810090000_add_banner_events` + regenerate Prisma client.

### 2. Aggregation helper
- `lib/analytics/bannerAnalytics.ts`: pure, testable aggregation of raw events into per-banner and
  summary metrics (total/unique/auth/anon for impressions, clicks, conversions + CTR/CR).

### 3. Tracking API
- Extend `PATCH /api/banners/[id]` (currently the orphaned click-increment endpoint) into a generic
  event-tracking endpoint: accepts `{ type, visitorId, source, metadata }`, resolves authenticated
  user via `getCurrentUser()` (optional), writes a `BannerEvent`, and increments the matching
  denormalized counter. IP-rate-limited, public (unauthenticated allowed).

### 4. Analytics API
- New `GET /api/admin/analytics/banners` (admin-only): `days`/`bannerId` filters, returns summary +
  per-banner breakdown incl. unique + authenticated/anonymous splits.

### 5. Client tracking
- `lib/tracking/bannerTracking.ts`: stable `visitorId` (localStorage UUID, capability-guarded),
  fire-and-forget beacon/fetch with `sendBeacon`/`keepalive`, per-session impression dedupe.
- Wire into `TopAdBanner`, `BannerCarousel` (hero + modal), `HomeContent` (sidebar rail).

### 6. Dashboards / analytics surfaces
- `app/api/operations/dashboard/route.ts`: admin metric cards for banner impressions/clicks +
  "Ad & Banner Analytics" quick action.
- `AnalyticsFeature.tsx`: admin-only "Banner & Ad Performance" section fed by the new endpoint.
- `lib/data/clientDataFetchers.ts`: `getBannerAnalyticsClient`.

### 7. Tests
- `lib/analytics/__tests__/bannerAnalytics.test.ts`
- `app/api/banners/[id]/__tests__/tracking.route.test.ts`
- `app/api/admin/analytics/banners/__tests__/route.test.ts`
- `lib/tracking/__tests__/bannerTracking.test.ts`
- Component tracking tests (`TopAdBanner.tracking.test.tsx`, `BannerCarousel.tracking.test.tsx`)

### 8. Docs / closure
- Update `task-queue.md`, `session-log.md`, `dev-history.md`, `system-architecture.md`,
  `project-decisions.md`, then run `update-ai-system.md`.

---

## Status Log

- **2026-08-10** — All slices implemented, QA gate green, docs updated. Session complete.

