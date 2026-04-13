# Development Task Queue

> **Overview:** Sprint-level task queue. Agents execute tasks top to bottom within the current sprint. When a task is completed, mark it [x] and add a checkpoint entry. Future tasks are queued below for prioritisation in the next sprint.

---

## Current Sprint

> **Section summary:** High-priority refactor tasks that align the codebase to a modular, config-driven, role-aware architecture.

- [x] Create a refactor plan document capturing current architecture and target state (`.ai-system/planning/refactor-plan.md`)
- [x] Create a centralized runtime config module (`lib/config/*`) and migrate scattered `process.env` access into typed helpers
- [x] Replace hardcoded RBAC route lists in `middleware.ts` with a declarative policy registry and per-route metadata
- [x] Add unit tests for RBAC guards (middleware) and config normalization
- [x] Implement a shared data adapter interface and ensure `USE_PRISMA` / `ENABLE_MOCK_BACKEND` toggles are explicit and safe
- [x] Add robust email + notification infrastructure (retry/backoff, persistence, in-app and push delivery)
- [x] Add caching layer for public content and heavily-read data (Redis cache + invalidation and key namespacing)
- [x] Add a small admin-editable public content model (banners/FAQ/About/Terms and Conditions/Policy, etc.) and caching strategy (Redis + invalidation endpoint)
- [x] Implement cloud asset handling best practices (upload metadata persistence, safe failure modes, and cache busting for media)
- [x] Audit and modernize the UI design system across core flows (signup, product browsing, carts, checkout, dashboards) using consistent tokens and responsive layouts
  - [x] Modernize signup account-type selection UI token usage and responsive card width behavior.
  - [x] Improve cart and checkout responsive spacing/typography and align service notice styling with semantic DS tokens.
  - [x] Refactor shared `Button` secondary variant from palette-hardcoded shades to semantic surface/border/text tokens.
  - [x] Complete product browsing and dashboard token/responsive alignment pass.
- [x] Refactor to single-route-per-feature architecture: move vendor/admin/buyer variations into dynamic routes/components + `RoleAwareFeatureRenderer`
- [x] Fully deprecate role-specific pages and ensure all functional content is accessible through config-driven single pages (e.g., /orders, /wallet, /profile) with role-based behavior inside.
- [x] Unify duplicated components (e.g., ProductCard, OrderCard, KPI Card, Button, Table, Form Field) across buyer/vendor/admin paths with configuration and slot props.
- [x] Remove redundant role-specific pages and deprecate (buyer/admin/vendor) page directories once merged.
- [x] Build `lib/permissions.ts`, `lib/rbac/policies.ts`, and `RoleGuard`/`PermissionsGate` wrappers.
- [x] Establish CI validation checks for Prisma migrations, required env vars, and linting
- [x] Add a small admin-editable public content model (banners/FAQ/About/Terms and Conditions/Policy, etc.) and caching strategy (Redis + invalidation endpoint) _(duplicate queue item resolved; implementation already delivered in this sprint)_

---

## Up Next

> **Section summary:** Tasks planned for the next sprint. Not yet started.

- [x] Recovery slice: ad application fallback + analytics/admin reliability (2026-04-06)
  - [x] Remove ad-application hard-blocking when ad rate config is missing by introducing safe fallback handling.
  - [x] Ensure `/api/admin/ads/rates` returns non-breaking fallback values when config is absent.
  - [x] Fix analytics user-count data retrieval mismatch from `/api/users` payload shape.
  - [x] Improve analytics load resilience with partial-success handling.
  - [x] Reintroduce lightweight analytics visualization blocks (progress-bar chart summaries).
  - [x] Enable real operations user management actions (view detail route, status toggle persistence, delete persistence).
  - [x] Add admin role-change control on dedicated `/operations/users/[id]` page.
  - [x] Improve advertise form control visual consistency for select/date/number inputs in dark mode/Safari.
  - [x] Remove provider-leaking user-facing bug-report upload error copy.

- [ ] Migrate mock backend to Prisma + PostgreSQL (using `prisma/schema.prisma`)
  - [x] Remove direct page-level and client-fetcher mock fallback paths in operations/users, operations/banners, wallet, favourites, and `lib/data/clientDataFetchers.ts`.
  - [x] Remove server-side runtime mock fallback branches in `lib/data/publicContent.ts` for read/write content paths.
  - [x] Remove server-side runtime mock fallback branches in `lib/data/dataFetchers.ts`.
  - [x] Audit and phase out remaining mock-mode toggles in adapter/bootstrap layers (for strict Prisma-first runtime).
  - [x] Remove remaining non-adapter runtime mock toggle usage (SearchBar + ProfilePage) and consolidate env flag messaging/docs.
  - [x] Fill Prisma adapter parity gap for ad rate config (`getActive`) used by `/api/admin/ads/rates`.
  - [x] Retire legacy in-file mock scaffolding in `lib/data/database.ts` and switch to a slim Prisma-adapter facade.
  - [x] Deprecate unused compatibility env toggles in `lib/config/env.ts` (`USE_PRISMA`, `ENABLE_MOCK_BACKEND`) and remove related config/test/docs references.
- [x] Add payment gateway integration stubs (Paystack, Flutterwave)
  - [x] Add gateway-agnostic payment stub service (`lib/services/payments.ts`) and initialize/verify API routes.
  - [x] Wire checkout/wallet flows to consume initialize/verify stubs instead of placeholder copy-only UI states.
  - [x] Persist payment verification outcomes in order/wallet domain records and enforce gateway status before final order confirmation.
  - [x] Add mode-aware Paystack env configuration (test/live key sets + `PAYSTACK_MODE`) and admin-facing operations context panel for safe test-mode understanding.
- [x] Implement notifications (email + in-app) using `resend` / `web-push`
- [x] Add vendor analytics dashboards (sales, orders, revenue)
- [x] Add public ad application page + footer CTA link (accessible to unauthenticated users)
  - [x] Create `app/ad-application` page with form content and static information
  - [x] Add backend endpoint `app/api/ads/apply/route.ts` to receive submissions
  - [x] Ensure no auth guard in middleware for this page (public route access)
  - [x] Add a clear footer link text like “Apply to Advertise” in `components/layout/Footer` or equivalent
  - [x] Add tests: route accessibility + form submit behavior + footer link presence

