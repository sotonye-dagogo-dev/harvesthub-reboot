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
- [ ] Solidify CI/Dev workflow (lint, build, test scripts)

---

## Phase 2 — Core Features

> **Section summary:** Key product functionality needed for a minimum viable marketplace.

- [ ] Buyer product browsing, filtering, and search
- [ ] Cart management, checkout flow, and order placement
- [ ] Vendor storefront management (product CRUD, inventory)
- [ ] Wallet system (deposit, withdrawal, balance) with mock transactions
- [ ] Order management dashboard (vendor + buyer views)
- [ ] Promotional banners and campaigns
- [ ] Role-based access control for routes and API endpoints

---

## Phase 3 — Secondary Features

> **Section summary:** Enhancements that improve usability and business value.

- [ ] Reviews & ratings system for products and vendors
- [ ] Delivery and pickup scheduling (church pickup, home delivery)
- [ ] Notifications system (in-app & email) and optional web push
- [ ] Caching layer for public and frequently-read content (Redis + invalidation)
- [ ] Cloud asset handling (upload metadata persistence, safe failure paths)
- [ ] Analytics dashboards for vendors and admins
- [ ] Search and filtering improvements (categories, locations)

---

## Phase 4 — Quality & Polish

> **Section summary:** UX polish, reliability hardening, and readiness for scaling.

- [ ] Full test coverage for critical flows (auth, checkout, orders)
- [ ] Accessibility audit and fixes (keyboard navigation, aria labels)
- [ ] Performance profiling and bundle optimization
- [ ] Error/empty/loading states refined across the app
- [ ] Revisit all mock-backend logic for eventual Prisma migration

---

## Phase 5 — Launch Preparation

> **Section summary:** Final steps to prepare for production deployment.

- [ ] Production environment configuration (env vars, secrets)
- [ ] Security review (auth, input validation, secrets handling)
- [ ] Deployment pipeline set up (GitHub Actions or CI/CD)
- [ ] Documentation & onboarding docs complete

---

## Completed

> **Section summary:** Tasks that have already shipped in the current repository state.

- [x] Rename and rebrand Martgram to MyHarvestHub (project metadata, README)
- [x] Upgrade Next.js to v15 and React to v19
- [x] Integrate Ant Design and Tailwind with purple-first theme
- [x] Create initial mock data and in-memory database layer
- [x] Establish basic auth (login, register, logout) APIs
