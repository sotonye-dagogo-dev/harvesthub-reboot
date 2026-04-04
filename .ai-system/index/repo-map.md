# Repository Map

> **Overview:** Visual map of the project folder structure with a brief description of each directory's purpose. Agents read this first when navigating the codebase. Updated whenever the folder structure changes.

---

## Folder Structure

```
myharvesthub-app/
├── app/                    → Next.js App Router routes and layouts
│   ├── (auth)/             → Authentication pages (login, register, reset)
│   ├── (buyer)/            → Buyer-facing pages (legacy/deprecation path)
│   ├── (vendor)/           → Vendor dashboard and tools (legacy/deprecation path)
│   ├── (admin)/            → Admin panel and operations (legacy/deprecation path)
│   ├── api/                → Server API routes (auth, products, orders, wallet)
│   ├── components/         → Shared UI components (UI primitives + feature components)
│   ├── providers.tsx       → Global React providers (theme, auth, config)
│   ├── _styles/            → Global CSS (Tailwind + custom variables)
│   └── layout.tsx          → Root layout + metadata
│
├── components/            → Additional reusable components + tests
│   └── __tests__/          → Component unit tests
│
├── lib/                   → Core logic (types, validation, mock backend, hooks)
│   ├── api/                → Shared API response/handler wrappers
│   ├── data/               → Mock data and in-memory database
│   ├── schemas/            → Zod validation schemas
│   ├── store/              → Zustand stores (cart, wallet, etc.)
│   ├── utils/              → Utility functions (formatting, offline queue, local draft)
│   └── types.ts            → Global TypeScript types and interfaces
│
├── prisma/                → Prisma schema, migrations, and seed scripts
├── public/                → Static assets (manifest, offline page, icons)
├── .github/               → Documentation, plans, and CI/CD configs
├── .ai-system/            → AI guidance and planning artifacts
├── next.config.mjs        → Next.js configuration
├── tailwind.config.ts     → Tailwind configuration
├── tsconfig.json          → TypeScript configuration
├── package.json           → Dependencies and scripts
└── README.md              → Project overview and setup
```

---

## Directory Descriptions

| Directory                                  | Purpose                                                 | Key Files                                       |
| ------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------- |
| `app/`                                     | Next.js App Router routes and layouts                   | `app/layout.tsx`, `app/providers.tsx`           |
| `app/api/`                                 | API routes for auth, products, orders, wallet, etc.     | `app/api/auth/*`, `app/api/products/*`          |
| `lib/`                                     | Shared business logic, API wrappers, offline resilience | `lib/api/http.ts`, `lib/data/database.ts`       |
| `components/`                              | Reusable UI components and feature widgets              | `components/ui`, `components/features`          |
| `components/layout/RoleDashboardShell.tsx` | Shared role dashboard container for admin/vendor shells | `app/admin/layout.tsx`, `app/vendor/layout.tsx` |
| `prisma/`                                  | Prisma ORM schema and database seeds                    | `prisma/schema.prisma`, `prisma/seed.ts`        |
| `public/`                                  | Static assets served by Next.js                         | `manifest.json`, `offline.html`, `icons/`       |

---

## Entry Points

| Purpose                   | File                           |
| ------------------------- | ------------------------------ |
| Frontend entry & metadata | `app/layout.tsx`               |
| API backend surface       | `app/api/*`                    |
| Mock data seed            | `lib/data/mockData.ts`         |
| Prisma schema             | `prisma/schema.prisma`         |
| Development start         | `package.json` (`npm run dev`) |
