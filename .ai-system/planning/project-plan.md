# Project Plan

> **Overview:** A phased roadmap for MyHarvestHub that guides work from foundational infrastructure through core product functionality to launch readiness. Update as progress is made.

---

## Phase 1 — Foundation (In Progress)

> **Section summary:** Core infrastructure and platform scaffolding that enables all features.

- [x] Establish Next.js App Router with route group conventions
- [x] Adopt strict TypeScript settings and global types (`lib/types.ts`)
- [x] Configure Tailwind + Ant Design theme with purple brand palette
- [x] Build mock backend layer (`lib/data/mockData.ts`, `lib/data/database.ts`)
- [x] Implement JWT auth + httpOnly cookie flow via API routes
- [x] Establish role-based layout routing (buyer, vendor, admin)
- [x] Create core UI component library (`components/ui/`) and feature scaffolds (`components/features/`)
- [x] Add starter test setup with Vitest
- [x] Solidify CI/Dev workflow (lint, build, test scripts)
- [ ] Consolidate role-based pages into single-page-per-feature (remove /buyer, /vendor, /admin page duplication)
- [ ] Build dynamic role-aware routing provider and config-driven page rendering service
- [ ] Migrate API route permissions to policy-driven router middleware
- [x] Standardize ad-related API handlers with shared response envelope + validation
- [x] Replace ad-media URL fields with upload-driven flow and offline draft/queue resilience
- [x] De-duplicate admin/vendor shell layout via a shared role dashboard container

---

## Phase 2 — Core Features

> **Section summary:** Key product functionality needed for a minimum viable marketplace.

- [ ] Buyer product browsing, filtering, and search
- [ ] Cart management, checkout flow, and order placement
- [ ] Vendor storefront management (product CRUD, inventory)
- [ ] Wallet system (deposit, withdrawal, balance) with mock transactions
- [ ] Order management dashboard (vendor + buyer views)
- [ ] Promotional banners and campaigns
- [x] Role-based access control for routes and API endpoints

---

## Phase 3 — Secondary Features

> **Section summary:** Enhancements that improve usability and business value.

- [ ] Reviews & ratings system for products and vendors
- [ ] Delivery and pickup scheduling (church pickup, home delivery)
- [ ] Notifications system (in-app & email) and optional web push
- [ ] Caching layer for public and frequently-read content (Redis + invalidation)
- [ ] Cloud asset handling (upload metadata persistence, safe failure paths)
- [x] Analytics dashboards for vendors and admins
- [ ] Search and filtering improvements (categories, locations)

---

## Phase 4 — Quality & Polish

> **Section summary:** UX polish, reliability hardening, and readiness for scaling.

- [ ] Full test coverage for critical flows (auth, checkout, orders)
- [ ] Accessibility audit and fixes (keyboard navigation, aria labels)
- [ ] Performance profiling and bundle optimization
- [ ] Error/empty/loading states refined across the app
- [x] Core-flow design-system modernization across signup, product browsing, cart, checkout, and operations dashboard
- [ ] Revisit all mock-backend logic for eventual Prisma migration

---

## Phase 5 — Launch Preparation

> **Section summary:** Final steps to prepare for production deployment.

- [ ] Production environment configuration (env vars, secrets)
- [ ] Security review (auth, input validation, secrets handling)
- [ ] Deployment pipeline set up (GitHub Actions or CI/CD)
- [ ] Documentation & onboarding docs complete

---

## Cloud Session Feature Spec - Production Readiness Completion (Planned 2026-04-04)

> **Section summary:** Execution spec for the cloud session to complete interrupted refactor work and deliver production-ready behavior across critical platform flows.

**Feature Objective:**
Stabilize and complete the in-progress refactor wave while implementing missing production-critical behavior across signup, account security, content configuration, operations CRUD, payment handling, and route integrity.

**Why This Is Needed:**

- Current work is interrupted with a large in-progress diff and partially complete queue items.
- Remaining hardcoded content/routes and incomplete flow wiring increase production risk.
- Signup, notification preferences, verification policies, and payment/fallback behaviors need end-to-end reliability before launch.

**Acceptance Criteria:**

