# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature (sponsors/ads landing page)
> - last-verified-against-code: 2026-08-04

**Status:** Completed

**Session:** Sponsors & Ads Landing Page

---

## Result

Built a public-facing, config-driven sponsors/ads **landing page** at `/advertise` so interested
parties can learn about advertising on MyHarvestHub before proceeding to the submission pages.
Content is config-driven (`advertisingConfig` in `lib/config/siteContent.ts`) and admin-editable via
the `advertise` `PublicContent` preset. The public/footer "Advertise With Us" link points to
`/advertise`, while the navbar/sidebar banner-management routes (`/operations/banners`,
`/operations/ads`) are preserved unchanged.

### Delivered

- **Route strategy:** landing page at `app/advertise/page.tsx`; full submission form moved to
  `app/advertise/apply/page.tsx` (`/advertise/apply`); `/ad-application` kept as quick-apply intake;
  `/operations/banners` and `/operations/ads` unchanged.
- **Config-driven content:** `advertisingConfig` (metadata, routes, hero, placement cards, steps,
  policies, FAQ, CTA) in `lib/config/siteContent.ts`.
- **Admin-editable content:** `advertise` preset added to `PagePreset[]` in
  `components/features/PublicContentAdminPanel.tsx`; page renders PUBLISHED `body` in the narrative
  block with config fallback.
- **Route/link wiring:** `/advertise/apply` added to `lib/rbac/routeConfig.ts`; `advertiseApply`
  label key in `lib/navigation.ts`; footer quick link "Advertise With Us" -> `/advertise`.
- **Tests:** `app/advertise/__tests__/page.test.tsx` (hero + CTA target, placement cards, config
  fallback, admin body render, closing CTA) and updated `components/__tests__/Footer.test.tsx`.
- **Docs closure:** `task-queue.md`, `session-log.md` (Session 87), `system-architecture.md`,
  `project-decisions.md` (superseded `/ad-application` canonical-intake decision), plus
  `update-ai-system.md` sync (repo-map, dependency-graph, dev-history, lessons-learned, metadata
  headers).

### Validation

- Focused vitest (advertise landing + footer): passing (6 tests).
- `npx tsc --noEmit`, `npm run lint` run as part of the QA gate.

## Files Modified

- app/advertise/page.tsx
- app/advertise/apply/page.tsx
- app/advertise/__tests__/page.test.tsx
- components/__tests__/Footer.test.tsx
- components/features/PublicContentAdminPanel.tsx
- lib/config/siteContent.ts
- lib/navigation.ts
- lib/rbac/routeConfig.ts
- ai-system/planning/task-queue.md
- ai-system/planning/project-plan.md
- ai-system/checkpoints/in-progress.md
- ai-system/checkpoints/session-log.md
- ai-system/index/repo-map.md
- ai-system/index/dependency-graph.md
- ai-system/system-architecture.md
- ai-system/memory/project-decisions.md
- ai-system/memory/lessons-learned.md
- ai-system/summaries/dev-history.md
