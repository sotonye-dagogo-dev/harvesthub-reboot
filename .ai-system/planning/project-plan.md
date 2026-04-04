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

## Completed

> **Section summary:** Tasks that have already shipped in the current repository state.

- [x] Rename and rebrand Martgram to MyHarvestHub (project metadata, README)
- [x] Upgrade Next.js to v15 and React to v19
- [x] Integrate Ant Design and Tailwind with purple-first theme
- [x] Create initial mock data and in-memory database layer
- [x] Establish basic auth (login, register, logout) APIs
