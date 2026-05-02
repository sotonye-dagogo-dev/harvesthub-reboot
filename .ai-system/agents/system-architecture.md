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

| Module                                | Responsibility                                                    | Key Files                                                | Dependencies                                            |
| ------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `app/`                                | UI routing and server/client components                           | `app/layout.tsx`, `app/(auth)/*`, `app/(operations)/*`   | `components/`, `lib/`                                   |
| `app/api/`                            | Backend endpoints for auth, products, orders, wallet, content     | `app/api/auth/*`, `app/api/orders/*`, `app/api/upload/*` | `lib/data/`, `lib/schemas/`, `lib/api/`                 |
| `app/become-vendor`                   | Buyer-to-vendor conversion UX entrypoint                          | `app/become-vendor/page.tsx`                             | `app/api/users/me/*`, `lib/constants`                   |
| `lib/api/`                            | Unified API success/error envelopes and handler wrappers          | `lib/api/http.ts`                                        | `next/server`                                           |
| `lib/config/`                         | Canonical runtime/discovery/notification copy+template config     | `lib/config/index.ts`, `lib/config/productDiscovery.ts`  | `lib/constants/`, feature components                    |
| `lib/data/`                           | Prisma-backed adapter facade and domain data access               | `database.ts`, `prismaAdapter.ts`                        | `lib/types.ts`, `lib/db/*`                              |
| `lib/services/notifications`          | Preference-aware notification fan-out + template resolution       | `lib/services/notifications.ts`                          | `lib/services/email.ts`, `lib/services/push.ts`, Prisma |
| `lib/services/email`                  | Branded email delivery wrapper + sender-specific template helpers  | `lib/services/email.ts`                                  | `lib/emails/`, Resend, delivery logging                  |
| `lib/emails/`                         | Shared branded email layout and sender-specific React templates    | `EmailLayout.tsx`, `NotificationEmail.tsx`, order/auth templates | `@react-email/components`                      |
| `lib/utils/offlineQueue`              | Client-side offline queue/replay for network-dependent operations | `lib/utils/offlineQueue.ts`, `lib/utils/localDraft.ts`   | Browser storage APIs                                    |
| `lib/utils/bannerPlacementValidation` | Placement-aware banner ratio validation helpers                   | `lib/utils/bannerPlacementValidation.ts`                 | `lib/constants/index.ts`, upload consumers              |
| `lib/schemas/`                        | Validation schemas (Zod)                                          | `auth.schemas.ts`, `product.schemas.ts`                  | `lib/types.ts`                                          |
| `lib/store/`                          | Client-side state stores (Zustand)                                | `cartStore.ts`, `walletStore.ts`                         | `lib/data/`                                             |
| `components/`                         | Reusable UI and feature components                                | `ui/`, `features/`, `layout/`                            | `lib/utils/`, `lib/constants/`                          |
| `prisma/`                             | Data model and migration tooling                                  | `schema.prisma`, `seed.ts`                               | Prisma client                                           |

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
1. Global layout renders `TOP` banners as a compact full-width strip (roughly half previous height) with fill-first image rendering and no in-strip navigator controls.
2. Home surface loads active banner payloads and separates them by placement (`HERO`, `SIDEBAR`).
3. Hero placement renders as image-first carousel with reduced viewport height contract (~1/6 shorter) and a compact below-image action panel containing nav controls, center indicators, and `Know More` CTA for modal details.
4. Sidebar placement renders compact square banner tiles in a denser responsive grid so more ads remain visible at once.
5. Banner links/actions remain config/data-driven with fallback to non-clickable cards when no destination is configured.
6. Operations/advertise preview surfaces mirror runtime placement ratios to avoid preview-runtime drift.
```

### Header Category Accessibility Flow

```
1. Header keeps category navigation out of desktop chrome to reduce top-nav clutter on web view.
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

### Branded Email Delivery Flow