- [x] Fix role-based dashboard routing for admin/vendor:
  - [x] Create `app/admin/dashboard/page.tsx` and `app/vendor/dashboard/page.tsx` or redirect to existing indexed pages
  - [x] Validate route exists in `lib/rbac/routeConfig.ts` and `components/layout/Sidebar.tsx`/`lib/navigation.ts`
  - [x] Add route existence audit and fail-safe nav filter to avoid broken links

- [x] Enhance ad application flow (payment + duration pricing):
  - [x] Extend `AdApplication` model (Prisma + types) with `paymentMethod`, `proofOfTransferUrl`, `amountPaid`, `durationType`, `durationValue`, `approvedBy`, etc.
  - [x] Add admin rate config model `AdRateConfig` (per-hour and per-day rates) and endpoints under `/api/admin/ads/rates`
  - [x] Update `app/advertise/page.tsx` to capture payment method and proof-of-transfer upload (and price estimate)
  - [x] Update admin review page to show payment info and set active duration based on price and rates
  - [x] Add tests for rates, payments, and timeline computation.

- [x] Resolve signup validation and role option bugs (closed via 2026-04-04 correction contract)
  - [x] Superseded: Do not add `Worker` as signup role; keep `Worker` only as church position where applicable.
  - [x] Removed role/dashboard mapping drift for deprecated signup role option.
  - [x] Investigated and fixed intermittent “fill all required fields” signup-stage validation behavior.
  - [x] Added/updated regression coverage for signup progression and validation-state retention.
- [x] Fix `SecurityInfo` race condition where `updateFormData` is not flushed before calling `register`; pass final payload explicitly to API call
- [x] Harden `/api/auth/register` input validation to use zod schemas and reject malformed requests (include `confirmPassword`, `agreeToTerms` checks)
- [x] Add a fallback catch for service worker `no-response` on `/signup/*` route navigation and document offline handling behavior
- [x] Verify dashboard route links in `Header`, `Sidebar`, and `middleware` for all roles to avoid broken or unauthorized navigation

---

## Backlog

> **Section summary:** Known work that needs to be done but hasn't been scheduled yet.

- [ ] Improve accessibility (keyboard nav, ARIA, contrast)
- [ ] Add PWA support (service worker + offline caching)
- [ ] Add search indexing and advanced filters (categories, campus)

---

## Completed This Sprint

> **Section summary:** Tasks finished in the current sprint. Cleared at sprint end and moved to dev-history.md.

- [x] Bootstrap `.ai-system` documentation and project context
- [x] Update theme and brand guidelines for MyHarvestHub

---

## Notes

- Priority is on stable auth + order flow before adding payment integrations.
- Keep all fixes type-safe and avoid introducing `any`.

---

## Session 49 Fix Slice — Payment/Banner UX Consistency (2026-04-11)

> **Section summary:** Small reliability patch set for payment availability, cart feedback messaging, vendor rail layout, banner rendering integrity, and ad/banner placement previews.

- [x] Align checkout/wallet/order payment gating with runtime Paystack key readiness.
- [x] Improve add-to-cart feedback message clarity (product-specific success toast).
- [x] Convert homepage popular vendors to horizontal overflow rail.
- [x] Preserve top/hero banner image aspect ratios responsively without clipping.
- [x] Add frontend placement previews for top/ad banners on advertise, public ad application, and operations banner form surfaces.

---

## Feature: Signup & Mobile UI Fixes

> **Section summary:** Tasks implementing the UI/UX fixes and signup enhancements requested on 2026-03-17.

- [x] Audit current signup and mobile UI; capture components to change
- [x] Resize signup logos and add rounded borders globally
- [x] Make theme toggle accessible on mobile (visible + reachable)
- [x] Add password visibility toggles to password & confirm fields
- [x] Fix admin dashboard mobile nav link accessibility
- [x] Enhance phone input: add country-select (+234 default), enforce local 10-digit validation
- [x] Update vendor signup: capture banking details, business operations address, and utility bill upload
- [ ] Align signup pages with design-system tokens and responsive rules
- [ ] Add unit & integration tests for new inputs and flows
- [ ] Update `.ai-system/design-system.md` and `.ai-system/agents/system-architecture.md` to reflect new components and data flow
- [ ] Mark Feature done and add checkpoint entry when complete

---

## Feature: Signup + Email Verification Gate + Complete Integration

- [x] Ensure signup progression waits on email verification before completing user status (enforce `verifiedEmail` state in register flow).
- [x] Implement dynamic `StageTracker` stage filtering by user type (buyer vs vendor) so only relevant stages appear.
- [x] Wire in all email flows for signup, password reset, order, vendor approval via `lib/services/email.ts` and `app/api/auth` routes.
- [ ] Confirm PWA setup is complete in `app/_service-worker`, manifest, and route/service worker registration.
- [x] Verify DB interactions for signup and user verification come through unified `prismaAdapter` (and fallback mock path) with connection resilience.
- [ ] Add end-to-end signup test covering role selection, form completion, verify-email page, and post-verify persistence.
- [ ] Add PWA offline banner state and cache-first fallback for core pages in app shell.
- [x] Add checkpoint entry after this feature is merged.

---

## Feature: UX Reliability + Buyer-to-Vendor Conversion + Account Editability

> **Section summary:** Planned implementation tasks to resolve client concerns around loading UX, role conversion, auth polish, profile/store editability, and dark-mode token compliance.