- Role-aware routing is consistent and no dead links remain across header, footer, dashboards, and operations areas.
- Signup deprecates `Worker` as a user role, keeps `Member`/`Non-Member` as valid position options end-to-end, and has regression coverage for stage/state reliability.
- Users can safely change email and re-verify through a secure redirect-based flow.
- Required vs optional UI labels are schema-consistent across major forms; vendor verification enforces required ID + business registration + utility bill uploads; draft retention/restoration is universal and non-blocking.
- Vendor `businessAddress` is required at signup and remains editable post-auth in vendor settings/profile surfaces.
- Help/public content and user-visible links are config-driven and admin-editable.
- Vendor verification status rules are explicit and enforced without blocking store setup/product creation.
- Bug reporting works from submission through admin triage; operations CRUD flows are functional for key domains.
- Upload-managed flows are Cloudinary-first and no longer rely on raw screenshot/image URL entry for governed fields.
- Paystack integration path is production-ready with webhook-capable handlers; bank-transfer screenshot flow remains controlled by a feature flag fallback.
- Full quality gate passes (lint, typecheck, targeted/full tests, route audit) and `.ai-system` docs are synchronized.

**Rollout Order:**

1. Stabilize existing interrupted diff + close open refactor wave gaps.
2. Fix signup/role validation defects and add tests.
3. Implement email-change + re-verification flow.
4. Apply universal form retention + schema/UI required-label alignment.
5. Complete config-driven content/navigation/help implementation.
6. Enforce settings/preferences behavior and vendor verification policy.
7. Finalize bug-report and operations CRUD reliability.
8. Harden payment integration with flagged fallback deprecation path.
9. Perform bulk cleanup and final production-readiness verification.

---

## Cloud Session Feature Spec - Exhaustive UX/Operations Closure (Planned 2026-04-05)

> **Section summary:** Follow-on execution spec built from an exhaustive read-only audit to close remaining production-readiness UX, layout, and operational workflow gaps.

**Feature Objective:**
Close the highest-risk post-adjustment gaps affecting operations usability, layout consistency, vendor workflow completion, and config-driven content behavior before final production sign-off.

**Why This Is Needed:**

- Exhaustive audit found one critical defect (duplicate operations header) and several high/medium workflow gaps still affecting role-specific usability.
- Vendor operations flow is still missing a first-class products management page despite backend CRUD capability.
- Email-change reverification and dashboard KPI wiring are only partially complete, leaving security/UX and operational visibility gaps.

**Acceptance Criteria:**

- Operations routes render a single header/footer chrome and pass regression checks for layout consistency.
- Vendors can manage their own catalog through `/operations/products` with role-safe CRUD behavior.
- Email-change verification is fully closed-loop (request -> verify -> atomic update -> re-auth-safe completion state).
- `/operations/dashboard` renders live role-scoped KPI cards and quick-action links rather than placeholder-only cards.
- `about` and `privacy` pages consume config/public-content pipeline with fallback content and admin editability.
- Core multi-context domains (`products`, `orders`, `vendors`, `wallet`, `notifications`) expose explicit role-scoped views with discoverable navigation and tested scope boundaries.
- Advertise form includes field-level guidance/help and profile surfaces expose missing church/business context fields with API parity.
- Final quality gates pass and deferred low-priority risks are explicitly documented in planning artifacts.

**Rollout Order:**

1. Fix layout duplication and confirm shared chrome behavior.
2. Implement `/operations/products` and sidebar route corrections.
3. Complete email-change reverification completion flow.
4. Wire dashboard KPI cards to live role-scoped metrics.
5. Migrate remaining static pages (`about`, `privacy`) to config/public-content.
6. Enforce cross-domain conceptual-view parity and dynamic accessibility for role-scoped domain surfaces.
7. Apply advertise/profile UX completeness updates.
8. Run full regression/route audit and finalize documentation closure.

---

## Feature Spec - Banner Integrity + Public Content Editor Redesign (Planned 2026-04-08)

> **Section summary:** Planning-only feature package requested for top-banner behavior correctness, analytics/count reliability, vendor-registration review communications, and non-technical content-editing UX.

**Implementation Status (2026-04-08):**

