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
- [ ] Audit and modernize the UI design system across core flows (signup, product browsing, carts, checkout, dashboards) using consistent tokens and responsive layouts
- [x] Refactor to single-route-per-feature architecture: move vendor/admin/buyer variations into dynamic routes/components + `RoleAwareFeatureRenderer`
- [x] Fully deprecate role-specific pages and ensure all functional content is accessible through config-driven single pages (e.g., /orders, /wallet, /profile) with role-based behavior inside.
- [x] Unify duplicated components (e.g., ProductCard, OrderCard, KPI Card, Button, Table, Form Field) across buyer/vendor/admin paths with configuration and slot props.
- [x] Remove redundant role-specific pages and deprecate (buyer/admin/vendor) page directories once merged.
- [x] Build `lib/permissions.ts`, `lib/rbac/policies.ts`, and `RoleGuard`/`PermissionsGate` wrappers.
- [x] Establish CI validation checks for Prisma migrations, required env vars, and linting
- [ ] Add a small admin-editable public content model (banners/FAQ/About/Terms and Conditions/Policy, etc.) and caching strategy (Redis + invalidation endpoint)

---

## Up Next

> **Section summary:** Tasks planned for the next sprint. Not yet started.

- [ ] Migrate mock backend to Prisma + PostgreSQL (using `prisma/schema.prisma`)
- [ ] Add payment gateway integration stubs (Paystack, Flutterwave)
- [ ] Implement notifications (email + in-app) using `resend` / `web-push`
- [ ] Add vendor analytics dashboards (sales, orders, revenue)
- [ ] Add public ad application page + footer CTA link (accessible to unauthenticated users)
  - [ ] Create `app/ad-application` page with form content and static information
  - [ ] Add backend endpoint `app/api/ads/apply/route.ts` to receive submissions
  - [ ] Ensure no auth guard in middleware for this page (public route access)
  - [ ] Add a clear footer link text like “Apply to Advertise” in `components/layout/Footer` or equivalent
  - [ ] Add tests: route accessibility + form submit behavior + footer link presence

- [ ] Fix role-based dashboard routing for admin/vendor:
  - [ ] Create `app/admin/dashboard/page.tsx` and `app/vendor/dashboard/page.tsx` or redirect to existing indexed pages
  - [ ] Validate route exists in `lib/rbac/routeConfig.ts` and `components/layout/Sidebar.tsx`/`lib/navigation.ts`
  - [ ] Add route existence audit and fail-safe nav filter to avoid broken links

- [ ] Enhance ad application flow (payment + duration pricing):
  - [ ] Extend `AdApplication` model (Prisma + types) with `paymentMethod`, `proofOfTransferUrl`, `amountPaid`, `durationType`, `durationValue`, `approvedBy`, etc.
  - [ ] Add admin rate config model `AdRateConfig` (per-hour and per-day rates) and endpoints under `/api/admin/ads/rates`
  - [ ] Update `app/advertise/page.tsx` to capture payment method and proof-of-transfer upload (and price estimate)
  - [ ] Update admin review page to show payment info and set active duration based on price and rates
  - [ ] Add tests for rates, payments, and timeline computation.

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
