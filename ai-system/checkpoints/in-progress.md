# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature (sponsors/ads landing page)
> - last-verified-against-code: 2026-08-04

**Status:** Complete

**Session:** Sponsors & Ads Landing Page

---

## Goal

Build a public-facing, well-designed marketing **landing page** for the sponsors/ads feature so
interested parties can learn about advertising on MyHarvestHub before proceeding to the actual
submission/procurement pages. It must be config-driven and admin-editable (via the existing
`PublicContent` system), and the public/footer ad link should point at this landing page while the
navbar/sidebar banner-management routes (`/operations/banners`, `/operations/ads`) are preserved.

## Outcome

### 1. Route strategy
- Landing page at `/advertise` (`app/advertise/page.tsx`, async server component).
- Full ad-application form moved from `app/advertise/page.tsx` -> `app/advertise/apply/page.tsx`
  (route `/advertise/apply`).
- `/ad-application` (simple public form) unchanged; landing CTAs link to `/advertise/apply` and
  `/ad-application`.
- `/operations/banners` and `/operations/ads` routes/nav/sidebar unchanged.

### 2. Config-driven content (`lib/config/siteContent.ts`)
- Added `advertisingConfig`: metadata, route refs, hero copy, placement cards (TOP/HERO/SIDEBAR w/
  dims + ratio), process steps, policies, FAQ list, CTA labels.

### 3. Admin-editable content
- Added `advertise` preset to `PagePreset[]` in `components/features/PublicContentAdminPanel.tsx`.
- Landing page reads `getPublicContentBySlug("advertise")`; renders admin `body` HTML (prose) when
  `PUBLISHED`, otherwise config fallback.

### 4. Landing page design (`app/advertise/page.tsx`)
- Hero (eyebrow/title/subtitle + CTA to `/advertise/apply`), admin narrative block, placement
  cards, how-it-works steps, policies, FAQ accordion, closing CTA band. Design-token (ds-*) + lucide
  icons + shared `Button`/`Card`/`Badge` patterns.

### 5. Route/link wiring
- `routeConfig.ts`: added `/advertise` and `/advertise/apply` (public); `/advertise` and
  `/ad-application` remain public.
- `navigation.ts`: added `advertiseApply` label key.
- `siteContent.ts`: footer quickLinks changed to `Advertise With Us` -> `/advertise`.
- `sitemap.ts`: added `/advertise` static entry.

### 6. Tests
- Added `app/advertise/__tests__/page.test.tsx` (hero, CTA target, admin body render, fallback,
  sections, quick-application CTA).
- Updated `components/__tests__/Footer.test.tsx` (footer link now `/advertise`).

### 7. Docs / closure
- Updated `task-queue.md`, `session-log.md`, `system-architecture.md`, `project-decisions.md`
  (landing-page decision; `/advertise` is now the public entry point while `/ad-application`
  remains the simple form), then ran `update-ai-system.md`.

## Validation / QA gate
- `npx tsc --noEmit` passed.
- `next lint` touched files passed.
- Focused vitest (advertise landing + footer) passed.
- `npm run build` passed (note pre-existing sitemap warnings).