- [x] Create a feature-spec note in `.ai-system/planning/project-plan.md` with acceptance criteria and rollout order for this feature set.
- [ ] Loading UX audit: inventory all route-level `loading.tsx` and image placeholders in auth, products, dashboards, profile, and store pages.
- [ ] Standardize image loading behavior by extending `app/components/ui/OptimizedImage.tsx` to reserve stable dimensions and prevent raw icon flash on slow networks.
- [ ] Introduce a shared media-loading primitive in `components/ui/Loading.tsx` (spinner/skeleton variants) and replace ad-hoc loading placeholders where image jank is visible.
- [x] Ensure Suspense fallbacks in auth and core routes use design-system loader tokens instead of plain text fallback blocks.
- [x] Login polish: comment out the demo/dev credentials block in `app/(auth)/login/page.tsx` (preserve for local debug behind an explicit feature flag only).
- [x] Login polish: enforce lowercase-normalized email input at UI submit/onChange path and keep API-side normalization as defense in depth.
- [x] Email verification UX: add success redirect from `app/verify-email/page.tsx` to login (with short countdown + explicit action button fallback).
- [x] Buyer-to-vendor conversion flow design: define entry points from buyer profile/dashboard/store-settings and finalize required fields for store onboarding.
- [x] Add a dedicated conversion page (for example `app/become-vendor/page.tsx`) that reuses existing vendor onboarding sections with role-aware step gating.
- [x] Add conversion API endpoint (for example `app/api/users/me/convert-to-vendor/route.ts`) that validates buyer eligibility and creates/updates pending vendor records atomically.
- [x] Update RBAC and navigation config so buyers can access conversion flow, and converted users can reach vendor settings/dashboard according to approval status.
- [x] Persist profile edits: wire `components/features/ProfilePage.tsx` to `PUT /api/users/[id]/profile` and remove success-only mock behavior.
- [x] Persist password changes: wire `components/features/ProfilePage.tsx` security tab to `PUT /api/users/[id]/password` with inline validation and error mapping.
- [x] Persist vendor/store edits: wire `components/features/StoreSettingsPage.tsx` to `GET/PUT /api/vendors/me/store-settings` using authenticated vendor identity.
- [x] Replace vendor settings bootstrap that scans `/api/vendors?limit=50` with a direct self/vendor endpoint to avoid brittle client-side filtering.
- [x] Design token enforcement pass: fix low-contrast placeholder/secondary/toast text in dark mode by replacing hardcoded utility shades with approved DS tokens.
- [ ] Add regression coverage for: image loader stability, login email normalization, verify-email redirect, buyer-to-vendor conversion, profile/save/password updates, and dark-mode contrast checks.
- [x] Record architectural decisions and migration notes in `.ai-system/memory/project-decisions.md` before implementation starts.
- [x] Update `.ai-system/agents/system-architecture.md` with new account-conversion flow and profile/store persistence data paths once implementation lands.

---

## Feature: Production-Readiness Refactor Wave (API + Upload + Layout)

> **Section summary:** High-impact structural changes for API standardization, upload reliability, offline resilience, and onboarding consistency.

- [x] Add shared API response/handler utility (`lib/api/http.ts`) and migrate ad-related endpoints to it.
- [x] Add schema-driven payload validation to `/api/ad-applications` and `/api/ads` routes using Zod.
- [x] Replace ad application manual image/payment URL input with upload-driven flow in `app/advertise/page.tsx`.
- [x] Add local draft persistence utility (`lib/utils/localDraft.ts`) and wire it into ad application form.
- [x] Add offline queue utility (`lib/utils/offlineQueue.ts`) and automatic replay for queued ad submissions.
- [x] Extend `/api/upload` to support rate-limited guest uploads for ad + payment-proof media with optional persistence skip.
- [x] Introduce shared dashboard shell (`components/layout/RoleDashboardShell.tsx`) and de-duplicate `app/admin/layout.tsx` + `app/vendor/layout.tsx`.
- [x] Update role policy to allow admin users to access vendor workspace routes when needed.
- [x] Redesign `app/signup/layout.tsx` to remove duplicate branding blocks and improve structural consistency.
- [ ] Migrate remaining role-prefixed routes into grouped architecture (`(public)`, `(dashboard)`, `(operations)`) with compatibility redirects.
  - [x] Add canonical operations workspace routes under `app/(operations)/operations/*` for admin/vendor management pages.
  - [x] Add middleware compatibility redirects from legacy `/admin/*` and `/vendor/*` URLs to canonical operations or unified routes.
  - [x] Make `/operations/dashboard` and `/operations/public-content` self-contained and convert legacy admin/vendor page routes to redirects.
  - [x] Make `/operations/ads`, `/operations/banners`, `/operations/settings`, and `/operations/vendor-content` self-contained and convert matching `/admin/*` pages to redirects.
  - [x] Move remaining legacy-only pages/components off direct `/admin/*` and `/vendor/*` implementations so wrappers are no longer needed.
- [ ] Standardize all API routes on shared wrappers (`lib/api/http.ts`) and remove direct `NextResponse.json` duplication.
  - [x] Standardize notifications API handlers under `app/api/notifications/**` on `withApiHandler` + `apiSuccess/apiError`.
  - [x] Standardize wallet API handlers under `app/api/wallet/**` on `withApiHandler` + `apiSuccess/apiError`.
  - [x] Standardize cart API handlers under `app/api/cart/**` on `withApiHandler` + `apiSuccess/apiError`.
  - [x] Standardize push API handlers under `app/api/push/**` on `withApiHandler` + `apiSuccess/apiError`.
  - [x] Standardize availability-requests API handlers under `app/api/availability-requests/**` on `withApiHandler` + `apiSuccess/apiError`.
  - [x] Standardize reviews API handlers under `app/api/reviews/**` on `withApiHandler` + `apiSuccess/apiError`.
- [x] Add regression tests for ad uploads, draft restore, offline queue replay, and signup layout rendering.

---

## Cloud Session Continuation Queue (2026-04-04)

> **Section summary:** Autonomous execution backlog for cloud-session completion of the interrupted production-readiness refactor wave.

- [x] Baseline and stabilize interrupted in-progress refactor work before new feature expansion.
  - [x] Audit current modified/untracked files and map each change to a queue item or remove/repair mismatches.
  - [x] Re-run baseline validation (`npm run lint`, `npx tsc --noEmit`, targeted Vitest) and fix regressions first.
  - [x] Close remaining incomplete items under Production-Readiness Refactor Wave (route migration/API wrapper standardization).
- [x] Resolve signup validation and role-option bugs completely.
  - [x] (Superseded) Prior cloud run added `Worker` signup role support; replaced by post-review correction below.
  - [x] Fix intermittent signup "fill all required fields" validation failure across stage transitions.
  - [x] Add regression tests for signup step progression, role transitions, and validation-state retention.
- [x] Implement secure email-change and re-verification channel.
  - [x] Add profile UX to request email change with explicit verification status messaging.
  - [x] Add backend flow for email-change token issuance, verification, and post-verify redirect handling.
  - [x] Ensure old sessions/tokens are handled safely after email mutation.
