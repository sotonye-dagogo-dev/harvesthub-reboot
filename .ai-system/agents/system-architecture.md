# System Architecture

> **Overview:** MyHarvestHub is a Next.js 15 App Router platform using consolidated operations routes (`/operations/*`), role-aware route policy, and a Prisma-first server data layer. The architecture combines Server/Client Components, API routes, and shared service modules for uploads, notifications, and payments.

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
Data Facade (lib/data/database.ts)
        ↓
Prisma Adapters + Client (lib/data/prismaAdapter.ts, lib/db/prisma.ts)
        ↓
PostgreSQL / External APIs (Cloudinary, Resend, Upstash)
```

---

## Module Breakdown

> **Section summary:** Each module listed here has a single defined responsibility. Agents should not modify a module's scope without updating this document.

| Module                       | Responsibility                                                    | Key Files                                                | Dependencies                                            |
| ---------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `app/`                       | UI routing and server/client components                           | `app/layout.tsx`, `app/(auth)/*`, `app/(operations)/*`   | `components/`, `lib/`                                   |
| `app/api/`                   | Backend endpoints for auth, products, orders, wallet, content     | `app/api/auth/*`, `app/api/orders/*`, `app/api/upload/*` | `lib/data/`, `lib/schemas/`, `lib/api/`                 |
| `app/become-vendor`          | Buyer-to-vendor conversion UX entrypoint                          | `app/become-vendor/page.tsx`                             | `app/api/users/me/*`, `lib/constants`                   |
| `lib/api/`                   | Unified API success/error envelopes and handler wrappers          | `lib/api/http.ts`                                        | `next/server`                                           |
| `lib/config/`                | Canonical runtime/discovery/notification copy+template config     | `lib/config/index.ts`, `lib/config/productDiscovery.ts`  | `lib/constants/`, feature components                    |
| `lib/data/`                  | Prisma-backed adapter facade and domain data access               | `database.ts`, `prismaAdapter.ts`                        | `lib/types.ts`, `lib/db/*`                              |
| `lib/services/notifications` | Preference-aware notification fan-out + template resolution       | `lib/services/notifications.ts`                          | `lib/services/email.ts`, `lib/services/push.ts`, Prisma |
| `lib/utils/offlineQueue`     | Client-side offline queue/replay for network-dependent operations | `lib/utils/offlineQueue.ts`, `lib/utils/localDraft.ts`   | Browser storage APIs                                    |
| `lib/schemas/`               | Validation schemas (Zod)                                          | `auth.schemas.ts`, `product.schemas.ts`                  | `lib/types.ts`                                          |
| `lib/store/`                 | Client-side state stores (Zustand)                                | `cartStore.ts`, `walletStore.ts`                         | `lib/data/`                                             |
| `components/`                | Reusable UI and feature components                                | `ui/`, `features/`, `layout/`                            | `lib/utils/`, `lib/constants/`                          |
| `prisma/`                    | Data model and migration tooling                                  | `schema.prisma`, `seed.ts`                               | Prisma client                                           |

---

## Data Flow

> **Section summary:** How a typical request moves through the system from entry point to response.

### Standard Request Flow

```
1. User navigates to a page in the browser.
2. Next.js renders the page (server/client) using components in `app/`.
3. UI components call API routes (e.g., `fetch('/api/products')`).
4. API route handler uses `lib/data/database.ts` facade which delegates to Prisma adapters.
5. Response is returned to the browser and UI updates.
```

### Product Discovery Query Flow

```
1. Discovery controls (home category tags, products filters/sort/search) write canonical URL query params.
2. Products page parses query state through shared contract helpers in `lib/config/productDiscovery.ts`.
3. Products feature applies normalized category mapping (slug/value -> canonical category values) and deterministic sorting.
4. Filter UI, active category state, pagination counts, and result cards render from the same normalized discovery state.
5. Products client state rehydrates from URL query updates (`useSearchParams`) so category-tag clicks and shared links immediately apply filtering without sidebar-only interaction.
```

### Home Banner Deck Composition Flow

```
1. Home surface loads active banner payloads and separates them by placement (`HERO`, `SIDEBAR`).
2. Hero placement renders as image-first carousel with `Know More` CTA for modal details.
3. Sidebar placement renders as responsive ad rail cards alongside hero on desktop and adaptive grid on smaller screens.
4. Banner links/actions remain config/data-driven with fallback to non-clickable cards when no destination is configured.
```

### Header Category Accessibility Flow

```
1. Header exposes desktop category quick links and an `All Categories` dropdown from canonical product-discovery config.
2. Hamburger menu exposes `Browse Categories` expandable section for mobile users.
3. Category entries route to canonical `/products?category=<slug>` query contract.
4. Products page query rehydration applies category filter state immediately on navigation.
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

### Operations Smart-Resource Refresh Flow

```
1. Operations page defines a fetcher and calls `useSmartResource(fetcher, { key, staleTimeMs, refreshIntervalMs })`.
2. Hook serves warm in-memory data immediately when cache exists.
3. Hook performs stale-check and background refresh without blocking existing UI.
4. Hook updates state only when payload materially changes (equality guard), reducing unnecessary rerenders.
5. Manual refresh actions can force a fresh pull for operator-driven recency.
```

### Unified Data Runtime Flow (Zustand-First + Adapter Boundary)

```
1. Runtime contracts in `lib/data-runtime/contracts.ts` define resource key/scope/policy and adapter-safe boundaries.
2. `lib/data-runtime/resourceRegistry.ts` provides declarative resources with stale/ttl/retry/compare/scope policy.
3. `lib/data-runtime/runtimeStore.ts` holds per-resource in-memory state (status, timestamps, in-flight, last-good snapshot, cooldown window).
4. `lib/hooks/useRuntimeResource.ts` / `useSmartResource` load resources through `runtimeClient` with bounded retry + jitter/backoff.
5. Reconciler suppresses no-op refresh updates and keeps visible last-good data during silent background refresh.
6. Mutation coordinator applies optimistic patch, rolls back deterministically on failure, and reconciles on success.
7. App bootstrap (`app/providers.tsx`) prefetches role + route-tag scoped resources to warm start without broad over-fetching.
8. Runtime telemetry tracks load latency, refresh churn, no-op ratio, retry volume, and rollback frequency.
9. Provider-level runtime activity notifier surfaces global processing feedback from aggregate in-flight resources.
10. Runtime activity copy uses threshold tiers (`Just a moment`, `Almost there`, `This might take a while`) and suppresses short background churn.

### Operations Dashboard Runtime API Flow

```

1. Operations dashboard page subscribes through `useSmartResource` instead of direct SSR Prisma calls.
2. Client fetches `/api/operations/dashboard` for role-scoped metric cards and quick actions.
3. API route enforces auth + role checks (`ADMIN`/`VENDOR`) and computes Prisma-backed metrics.
4. Runtime cache serves warm data and background refresh to keep dashboard cards responsive without full page reload.

```

```

### Vendor Marketing Moderation Boundary Flow

```
1. Vendor submits marketing content through `/api/vendors/[vendorId]/content` with explicit `targetPlatform` metadata.
2. Operations moderation reads `/api/admin/vendor-content` using marketing-scoped query semantics.
3. Moderators approve/reject marketing submissions in `/operations/vendor-content` (labeled as marketing review).
4. Product media/catalog workflows remain separate from this moderation path.
```

### Profile + Store Settings Persistence Flow

```
1. Profile page loads/saves via `/api/users/[id]/profile` and `/api/users/[id]/password`.
2. Store settings page loads/saves via `/api/vendors/me/store-settings`.
3. Store settings include editable vendor `businessAddress` persisted in `businessVerification`.
4. APIs validate requester identity and update Prisma records.
5. Client surfaces success/error feedback and refreshes auth state where needed.
```

### Ad Application Upload + Offline Flow

```
1. User fills `/advertise` form and uploads banner/proof via `/api/upload`.
2. Upload route supports authenticated uploads and rate-limited guest uploads for ad/payment-proof folders.
3. Client stores draft data in localStorage and queues submission if offline.
4. On reconnect, queued payloads replay to `/api/ad-applications`.
5. API validates payload with Zod and persists via data adapter.
6. Upload-managed ad fields are expected to be Cloudinary-managed URLs produced by `/api/upload`.
```

### Public Ad Application Flow

```
1. Unauthenticated users open `/ad-application` from footer CTA or direct link.
2. Client form submits campaign + payment-proof metadata to `/api/ads/apply`.
3. API enforces IP rate limiting and schema validation.
4. API rejects unsupported non-Cloudinary URLs for upload-managed image/proof fields.
5. Application is persisted with pending-payment review status for operations moderation.
```

### Vendor WhatsApp Guard-First Contact Flow

```
1. Buyer clicks vendor WhatsApp CTA on `/vendors/[id]` or product-detail chat pointer on `/products/[id]`.
2. CTA navigates to internal guard page (`/contact/whatsapp`) with vendor context + sanitized phone params.
3. Guard page displays safety disclaimer and off-platform warning before any external navigation.
4. User explicitly confirms with "Continue to WhatsApp" before browser opens `wa.me`.
5. Guard page emits lightweight telemetry marker (`/api/telemetry/off-platform-contact`) with sanitized source context.
6. Invalid/missing phone context blocks external handoff and keeps user in internal safe state.
```

### Signup Verification + Position Parity Flow

```
1. Signup role selection allows only buyer/vendor account types.
2. Vendor path requires `businessAddress`, selected `idType`, and all three verification uploads (ID, business registration, utility bill).
3. Verification/profile uploads use `/api/upload` and persist Cloudinary asset references in draft state.
4. Register API validates church `position` against synchronized enum values (`MEMBER`, `NON_MEMBER`, `WORKER`, leadership roles).
5. Vendor record stores verification docs + business address in `businessVerification` JSON.
```

### Bug Report Screenshot Upload Flow

```
1. Bug report form uploads screenshots through `/api/upload` (`folderType=bug-report`) before submit.
2. Client submits canonical screenshot URL (+ optional publicId metadata) to `/api/bug-reports`.
3. API rejects unsupported raw/non-Cloudinary screenshot URLs for governed upload fields.
4. Report persists with screenshot URL and metadata for operations triage.
```

### Vendor Analytics Scoping Flow

```
1. Shared analytics page loads products/orders/users datasets.
2. If current role is vendor, client resolves current vendor profile by `userId`.
3. KPI computations are scoped to vendor-owned orders/products only.
4. Admin role continues to consume platform-wide aggregates from same feature shell.
```

### Payment Verification Enforcement Flow

```
1. Client initializes payment via `/api/payments/initialize` and receives a reference.
2. Client submits payment metadata to downstream mutation endpoint (`/api/orders` or `/api/wallet/deposit`).
3. Mutation endpoint verifies payment server-side via `lib/services/payments.ts` before any persistence action.
4. On success, endpoint persists business record and verification audit metadata.
5. On failure/unverified status, endpoint rejects mutation with a payment error response.
```

### Order Status Lifecycle + Delivered Payout Automation Flow

```
1. Vendor/admin submits status update to `PATCH /api/orders/[id]/status`.
2. API validates requested status against canonical enum-safe lifecycle transitions.
3. Same-status requests return idempotent success and skip side effects.
4. Valid transitions update `order.status` + status history atomically.
5. If transitioning to `DELIVERED` and payment is already `PAID`, API creates payout hold (`PAYOUT`, `PENDING`) with deterministic reference.
6. Vendor wallet is not credited at delivery transition; settlement remains held until confirmation release.
7. Replayed requests remain safe because deterministic payout reference + existing transaction check prevents duplicate holds/credits.
```

### Commerce Assurance Phase B Continuation Flow (Planned)

```
1. Buyer confirms delivered order explicitly (or scheduler auto-confirms after SLA window).
2. Confirmation event writes durable lifecycle timestamp and append-only timeline entry.
3. Settlement release transitions held commerce value into payout-eligible state.
4. Payout lifecycle progresses through intent/request -> processing -> completed/failed with provider reconciliation.
5. Refund requests route through review/execution states and apply compensating ledger logic for pre/post settlement scenarios.
6. Lifecycle notifications (in-app/email/push) are emitted with traceable metadata for inbox timeline context.
7. Final release report includes explicit schema/migration outcome and residual risk statement.
```

### Delivery Confirmation + Auto-Confirm Settlement Release Flow

```
1. Delivered paid order creates payout hold (`TransactionType.PAYOUT`, `PENDING`) at status-transition boundary.
2. Buyer can confirm via `POST /api/orders/[id]/confirm-delivery`, or scheduler can auto-confirm via `POST /api/orders/auto-confirm` after admin-configured SLA hours.
3. Settlement release updates payout hold to `COMPLETED`, credits vendor wallet once, and appends lifecycle history (`BUYER_CONFIRMED`/`AUTO_CONFIRMED` + `SETTLEMENT_RELEASED`).
4. Replay requests are idempotent and return already-released state without duplicate credits.
```

### Admin-Managed Commerce Lifecycle Config Flow

```
1. Admin opens `/operations/settings` and loads lifecycle panel state from `GET /api/admin/commerce-config`.
2. API upserts/returns singleton config (`CommerceLifecycleConfig`) with bounded values.
3. Admin updates auto-confirm enablement + SLA hours + refund request window via `PUT /api/admin/commerce-config`.
4. `POST /api/orders/auto-confirm` reads persisted config to determine enablement and window.
5. `POST /api/orders/[id]/refund/request` enforces admin-configured refund window against delivered timestamp.
```

### Multi-Vendor Checkout Split Order Flow

```
1. Checkout groups cart lines by `vendorId` and submits `vendorOrders[]` in one checkout request.
2. `POST /api/orders` verifies payment once (gateway/wallet semantics), validates vendor ownership per line, and computes per-vendor totals.
3. API creates one order per vendor within a single DB transaction and links them via checkout-group metadata.
4. Wallet method debits buyer wallet once for the grouped checkout amount while recording per-order payment transactions with deterministic balance progression.
5. Stock/vendor metrics update per split order, and notifications fan out to each vendor plus buyer checkout summary.
```

### Refund Request/Review/Reconciliation Flow

```
1. Buyer submits refund request via `POST /api/orders/[id]/refund/request`.
2. API records pending refund transaction and appends `REFUND_REQUESTED` lifecycle event.
3. Admin reviews via `POST /api/orders/[id]/refund/review` with approve/reject action.
4. Approve path credits buyer wallet, marks order/payment as refunded, and reconciles payout:
        - pre-release: reverse pending payout hold
        - post-release: debit vendor wallet compensation and reverse payout record.
5. Reject path marks request failed and appends `REFUND_REJECTED` lifecycle event.
```

### Withdrawal Transfer Processing Lifecycle

```
1. Vendor withdrawal request creates `WITHDRAWAL` transaction intent (`PENDING`) without immediate wallet debit.
2. Processing endpoint `POST /api/wallet/withdraw/process` initiates provider transfer and reconciles status.
3. On success, wallet is debited and withdrawal transaction marked `COMPLETED`.
4. On failure, transaction is marked `FAILED` and available balance remains unaffected.
5. Wallet API exposes derived `availableBalance` and `pendingWithdrawals` for accurate UI display.
```

### Operations Payment Mode Visibility Flow

```
1. Admin opens `/operations/settings` and loads payment processing section.
2. Client requests `/api/admin/payments/config` to retrieve sanitized gateway config status.
3. API resolves active Paystack mode from env (`PAYSTACK_MODE`) and selected key set (test/live) without exposing secrets.
4. Response includes mode-aware callback URL, expected dashboard webhook URL, key/webhook readiness booleans, and Paystack webhook whitelist IPs.
5. UI surfaces explicit test-vs-live behavior guidance so admins understand whether transactions are simulated or real-money.
```

### Notification Delivery Flow

```
1. Domain mutation (for example order creation or wallet deposit) calls `dispatchNotification`.
2. Notification template resolver (`lib/services/notificationTemplateResolver.ts`) merges config-driven templates with event metadata + user context.
3. Service checks user-level notification preferences and preserves mandatory critical-email delivery for order/payment/delivery events.
4. Service persists in-app notification record in Prisma when optional type/channel is enabled.
5. Service optionally sends email through Resend-backed email service.
6. Service optionally sends web push to stored user subscriptions.

### Notification Inbox + Preference Route Flow

```

1. `/notifications` renders full inbox timeline (`NotificationInbox`) with shared context actions (read, read-all, delete, refresh, CTA navigation).
2. `/notifications/settings` renders preference controls only (`NotificationPreferences`) with explicit editable vs enforced sections.
3. Sidebar/nav include both inbox and settings links for vendor/admin discoverability; buyer flows discover settings through inbox and bell-entry links.
4. Notification context is source-of-truth for bell/drawer/inbox synchronization and now refreshes on a calmer 5-minute cadence plus manual refresh.

```

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

| Layer      | Technology                | Version                |
| ---------- | ------------------------- | ---------------------- |
| Frontend   | Next.js (App Router)      | 15.x                   |
| UI         | React                     | 19.x                   |
| Styling    | Tailwind CSS + Ant Design | Tailwind 3.x, Antd 5.x |
| State      | Zustand                   | 4.x                    |
| Validation | Zod                       | 3.x                    |
| Auth       | JWT (jose)                | 6.x                    |
| Data       | Prisma adapter facade     | n/a                    |
| DB         | Prisma ORM + PostgreSQL   | 7.x                    |

---

## Architecture Drift Check (2026-04-08)

> **Section summary:** Recently detected mismatches between docs and current code, now synchronized.

- Legacy route-group references `(buyer)/(vendor)/(admin)` were removed from active architecture descriptions; canonical operations routes are now documented as `app/(operations)/operations/*`.
- Runtime persistence is Prisma-first; references to mock-backend-as-primary were removed from core flow narratives.
- Discoverability and policy must stay aligned across `lib/rbac/routeConfig.ts`, `lib/navigation.ts`, and `components/layout/Sidebar.tsx` to avoid parity drift.

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

| Date       | Change                                                     | Reason                                                                                                      |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-03-15 | Initialized `.ai-system` & documented architecture         | Bootstrapped AI-guided workflow for MyHarvestHub                                                            |
| 2026-03-31 | Hardened signup flow and dashboard route mapping           | Fix `Missing required fields` signup bug and unify role dashboards                                          |
| 2026-04-01 | Added buyer-to-vendor conversion and persistence hardening | Address client concerns on role conversion, editability, and auth UX                                        |
| 2026-04-01 | Standardized ad APIs/uploads + signup layout modernization | Improve production-readiness via API consistency, offline resilience, and UX cleanup                        |
| 2026-04-01 | Introduced `/operations/*` canonical management namespace  | Start grouped-route migration with middleware redirects from legacy role-prefixed URLs                      |
| 2026-04-01 | Removed final operations wrappers and legacy hosts         | Completed migration so operations pages are self-contained and legacy admin/vendor pages redirect           |
| 2026-04-01 | Enforced server-side payment verification in mutations     | Prevent unverified card orders/wallet credits by verifying payment status at API mutation boundaries        |
| 2026-04-01 | Added unified notification fan-out service                 | Centralize in-app/email/web-push delivery and honor notification preference settings                        |
| 2026-04-01 | Added public ad-application intake route                   | Enable unauthenticated ad submissions with validated/rate-limited backend intake                            |
| 2026-04-01 | Enforced vendor-scoped analytics KPI computation           | Prevent vendor dashboards from showing platform-wide aggregate metrics                                      |
| 2026-04-09 | Added notifications inbox-first route + template resolver  | Restore `/notifications` inbox discoverability, make preference UI truthful, and reduce churny runtime copy |
| 2026-04-13 | Added idempotent order lifecycle + delivered payout automation + WhatsApp guard flow | Enforce deterministic status transitions, replay-safe payout automation, and guard-first external vendor contact |
| 2026-04-13 | Refined banner deck and category navigation query-sync UX  | Deliver image-first hero/side ad composition and ensure category-tag filtering responds directly to URL navigation |
| 2026-04-14 | Reconciled commerce assurance docs into Phase A delivered + Phase B continuation | Preserve merged deterministic lifecycle safeguards while restoring full original scope for settlement/refund/auto-confirm closure |
| 2026-04-14 | Implemented Phase B lifecycle APIs for settlement release, refund review, and withdrawal processing | Move from delivery-trigger immediate credit to confirmation-gated settlement release with explicit reconciliation paths |
| 2026-04-14 | Added admin lifecycle config + multi-vendor split checkout safety | Make SLA/refund timing operationally configurable and ensure grouped checkout funds/order integrity across vendors |

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

### Orders Domain Scope-Split Flow

```
1. Buyer history route remains canonical at `/orders` and is buyer-only in route policy.
2. Vendor/admin operational order management uses `/operations/orders`.
3. Non-buyer access to `/orders` is redirected to `/operations/orders`.
4. Middleware keeps legacy compatibility by redirecting `/admin/orders` and `/vendor/orders` to `/operations/orders`.
5. Navigation/sidebar and RBAC route registry are aligned with the same scope split to avoid discoverability drift.
```

### Role/Domain Parity Matrix Enforcement Flow

```
1. Route policy registry (`lib/rbac/routeConfig.ts`) defines role/public scope for core domains:
   products, orders, vendors, wallet, notifications, ads, bug reports, profile/store.
2. Navigation builder + operations sidebar expose discoverable entry points only for allowed role scopes.
3. Domain parity regression tests assert route policy, navigation visibility, and legacy redirect behavior.
4. Dead-link audits validate route discoverability consistency after navigation/policy changes.
```

| 2026-04-04 | Added email-change reverification + bug-report/settings/help-flow hardening | Close cloud continuation queue for account security, config-driven UX surfaces, and operations reliability |
| 2026-04-04 | Enforced signup role/position parity + Cloudinary-first governed uploads | Remove Worker signup role drift, require vendor verification contract, and harden image evidence ingestion |
| 2026-04-05 | Enforced explicit orders scope split + role/domain parity matrix | Separate buyer history from operations order management and harden route discoverability/scope boundaries |
