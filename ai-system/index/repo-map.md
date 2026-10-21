# Repository Map

> **last-updated-by:** update-ai-system.md (2026-10-21, Session 105 cron scheduling + storage repair)
> **last-updated-at:** 2026-10-21T00:00:00Z
> **Overview:** Current folder topology for MyHarvestHub. This map is synchronized to the canonical operations-route architecture (`/operations/*`), Prisma-first runtime (11 migrations, schema up to date), checkout proof-of-payment enforcement, mutation bus, CIS handshake surface, hardened email verification (verify-email public route + JWT refresh), help-center config fallbacks, and the Session 104 payment-models surface (commission toggle + subscription packages: `/packages`, `/operations/subscription(s)`, `app/api/subscriptions`, `app/api/admin/subscription-packages`, `app/api/admin/subscriptions`, `app/api/cron/subscriptions`, `lib/services/subscriptions.ts`), and the Session 105 cron-scheduling surface (`vercel.json` daily crons; GET + Bearer `CRON_SECRET` auth on `app/api/cron/subscriptions` and `app/api/orders/service-fulfillment`; `vitest.setup.tsx` in-memory Storage test-env polyfill).

---

## Folder Structure

```
harvesthub-reboot/
â”œâ”€â”€ app/                               â†’ Next.js App Router pages, route groups, and API surface
â”‚   â”œâ”€â”€ (auth)/                        â†’ Auth pages (login, forgot/reset password)
â”‚   â”œâ”€â”€ (operations)/operations/       â†’ Canonical admin/vendor operations workspace routes
â”‚   â”‚   â”œâ”€â”€ subscription/              â†’ Vendor "My Subscription" status + history page
â”‚   â”‚   â””â”€â”€ subscriptions/             â†’ Admin package CRUD + subscriber observability page
â”‚   â”œâ”€â”€ advertise/                     â†’ Public sponsors & ads landing page (/advertise) + full application form (/advertise/apply)
â”‚   â”œâ”€â”€ ad-application/                â†’ Simple public ad application form
â”‚   â”œâ”€â”€ api/                           â†’ Route handlers by domain (auth, products, orders, upload, etc.)
â”‚   â”‚   â”œâ”€â”€ admin/analytics/banners/   â†’ Admin-only banner performance analytics endpoint
â”‚   â”‚   â”œâ”€â”€ admin/subscription-packages/ â†’ Admin CRUD for subscription packages (+[id] edit/delete guard)
â”‚   â”‚   â”œâ”€â”€ admin/subscriptions/       â†’ Admin subscriber list/stats (+[id] cancel/restore)
â”‚   â”‚   â”œâ”€â”€ banners/[id]/              â†’ Banner CRUD + public event-tracking endpoint
â”‚   â”‚   â”œâ”€â”€ cron/subscriptions/        â†’ Idempotent expiry sweep (Vercel GET cron; Bearer `CRON_SECRET`/`SUBSCRIPTION_CRON_SECRET` header or admin)
â”‚   â”‚   â”œâ”€â”€ subscription-packages/     â†’ Public active-packages listing for /packages
â”‚   â”‚   â””â”€â”€ subscriptions/             â†’ Vendor summary/history GET + purchase POST (CARD/WALLET)
â”‚   â”œâ”€â”€ packages/                      â†’ Public subscription-packages purchase page (/packages)
â”‚   â”œâ”€â”€ components/                    â†’ App-local shared components
â”‚   â”œâ”€â”€ _styles/                       â†’ Global CSS and tokenized style overrides
â”‚   â”œâ”€â”€ fonts/                         â†’ Local font assets
â”‚   â”œâ”€â”€ layout.tsx                     â†’ Root app layout shell
â”‚   â”œâ”€â”€ providers.tsx                  â†’ App-wide React providers
â”‚   â””â”€â”€ page.tsx                       â†’ Public homepage entry
â”‚
â”œâ”€â”€ components/                        â†’ Shared feature/layout/ui component library + tests
â”‚   â”œâ”€â”€ features/
â”‚   â”‚   â””â”€â”€ content/                   â†’ Universal structured content editor + tests
â”‚   â”œâ”€â”€ layout/
â”‚   â”œâ”€â”€ ui/
â”‚   â””â”€â”€ __tests__/
â”‚
â”œâ”€â”€ lib/                               â†’ Core runtime logic, adapters, services, and utilities
â”‚   â”œâ”€â”€ analytics/                     â†’ Banner event aggregation/metrics helpers
â”‚   â”œâ”€â”€ api/                           â†’ Shared API response/handler wrappers
â”‚   â”œâ”€â”€ config/                        â†’ Typed env + feature configuration (incl. cis.ts, payments.ts)
â”‚   â”œâ”€â”€ content/                       â†’ Pure structured-section model + serializer/parser + tests
â”‚   â”œâ”€â”€ data/                          â†’ Data facade/adapters and fetch helpers
â”‚   â”œâ”€â”€ data-runtime/                  â†’ Cross-resource mutation bus + useSmartResource invalidation
â”‚   â”œâ”€â”€ db/                            â†’ Prisma client + transaction helpers
â”‚   â”œâ”€â”€ rbac/                          â†’ Route policy and permission logic
â”‚   â”œâ”€â”€ schemas/                       â†’ Zod schemas
â”‚   â”œâ”€â”€ services/                      â†’ Email, notification, upload, payment, order-lifecycle, subscription, and related services
â”‚   â”œâ”€â”€ store/                         â†’ Client state stores
â”‚   â”œâ”€â”€ tracking/                      â†’ Client-side banner event tracking (beacon/fetch)
â”‚   â”œâ”€â”€ utils/                         â†’ Shared utilities (drafts, offline queue, formatters, upload helpers, etc.)
â”‚   â””â”€â”€ __tests__/
â”‚
â”œâ”€â”€ modules/                           â†’ Domain submodules (currently `orders/`)
â”œâ”€â”€ prisma/                            â†’ Prisma schema, migrations, generated client, seed script
â”œâ”€â”€ public/                            â†’ Static web assets (icons, manifest, service worker files)
â”œâ”€â”€ scripts/                           â†’ Audit and maintenance scripts
â”œâ”€â”€ ai-system/                        â†’ AI orchestration docs (agents, plans, memory, index)
â”‚   â”œâ”€â”€ commands/
â”‚   â”œâ”€â”€ index/
â”‚   â”‚   â””â”€â”€ file-summaries/
â”‚   â”œâ”€â”€ planning/
â”‚   â”œâ”€â”€ memory/
â”‚   â”œâ”€â”€ checkpoints/
â”‚   â””â”€â”€ summaries/
â”œâ”€â”€ middleware.ts                      â†’ Route normalization + RBAC middleware entry
â”œâ”€â”€ next.config.mjs                    â†’ Next.js configuration
â”œâ”€â”€ vercel.json                         â†’ Next.js configuration
â”œâ”€â”€ tailwind.config.ts                 â†’ Tailwind config
â”œâ”€â”€ vitest.config.ts                   â†’ Vitest config
â”œâ”€â”€ tsconfig.json                      â†’ TypeScript compiler settings
â””â”€â”€ package.json                       â†’ Scripts and dependencies
```