- [ ] Standardize universal form retention/restoration and required/optional labeling.
  - [ ] Extend shared draft/offline utilities and apply to signup, vendor onboarding, ad forms, bug report, and settings forms.
  - [ ] Enforce schema/UI parity so required fields in Zod/schema are labeled required in UI and optional fields are labeled optional.
  - [ ] Ensure verification-critical uploads/documents cannot be marked optional by UI drift.
- [x] Complete config-driven content and navigation hardening.
  - [x] Remove remaining hardcoded user-visible links/content (header, footer, dashboard links, help pages, static marketing copy).
  - [x] Make help pages/subpages functional, route-safe, and admin-editable through public-content/config systems.
  - [x] Add dead-link and orphan-route audit pass for all nav surfaces.
- [x] Wire user settings/preferences to real backend behavior.
  - [x] Ensure notification settings actually control enabled channels.
  - [x] Keep mandatory system-critical email delivery paths always enabled regardless of optional preference toggles.
  - [x] Verify redirects, confirmation feedback, and persistence consistency for settings pages.
- [x] Verify vendor verification-state business rules.
  - [x] Ensure unverified vendors can create/update stores and add products.
  - [x] Implement explicit order gating policy for unverified vendors (block order placement or require explicit buyer acknowledgment).
  - [x] Surface verification badges/warnings consistently across storefront, product, checkout, and operations views.
- [x] Complete bug-reporting and operations CRUD reliability.
  - [x] Verify end-to-end bug reporting from user submission to admin triage/update flow with no route/API errors.
  - [x] Ensure operations CRUD paths are functional for users, stores/vendors, banners, ads, and public content.
  - [x] Add tests for bug-report lifecycle and high-risk operations CRUD mutations.
- [x] Upgrade payment integration path for production readiness with graceful fallback.
  - [x] Replace stub-only Paystack handlers with production-ready initialize/verify/webhook structure.
  - [x] Keep bank-transfer + proof upload as feature-flagged fallback during migration.
  - [x] Add deprecation path/flags and observability for fallback usage until full gateway cutover.
- [ ] Run cleanup and bulk deletion of obsolete files/routes/components.
  - [x] Identify and remove duplicate legacy route wrappers in `app/admin/*` and `app/vendor/*` (middleware redirects retained for compatibility).
  - [ ] Delete in controlled batches with import/route validation after each batch.
  - [ ] Update architecture maps and dependency index docs after cleanup.
- [ ] Final production-readiness verification and documentation closure.
  - [ ] Execute full regression matrix (lint, typecheck, tests, route audit, key E2E smoke checks).
  - [ ] Update `.ai-system/checkpoints/session-log.md`, `.ai-system/summaries/dev-history.md`, `.ai-system/memory/project-decisions.md`, and architecture docs.
  - [ ] Mark completed queue items and record remaining risks/gaps explicitly.

---

## Cloud Session Adjustment Queue (2026-04-04 Addendum)

> **Section summary:** Locked corrective implementation queue after post-cloud review audit.

- [x] Deprecate `Worker` as signup role across UI/types/flow logic and preserve it only as church position where applicable.
- [x] Ensure `Member` and `Non-Member` position values are valid end-to-end without vendor registration/runtime failures.
  - [x] Align Prisma enum + constants + payload validation for `Position` and add migration if schema changes.
  - [x] Regenerate Prisma client and validate registration success paths.
- [x] Enforce vendor verification requiredness parity.
  - [x] Require all 3 vendor verification uploads: ID, business registration certificate, and utility bill.
  - [x] Make vendor `businessAddress` required at signup and required in server validation.
  - [x] Remove misleading optional labels from required fields in form UI.
- [x] Preserve signup-entered values across stage navigation and restore correctly from draft state.
  - [x] Fix `idType` persistence and restoration.
  - [x] Fix profile-picture and document upload state retention between steps.
- [x] Confirm and patch post-auth editability/viewability for signup-originated fields in profile/store settings.
  - [x] Ensure `businessAddress` remains editable post-auth.
  - [x] Expose/edit vendor-relevant fields through vendor settings APIs/UI where missing.
- [x] Improve verify-email UX clarity.
  - [x] Add concise instruction copy to click the email link.
  - [x] Display recipient email context in resend/no-token flows.
- [x] Fix dark-mode select active/focus contrast across key forms and error states.
- [x] Harden vendor registration diagnostics.
  - [x] Add structured verbose server-side logging (sanitized payload + Prisma error mapping + correlation context).
  - [x] Add resilient fallback for vendor position write when database schema is behind (avoid opaque 500 during signup).
  - [x] Return actionable validation and failure messages without leaking sensitive data.
- [x] Enforce Cloudinary-first upload governance platform-wide.
  - [x] Fix unauthenticated signup upload failures by allowing scoped guest uploads for `profile` and `verification-doc` when `skipPersistence=true`.
  - [x] Replace raw screenshot/image URL entry paths (including bug report flow) with managed upload workflow.
  - [x] Reject unsupported raw URL payloads for upload-managed fields.
  - [x] Standardize upload metadata contract across forms and APIs.
- [x] Re-verify service readiness posture for Resend, Cloudinary, Upstash, Prisma, wallet, and payment paths with production-safe feature-flag behavior.

---

## Cloud Session Execution Queue (2026-04-05 Exhaustive Audit)

> **Section summary:** Priority-ordered implementation queue derived from exhaustive read-only audit findings to close remaining production-readiness UX and operations gaps.

- [ ] Resolve critical layout chrome duplication on operations routes.
  - [x] Remove duplicate Header rendering between `app/layout.tsx` and `components/layout/RoleDashboardShell.tsx` so `/operations/*` renders exactly one header.
  - [x] Validate Footer/Header behavior parity across public, auth, signup, and operations route groups.
  - [x] Add regression coverage to prevent reintroduction of duplicate layout chrome.
- [x] Deliver vendor product-management workspace in operations namespace.
  - [x] Create `app/(operations)/operations/products/page.tsx` for vendor-scoped product list/create/edit/delete flows.
  - [x] Update vendor sidebar links in `components/layout/Sidebar.tsx` from marketplace `/products` to `/operations/products`.
  - [x] Verify role/ownership enforcement end-to-end (vendor self-scope, admin global scope, buyer denied).
