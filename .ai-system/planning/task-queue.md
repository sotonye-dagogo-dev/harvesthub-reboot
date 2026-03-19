# Development Task Queue

> **Overview:** Sprint-level task queue. Agents execute tasks top to bottom within the current sprint. When a task is completed, mark it [x] and add a checkpoint entry. Future tasks are queued below for prioritisation in the next sprint.

---

## Current Sprint

> **Section summary:** High-priority refactor tasks that align the codebase to a modular, config-driven, role-aware architecture.

- [x] Create a refactor plan document capturing current architecture and target state (`.ai-system/planning/refactor-plan.md`)
- [ ] Create a centralized runtime config module (`lib/config/*`) and migrate scattered `process.env` access into typed helpers
- [ ] Replace hardcoded RBAC route lists in `middleware.ts` with a declarative policy registry and per-route metadata
- [ ] Add unit tests for RBAC guards (middleware) and config normalization
- [ ] Implement a shared data adapter interface and ensure `USE_PRISMA` / `ENABLE_MOCK_BACKEND` toggles are explicit and safe
- [ ] Add robust email + notification infrastructure (retry/backoff, persistence, in-app and push delivery)
- [ ] Add caching layer for public content and heavily-read data (Redis cache + invalidation and key namespacing)
- [ ] Implement cloud asset handling best practices (upload metadata persistence, safe failure modes, and cache busting for media)
- [ ] Audit and modernize the UI design system across core flows (signup, product browsing, carts, checkout, dashboards) using consistent tokens and responsive layouts
- [ ] Establish CI validation checks for Prisma migrations, required env vars, and linting
- [ ] Add a small admin-editable public content model (banners/FAQ/About/Terms and Conditions/Policy, etc.) and caching strategy (Redis + invalidation endpoint)

---

## Up Next

> **Section summary:** Tasks planned for the next sprint. Not yet started.

- [ ] Migrate mock backend to Prisma + PostgreSQL (using `prisma/schema.prisma`)
- [ ] Add payment gateway integration stubs (Paystack, Flutterwave)
- [ ] Implement notifications (email + in-app) using `resend` / `web-push`
- [ ] Add vendor analytics dashboards (sales, orders, revenue)

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
