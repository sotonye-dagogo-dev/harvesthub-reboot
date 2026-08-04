# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature (sponsors/ads landing page)
> - last-verified-against-code: 2026-08-04

**Status:** In Progress

**Session:** Sponsors & Ads Landing Page

---

## Goal

Build a public-facing, well-designed marketing **landing page** for the sponsors/ads feature so
interested parties can learn about advertising on MyHarvestHub before proceeding to the actual
submission/procurement pages. It must be config-driven and admin-editable (via the existing
`PublicContent` system), and the public/footer ad link should point at this landing page while the
navbar/sidebar banner-management routes (`/operations/banners`, `/operations/ads`) are preserved.

## Plan

### 1. Route strategy
- **Landing page at `/advertise`** (async Server Component, `app/advertise/page.tsx`).
- Move the existing full ad-application form from `app/advertise/page.tsx` ->
  `app/advertise/apply/page.tsx` (route `/advertise/apply`).
- Keep `/ad-application` (simple public form) unchanged; landing CTAs link to `/advertise/apply`
  and `/ad-application`.
- Keep `/operations/banners` and `/operations/ads` routes/nav/sidebar unchanged.

### 2. Config-driven content (`lib/config/siteContent.ts`)
- Add `advertisingConfig`: metadata (title/description), route refs, hero copy, placement cards
  (TOP/HERO/SIDEBAR w/ dims + ratio), process steps, policies, FAQ list, CTA labels.

### 3. Admin-editable content
- Add an `advertise` preset to `PagePreset[]` in
  `components/features/PublicContentAdminPanel.tsx`.
- Landing page reads `getPublicContentBySlug("advertise")`; renders admin `body` HTML in the
  narrative block (dangerouslySetInnerHTML + prose) when PUBLISHED, otherwise config fallback.

### 4. Landing page design (`app/advertise/page.tsx`)
- Hero (eyebrow/title/subtitle + CTA to `/advertise/apply`), admin narrative block, placement
  cards, how-it-works steps, policies, FAQ accordion, closing CTA band. Design-token (ds-*) +
  lucide icons + shared `Button`/`Card`/`Badge`.

### 5. Route/link wiring
- `routeConfig.ts`: add `/advertise/apply` (public); keep `/advertise`, `/ad-application` public.
- `navigation.ts`: add `advertiseApply` label key (if surfaced).
- `siteContent.ts`: change footer quickLinks `Apply to Advertise` -> `Advertise With Us` pointing to
  `/advertise`.

### 6. Tests
- New `app/advertise/__tests__/page.test.tsx` (hero, CTA target, admin body render, fallback).
- Update `components/__tests__/Footer.test.tsx` (footer link now `/advertise`).

### 7. Docs / closure
- Update `task-queue.md`, `session-log.md`, `system-architecture.md`, `project-decisions.md`
  (supersede `/ad-application` canonical-intake decision), then run `update-ai-system.md`
  (repo-map, dependency-graph, dev-history, metadata headers).

## Validation / QA gate
- `npx tsc --noEmit`, `npm run lint`, focused vitest (advertise landing + footer).
- `npm run build` (note pre-existing sitemap warnings).