- Implemented: top-banner text normalization + suppression, TOP/HERO feed separation, analytics count contract hardening, vendor review visibility + email lifecycle dispatch, and structured public-content editor redesign with upload-first preview workflow.
- Validation coverage added for homepage banner composition and analytics partial-success/count behavior; feature queue items are now marked complete.

**Feature Objective:**
Stabilize user-facing banner presentation and operational metrics integrity while redesigning the public-content admin experience so non-technical administrators can confidently author, preview, and publish content using managed uploads and consistent fallback behavior.

**Why This Is Needed:**

- Top banner behavior still has edge-case regressions when text fields are empty.
- Banner placement can overlap with hero rendering in some composition states.
- Analytics counters need stronger source-of-truth validation to avoid drift from API payload changes.
- Vendor onboarding/review notifications need verified end-to-end email lifecycle checks.
- Existing public-content editing is too technical and does not provide safe guided preview and upload-first consistency.

**Architecture Impact:**

- `app/page.tsx`, banner rendering components, and banner placement/layout logic.
- Banner/public-content admin surfaces under `app/(operations)/operations/*`.
- Analytics data fetchers (`lib/data/clientDataFetchers.ts`, analytics feature modules, and relevant APIs).
- Vendor review workflow APIs and mail dispatch layers (`app/api/vendors/*`, `lib/services/email.ts`, notification services).
- Content data path (`app/api/public-content/*`, `lib/data/publicContent.ts`) and upload integration.

**Acceptance Criteria:**

- Top banner is not rendered when configured text content is empty/whitespace-only and no required media fallback is present.
- Banner placement rules prevent duplicate top-of-page rendering (top banner and hero do not stack unexpectedly).
- Operations analytics counts are validated against consistent API contract mappings with resilient partial-failure handling.
- Vendor registration review actions reliably trigger expected email notifications with audit-friendly status tracking.
- Public-content admin UX supports: page/section picker, structured editor blocks, live preview, upload-first media insertion, and publish-time fallback consistency with frontend rendering.

**UI/UX Constraints (Design-System Aligned):**

- Keep Ant Design form semantics with explicit labels/help states for non-technical users.
- Include draft-safe preview mode that mirrors published page rendering contract.
- Preserve required/optional label parity with schema validation.
- Maintain mobile-friendly editor interactions and clear success/error guidance.

**Risks and Edge Cases:**

- Empty string vs null handling may differ across content APIs and DB records.
- Banner cache invalidation may delay placement/text behavior after publish.
- Email provider transient failures can mask vendor-review communication state unless retriable and auditable.
- Structured editor schema drift can break legacy fallback rendering if migration contracts are not explicit.

**Rollout Order:**

1. Banner visibility and placement bug fixes + regression tests.
2. Analytics/count contract audit and API/client mapping hardening.
3. Vendor review + email workflow verification and lifecycle instrumentation.
4. Public-content editor redesign (structure + preview + uploads + fallback parity).
5. Full route/content regression verification and documentation sync.

---

## Feature Spec - Product Discovery Filter/Sort Contract Hardening (Planned 2026-04-08)

> **Section summary:** Planning package to audit and correct category-tag filtering, products-page filter/sort behavior, and single-source-of-truth config alignment for product discovery.

**Feature Objective:**
Ensure category tags and all discovery controls (search/filter/sort) consistently produce the expected product results across home and products pages, using one canonical config contract for category and query behavior.

**Why This Is Needed:**

- Home/category links currently emit URL query parameters that are not fully consumed by products-page state.
- Home links include sort query parameters (`sort=trending`, `sort=new`) but products-page logic currently does not honor sort query state.
- Category definitions and slug/value mapping are duplicated, increasing drift risk between UI tags, filters, and backend query semantics.
- Existing filter coverage is component-level, but end-to-end query-to-results behavior is under-tested.

**Architecture Impact:**

- `app/components/HomeContent.tsx` for category tags and discoverability links.
- `components/features/CategoryNav.tsx` for URL parameter generation and active state.
- `app/products/page.tsx` + `components/features/ProductsContent.tsx` for query parsing, filter/sort state hydration, and result rendering.
- `components/features/FilterSidebar.tsx` for UI filter controls and outward contract shape.
- `lib/constants/index.ts` (or extracted config module) for canonical category/sort definitions.
- `app/api/products/route.ts` and `lib/data/clientDataFetchers.ts` for query contract consistency.

