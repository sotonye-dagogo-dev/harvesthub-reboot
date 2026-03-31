# System Architecture

> **Overview:** MyHarvestHub is a Next.js 15 App Router application that combines server-side rendering, server actions, and API routes with a mock backend layer. The architecture is designed to support a future migration to Prisma/PostgreSQL while keeping the front-end stable.

---

## Architecture Diagram

> **Section summary:** Text-based overview of system layers and how they connect.

```
Client (Browser)
        ↓
Next.js App Router (app/)
  ├─ Server Components
  ├─ Client Components
  ├─ Server Actions
  └─ API Routes (app/api/*)
        ↓
Mock Data Layer (lib/data/database.ts)
        ↓
Prisma ORM (prisma/) [future]
        ↓
PostgreSQL / External APIs (Cloudinary, Resend, Upstash)
```

---

## Module Breakdown

> **Section summary:** Each module listed here has a single defined responsibility. Agents should not modify a module's scope without updating this document.

| Module         | Responsibility                                       | Key Files                                           | Dependencies                   |
| -------------- | ---------------------------------------------------- | --------------------------------------------------- | ------------------------------ |
| `app/`         | UI routing and server components                     | `app/layout.tsx`, `app/(buyer)/*`, `app/(vendor)/*` | `components/`, `lib/`          |
| `app/api/`     | Backend endpoints for auth, products, orders, wallet | `app/api/auth/*`, `app/api/orders/*`                | `lib/data/`, `lib/schemas/`    |
| `lib/data/`    | Mock backend & in-memory persistence                 | `mockData.ts`, `database.ts`                        | `lib/types.ts`, `lib/utils/*`  |
| `lib/schemas/` | Validation schemas (Zod)                             | `auth.schemas.ts`, `product.schemas.ts`             | `lib/types.ts`                 |
| `lib/store/`   | Client-side state stores (Zustand)                   | `cartStore.ts`, `walletStore.ts`                    | `lib/data/`                    |
| `components/`  | Reusable UI components                               | `ui/`, `features/`                                  | `lib/utils/`, `lib/constants/` |
| `prisma/`      | Data model and migration tooling                     | `schema.prisma`, `seed.ts`                          | Prisma client (future)         |

---

## Data Flow

> **Section summary:** How a typical request moves through the system from entry point to response.

### Standard Request Flow

```
1. User navigates to a page in the browser.
2. Next.js renders the page (server/client) using components in `app/`.
3. UI components call API routes (e.g., `fetch('/api/products')`).
4. API route handler uses `lib/data/database.ts` to read/write mock data.
5. Response is returned to the browser and UI updates.
```

### Authentication Flow

```
1. User submits login form.
2. Client calls `/api/auth/login`.
3. API validates credentials using `lib/data/database.ts` and `lib/schemas/auth.schemas.ts`.
4. On success, API sets httpOnly JWT cookies (access + refresh).
5. Protected routes verify JWT from cookies and return user context.
```

### Data Persistence Flow

```
1. API route calls a higher-level service in `lib/data/database.ts`.
2. Service reads/writes in-memory objects from `mockData.ts`.
3. (Future) Replace `lib/data/database.ts` implementation with Prisma client calls.
```

---

## Configuration Points

> **Section summary:** All configurable values are listed here. Nothing should be hardcoded in source files that appears in this section.

| Config Key                    | Purpose                                    | Location              | Default                                               |
| ----------------------------- | ------------------------------------------ | --------------------- | ----------------------------------------------------- |
| `JWT_SECRET`                  | Sign access tokens                         | `.env` / `.env.local` | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_ACCESS_EXPIRY`           | Access token lifetime                      | `.env`                | `8h`                                                  |
| `JWT_REFRESH_EXPIRY`          | Refresh token lifetime                     | `.env`                | `7d`                                                  |
| `NEXT_PUBLIC_API_URL`         | API base url for client                    | `.env`                | `http://localhost:3000/api`                           |
| `DATABASE_URL`                | Prisma database connection string (future) | `.env`                | `prisma://...`                                        |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Currency display                           | `.env`                | `₦`                                                   |
| `NEXT_PUBLIC_PHONE_PREFIX`    | Default phone prefix                       | `.env`                | `+234`                                                |

---

## Tech Stack

> **Section summary:** Core technologies in use. New dependencies should be added here when introduced.

| Layer       | Technology                | Version                |
| ----------- | ------------------------- | ---------------------- |
| Frontend    | Next.js (App Router)      | 15.x                   |
| UI          | React                     | 19.x                   |
| Styling     | Tailwind CSS + Ant Design | Tailwind 3.x, Antd 5.x |
| State       | Zustand                   | 4.x                    |
| Validation  | Zod                       | 3.x                    |
| Auth        | JWT (jose)                | 6.x                    |
| Data        | Mock layer (in-memory)    | n/a                    |
| DB (future) | Prisma ORM                | 7.x                    |

---

## Known Constraints & Technical Debt

> **Section summary:** Limitations and known issues that affect architecture decisions. Agents should be aware of these before proposing changes.

- The current backend is an in-memory mock; persistence is lost on restart.
- Some routes and features are scaffolds only and may return placeholder data.
- UI still contains references from the original Martgram codebase (naming/branding) that may need full refactor.
- Payment integration and email notifications are partially stubbed and not production-ready.

---

## Architecture History

> **Section summary:** Log of major architectural changes. See also memory/architecture-history.md for full details.

| Date       | Change                                             | Reason                                                             |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 2026-03-15 | Initialized `.ai-system` & documented architecture | Bootstrapped AI-guided workflow for MyHarvestHub                   |
| 2026-03-31 | Hardened signup flow and dashboard route mapping   | Fix `Missing required fields` signup bug and unify role dashboards |