```
1. Application services call the shared wrapper helpers in `lib/services/email.ts` rather than building ad hoc JSX payloads.
2. Sender-specific wrappers resolve the appropriate component from `lib/emails/` and render it through the shared `EmailLayout`.
3. Notification dispatch routes use the branded generic notification template for non-order mail and preserve structured detail tables when metadata provides them.
4. Order, auth, wallet, vendor, and availability emails keep their own content-specific templates, but all share the same branded shell, typography, and footer contract.
5. Delivery logging stays centralized in the email service wrapper so retries and provider outcomes remain consistent.
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

### Ad/Banner Idempotent Mutation Flow

```
1. Client mutation forms (`/operations/banners`, `/advertise`, `/ad-application`) generate request keys and apply submit-lock while request is in-flight.
2. Banner/ad mutation routes derive idempotency key from request header or payload fingerprint fallback.
3. API attempts Redis-backed guard acquisition and falls back to local in-memory guard when Redis is unavailable.
4. First request writes once and stores replay payload for a short dedupe window.
5. Replayed requests return replay-safe payload (or duplicate-processing acknowledgement) without duplicate writes.
6. `/api/ad-applications` and `/api/ads/apply` share one submission service to prevent route-contract drift.
```

### Banner Upload Placement Validation Flow

```
1. User selects ad/banner placement (`TOP`, `HERO`, `SIDEBAR`) and uploads an image through `ImageUpload`.
2. `/api/upload` returns upload metadata including `width` and `height`.
3. Client runs `validateBannerPlacementRatio` against `AD_BANNER_DIMENSIONS` recommendations.
4. If deviation is within tolerance, flow proceeds silently.
5. If deviation exceeds tolerance, UI emits non-blocking warning payload (`expectedRatio`, `actualRatio`, `deviationPercent`, human guidance).
6. Upload remains successful; user can keep asset or re-upload better-fitting creative.
```

### Header Search Suggestion + Recent History Flow

```
1. Header composes shared `SearchBar` component instead of static input.
2. Typing 2+ characters triggers debounced product suggestion fetches via client fetcher/API.
3. Dropdown renders suggestion cards (image/title/price) with loading/empty/error states.
4. Recent searches are loaded from browser storage and shown when query is short/empty.
5. Keyboard and pointer controls support highlight navigation (`ArrowUp/ArrowDown`), enter-select, escape-close, and click-outside close.
6. Selection navigates to product detail (suggestion) or canonical discovery search route (`/products?search=...`) and recent history is persisted.
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
3. Guard page enforces auth; unauthenticated users are routed to signup with a persisted safe continuation path.
4. Signup -> verify-email -> login flow refires the stored continuation so users return to the same guard intent after completion.
5. Guard page displays safety disclaimer and off-platform warning before any external navigation.
6. User explicitly confirms with "Continue to WhatsApp" before browser opens `wa.me`.
7. Guard page emits lightweight telemetry marker (`/api/telemetry/off-platform-contact`) with sanitized source context.
8. Invalid/missing phone context blocks external handoff and keeps user in internal safe state.
```

### Context-Aware WhatsApp Intent Flow

```
1. Product/vendor CTAs build origin-aware prefilled chat text via shared helper (`lib/utils/whatsappIntent.ts`).
2. Intent payload includes source label plus canonical source URL before routing to guard page.
3. Guard page normalizes source/vendor/message/url and rebuilds safe fallback message when context is incomplete.
4. Confirm action opens `wa.me` with encoded prefilled text and emits sanitized source-aware telemetry.
5. Product CTA includes explicit WhatsApp icon/green affordance for chat intent clarity.
```

### Voucher Scope + Visibility Flow

```
1. Operations configures voucher scope in `/operations/vouchers` using campuses, categories, vendors, products, and visibility (PUBLIC/PRIVATE).
2. Admin voucher APIs persist scope as normalized JSON-compatible fields while preserving legacy array compatibility.
3. Buyer voucher dashboard API (`/api/vouchers/my`) excludes PRIVATE vouchers from visible availability payloads.
4. Checkout sends cart context (product/vendor IDs) to `/api/vouchers/validate`.
5. Validate route resolves product/vendor category/campus metadata and enforces scope applicability before returning discount.
6. Voucher applicability remains config-driven and reusable through shared `lib/vouchers/scope.ts` helpers.
```

### Dynamic Metadata Parity Flow (Entity Detail Pages)

```
1. Product/vendor dynamic routes resolve canonical base URL from request headers + env fallback.
2. Shared metadata builder composes title, description, image, and canonical url with deterministic fallbacks.
3. Open Graph and Twitter metadata are generated from the same normalized values to avoid preview drift.
4. Missing entity fields degrade to safe defaults (no blank title/description/image/url output).
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
1. Client initializes Paystack card handoff via inline popup (`https://js.paystack.co/v1/inline.js`) using runtime payment config public key and receives a provider reference.
2. Client submits payment metadata to downstream mutation endpoint (`/api/orders` or `/api/wallet/deposit`).
3. Mutation endpoint verifies payment server-side via `lib/services/payments.ts` before any persistence action.
4. On success, endpoint persists business record and verification audit metadata.
5. On failure/unverified status, endpoint rejects mutation with payment-specific error codes (for example `PAYMENT_VERIFICATION_FAILED`) and verification payload context.
6. Checkout client maps known API error codes (`INSUFFICIENT_WALLET_BALANCE`, `WALLET_NOT_AVAILABLE`, `PAYMENT_VERIFICATION_FAILED`) through shared mapper helper (`app/checkout/error-mapping.ts`) into explicit user-facing feedback.
```

### Payment Initialize Error Taxonomy Flow

```
1. `/api/payments/initialize` validates amount/email contract (merchant/app-supplied amount remains required).
2. Provider initialize failures are mapped to stable app-level error codes (`PAYMENT_PROVIDER_IP_NOT_ALLOWED`, etc.).
3. Response payload keeps user-safe message while including operator diagnostics path (`/operations/settings`) and action guidance.
4. Operations settings Paystack panel documents diagnostics remediation path for initialize failures.
```

### Order Status Lifecycle + Delivered Payout Automation Flow

```
1. Vendor/admin submits status update to `PATCH /api/orders/[id]/status`.
2. API validates requested status against canonical enum-safe lifecycle transitions.
3. Same-status requests return idempotent success and skip side effects.
4. Valid transitions update `order.status` + status history atomically, including optional operator-provided transition notes.
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
3. Admin updates auto-confirm enablement + SLA hours + refund request window + withdrawal settlement hold window via `PUT /api/admin/commerce-config`.
4. `POST /api/orders/auto-confirm` reads persisted config to determine enablement and window.
5. `POST /api/orders/[id]/refund/request` enforces admin-configured refund window against delivered timestamp.
6. `POST /api/wallet/withdraw` enforces pending-settlement hold checks using persisted `withdrawalSettlementHoldHours`.