**New Modules or Services Required:**

- `lib/config/productDiscovery.ts` (or equivalent): canonical definitions for category groups, URL slug mapping, supported sort keys, and default filter state.
- `lib/utils/productDiscoveryQuery.ts` (or equivalent): parse/serialize helpers for URL query params <-> filter state <-> API query payload.
- Optional: lightweight discovery-state hook in `lib/hooks` to centralize products-page query synchronization.

**Data Flow:**

1. User selects category tag or sort control on home/products surface.
2. UI writes canonical query params using shared query serializer.
3. Products page hydrates filter/sort state from URL via shared parser.
4. Products query execution applies canonical mapping (category slug -> category enum/subcategory set) and sort rules.
5. Results, active chips, and category active-state UI reflect one synchronized contract.
6. API/client query layer uses identical key set and default behavior.

**UI/UX Considerations (Design-System Aligned):**

- Keep filter/sort controls mobile-friendly and consistent with existing DS tokens and spacing.
- Ensure active category/sort state is visually explicit and keyboard accessible.
- Preserve clear empty-state messaging when strict filters return no products.
- Keep query-state behavior shareable/bookmarkable via URL without surprising resets.

**Potential Risks or Edge Cases:**

- Slug-to-enum mismatch for parent category vs product subcategory values may produce false-empty result sets.
- Mixed local filtering and API filtering can cause inconsistent pagination counts if not unified.
- Query param backward compatibility is required for previously shared links.
- Sort behavior for equal timestamps/review counts needs deterministic tie-breaking.

**Architecture Doc Updates Needed:**

- Add a product-discovery query contract note in `.ai-system/agents/system-architecture.md` under data flow.
- Add `lib/config/productDiscovery.ts` to module breakdown once implemented.

**Rollout Order:**

1. Audit and document current category/filter/sort drift points.
2. Introduce canonical discovery config + query parser/serializer.
3. Wire home tags, category nav, and products page to shared query contract.
4. Align API/client query handling and sorting semantics.
5. Add integration/regression tests and finalize docs.

---

## Feature Spec - Unified In-Memory Data Runtime + Seamless Refresh (Planned 2026-04-08)

> **Section summary:** Planning package for project-wide data loading/rendering reliability: preloaded role-accessible data, in-memory continuity, optimistic mutation sync, and low-interruption background refresh.

**Feature Summary:**
Design and roll out a unified client data runtime so user-accessible data is loaded early, kept in memory, and updated predictably with minimal visual interruption. Mutations should update UI-state and backend safely, while background DB refreshes reconcile state without blank states, unnecessary spinners, or noisy rerenders.

**Why This Is Needed:**

- Multiple pages still perform page-local fetch patterns that re-trigger cold-loading, visible emptiness, and repeated waits.
- Some flows experience transient DB connection errors (`connection closed`) even after prior successful data load.
- Refresh behavior can show loading indicators even when payloads are unchanged, creating UX jitter.
- Data comparison and refresh orchestration are inconsistent across pages.

**Architecture Impact:**

- `lib/hooks/useSmartResource.ts` (existing) will evolve into a shared runtime surface instead of isolated page usage.
- New runtime modules under `lib/data-runtime/*` (resource registry, cache policy, refresh scheduler, mutation coordinator, reconciler).
- App bootstrap/provider layer in `app/providers.tsx` for role-aware warm-up loading and hydration.
- Existing client fetchers in `lib/data/clientDataFetchers.ts` and selected API consumers across `app/*` and `components/*`.
- Optional event-stream integration boundary for future RxJS channels (without hard coupling initial rollout).

**New Modules or Services Required:**

- `lib/data-runtime/resourceRegistry.ts`: declarative resource map (key, fetcher, scope, stale/ttl policy).
- `lib/data-runtime/runtimeConfig.ts`: config-driven policy defaults (retry, backoff, spinner thresholds, compare strategy).
- `lib/data-runtime/runtimeStore.ts`: in-memory state graph (resources, status flags, timestamps, in-flight ops).
- `lib/data-runtime/mutationCoordinator.ts`: optimistic update + rollback + DB commit reconciliation.
- `lib/data-runtime/reconciler.ts`: payload comparison/merge pipeline for silent refresh and non-disruptive updates.
- `lib/data-runtime/prefetch.ts`: role/context-aware initial warm-up loader for accessible resources.
- `lib/data-runtime/telemetry.ts`: lightweight instrumentation for load latency, refresh churn, and retry/error rates.

