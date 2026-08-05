# Repository Map

> **last-updated-by:** update-ai-system.md (2026-08-04)
> **last-updated-at:** 2026-08-04T16:30:00Z
> **Overview:** Current folder topology for MyHarvestHub. This map is synchronized to the canonical operations-route architecture (`/operations/*`) and Prisma-first runtime behavior.

---

## Folder Structure

```
harvesthub-reboot/
├── app/                               → Next.js App Router pages, route groups, and API surface
│   ├── (auth)/                        → Auth pages (login, forgot/reset password)
│   ├── (operations)/operations/       → Canonical admin/vendor operations workspace routes
│   ├── api/                           → Route handlers by domain (auth, products, orders, upload, etc.)
│   ├── components/                    → App-local shared components
│   ├── _styles/                       → Global CSS and tokenized style overrides
│   ├── fonts/                         → Local font assets
│   ├── layout.tsx                     → Root app layout shell
│   ├── providers.tsx                  → App-wide React providers
│   └── page.tsx                       → Public homepage entry
│
├── components/                        → Shared feature/layout/ui component library + tests
│   ├── features/
│   ├── layout/
│   ├── ui/
│   └── __tests__/
│
├── lib/                               → Core runtime logic, adapters, services, and utilities
│   ├── api/                           → Shared API response/handler wrappers
│   ├── config/                        → Typed env + feature configuration
│   ├── data/                          → Data facade/adapters and fetch helpers
│   ├── db/                            → Prisma client + transaction helpers
│   ├── rbac/                          → Route policy and permission logic
│   ├── schemas/                       → Zod schemas
│   ├── services/                      → Email, notification, upload, payment, and related services
│   ├── store/                         → Client state stores
│   ├── utils/                         → Shared utilities (drafts, offline queue, formatters, etc.)
│   └── __tests__/
│
├── modules/                           → Domain submodules (currently `orders/`)
├── prisma/                            → Prisma schema, migrations, generated client, seed script
├── public/                            → Static web assets (icons, manifest, service worker files)
├── scripts/                           → Audit and maintenance scripts
├── ai-system/                        → AI orchestration docs (agents, plans, memory, index)
│   ├── commands/
│   ├── index/
│   │   └── file-summaries/
│   ├── planning/
│   ├── memory/
│   ├── checkpoints/
│   └── summaries/
├── middleware.ts                      → Route normalization + RBAC middleware entry
├── next.config.mjs                    → Next.js configuration
├── tailwind.config.ts                 → Tailwind config
├── vitest.config.ts                   → Vitest config
├── tsconfig.json                      → TypeScript compiler settings
└── package.json                       → Scripts and dependencies
```

---

## Directory Notes

| Directory     | Purpose                                                              | Key Files                                                                        |
| ------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app/`        | Main App Router surface for public, auth, and operations experiences | `app/layout.tsx`, `app/page.tsx`, `app/advertise/page.tsx` (sponsors/ads landing), `app/advertise/apply/page.tsx` (full submission), `app/ad-application/page.tsx` (quick-apply intake), `app/(operations)/operations/layout.tsx`       |
| `app/api/`    | Domain APIs with role validation and shared wrappers                 | `app/api/auth/*`, `app/api/orders/*`, `app/api/orders/[id]/proof-of-payment/*`, `app/api/vendors/[id]/bank-details/route.ts`, `app/api/upload/route.ts`                  |
| `components/` | Reusable app-wide UI and feature composition                         | `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`                  |
| `lib/`        | Core shared runtime utilities and business logic                     | `lib/api/http.ts`, `lib/rbac/routeConfig.ts`, `lib/data/database.ts`             |
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