### Admin Commission + Lifecycle Coordinated Settings Save Flow

```

1. Operations settings page loads commission defaults from `GET /api/admin/commission` and lifecycle controls from `GET /api/admin/commerce-config`.
2. Save action submits category commission rates to `PUT /api/admin/commission` (decimal rate contract) and lifecycle policy to `PUT /api/admin/commerce-config`.
3. Client surfaces partial-save visibility if one section persists and another fails.
4. Category commission defaults now persist via dedicated admin API instead of UI-only no-op behavior.

```

### Operations Settings Control Persistence Map

| Settings Control | Source of Truth | Endpoint/Contract | Persistence Model |
| --- | --- | --- | --- |
| Category commission defaults | Admin managed | `GET/PUT /api/admin/commission` | `CommissionConfig` |
| Auto-confirm enabled + hours | Admin managed | `GET/PUT /api/admin/commerce-config` | `CommerceLifecycleConfig` |
| Refund request window | Admin managed | `GET/PUT /api/admin/commerce-config` | `CommerceLifecycleConfig` |
| Withdrawal settlement hold window | Admin managed | `GET/PUT /api/admin/commerce-config` | `CommerceLifecycleConfig` |
| Payment processing enabled indicator | Runtime derived (read-only) | `GET /api/admin/payments/config` | Environment key readiness (`PAYSTACK_MODE` + key set) |
| Minimum order amount display | Runtime default (read-only) | Client constant (`PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT`) | Build/runtime config constant |
| Maximum booking advance display | Runtime default (read-only) | Client constant (`PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS`) | Build/runtime config constant |

Notes:
Editable controls are limited to values with persisted API contracts. Runtime-default controls remain explicitly read-only to prevent editable-no-persistence drift.

### Multi-Vendor Checkout Split Order Flow

```

1. Checkout groups cart lines by `vendorId` and submits `vendorOrders[]` in one checkout request.
2. `POST /api/orders` verifies payment once (gateway/wallet semantics), validates vendor ownership per line, and computes per-vendor totals.
3. API creates one order per vendor within a single DB transaction and links them via checkout-group metadata.
4. Wallet method debits buyer wallet once for the grouped checkout amount while recording per-order payment transactions with deterministic balance progression.
5. Stock/vendor metrics update per split order, and notifications fan out to each vendor plus buyer checkout summary.
6. `GET /api/orders` derives `orderGroupId` from order history metadata and returns grouped summary aggregates for grouped-order traceability.

```

### Grouped Order Bulk Lifecycle Flow

