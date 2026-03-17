# Development Task Queue

> **Overview:** Sprint-level task queue. Agents execute tasks top to bottom within the current sprint. When a task is completed, mark it [x] and add a checkpoint entry. Future tasks are queued below for prioritisation in the next sprint.

---

## Current Sprint

> **Section summary:** Tasks actively being worked on. Agents pick the first incomplete task.

- [x] Ensure the repository builds cleanly (`npm run build` + `npx tsc --noEmit`)
- [ ] Complete missing API routes for orders, carts, and wallets under `app/api/`
- [ ] Add role-based layout guards (buyer vs vendor vs admin)
- [ ] Implement empty and loading states for product listings, cart, and orders
- [ ] Add unit tests for critical business logic in `lib/data/database.ts`

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
