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

- [ ] Resolve signup validation and role option bugs:
  - [ ] Add `Worker` to role options in `app/signup/components/UserSelect.tsx` and any supporting UserType union/type definitions
  - [ ] Add `Worker` to applicable role-to-dashboard route mapping
  - [ ] Investigate and fix intermittent ‘fill all required fields’ error in signup workflow (likely a form state/partial/validator or stage skip bug)
  - [ ] Add regression test coverage for signup step progression and validation state
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
  - [x] Return actionable validation and failure messages without leaking sensitive data.
- [x] Enforce Cloudinary-first upload governance platform-wide.
  - [x] Fix unauthenticated signup upload failures by allowing scoped guest uploads for `profile` and `verification-doc` when `skipPersistence=true`.
  - [x] Replace raw screenshot/image URL entry paths (including bug report flow) with managed upload workflow.
  - [x] Reject unsupported raw URL payloads for upload-managed fields.
  - [x] Standardize upload metadata contract across forms and APIs.
- [x] Re-verify service readiness posture for Resend, Cloudinary, Upstash, Prisma, wallet, and payment paths with production-safe feature-flag behavior.
