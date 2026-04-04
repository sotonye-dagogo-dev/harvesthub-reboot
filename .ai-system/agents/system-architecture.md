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

| Module                   | Responsibility                                                    | Key Files                                                | Dependencies                            |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `app/`                   | UI routing and server components                                  | `app/layout.tsx`, `app/(auth)/*`, `app/signup/*`         | `components/`, `lib/`                   |
| `app/api/`               | Backend endpoints for auth, products, orders, wallet              | `app/api/auth/*`, `app/api/orders/*`, `app/api/upload/*` | `lib/data/`, `lib/schemas/`, `lib/api/` |
| `app/become-vendor`      | Buyer-to-vendor conversion UX entrypoint                          | `app/become-vendor/page.tsx`                             | `app/api/users/me/*`, `lib/constants`   |
| `lib/api/`               | Unified API success/error envelopes and handler wrappers          | `lib/api/http.ts`                                        | `next/server`                           |
| `lib/data/`              | Prisma-backed adapter facade and domain data access               | `database.ts`, `prismaAdapter.ts`                        | `lib/types.ts`, `lib/db/*`              |
| `lib/services/notifications` | Preference-aware notification fan-out across channels          | `lib/services/notifications.ts`                          | `lib/services/email.ts`, `lib/services/push.ts`, Prisma |
| `lib/utils/offlineQueue` | Client-side offline queue/replay for network-dependent operations | `lib/utils/offlineQueue.ts`, `lib/utils/localDraft.ts`   | Browser storage APIs                    |
| `lib/schemas/`           | Validation schemas (Zod)                                          | `auth.schemas.ts`, `product.schemas.ts`                  | `lib/types.ts`                          |
| `lib/store/`             | Client-side state stores (Zustand)                                | `cartStore.ts`, `walletStore.ts`                         | `lib/data/`                             |
| `components/`            | Reusable UI and feature components                                | `ui/`, `features/`, `layout/RoleDashboardShell.tsx`      | `lib/utils/`, `lib/constants/`          |
| `prisma/`                | Data model and migration tooling                                  | `schema.prisma`, `seed.ts`                               | Prisma client (future)                  |

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

### Email Verification Redirect Flow

```
1. User opens `/verify-email?token=...` from the email link.
2. Client page posts token to `/api/auth/verify-email`.
3. API marks `emailVerified=true` and clears verification token fields.
4. Client shows success state and redirects user to `/login`.
```

### Buyer-to-Vendor Conversion Flow

```
1. Buyer opens `/become-vendor` from header/profile CTA.
2. Client submits store onboarding payload to `/api/users/me/convert-to-vendor`.
3. API validates payload, upserts vendor profile, and updates user role to `VENDOR`.
4. API reissues auth cookies with vendor role claims.
5. Client refreshes auth context and routes user through `/dashboard` role hub.
```

### Operations Namespace + Legacy Compatibility Flow