```

1. Buyer/admin opens an order detail page and, when grouped context exists, client fetches sibling orders by `groupId`.
2. Client submits grouped action requests to `POST /api/orders/group/[groupId]/bulk` with action type (`CANCEL` or `REFUND_REQUEST`).
3. API resolves all group orders visible to requester role scope and evaluates per-order eligibility.
4. Eligible orders are mutated (cancel or refund-request transition), while ineligible items are skipped with structured reasons.
5. API returns partial-applicability report (`applied`, `skipped`, counts) so UI can render mixed-status outcomes safely.
6. Grouped listing endpoints (`GET /api/orders?groupId=...` and `GET /api/orders/[id]`) expose `orderGroupId`/group metadata for traceability and navigation.

```

### Wallet Role Parity + Derived Balance Presentation Flow

```

1. Wallet page requests wallet summary and renders derived balances (`current`, `available`, `pending`) from API response.
2. Authenticated users can access deposit/withdraw controls when gateway and form prerequisites are satisfied.
3. Restriction messaging is contextual (for example pending settlement holds) instead of blanket role-only lockouts.
4. Focused tests verify role parity behavior and balance invariants to prevent regressions.

```

### Wallet Deterministic Reconciliation Flow

```

1. Wallet page triggers `refresh(true)` on mount to avoid stale-cache drift after recent order/refund mutations.
2. Wallet mutations emit wallet sync events (`wallet-deposit`, `wallet-withdraw`) after successful server commits.
3. Order detail lifecycle mutations emit wallet sync events for potentially balance-impacting actions (cancel, refund request/review, grouped action, confirm delivery).
4. Wallet page subscribes to sync events and forces `refresh(true)` so card balances/transactions reconcile deterministically.

```

### Refund Request/Review/Reconciliation Flow

```

1. Buyer submits refund request via `POST /api/orders/[id]/refund/request`.
2. API records pending refund transaction and appends `REFUND_REQUESTED` lifecycle event.
3. Admin reviews via `POST /api/orders/[id]/refund/review` with approve/reject action.
4. Approve path credits buyer wallet, marks order/payment as refunded, and reconciles payout: - pre-release: reverse pending payout hold - post-release: debit vendor wallet compensation and reverse payout record.
5. Reject path marks request failed and appends `REFUND_REJECTED` lifecycle event.

```

### Withdrawal Transfer Processing Lifecycle

```

1. Authenticated withdrawal request creates `WITHDRAWAL` transaction intent (`PENDING`) without immediate wallet debit.
2. Request path applies contextual hold guard (`WITHDRAWAL_PENDING_SETTLEMENT`) when recent pending payout settlements exist.
3. Processing endpoint `POST /api/wallet/withdraw/process` initiates provider transfer and reconciles status.
4. On success, wallet is debited and withdrawal transaction marked `COMPLETED`.
5. On failure, transaction is marked `FAILED` and available balance remains unaffected.
6. Wallet API exposes derived `availableBalance` and `pendingWithdrawals` for accurate UI display.

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
3. Sidebar/nav include both inbox and settings links for vendor/admin discoverability; header and hamburger nav now include inbox discoverability with unread badge counts.
4. Notification context is source-of-truth for bell/drawer/inbox synchronization and now refreshes on a calmer 5-minute cadence plus manual refresh.
5. On post-hydration polling, newly detected unread notifications emit in-app toast signals for proactive awareness.
6. Push preference saves orchestrate browser subscription enable/disable (not just API persistence), including permission-denied graceful messaging.

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
(public)/ -> marketing + catalogue + public content pages
(auth)/ -> login/reset/verify/signup flows
(dashboard)/ -> shared authenticated feature routes (orders, wallet, profile, analytics)
(operations)/ -> operational consoles (admin/vendor tools) with capability-aware layouts
api/
\_shared/ -> shared API middleware/wrappers/validators

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
- Payment provider integration now supports real Paystack initialize/verify contracts when credentials exist, with controlled stub fallback in non-configured environments.
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
| 2026-04-14 | Rebalanced top/hero/sidebar banner runtime and preview ratios | Reduce banner vertical dominance, keep top-strip clipping near zero, and increase sidebar tile density with square-card parity |
| 2026-04-14 | Tightened notification signal UX and push preference orchestration | Align saved push intent with real browser subscription state and improve in-session notification discoverability via unread badges + toasts |
| 2026-04-14 | Implemented Tracks A-H core UX/flow hardening slice | Added sidebar-ad rail contracts, settings commission persistence, operations orders data-table with status notes, grouped summary exposure, and route-scoped navigation guard copy improvements |
| 2026-04-14 | Added grouped bulk order actions + settings parity test contracts + wallet/email completeness pass | Completed grouped cancel/refund-request API+UI safety reporting, persistence parity regressions for settings APIs, role-aware wallet action messaging, and richer order-email metadata contracts |
| 2026-04-14 | Closed remaining queue with wallet sync reconciliation + settings control audit map + payment smoke evidence | Ensured deterministic wallet refresh after lifecycle mutations, documented settings control persistence ownership, and validated wallet/payments grouped flows with focused smoke suites |
| 2026-04-15 | Hardened wallet/checkout payment reliability + notification/email delivery parity | Enforced buyer-only checkout + admin wallet read-only contract, removed synthetic payment verification shortcuts, added gateway-aware initialize/verify behavior, improved notification recency/push diagnostics, and routed order lifecycle emails through shared templates |
| 2026-04-15 | Closed payment/notification reliability follow-ups | Added Paystack webhook replay-safe reconciliation (signature + idempotency + provider re-verification), completed unread-sync timing regression tests, and captured push delivery smoke checklist guidance |
| 2026-04-15 | Switched checkout/withdraw access to authenticated policy with contextual payout guardrails | Removed blanket role hard-blocks for checkout/withdraw request actions, added pending-settlement contextual withdrawal restriction, and improved push health diagnostics with actionable repair flow |
| 2026-04-16 | Closed ads/wallet/chat metadata reliability package | Added ad/banner mutation idempotency, unified ad submission semantics, config-driven sidebar rail motion/bounds, wallet action containment, payment initialize error taxonomy, context-aware WhatsApp intent payloads, and dynamic metadata parity builder |

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

### Checkout Payment Verification Lifecycle Flow

```

