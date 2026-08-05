# `app/advertise/page.tsx` + `app/advertise/apply/page.tsx` — Sponsors & Ads Landing Page and Application Form

## Purpose

- `app/advertise/page.tsx` is the public-facing marketing **landing page** at `/advertise`. It explains sponsored banner placements, the application process, policies, and FAQ before interested parties proceed to an actual submission flow.
- `app/advertise/apply/page.tsx` is the full sponsored-application form at `/advertise/apply` (moved from the old `/advertise` single page), handling campaign details, placement, schedule, payment method, and Paystack inline payment.

## Dependencies

- `lib/config/siteContent.ts` — `advertisingConfig` supplies all copy (hero, placements, steps, policies, FAQ, CTA labels, route refs).
- `lib/data/publicContent.ts` — `getPublicContentBySlug("advertise")` supplies admin-editable narrative when `PUBLISHED`.
- `components/features/PublicContentAdminPanel.tsx` — `advertise` preset lets admins manage the narrative block.
- `lib/rbac/routeConfig.ts` — `/advertise` and `/advertise/apply` registered as public routes.
- `components/layout/Footer.tsx` — quick-link "Advertise With Us" points to `/advertise`.

## Contract

- Landing page is an async server component; fallback copy is used when no published admin content exists.
- Admin banner-management routes (`/operations/banners`, `/operations/ads`) and `/ad-application` are intentionally unchanged.
- Design tokens (`ds-*`) and lucide icons only; no raw hex color utilities.

## Tests

- `app/advertise/__tests__/page.test.tsx` — hero + CTA target, config fallback, admin body render, sections, quick-application CTA.
- `components/__tests__/Footer.test.tsx` — asserts footer link points to `/advertise`.