```
1. User hits a legacy operational URL under `/admin/*` or `/vendor/*`.
2. Middleware normalizes path to canonical `/operations/*` (or unified routes like `/store-settings`).
3. Route policies are enforced from `lib/rbac/routeConfig.ts` against canonical paths.
4. `app/(operations)/operations/layout.tsx` renders shared shell with role-derived sidebar mode.
5. Feature page runs under consolidated operations namespace while old bookmarks remain valid.
```

### Profile + Store Settings Persistence Flow

```
1. Profile page loads/saves via `/api/users/[id]/profile` and `/api/users/[id]/password`.
2. Store settings page loads/saves via `/api/vendors/me/store-settings`.
3. APIs validate requester identity and update Prisma records.
4. Client surfaces success/error feedback and refreshes auth state where needed.
```

### Ad Application Upload + Offline Flow

```
1. User fills `/advertise` form and uploads banner/proof via `/api/upload`.
2. Upload route supports authenticated uploads and rate-limited guest uploads for ad/payment-proof folders.
3. Client stores draft data in localStorage and queues submission if offline.
4. On reconnect, queued payloads replay to `/api/ad-applications`.
5. API validates payload with Zod and persists via data adapter.

### Public Ad Application Flow

```
1. Unauthenticated users open `/ad-application` from footer CTA or direct link.
2. Client form submits campaign + payment-proof metadata to `/api/ads/apply`.
3. API enforces IP rate limiting and schema validation.
4. Application is persisted with pending-payment review status for operations moderation.
```

### Vendor Analytics Scoping Flow

```
1. Shared analytics page loads products/orders/users datasets.
2. If current role is vendor, client resolves current vendor profile by `userId`.
3. KPI computations are scoped to vendor-owned orders/products only.
4. Admin role continues to consume platform-wide aggregates from same feature shell.
```
```

### Payment Verification Enforcement Flow

```
1. Client initializes payment via `/api/payments/initialize` and receives a reference.
2. Client submits payment metadata to downstream mutation endpoint (`/api/orders` or `/api/wallet/deposit`).
3. Mutation endpoint verifies payment server-side via `lib/services/payments.ts` before any persistence action.
4. On success, endpoint persists business record and verification audit metadata.
5. On failure/unverified status, endpoint rejects mutation with a payment error response.
```

### Notification Delivery Flow

```
1. Domain mutation (for example order creation or wallet deposit) calls `dispatchNotification`.
2. Notification service checks user-level notification preferences.
3. Service persists in-app notification record in Prisma.
4. Service optionally sends email through Resend-backed email service.
5. Service optionally sends web push to stored user subscriptions.
```

### Data Persistence Flow

```
1. API route calls a higher-level service in `lib/data/database.ts`.
2. Database facade delegates to Prisma-backed adapters in `lib/data/prismaAdapter.ts`.
3. Adapters execute Prisma client operations against configured Postgres datasource.
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

## Target Route Topology (Refactor Plan)

> **Section summary:** Desired structural end state for page consolidation and role-aware rendering.

```
app/
        (public)/           -> marketing + catalogue + public content pages
        (auth)/             -> login/reset/verify/signup flows
        (dashboard)/        -> shared authenticated feature routes (orders, wallet, profile, analytics)
        (operations)/       -> operational consoles (admin/vendor tools) with capability-aware layouts
        api/
                _shared/          -> shared API middleware/wrappers/validators
```

Migration direction:

- Replace role-prefixed URLs where possible with capability-aware shared feature pages.
- Keep compatibility redirects while moving from `/admin/*` and `/vendor/*` to consolidated routes.
- Preserve permissions in middleware/policies rather than URL naming.

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
| Data        | Prisma adapter facade     | n/a                    |
| DB          | Prisma ORM + PostgreSQL   | 7.x                    |

---

## Known Constraints & Technical Debt

> **Section summary:** Limitations and known issues that affect architecture decisions. Agents should be aware of these before proposing changes.

- Runtime data access is Prisma-first and requires a reachable configured database.
- Some routes and features are scaffolds only and may return placeholder data.
- UI still contains references from the original Martgram codebase (naming/branding) that may need full refactor.
- Payment provider integration remains stubbed internally, but order and wallet mutation paths now enforce server-side verification checks.
- Web-push delivery requires browser permission grant plus configured VAPID keys in environment.

---

## Architecture History

> **Section summary:** Log of major architectural changes. See also memory/architecture-history.md for full details.

| Date       | Change                                                     | Reason                                                                                            |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-03-15 | Initialized `.ai-system` & documented architecture         | Bootstrapped AI-guided workflow for MyHarvestHub                                                  |
| 2026-03-31 | Hardened signup flow and dashboard route mapping           | Fix `Missing required fields` signup bug and unify role dashboards                                |
| 2026-04-01 | Added buyer-to-vendor conversion and persistence hardening | Address client concerns on role conversion, editability, and auth UX                              |
| 2026-04-01 | Standardized ad APIs/uploads + signup layout modernization | Improve production-readiness via API consistency, offline resilience, and UX cleanup              |
| 2026-04-01 | Introduced `/operations/*` canonical management namespace  | Start grouped-route migration with middleware redirects from legacy role-prefixed URLs            |
| 2026-04-01 | Removed final operations wrappers and legacy hosts         | Completed migration so operations pages are self-contained and legacy admin/vendor pages redirect |
| 2026-04-01 | Enforced server-side payment verification in mutations     | Prevent unverified card orders/wallet credits by verifying payment status at API mutation boundaries |
| 2026-04-01 | Added unified notification fan-out service                 | Centralize in-app/email/web-push delivery and honor notification preference settings |
| 2026-04-01 | Added public ad-application intake route                  | Enable unauthenticated ad submissions with validated/rate-limited backend intake |
| 2026-04-01 | Enforced vendor-scoped analytics KPI computation          | Prevent vendor dashboards from showing platform-wide aggregate metrics |

### Email Change + Reverification Flow

```
1. Authenticated user submits a new email from profile security settings.
2. API (`POST /api/users/me/change-email`) validates identity, uniqueness, and rate-limit constraints.
3. API stores a prefixed verification token carrying pending-email context and marks account unverified.
4. Verification email is delivered to the new address and user follows `/verify-email?token=...`.
5. `/api/auth/verify-email` detects email-change token, updates canonical email, clears token fields, clears auth cookies, and returns a login redirect instruction.
```

### Help Content Route-Safe Flow

```
1. Help index page renders topics/quick links from `lib/config/siteContent.ts`.
2. Topic routes resolve via `/help/[slug]` against the same config to avoid orphan slugs.
3. Topic page attempts to hydrate detail body from public-content (`help-{slug}`) for admin-editable rich text.
4. If no content is published, page falls back to a safe support/contact guidance state.
```

### Vendor Verification Order-Gating Flow

```
1. Checkout loads vendor status and displays a warning for unverified vendors.
2. Buyer must explicitly acknowledge warning before order submission.
3. Orders API enforces server-side acknowledgement requirement for unverified vendors.
4. Order status-history captures verification/acknowledgement context for audit visibility.
```

| 2026-04-04 | Added email-change reverification + bug-report/settings/help-flow hardening | Close cloud continuation queue for account security, config-driven UX surfaces, and operations reliability |
