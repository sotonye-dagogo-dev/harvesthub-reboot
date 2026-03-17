# Dependency Graph

> **Overview:** Maps how modules depend on each other. Agents use this to understand the impact of changes before modifying a module. Updated whenever new dependencies are introduced or modules are refactored.

---

## Module Dependency Map

```
app/layout.tsx
  → providers.tsx
    → lib/theme/*
    → lib/hooks/useAuth
    → components/ui/*

app/(buyer)/page.tsx
  → components/features/*
  → lib/data/database.ts (via API routes)

app/api/auth/*
  → lib/data/database.ts
  → lib/schemas/auth.schemas.ts
  → lib/utils/jwt.ts

lib/data/database.ts
  → lib/data/mockData.ts
  → lib/types.ts

components/ui/*
  → lib/constants/*
  → lib/utils/format.ts

lib/store/*
  → lib/data/database.ts (for mock persistence)
  → lib/utils/api.ts
```

---

## External Dependencies

> **Section summary:** Third-party packages and what they're used for. Review before adding new packages.

| Package               | Purpose                   | Used In                       |
| --------------------- | ------------------------- | ----------------------------- |
| `next`                | React framework / routing | app/                          |
| `react` / `react-dom` | UI library                | app/ components/              |
| `antd`                | UI components             | components/ui/ and pages      |
| `tailwindcss`         | Utility-first styling     | global styles and components  |
| `prisma`              | ORM (future migration)    | prisma/ schema & generator    |
| `zod`                 | Validation schemas        | lib/schemas/, API routes      |
| `zustand`             | Client state management   | lib/store/                    |
| `bcryptjs`            | Password hashing          | lib/utils/auth.ts (mock auth) |
| `jose`                | JWT creation/validation   | lib/utils/jwt.ts              |
| `resend`              | Email sending             | lib/services/email (if used)  |
| `@upstash/redis`      | Cache / pubsub (optional) | lib/services/cache (if used)  |

---

## Circular Dependency Warnings

> **Section summary:** Any detected circular dependencies that need to be resolved.

- No known circular dependencies documented yet. Keep an eye on `lib/*` → `components/*` backreferences.

---

# Dependency Graph

> **Overview:** This file captures the main modules and dependencies in MyHarvestHub and how they connect at a high level. Use it to understand routing, data flow, and where to look when changing APIs, the data layer, or UI components.

---

## Modules

> **Section summary:** Major code areas and their responsibilities.

- `app/` — Next.js App Router: pages, layouts, Server and Client Components. Contains route groups: `(auth)`, `(buyer)`, `admin`, `vendor`, `signup`.
- `app/api/` — Route handlers (REST-like endpoints) for auth, products, orders, wallet, vendors, admin, banners, notifications, upload, reviews, vouchers, etc.
- `components/` — Shared UI components and feature widgets used across pages.
- `lib/` — Utilities, hooks, validation, mock data layer (`lib/data/database.ts`), services and stores.
- `prisma/` — `schema.prisma`, `seed.ts`, and the generated Prisma client (large generated artifacts after build).
- `public/`, `app/_styles/`, `app/fonts/` — Static assets, fonts, and global styles.
- `.ai-system/`, `.github/` — Agent/system documentation, planning, and project policies.

---

## Edges (data & control flow)

> **Section summary:** Typical call / dependency relationships between modules.

- `app/` -> `components/` : Pages import and render UI components.
- `app/` -> `app/api/` : Pages call API routes (fetch) or call Server Actions that use server code.
- `app/api/` -> `lib/` : Route handlers invoke services, validation, and the mock database in `lib/`.
- `lib/` -> `prisma/` : Service layer uses the Prisma client (when enabled) or the in-memory DB for queries and mutations.
- `components/` -> `lib/` : UI components import helper utilities, hooks, and formatters from `lib/`.
- `prisma/schema.prisma` -> generated Prisma client : schema changes generate client code used by server logic.

---

## Notable hotspots

> **Section summary:** Files and areas that are large, frequently changed, or important for analysis.

- Generated Prisma client files (under `prisma/generated/` or build output) — very large; they dominate packed exports and analysis token counts.  
- `lib/data/database.ts` — in-memory mock DB used across many endpoints; changing shape here affects many routes.  
- `app/api/*` — many independent route handlers; good candidates for API-level tests and contract verification.

---

## Quick ASCII diagram

> **Section summary:** Simple visualization of main data flow.

```
[app/pages] -> [components]
   |
   v
 [app/api routes] -> [lib services] -> [prisma client / mock DB]
```

---

If you want, I can render a Mermaid graph or produce a JSON module graph extracted from the packed `stdout` for automated visualization.