- [x] Complete email-change reverification flow closure.
  - [x] Implement dedicated verification completion path (`/verify-email-change` or `/verify-email?type=change`) with token validation and atomic email mutation.
  - [x] Add pending/retry UI states in profile security settings for email-change lifecycle.
  - [x] Ensure session/token handling is explicit after email mutation (force re-auth and clear stale session state).
- [x] Upgrade operations dashboard from placeholder cards to live KPI + quick-action surface.
  - [x] Wire role-scoped metrics into `/operations/dashboard` (admin and vendor variants).
  - [x] Make cards actionable with links to relevant operations/detail pages.
  - [x] Add loading/error/empty states and last-updated metadata for observability.
- [x] Finish config-driven migration for remaining static policy/marketing pages.
  - [x] Refactor `app/about/page.tsx` and `app/privacy/page.tsx` to `publicContent` lookup with safe fallback content.
  - [x] Confirm `/operations/public-content` has complete admin CRUD coverage for these slugs.
  - [x] Re-run dead-link/orphan-route audit after migration.
- [x] Enforce cross-domain conceptual-view parity and dynamic accessibility.
  - [x] Build a role/domain parity matrix for products, orders, vendors, wallet, notifications, ads, bug reports, and profile surfaces.
  - [x] Ensure each role has explicit and discoverable entry points for each domain view (public marketplace, vendor store scope, admin global scope) without scope leakage.
  - [x] Deliver explicit orders view separation (`/orders` for buyer-history flow, `/operations/orders` for vendor/admin operations scope) or equivalent mode-safe route architecture with tests.
  - [x] Add compatibility redirects for legacy `/admin/orders` and `/vendor/orders` paths and align navigation/sidebar discoverability.
  - [x] Add regression coverage for route policy, navigation visibility, and API scope enforcement across role/domain permutations.
- [ ] Improve form usability and profile completeness in remaining audited gaps.
  - [x] Add field-level help guidance to `app/advertise/page.tsx` (position/theme/duration/payment-proof expectations).
  - [x] Add church position and vendor business-context edit surfaces in `components/features/ProfilePage.tsx` with API parity.
  - [x] Confirm required/optional labeling stays schema-aligned after UI updates.
- [x] Finalize hardening, deferred-risk accounting, and sign-off.
  - [x] Run full quality gate matrix: lint, typecheck, Vitest suites, route audits, and targeted smoke checks.
    - Note: repository-wide `npm test` still has pre-existing unrelated failures (auth/jwt/schema/api integration/ui suites); touched-flow targeted suites pass.
  - [x] Update `.ai-system` artifacts (queue, plan, decisions, session log, architecture notes) with final statuses and residual risks.
  - [x] Track explicitly deferred low-priority items (contact page config source, vendor deactivation UX, webhook idempotency hardening) with owner and target sprint.
    - Deferred risk register:
      - Contact page config source parity — Owner: Content/Platform; Target sprint: 2026-04-12 hardening wave.
      - Vendor deactivation UX lifecycle completion — Owner: Operations UX; Target sprint: 2026-04-12 hardening wave.
      - Payment webhook idempotency hardening — Owner: Payments backend; Target sprint: 2026-04-12 hardening wave.

---

## Session Task Slice (2026-04-05) — Product/Vendor/Layout Hotfix Follow-up

> **Section summary:** Immediate fixes for product detail routing, dashboard shell consistency, and vendor visibility/verification labeling.

- [x] Restore single-product detail route reliability.
  - [x] Add/repair `/products/[id]` page so product cards resolve and not-found behavior is intentional.
  - [x] Add null-safe fallbacks for product/vendor/reviews/media fields to avoid runtime crashes.
- [x] Apply dashboard shell/menu spacing consistency on missing pages.
  - [x] Ensure `/store-settings` renders the same sidebar + mobile bottom nav + bottom spacing used in dashboard shell.
  - [x] Ensure `/notifications/settings` uses dashboard shell for vendor/admin while preserving buyer access.
- [x] Fix vendor read-path visibility and labeling.
  - [x] Ensure public vendor/product surfaces include unverified vendors instead of dropping to empty/Unknown Vendor.
  - [x] Keep verification state visible via badges/labels (verified vs unverified) on vendor/product cards and detail pages.
  - [x] Preserve order restrictions by relying on existing server-side unverified-vendor acknowledgment gating.
- [x] Add/adjust focused tests for changed UI behavior.
- [ ] Re-run touched-scope validations and capture UI screenshots.
  - [x] Re-ran touched-scope validations (`vitest`, `eslint`, `tsc --noEmit`) for updated product/vendor/layout files.
  - [ ] Capture updated UI screenshots for `/products/[id]`, `/store-settings`, and `/notifications/settings` shell parity.
- [x] Restore `/operations/banners` end-to-end management reliability (real API-backed create/update/delete/status toggle + robust non-blocking error/success feedback + cache invalidation parity).
- [x] Add reusable config-driven confirmation workflow for destructive/removal-like operations and apply across operations surfaces.
  - [x] Added OOP-backed confirmation config builder/presets utility (`components/ui/actionConfirm.ts`).
  - [x] Applied shared confirmation utility in operations marketing content, products, users, vendors, ads, and banners high-risk actions.
  - [x] Standardized concise confirmation copy (title/message/confirm button text).
- [x] Remove ambiguous placeholder-style messaging in vendor marketing-content table context for production readiness.

---

## Feature Planning Queue (2026-04-08) — Banner Integrity + Content Editor UX

> **Section summary:** Planning backlog derived from `plan-feature.md` directive for banner behavior, analytics integrity, vendor-review communication checks, and non-technical public-content editing.

- [x] Fix top-banner text rendering contract.
  - [x] Prevent top-banner render when text payload is empty/whitespace and no required media fallback exists.
  - [x] Normalize empty text handling (`null`, `undefined`, empty string, whitespace) in banner DTO + frontend guard.
  - [x] Add regression tests for banner hidden/visible state permutations.
- [x] Resolve top-banner placement duplication with hero region.
  - [x] Audit homepage composition so top-position banner and hero are rendered once each under valid states.
  - [x] Harden placement resolver logic for `TOP`/`HERO`/fallback mapping.
  - [x] Add route-level visual regression checks for homepage banner stack order.
