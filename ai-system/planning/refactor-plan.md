# Refactor & Modernization Plan (March 2026)

> **Purpose:** Capture the current architecture, define the desired end-state, and create an actionable, verifiable implementation plan for a modular, config-driven, role-aware MyHarvestHub platform.

---

## 1. Current State (as of 2026-03-19)

### Architecture Summary

- **Framework:** Next.js App Router (app/ folder) with route groups for auth, buyer, vendor, and admin.
- **Routing & Layouts:** Layouts are organized under `app/(auth)`, `app/(buyer)`, `app/vendor`, and `app/admin`. Public pages are in `app/` root and in grouped folders.
- **Auth:** JWT-based auth stored in an `accessToken` cookie. Validation is done via `lib/utils/jwt.ts` and enforced by `middleware.ts`.
- **RBAC:** Role-based access enforced in `middleware.ts` using hardcoded route arrays and `UserRole` checks; some pages use role-specific layouts.
- **Data Layer:** A mock in-memory database lives in `lib/data/database.ts` (mock data + CRUD helpers). A Prisma adapter exists in `lib/data/prismaAdapter.ts` and is toggled via `USE_PRISMA=true` or `NODE_ENV=production`.
- **Config:** Most configuration is via `.env` / `.env.local` (environment variables) and a handful of constants in `lib/constants/index.ts`. Some business rules are hardcoded in code.
- **UI/Theme:** Uses Tailwind and Ant Design (`antd`) with a theme provider in `app/providers.tsx`. Components live in `components/` (core UI in `components/ui/`).
- **Service Integrations:** Prisma, Upstash Redis, Cloudinary, Resend (email), and local mock data.
- **Testing:** Vitest is configured; some unit tests exist under `lib/__tests__` and `components/__tests__`.

### Key File Map

- `app/` – Next.js pages, layouts, route groups, and API routes.
- `app/api/` – Server actions / route handlers for auth, products, orders, etc.
- `lib/data/` – Mock database layer + Prisma adapter.
- `lib/constants/` – Platform enums and static values.
- `lib/utils/` – Helpers (JWT, password hashing, formatting, etc.).
- `lib/contexts/` – React context providers (auth, notifications, toast, etc.).
- `lib/theme/` – Ant Design theme definitions.
- `components/` – UI component library and feature components.
- `prisma/` – Prisma schema, migrations, seed, generated client.
- `ai-system/` – Documentation, plans, decisions, and tooling guides.

### RBAC Approach (Current)

- **Roles:** `ADMIN`, `VENDOR`, `BUYER` (defined in `lib/constants/index.ts`).
- **Route protection:** `middleware.ts` defines `publicRoutes`, constructs a guard using hardcoded arrays, and checks `pathname.startsWith`.
- **Navigation:** There are role-specific dashboards and layouts, but the security model is centralized in middleware.
- **Limitations:** Hardcoded route lists are brittle, hard to audit, and not automatically synced with page hierarchy. No centralized policy layer, no defend-by-default strategy, and no explicit mapping of roles to route patterns.

### Config-Driven Surface (Current)