---

## Directory Notes

| Directory     | Purpose                                                              | Key Files                                                                        |
| ------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app/`        | Main App Router surface for public, auth, and operations experiences | `app/layout.tsx`, `app/page.tsx`, `app/advertise/page.tsx`, `app/(operations)/operations/layout.tsx`       |
| `app/api/`    | Domain APIs with role validation and shared wrappers                 | `app/api/auth/*`, `app/api/orders/*`, `app/api/orders/[id]/proof-of-payment/*`, `app/api/vendors/[id]/bank-details/route.ts`, `app/api/upload/route.ts`, `app/api/subscriptions/route.ts`, `app/api/admin/subscription-packages/route.ts`, `app/api/admin/subscriptions/route.ts`, `app/api/cron/subscriptions/route.ts`                  |
| `components/` | Reusable app-wide UI and feature composition                         | `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`                  |
| `lib/`        | Core shared runtime utilities and business logic                     | `lib/api/http.ts`, `lib/rbac/routeConfig.ts`, `lib/data/database.ts`             |
| `lib/content/`| Pure structured-content section model (types, serializer/parser)     | `lib/content/structuredSections.ts`                                              |
| `components/features/content/` | Shared no-HTML structured content editor                    | `components/features/content/StructuredContentEditor.tsx`                        |
| `prisma/`     | ORM schema/migrations/client generation                              | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`                  |
| `scripts/`    | Route/dead-link/sidebar audits and maintenance tasks                 | `scripts/auditRoutes.ts`, `scripts/auditSidebarRoutes.ts`                        |
| `ai-system/` | AI execution protocol, planning queue, and change history            | `ai-system/protocols/entry-protocol.md`, `ai-system/planning/task-queue.md` |

---

## Entry Points

| Purpose             | File                           |
| ------------------- | ------------------------------ |
| App shell           | `app/layout.tsx`               |
| API boundary        | `app/api/*`                    |
| Route policy source | `lib/rbac/routeConfig.ts`      |
| Data model source   | `prisma/schema.prisma`         |
| Dev startup         | `package.json` (`npm run dev`) |