- [x] Harden analytics/count integrity.
  - [x] Audit analytics data contracts (API payload shapes vs client count readers) and remove fragile assumptions.
  - [x] Add count source-of-truth mappers with runtime guards and typed fallbacks.
  - [x] Add targeted tests for partial-success fetch behavior and KPI count correctness.
- [x] Validate vendor registration review visibility + email lifecycle.
  - [x] Ensure operations review surfaces expose pending vendor registrations and status transitions reliably.
  - [x] Verify approval/rejection actions dispatch expected email notifications through service layer.
  - [x] Add audit logging/observability markers for vendor-review email send outcomes.
- [x] Redesign public-content editor for non-technical admins.
  - [x] Add page/section selector UX with safe defaults and explicit context labels.
  - [x] Replace raw JSON-style editing with structured section blocks and guided field controls.
  - [x] Add live preview mode mirroring published render behavior.
  - [x] Enforce upload-first media workflow in editor and persist canonical managed asset metadata.
  - [x] Ensure publish-time fallback content remains consistent between DB content, cache, and frontend rendering.
- [x] Finalize validation and documentation.
  - [x] Run lint, typecheck, targeted Vitest, route/sidebar audits for touched scope.
  - [x] Update architecture/docs/history/checkpoint records after implementation.

---

## Feature Planning Queue (2026-04-08) — Product Discovery Filter/Sort Contract Hardening

> **Section summary:** Implementation queue for category-tag filtering correctness, query-state synchronization, and single-source-of-truth filter/sort configuration.

- [x] Audit current category/filter/sort behavior across home and products pages.
  - [x] Map all current query inputs (`category`, `search`, `sort`, price, rating, vendor, location) and identify non-functional paths.
  - [x] Document mismatches between category slug values, enum values, and product subcategory storage.
  - [x] Confirm where filtering is local-only vs API-backed and capture expected source-of-truth behavior.
- [x] Introduce canonical product discovery configuration.
  - [x] Add shared config for category groups, URL slugs, supported sort keys, and default filter state.
  - [x] Replace hardcoded home/category lists with config-derived structures.
  - [x] Ensure filter controls consume same config primitives as category tags.
- [x] Implement query-state parser/serializer contract.
  - [x] Add URL query parsing helper to hydrate products-page filters/sort/search state.
  - [x] Add query serializer helper so home tags/filter controls write canonical params.
  - [x] Keep backward compatibility for existing shared links where feasible.
- [x] Wire products discovery behavior end-to-end.
  - [x] Update products page/content to apply URL-driven category/search/sort state on initial load.
  - [x] Add deterministic sorting behavior (`new`, `trending`, `price-low`, `price-high`, etc.) tied to canonical keys.
  - [x] Align local filtering and API query behavior so counts/pagination/results remain consistent.
- [x] Validate filtering tools and single-source config adherence.
  - [x] Add tests for home category tag click-through -> products filtered result behavior.
  - [x] Add tests for sort query behavior and query-state persistence across reload/share.
  - [x] Add tests verifying filter sidebar selections map to canonical query/config values.
- [x] Finalize documentation and architecture notes.
  - [x] Update `.ai-system/agents/system-architecture.md` with product discovery query flow and config module reference.
  - [x] Log implementation decisions/checkpoints/history updates in `.ai-system` artifacts.

---

## Session Hotfix Queue (2026-04-08) — Home/Product/Banner/Data Integrity

> **Section summary:** Immediate bug-fix slice for discount rendering, top-banner image-only behavior, and stale/zero data regressions on home + operations vendor metrics.

- [x] Fix product-card discount rendering contract.
  - [x] Hide discount badge/old-price rendering when discount is zero or invalid.
  - [x] Ensure discounted/current price remains visible on narrow/mobile cards.
- [x] Enforce top-banner image-only display contract.
  - [x] Remove top-banner title/text overlay rendering from frontend strip.
  - [x] Allow TOP banners with empty title while still requiring an image.
  - [x] Update operations banner editor UX so TOP position does not force title input.
- [x] Stabilize home and vendor-stat data reliability.
  - [x] Add Prisma reconnect retry hardening to server data fetchers used by home/products/vendors pages.
  - [x] Add hero/top dedupe guard for accidentally duplicated banner content.
  - [x] Replace multi-request vendor-status loading in operations vendors page with admin all-status paginated fetch.
- [x] Add/refresh focused regression coverage.
  - [x] Update top-banner tests for image-only + empty-title TOP behavior.
  - [x] Add product-card discount rendering tests.
  - [x] Re-run targeted Vitest suites for touched scope.

---

## Session Feature Queue (2026-04-08) — Vendor Marketing Separation + Smart Refresh

> **Section summary:** Follow-up implementation slice to separate marketing moderation concerns from product media, add resilient avatar fallbacks, and reduce operations request churn with in-memory cached silent refresh.

- [x] Enforce vendor marketing-content entity boundaries.
  - [x] Restrict admin moderation feed to marketing-scoped vendor submissions.
  - [x] Clarify operations copy/navigation that moderation is marketing-review scope.
  - [x] Require/normalize target-platform metadata for vendor marketing submissions.
- [x] Add robust image/avatar fallback behavior.
  - [x] Introduce reusable entity avatar component with icon/initial fallback and image-failure recovery.
  - [x] Apply fallback avatar rendering to operations vendors/users views and shared `VendorCard`.
- [x] Introduce non-abusive operations data retrieval strategy.
  - [x] Add shared in-memory smart-resource hook with stale-time cache, background refresh, and compare-before-state-update guard.
  - [x] Migrate operations vendors, vendor-content moderation, and vendor marketing-content pages to smart-resource retrieval.
  - [x] Add manual refresh controls and non-blocking refresh indicators on migrated pages.
- [x] Validate touched scope.
  - [x] Run focused lint for edited files.
  - [x] Run focused Vitest regression suites for vendor/banner/product contracts.

---

## Feature Planning Queue (2026-04-08) — Unified In-Memory Data Runtime + Seamless Refresh

> **Section summary:** Cross-project reliability feature to preload role-accessible data, keep it in-memory, apply safe optimistic updates, and refresh from DB with minimal visual interruption.