**Data Flow:**

1. App bootstrap resolves auth/role context.
2. Prefetch layer loads role-accessible resources into runtime store (warm start).
3. UI components subscribe to runtime resources (not page-local cold fetch by default).
4. User-triggered mutations apply optimistic in-memory change and dispatch backend request.
5. On backend success, reconciler confirms/normalizes resource state; on failure, rollback + user-safe error feedback.
6. Background refresh scheduler pulls DB snapshots on policy intervals or explicit triggers.
7. Compare/merge step suppresses no-op UI updates when payload is semantically unchanged.
8. Loading indicators only surface when stale/no-data thresholds are crossed; otherwise refresh remains silent.

**UI/UX Considerations (Design-System Aligned):**

- Preserve existing page content during refresh whenever valid cached data exists.
- Use DS loaders (`PageLoader`, `SectionLoader`, skeletons) only for true cold/empty states.
- Provide subtle, non-blocking refresh cues (timestamp/badge) for background sync activity.
- Keep destructive/loading states scoped to affected controls, not full-page flicker.

**Potential Risks or Edge Cases:**

- Over-prefetching can inflate initial payload and memory usage if role/scope boundaries are not strict.
- Incorrect compare semantics can suppress legitimate updates or cause stale UI.
- Optimistic updates across relational datasets can drift without deterministic reconciliation contracts.
- Retry loops on transient connection errors can degrade UX if backoff/circuit-breaker policy is weak.
- Mixed legacy fetch patterns and new runtime subscriptions can create inconsistent state sources during migration.

**Architecture Doc Updates Needed:**

- Add a dedicated "Unified Data Runtime Flow" section to `.ai-system/agents/system-architecture.md`.
- Extend module breakdown to include `lib/data-runtime/*` runtime services.
- Add migration guidance for retiring page-local ad hoc fetch patterns in favor of registry-driven resource access.

**Implementation Approach Decision (Planning):**

- Primary rollout uses existing Zustand-compatible ecosystem and extends current smart-resource patterns to a centralized runtime.
- Redux Toolkit and RxJS were considered; introduce adapter boundaries so either can be added incrementally where justified (for example, high-frequency streaming domains), but avoid immediate full-stack rewrite risk.

**Rollout Order:**

1. Define runtime architecture contracts and resource registry.
2. Implement core runtime store/reconciler/mutation coordinator.
3. Add role-aware warm-start prefetch during app bootstrap.
4. Migrate highest-latency/high-churn pages first (operations + core buyer flows).
5. Add telemetry + guardrails for refresh churn and connection error retries.
6. Expand migration coverage and retire legacy page-local fetch anti-patterns.
7. Validate full regression matrix and finalize documentation.

---

## Feature Spec - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning (Planned 2026-04-09)

> **Section summary:** Planning package to make notifications discoverable and trustworthy: expose a real inbox route, enforce truthful toggle behavior, and reduce noisy global processing indicators and refresh churn.

**Feature Summary:**
Create a clear, user-facing notification inbox experience that matches email/push/in-app delivery expectations, fix preference toggles so UI behavior matches backend reality, and tune runtime activity messaging so background refresh does not constantly interrupt users with repetitive processing copy.

**Why This Is Needed:**

- `/notifications` currently renders preferences instead of an inbox timeline, despite existing notification CRUD APIs and existing bell/drawer components.
- Preference toggles appear editable but are collapsed into coarse backend flags (`orderUpdates`, `promotions`) and mandatory channels, creating misleading UX when values rebound.
- Runtime/background refresh cadence and global in-flight messaging can surface frequent `Processing... task N` copy that feels noisy and non-actionable.
- User requirement is to avoid Prisma schema migration in this pass unless absolutely required.

**Architecture Impact:**