- **Environment variables:** `.env` / `.env.local` with keys like `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `RESEND_API_KEY`, `USE_PRISMA`, etc.
- **Static constants:** `lib/constants/index.ts` contains enums and lookup maps (e.g., `UserRole`, `OrderStatus`, campus list).
- **Hardcoded settings:** Route permissions inside `middleware.ts`, route-to-dashboard mapping, and some UI theme choices (colors in theme config) are embedded in code.

---

## 2. Desired End-State (Target Architecture)

### Modular Architecture

- **Feature modules:** Each domain (auth, product, order, wallet, vendor, admin, marketing) lives in a self-contained module with its own routes, UI components, services, and data adapters.
- **Core/shared:** Shared utilities, types, components, and configuration live in `lib/core/*` or similarly named folders.
- **Clear boundaries:** Minimal cross-module dependencies; modules communicate through well-defined interfaces.

### Config-Driven & Declarative

- **Centralized config:** Create a canonical `lib/config/*` module where environment variables and runtime settings are normalized, validated, and typed.
- **Feature flags:** Enable toggles for key behavior (e.g., `USE_PRISMA`, `ENABLE_MOCK_BACKEND`, `ENABLE_EMAIL`, `ENABLE_BETA_FEATURE_X`).
- **Route + policy config:** Define routes and RBAC policies declaratively (e.g., `routes.ts` with per-route metadata: `roles`, `public`, `layout`, `featureFlag`).

### RBAC Strategy (Role-Aware, Deny-by-Default)

- **Single source of truth:** Central policy registry that maps routes to allowed roles and/or permissions.
- **Guard abstraction:** Replace hardcoded middleware arrays with a reusable guard that uses route metadata.
- **Layout/route integration:** Use `app/` route metadata and layout wrappers to enforce access and render role-aware UI (e.g., show/hide nav links based on role).
- **Auditability:** Enable a simple report (CLI or endpoint) that lists all routes and their required roles/flags.

### Public Content Management

- **Admin-editable content:** Introduce a lightweight CMS-style model for banners, FAQs, About, Terms and Conditions, Policy, and marketing copy stored in the database (Prisma schema) and editable via admin UI.
- **Runtime caching:** Cache public content (in-memory / Redis) with explicit invalidation endpoints triggered after updates.

### Notifications & Messaging

- **Email reliability:** Ensure all email paths (verification, password reset, order updates, vendor notifications) are resilient, non-blocking, and have retry/recovery when the email provider is unavailable.
- **In-app notifications:** Standardize a notification model in the database with a client consumer, including read/unread state and push support.
- **Push notifications:** Add support for web push (and optionally mobile) with explicit permission checking and safe fallback.

### Caching, Assets & Cloud Storage

- **DB/Redis caching:** Introduce a cache layer for frequently read data (banners, product lists, vendor lists) with predictable invalidation and namespaced keys.
- **Cloud asset handling:** Standardize upload flows (images, documents) to Cloudinary (or equivalent), persist metadata in the database, and ensure upload failures do not break the client.
- **Cache correctness:** Ensure cached data is invalidated when underlying resources change (e.g., product updates, banner publish state) and that cache miss/refresh is safe.

### Design System Evolution

- **Tokens & themes:** Rethink tokens (colors, spacing, typography) in a single source; use Tailwind theme + Ant Design token layering.
- **Component library:** Build reusable UI primitives (buttons, inputs, cards, form fields) that are used across sign-up and checkout.
- **Sign-up flow overhaul:** Bring sign-up / onboarding components into the design system; eliminate outdated “relic” styles and make flow responsive, WCAG-friendly, and consistent.

### Non-negotiable Modular Architecture Principles (Blueprint)

- **Single route per feature:** Remove role-specific route directories (`/(buyer|vendor|admin)` for the same feature). One route per logical feature with dynamic rendering and policy checks.
- **Policy-driven role access:** Central policy in `lib/rbac/policies.ts` + `lib/permissions.ts`. A role capability layer (`getRoleCapabilities(role)` and `canAccess(feature, action)`).
- **Dynamic rendering wrappers:** `RoleGuard`, `PermissionsGate`, `AsyncContent`, `DataFetchBoundary`, and `RoleAwareFeatureRenderer` used across interface.
- **Config-driven metadata:** `routes.ts`/`nav.ts`/`modules/*` contain declarative feature metadata, labels, permissions, endpoint keys.
- **Shared core UI layer:** `components/ui` should provide minimal primitives (`Card`, `Button`, `Input`, `Table`) with AntD adaptors, not full per-role pages.
- **Remove duplication:** Consolidate duplicate view components from admin/vendor/buyer into one reusable module with props/config.

### Additional required modules

- `lib/config/env.ts`, `lib/config/features.ts`, `lib/config/index.ts` (already built as baseline)
- `lib/rbac/policies.ts`, `lib/permissions.ts`, `lib/modules.ts`
- `config/publicContent.ts` + admin/public content API + caching layer
- `lib/services/emailDeliveryLog.ts` (for email reliability), existing now in place but confirm.

### Resilience & Safety

- **Data reliability:** Ensure Prisma adapters are complete; if a domain is not implemented, fail fast with clear error messages.
- **Retry/backoff:** For external services (Redis, email, Cloudinary, push providers), add retry with backoff and circuit-breaker behavior.
- **Email & notification durability:** Ensure email sends are non-blocking and retried; ensure in-app notifications are persisted and can be replayed if delivery fails.
- **Idempotency:** Ensure critical APIs (order creation, wallet deposit) are idempotent.
- **Offline resilience:** For the client, ensure the app handles network dropouts gracefully (existing `OfflineNotice` is a start).

### Production Safety Constraints

- **Prisma migrations:** Only apply migrations via explicit workflow; add lint to prevent running migrations in CI without review.
- **Secrets safety:** Ensure secrets are never logged; validate required env vars at startup.
- **Cache correctness:** Ensure Redis keys are namespaced and invalidated properly (existing `REDIS_PREFIX`).
- **Safe retries:** Do not allow unbounded retry loops in APIs (limit retries).

---

## 3. Implementation Strategy

### Phase A — Planning & Documentation (current step)

1. Capture current architecture & identify key risk areas. (this document)
2. Define the desired end-state and how to measure completion.
3. Update `ai-system` docs to persist understanding.
4. Ensure all code changes are reflected in `ai-system` artifacts (task queue, plan, decisions, session log, dev history) so future runs are based on the latest state.

### Phase B — Core Refactor

1. Create a canonical config module (`lib/config/*`) and migrate env access away from ad-hoc `process.env` usage.
2. Build a RBAC policy system and replace `middleware.ts` route arrays with declarative policies.
3. Standardize route metadata (e.g., `routeConfig` objects or `routeMeta` exports) for each page.
4. **Status update (2026-03-20):** `lib/config` typed env + feature flags implemented and wired into key services (`email`, `push`, `redis`, Cloudinary root folder, data layer Prisma toggle). Middleware now uses declarative route policies from `lib/rbac/policies.ts`.

### Phase C — Data Layer / Prisma

1. Define shared adapter interface for data operations.
2. Complete Prisma adapter coverage for all domains (users, products, orders, carts, wallets, vendors, banners, notifications, etc.).
3. Implement a robust notifications system (email + in-app + web push) with retry/backoff, persistence, and admin controls.
4. Implement a cache layer for public content and heavily-read queries (banners, vendor lists, featured products) with explicit invalidation.
5. Ensure `lib/data/database.ts` falls back to safe mocks only when explicitly enabled.
6. **Status update (2026-03-20):** Introduced shared `CrudAdapter` interface (`lib/data/adapterTypes.ts`) and enforced conformance in `lib/data/prismaAdapter.ts` with `satisfies`.

### Phase D — Design System & Sign-up UX

1. Audit UI components in the sign-up flow and identify outdated patterns.
2. Develop a modern component library with consistent spacing, typography, and form behavior.
3. Refactor sign-up steps to use shared form components and a coherent layout.

### Phase E — Testing & Validation

1. Add unit tests for auth + RBAC middleware and config module.
2. Add integration tests for key flows (login, signup, order placement).
3. Validate Prisma migration + seed scripts in CI.

---

## 4. Risks / Rollback Strategy

- **Risk:** Refactor breaks auth/route protection and allows unauthorized access.
  - **Mitigation:** Add automated tests for all guarded routes before refactor, and deploy changes behind a feature flag.
  - **Rollback:** Revert to previous `middleware.ts` and restore hardcoded route lists.

- **Risk:** Incomplete Prisma domain causes runtime failures in production.
  - **Mitigation:** Keep `USE_PRISMA=false` as the default in development; require explicit enable and validate all adapter calls at startup.
  - **Rollback:** Revert to fully mock-backed backend until adapters are complete.

- **Risk:** Design system changes regress UI in critical flows (signup/cart).
  - **Mitigation:** Use visual regression checklists (manual) and run component snapshot tests where possible.
  - **Rollback:** Keep old component variants behind a “legacy” wrapper until new design is stable.

---

## 5. Next Step (After Planning)

When ready, implement Phase B (Core Refactor). Start by adding a typed `lib/config` module and a centralized RBAC policy file, then incrementally update middleware and route layouts to use the new policy.