- [x] Define runtime architecture contracts and migration boundaries.
  - [x] Add `lib/data-runtime` module blueprint (registry, store, reconciler, mutation coordinator, prefetch, telemetry).
  - [x] Define canonical resource key policy, scope policy (public/auth/role), and cache invalidation contract.
  - [x] Document coexistence strategy for legacy fetch patterns during phased migration.

- [x] Build config-driven resource registry + policy system.
  - [x] Implement declarative `resourceRegistry` entries with stale/ttl/retry/compare policy fields.
  - [x] Add runtime config defaults in `lib/config` for spinner thresholds, retry backoff, and silent-refresh behavior.
  - [x] Ensure policy overrides are typed and domain-safe.

- [x] Implement centralized runtime store and reconciler.
  - [x] Build in-memory resource state graph with status/timestamp/in-flight metadata.
  - [x] Implement semantic compare pipeline to suppress no-op UI updates.
  - [x] Add stale-safe merge behavior that preserves visible data during background refresh.

- [x] Implement mutation coordinator with optimistic safety.
  - [x] Add optimistic patch application and deterministic rollback on backend failure.
  - [x] Add reconciliation hooks for server-normalized payloads after successful commits.
  - [x] Enforce domain-level error mapping so mutation failures do not silently corrupt runtime state.

- [x] Add role-aware warm-start prefetch at app bootstrap.
  - [x] Resolve auth/role context and preload role-accessible resources from registry on initial app load.
  - [x] Gate prefetch breadth by route/feature scope to avoid over-fetching.
  - [x] Ensure first paint uses warm in-memory data where available.

- [ ] Migrate high-impact pages from page-local fetch to runtime subscriptions.
  - [ ] Operations surfaces: dashboard, users, vendors, products, bug reports, orders.
    - [x] Completed: users, vendors, bug reports, vendor-content, marketing-content.
    - [ ] Blocked this run: dashboard/orders remain server-auth SSR metric surfaces; products migration deferred due large coupled CRUD form state and requires dedicated split to avoid regression risk.
  - [ ] Core buyer surfaces: home, products, cart/checkout support data, orders, profile/wallet notifications.
    - [x] Completed: home, products, checkout vendor-verification support data, wallet, notifications/preferences.
    - [ ] Blocked this run: orders and profile remain server/component domain flows requiring separate runtime API normalization pass.
  - [x] Remove duplicate per-page loading flags where runtime status already provides equivalent state on migrated pages.

- [x] Harden transient DB/API error handling in runtime.
  - [x] Add retry with jitter/backoff + bounded attempts for connection-closed class errors.
  - [x] Add circuit-breaker/cooldown logic to avoid refresh storms.
  - [x] Preserve last-good data during retry windows and show non-blocking status cues.

- [ ] Add observability and quality gates for runtime behavior.
  - [x] Track load latency, refresh churn, no-op refresh ratio, retry counts, and mutation rollback frequency.
  - [x] Add regression tests for optimistic updates/reconcile foundations and silent-refresh/no-op behavior in runtime core.
  - [ ] Run full matrix (`lint`, `tsc --noEmit`, targeted/full Vitest, route audits) after staged migrations.

- [x] Finalize architecture/docs synchronization.
  - [x] Update `.ai-system/agents/system-architecture.md` with unified runtime data flow.
  - [x] Record decisions in `.ai-system/memory/project-decisions.md` and update checkpoint/history artifacts.
  - [x] Mark completion status and residual risks in queue and summary docs.

---

## Runtime Closeout Queue (2026-04-09) — Post-Cloud Gap Closure

> **Section summary:** Follow-up closure plan for cloud-session blockers plus newly reported admin/dashboard UX issues.

- [x] Fix vendor detail runtime crash on missing analytics object.
  - [x] Normalize vendor analytics fallback in operations vendor detail when API returns flat metrics.
  - [x] Guard `totalSales`/`averageRating` rendering against undefined analytics payloads.

- [x] Improve admin verification evidence visibility sweep.
  - [x] Expand vendor verification document rendering to support both structured document arrays and legacy URL-key payloads.
  - [x] Add clearer document labeling in vendor review detail view.
  - [x] Add inline preview for ad creative and transfer proof in operations ad-application details.

- [x] Restore dashboard shell consistency on non-operations dashboard-linked pages.
  - [x] Ensure vendor/admin sidebar shell wraps `/analytics`.
  - [x] Ensure vendor/admin sidebar shell wraps `/wallet`.
  - [x] Ensure vendor/admin sidebar shell wraps `/profile` and `/notifications`.
  - [x] Make desktop sidebar navigation vertically scrollable for long nav sets.

- [x] Close remaining runtime migration blockers from cloud run.
  - [x] Operations dashboard/orders runtime normalization strategy for server-auth SSR flows.
  - [x] Operations products migration split (isolate CRUD form state from list/resource runtime subscription).
  - [x] Buyer orders/profile runtime API normalization and migration pass.

- [ ] Final closeout validation + evidence capture.
  - [x] Run targeted Vitest suites for modified dashboard/admin views.
  - [ ] Capture UI evidence: sidebar visibility on analytics/wallet/profile/notifications + vendor/ad verification document previews.
    - [ ] Execute checklist in `.ai-system/checkpoints/runtime-closeout-ui-evidence-2026-04-09.md` and attach screenshots.
  - [x] Re-run full quality matrix after blocker migrations complete.

---

## Feature Planning Queue (2026-04-09) - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning

> **Section summary:** Planning backlog from `plan-feature.md` directive to expose a real notifications inbox, make preference toggles truthful, and reduce noisy runtime processing refresh behavior.

- [x] Package single-pass cloud execution handoff for this feature.
  - [x] Added temporary execution plan: `.ai-system/planning/cloud-session-temp-plan-2026-04-09-notification-assurance.md`.
  - [x] Added copy/paste cloud kickoff prompt for all-slices implementation with mandatory validation + .ai-system update rules.

- [x] Establish canonical notifications UX route contract.
  - [x] Make `/notifications` the user inbox timeline route and keep `/notifications/settings` for preferences only.
  - [x] Ensure buyer/vendor/admin shell parity and sidebar/nav discoverability for both routes.
  - [x] Reuse existing notifications APIs/components where possible; avoid schema migration in this feature pass.