- `app/notifications/page.tsx` and `app/notifications/settings/page.tsx` route semantics and dashboard-shell behavior.
- `components/features/NotificationDrawer.tsx`, `components/features/NotificationBell.tsx`, and new inbox-page composition surface.
- `components/features/NotificationPreferences.tsx` plus `app/api/notifications/preferences/route.ts` contract mapping.
- `lib/contexts/NotificationContext.tsx` polling cadence and explicit user-triggered refresh behavior.
- `lib/services/notifications.ts` to introduce config-driven template resolution and cross-channel payload shaping.
- `app/providers.tsx` runtime activity notifier copy/threshold behavior.
- `lib/config/runtime.ts` and runtime resource policy usage where interval defaults are currently too eager.

**New Modules or Services Required:**

- `lib/config/notificationTemplates.ts`: canonical per-notification-type template configuration (title/body variants, CTA labels, optional preview/media hints, priority).
- `lib/services/notificationTemplateResolver.ts`: context-aware resolver using user profile/status/audit timestamps to generate channel-safe content.
- `components/features/NotificationInbox.tsx` (or equivalent): full-page inbox timeline reusing existing mark-read/delete/filter patterns.
- Optional `lib/config/runtimeActivityCopy.ts` (or in-place config) for threshold-based global status labels.

**Data Flow:**

1. Domain events call `dispatchNotification` with `type`, user target, and metadata.
2. Template resolver derives per-channel message content (in-app/email/push) from config + contextual state (signup date, verification transitions, ad/content status, order/payment timeline).
3. Existing in-app persistence path remains source-of-truth (`notification` table) with no schema migration in this feature pass.
4. Inbox page (`/notifications`) reads notifications via API/runtime context, supports read/unread filters, mark-all-read, and CTA navigation.
5. Settings page (`/notifications/settings`) manages preferences with explicit lock-state semantics for mandatory channels.
6. Runtime activity notifier emits calmer threshold-based copy and suppresses short/background-only churn.

**UI/UX Considerations (Design-System Aligned):**

- `/notifications` should be a first-class inbox timeline page, not a settings-only surface.
- Keep `/notifications/settings` as dedicated preferences management with explicit editable vs enforced controls.
- Use lock/tooltip/info copy for non-editable mandatory switches to avoid false affordances.
- Support richer cards where needed (status icon, optional image preview, CTA button) without breaking compact list readability.
- Replace raw task-count copy with human phrasing tiers (for example: `Just a moment`, `Almost there`, `This might take a while`).
- Prefer manual refresh plus long idle refresh thresholds (5-10 min) over aggressive interval polling.

**Potential Risks or Edge Cases:**

- Template drift across in-app/email/push can create inconsistent user messaging if config ownership is unclear.
- Mandatory-channel enforcement must remain explicit to avoid compliance/security regressions.
- Reducing auto refresh too far can leave stale unread counts unless manual refresh affordances are prominent.
- Existing `NotificationBell` local fetch state and context-based notifications can diverge if not consolidated.

**Architecture Doc Updates Needed:**

- Add `Notification Inbox + Template Resolver Flow` to `.ai-system/agents/system-architecture.md`.
- Update module breakdown for new notification template config/resolver modules and inbox feature surface.
- Update runtime flow notes to distinguish user-triggered refresh from low-priority background refresh and describe global notifier suppression thresholds.

**Rollout Order:**

1. Normalize route intent (`/notifications` inbox, `/notifications/settings` preferences) and navigation entry points.
2. Implement inbox page composition using existing API/context primitives.
3. Add config-driven template resolver and connect it to notification dispatch.
4. Refactor preferences mapping so toggles persist truthfully with lock-state UX for enforced channels.
5. Tune runtime/notification refresh cadence and global processing copy/threshold logic.
6. Add regression tests and run targeted validation matrix.
7. Sync architecture/repair/decision/checkpoint artifacts.

---

## Completed

> **Section summary:** Tasks that have already shipped in the current repository state.

- [x] Rename and rebrand Martgram to MyHarvestHub (project metadata, README)
- [x] Upgrade Next.js to v15 and React to v19
- [x] Integrate Ant Design and Tailwind with purple-first theme
- [x] Create initial mock data and in-memory database layer
- [x] Establish basic auth (login, register, logout) APIs