1. Authenticated user starts checkout and launches Paystack inline popup using runtime-configured public key.
2. Buyer completes payment in popup and receives provider reference callback in checkout client.
3. Checkout verifies provider reference via `/api/payments/verify`.
4. Orders API (`POST /api/orders`) re-verifies provider reference server-side before creating paid orders.
5. On successful verification, order status-history stores payment verification timeline metadata (`verificationStatus`, `verificationProviderStatus`, `paymentVerifiedAt`).
6. On failed/pending/not-found/unavailable states, order creation is rejected with typed error codes for explicit checkout UX mapping.

```

### Paystack Webhook Reconciliation Flow

```

1. Paystack posts callback events to `/api/payments/webhook` (or compatibility alias `/api/paystack-webhook`) with `x-paystack-signature`.
2. Route validates signature before any persistence side effects.
3. Route acquires replay guard key (`paystack:webhook:<event|reference>`) via Redis with local-memory fallback when Redis is unavailable.
4. Supported payment events are re-verified against provider status through `verifyPayment` before reconciliation writes.
5. Verified matches update transaction/order state and append webhook reconciliation audit metadata to order status history.
6. Replayed events are acknowledged idempotently without duplicating side effects.

```

### Wallet Deposit Verification Lifecycle Flow

```

1. User initializes deposit payment from wallet UI via Paystack inline popup.
2. Wallet UI receives provider reference callback and immediately submits deposit mutation payload.
3. `/api/wallet/deposit` verifies the provider reference before crediting wallet balance.
4. Deposits are available for authenticated roles when payment gateway readiness checks pass.
5. Withdrawals are available to authenticated users with contextual pending-settlement hold checks in `/api/wallet/withdraw`.
6. Successful verification writes completed transaction metadata with gateway and verification context.

```

### Notification Freshness + Push Health Flow

```

1. Notification context performs periodic sync plus passive sync triggers on window focus, tab visibility regain, and reconnect (`online`).
2. Passive refresh calls are throttle-guarded to avoid request storms.
3. Notifications preferences surface push health diagnostics (permission, service worker readiness, browser subscription, backend sync status).
4. Push health endpoint (`POST /api/push/health`) validates subscription endpoint persistence for current user.

```

### Order Lifecycle Email Template Routing Flow

```

1. Notification dispatcher resolves notification template metadata and delivery channels.
2. For order lifecycle notification types, dispatcher fetches associated order context when available.
3. Buyer order-confirmed notifications use `sendOrderConfirmationEmail`.
4. Vendor/non-buyer lifecycle updates use `sendOrderStatusUpdateEmail`.
5. Generic inline notification email is used only as fallback when template routing cannot complete.

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
```