- [x] Deliver full-page inbox experience from existing notification services.
  - [x] Build `NotificationInbox` page composition using existing read/unread, mark-read, mark-all-read, delete, and CTA link actions.
  - [x] Consolidate overlapping bell/drawer/context fetch patterns so unread count and inbox list stay in sync.
  - [x] Add empty/error/loading states with clear retry actions.

- [x] Introduce config-driven notification template intelligence.
  - [x] Add canonical template config per notification type (title/body variants, CTA labels, optional media/preview metadata).
  - [x] Add resolver service that enriches messages using existing user context and domain metadata (signup date, verification transitions, ad/content status, order/payment lifecycle).
  - [x] Integrate resolver into `dispatchNotification` while preserving existing channel preference and mandatory delivery logic.

- [x] Fix preference toggle integrity and enforceability semantics.
  - [x] Remove misleading per-toggle behavior where backend collapses values into coarse flags without clear UI explanation.
  - [x] Explicitly separate editable toggles from enforced mandatory channels.
  - [x] Add lock/tooltip/info display for non-editable controls and align save/reset copy with actual persistence behavior.

- [x] Tune refresh cadence and global processing notifier behavior.
  - [x] Reduce aggressive polling/auto-refresh defaults across notifications/runtime resources.
  - [x] Prefer user-triggered refresh plus long idle-time refresh windows (5-10 minutes) for non-critical domains.
  - [x] Replace `Processing... <task count>` with threshold-based copy and suppress short/background-only churn.
  - [x] Keep real-time feedback for explicitly user-triggered long-running flows (checkout/payment/order status transitions).

- [x] Add regression coverage for notifications and runtime feedback contracts.
  - [x] Inbox route rendering and role-aware shell/navigation coverage.
  - [x] Preference toggles: editable vs enforced lock semantics and persistence mapping.
  - [x] Template resolver contract tests (context-aware title/body/CTA selection).
  - [x] Runtime activity copy threshold and suppression behavior tests.

- [x] Finalize validation and documentation sync.
  - [x] Run targeted lint, `tsc --noEmit`, focused Vitest suites, and route/sidebar audits for touched scope.
  - [x] Update `.ai-system/agents/system-architecture.md`, `.ai-system/agents/repair-system.md`, `.ai-system/memory/project-decisions.md`, `.ai-system/checkpoints/session-log.md`, and `.ai-system/summaries/dev-history.md`.

---

## Feature Planning Queue (2026-04-13) - Commerce Assurance Wave: Order-to-Payout Automation + Banner Parity + Vendor Contact Safety

> **Section summary:** Cloud continuation execution block for deterministic order lifecycle/payout automation, banner preview-runtime parity, and guarded vendor WhatsApp handoff safety.

- [x] Blocker accounting and execution handoff alignment.
  - [x] Noted missing source temp-plan file in this clone: `.ai-system/planning/cloud-session-temp-plan-2026-04-13-commerce-assurance-wave.md`.
  - [x] Proceeded with implementation using locked scope from cloud prompt slices while preserving deterministic/idempotent behavior.

- [x] Slice 1 — Order-to-Payout automation with deterministic lifecycle transitions.
  - [x] Replaced invalid/non-enum order transition map with canonical `OrderStatus` transitions only.
  - [x] Added idempotent no-op handling when requested status already equals persisted status.
  - [x] Added transaction-safe delivered-order payout automation (`TransactionType.PAYOUT`) for paid orders.
  - [x] Enforced payout idempotency via deterministic reference + existing payout check before crediting vendor wallet.
  - [x] Added focused route tests for invalid transition rejection, payout creation path, and idempotent replay.

- [x] Slice 2 — Banner placement preview parity with runtime rendering.
  - [x] Updated shared `BannerPlacementPreview` so TOP placement remains image-only (no title overlay), matching `TopAdBanner` runtime contract.
  - [x] Added focused preview tests for TOP image-only behavior and HERO title-overlay continuity.

- [x] Slice 3 — Vendor contact safety guard for WhatsApp handoff.
  - [x] Added public guard page (`/contact/whatsapp`) that shows safety disclaimer before external handoff.
  - [x] Rewired vendor detail WhatsApp CTA to route through guard-first page instead of direct external deep-link.
  - [x] Added focused tests for safe handoff path and invalid-number blocking behavior.

- [x] Validation gates for touched scope.
  - [x] Targeted lint for modified route/page/component/test files.
  - [x] `npx tsc --noEmit`.
  - [x] Focused Vitest suites for order status route, contact guard page, banner preview parity, and top-banner contract.

---

## UI Adjustment Queue (2026-04-13) - Konga-inspired Banner Composition + Category Navigation Accessibility + Category Tag Filter Sync

> **Section summary:** UI-focused refinement pass for home ad composition, menu/category discoverability, and products-page category-tag filter correctness.

- [x] Hero + side banner composition refresh.
  - [x] Refactored home banner deck to a Konga-inspired split layout (hero surface + sidebar ad rail) using existing `HERO` + `SIDEBAR` banner positions.
  - [x] Kept config/data-driven behavior and existing banner links/actions fallback paths.

- [x] Hero banner rendering contract refinement.
  - [x] Updated hero carousel viewport to image-first rendering and removed direct title/description copy from slide surface.
  - [x] Preserved `View more` (`Know More`) CTA and modal detail experience for full content access.
  - [x] Added focused regression for image-first hero visual contract.

- [x] Hamburger/menu category accessibility.
  - [x] Added expandable mobile categories section inside hamburger menu.
  - [x] Added desktop category strip with `All Categories` dropdown + quick category links.
  - [x] Added focused header menu test for category-link accessibility in hamburger flow.

- [x] Category tag filtering sync fix.
  - [x] Synchronized products-page local filter/search/sort state with URL query params via `useSearchParams` + canonical parser.
  - [x] Fixed category-tag click-through behavior so horizontal category nav applies filtering immediately without requiring sidebar interaction.
  - [x] Updated focused products discovery tests for query-state synchronization.

- [x] Validation gates for touched scope.
  - [x] Targeted lint + `npx tsc --noEmit`.
  - [x] Focused Vitest suites: home category click-through, products discovery contract, header category menu, and banner visual contract.
