# Repair System — Error Knowledge Base

> **Overview:** A living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents should consult this before diagnosing new errors. Every fixed bug should be logged here to prevent recurrence.

---

## How to Use This File

- **Before debugging:** Search this file for patterns matching your current error
- **After fixing a bug:** Add an entry using the template at the bottom
- **Agents:** Reference this during the fix-build and self-heal cycles

---

## Error Log

> **Section summary:** Each error entry includes the symptom, cause, fix, and prevention strategy. Entries are added chronologically.

---

## [Search UI crashes in tests/runtimes where localStorage is non-standard]

**Symptom:**

- Header/Search components crash with errors like `window.localStorage.getItem is not a function`.

**Root Cause:**

- Environment provided a non-standard/localstorage shim where expected methods (`getItem`, `setItem`, `removeItem`) were absent or not callable.

**Fix Applied:**

- Added storage capability guard in search component (`getSafeStorage`) before any localStorage access.
- Updated SearchBar tests to install deterministic localStorage mock instead of relying on environment default.

**Prevention:**

- Never call browser storage APIs directly without capability checks in shared UI components.
- In tests, explicitly mock localStorage when persistence behavior is asserted.

**Files Affected:**

- components/features/SearchBar.tsx
- components/__tests__/SearchBar.test.tsx

**Date:** 2026-04-15

---

## [Order list item count rendered as 0 on buyer/operations pages]

**Symptom:**

- Order cards/table rows display `0 items` even when orders contain order items.

**Root Cause:**

- List consumers derived count from `order.items?.length`.
- `GET /api/orders` list response did not include `items` relation payload by default, so UI fallback evaluated to zero.

**Fix Applied:**

- Added canonical `itemCount` and `totalQuantity` fields in `GET /api/orders` response.
- Updated buyer `/orders` and operations `/operations/orders` consumers to read canonical count fields with fallback safety.
- Added grouped-orders API test assertions for canonical count fields.

**Prevention:**

- Do not rely on optional relation arrays for list metrics.
- Expose required display aggregates (counts/totals) directly in list API contracts.

**Files Affected:**

- app/api/orders/route.ts
- app/orders/page.tsx
- app/(operations)/operations/orders/page.tsx
- app/api/orders/__tests__/route.grouping.test.ts

**Date:** 2026-04-15

---

## [Next.js page module exported helper and failed typecheck]

**Symptom:**

- TypeScript/Next compile failed after adding a named helper export in a `page.tsx` file under App Router.

**Root Cause:**

- App Router page modules have a constrained export surface; arbitrary named exports from `page.tsx` violate framework typing/build contracts.

**Fix Applied:**

- Moved reusable helper (`mapCheckoutErrorMessage`) into sibling utility module (`app/checkout/error-mapping.ts`).
- Imported helper into page module and updated tests to target helper module directly.

**Prevention:**

- Do not export reusable utilities directly from `app/**/page.tsx` files.
- Extract reusable/tested logic into nearby utility modules.

**Files Affected:**

- app/checkout/page.tsx
- app/checkout/error-mapping.ts
- app/checkout/__tests__/page.error-mapping.test.ts

**Date:** 2026-04-14

---

## [Operations settings commission controls changed UI state but did not persist]

**Symptom:**

- Admin could edit commission values in operations settings UI, but values were not saved to backend and reverted on reload.

**Root Cause:**

- Settings save path only persisted commerce lifecycle config and skipped commission API writes.

**Fix Applied:**

- Added commission config load/save wiring through `/api/admin/commission`.
- Coordinated settings save now persists commission and lifecycle settings and surfaces partial-save warnings when one section fails.

**Prevention:**

- Do not expose editable settings controls without a concrete persisted API contract.
- Keep multi-section settings saves explicit about section-level success/failure.

**Files Affected:**

- app/(operations)/operations/settings/page.tsx
- app/api/admin/commission/route.ts

**Date:** 2026-04-14

---

## [Notification preference saved but browser push state remained stale]

**Symptom:**

- Users could save push preference toggles, but browser/device push subscription state did not consistently change.
- Notifications were delivered to inbox but lacked proactive in-app signal on arrival, reducing perceived reliability.

**Root Cause:**

- Preference persistence (`/api/notifications/preferences`) was not tightly coupled to browser push subscribe/unsubscribe orchestration.
- Notification polling updated state silently without differentiating newly detected unread items from existing feed baseline.

**Fix Applied:**

- Added explicit push orchestration methods in notification context for enable + disable flows (including backend unsubscribe cleanup).
- Wired `NotificationPreferences` save flow to invoke subscription orchestration and surface permission/setup warnings.
- Added fresh-unread detection in notification polling and emit in-app toast signals for newly detected events.
- Added unread badge surfacing to primary navigation links for better discoverability.

**Prevention:**

- Treat channel preference toggles as orchestration contracts, not storage-only flags.
- Keep nav badge + toast signal paths as first-class notification UX contracts with focused regression tests.

**Files Affected:**

- lib/contexts/NotificationContext.tsx
- components/features/NotificationPreferences.tsx
- components/layout/Header.tsx
- components/layout/Sidebar.tsx

**Date:** 2026-04-14

---

## [New Prisma model exists in schema but TypeScript reports missing Prisma client delegate]

**Symptom:**

- After adding a new Prisma model and running migration, TypeScript still reports missing delegate properties on `prisma` (for example `Property 'commerceLifecycleConfig' does not exist on type PrismaClient`).

**Root Cause:**

- Prisma schema/migration changed, but generated client artifacts in `prisma/generated/client` were not refreshed yet.

**Fix Applied:**

- Regenerated Prisma client (`npx prisma generate`) after migration execution.

**Prevention:**

- Always regenerate Prisma client immediately after schema changes/migration execution in this repository.
- Confirm generated client files are updated before running full typecheck.

**Files Affected:**

- prisma/schema.prisma
- prisma/generated/client/*

**Date:** 2026-04-14

---

## [Products category tags updated URL but did not apply filter state until sidebar interaction]

**Symptom:**

- Clicking horizontal category tags on products/home navigation updated route query but product list remained unfiltered.
- Filtering only reflected after interacting with sidebar filter controls.

**Root Cause:**

- `ProductsContent` initialized client filter state from `initialQueryState` once, but did not rehydrate local state from subsequent URL query updates on same-route navigation.

**Fix Applied:**

- Added URL-query synchronization in `ProductsContent` using `useSearchParams` + `parseProductDiscoveryQueryState`.
- Rehydrated local search/sort/filter state whenever query params change.

**Prevention:**

- For query-driven pages, treat URL query as source-of-truth and keep local state synchronized.
- Add regression coverage for route-query updates, not only initial hydration.

**Files Affected:**

- components/features/ProductsContent.tsx
- components/__tests__/ProductsContent.discovery-contract.test.tsx

**Date:** 2026-04-13

---

## [Order status API drifted from enum-safe lifecycle and allowed non-deterministic payout side effects]

**Symptom:**

- `PATCH /api/orders/[id]/status` contained lifecycle states not present in schema (`SHIPPED`, `COMPLETED`), causing transition drift against persisted enums.
- Replayed status updates lacked explicit idempotent handling and could not safely guarantee no duplicate payout side effects.

**Root Cause:**

- Legacy transition map was string-based and not constrained to schema enums.
- Delivered-order payout automation had no deterministic replay guard in this endpoint.

**Fix Applied:**

- Replaced transition map with canonical `OrderStatus` enum transitions only.
- Added idempotent same-status no-op response path.
- Added transaction-safe delivered payout automation for paid orders with deterministic payout reference (`PAYOUT-ORDER-{orderId}`) and existing-transaction guard.

**Prevention:**

- Keep lifecycle maps enum-typed instead of free-form strings.
- Treat status mutation endpoints as replayable APIs and enforce idempotent side-effect guards for financial writes.

**Files Affected:**

- app/api/orders/[id]/status/route.ts
- app/api/orders/__tests__/status.route.test.ts

**Date:** 2026-04-13

---

## [Direct WhatsApp vendor link bypassed internal safety warning]

**Symptom:**

- Vendor profile WhatsApp CTA opened external `wa.me` link immediately with no internal safety checkpoint.

**Root Cause:**

- Contact CTA was implemented as direct external anchor from vendor detail page.

**Fix Applied:**

- Added public guard page at `/contact/whatsapp` with explicit off-platform safety disclaimer and continue action.
- Updated vendor detail CTA to route through guard-first page before external handoff.

**Prevention:**

- Route external messaging handoffs through internal safety-interstitial pages instead of direct outbound anchors.
- Validate/sanitize outbound phone payload before generating external URLs.

**Files Affected:**

- app/contact/whatsapp/page.tsx
- app/contact/whatsapp/__tests__/page.test.tsx
- app/vendors/[id]/page.tsx

**Date:** 2026-04-13

---

## [Native browser confirm bypasses shared destructive-action governance]

**Symptom:**

- Some destructive actions (for example content delete in operations/public-content editor) use `window.confirm` instead of the shared confirmation utility.
- Confirmation UX becomes inconsistent and can drift from app-wide behavior controls.

**Root Cause:**

- Legacy/localized action handlers retained direct `confirm(...)` usage during earlier feature iterations.
- No enforcement sweep was run after introducing shared `openActionConfirm` infrastructure.

**Fix Applied:**

- Replaced direct browser confirm path in `PublicContentAdminPanel` with `openActionConfirm`.
- Routed section removal and content deletion actions through shared confirm presets/builder.
- Verified no remaining `confirm(...)` usage in app/components destructive flows.

**Prevention:**

- Do not introduce `window.confirm` in feature code.
- Use `openActionConfirm` as the only confirmation entry point for destructive actions.
- Include a quick grep check for `confirm(` when adding/modifying destructive operations.

**Files Affected:**

- components/features/PublicContentAdminPanel.tsx

**Date:** 2026-04-09

---

## [Operations products vendor selector reverts from All to first store]

**Symptom:**

- In operations product management, selecting `All vendors` reverts to a specific store after a short delay.
- Product list scope appears to reset unexpectedly after refresh/bootstrap.

**Root Cause:**

- Bootstrap effect loaded vendor options then auto-set admin filter to first vendor whenever current value was `ALL`.
- Effect depended on the filter state itself, causing re-run loops that re-applied first-vendor override.

**Fix Applied:**

- Removed forced first-vendor override when filter is explicitly `ALL`.
- Changed filter reconciliation to preserve user selection if still valid, else fallback to `ALL`.
- Removed `adminVendorFilter` from bootstrap effect dependency list to prevent self-triggered reset loops.

**Prevention:**

- Avoid auto-selecting first option in bootstrap for user-controlled scope filters.
- For selector bootstraps, reconcile invalid stale values to a neutral option rather than forcing specific entity scope.

**Files Affected:**

- app/(operations)/operations/products/page.tsx

**Date:** 2026-04-09

---

## [Static modal confirm can fail to present reliably across shells]

**Symptom:**

- Some destructive buttons trigger no visible confirmation dialog in certain route/shell contexts.
- Callback paths exist but user never sees/accepts confirm step.

**Root Cause:**

- Confirmations were using static `Modal.confirm` only, which can be less reliable across app/provider boundaries.
- No centralized presenter bridge bound to Ant App modal context.

**Fix Applied:**

- Added provider-registered confirmation presenter bridge (`App.useApp().modal.confirm`) in `app/providers.tsx`.
- Updated `openActionConfirm` utility to use registered presenter first, fallback to static modal otherwise.

**Prevention:**

- Keep destructive-action confirms routed through shared confirm utility only.
- Prefer context-bound presenter registration for global modal reliability.

**Files Affected:**

- components/ui/actionConfirm.ts
- app/providers.tsx

**Date:** 2026-04-09

---

## [Mandatory critical emails suppressed by grouped notification type gating]

**Symptom:**

- Critical order/payment/delivery email notifications could fail to send when users disabled grouped `orderUpdates`.
- UI suggested critical emails were mandatory, but backend short-circuited all channels for that type group.

**Root Cause:**

- `dispatchNotification` returned early when coarse type preference (`orderUpdates`) was false.
- Mandatory email override logic existed later in dispatch and was never reached in that branch.

**Fix Applied:**

- Added template resolution + channel gating split in dispatch flow.
- Kept optional in-app/push channel gating tied to grouped preferences.
- Preserved mandatory email delivery path for critical system types regardless of optional grouped toggle state.

**Prevention:**

- Avoid single early-return gates when channel policies differ (mandatory vs optional channels).
- Assert mandatory-channel behavior with unit tests whenever preference mapping is changed.

**Files Affected:**

- lib/services/notifications.ts
- lib/services/notificationTemplateResolver.ts
- app/api/notifications/preferences/route.ts

**Date:** 2026-04-09

---

## [Server-component tests fail after page migration to client hooks]

**Symptom:**

- Existing tests call page modules as async functions and fail with `Invalid hook call` / `Cannot read properties of null (reading 'useContext')`.

**Root Cause:**

- Page was migrated from server component to client component and now depends on React hooks/context (`useAuth`, runtime hooks).
- Legacy tests still invoke the component function directly instead of rendering with mocked client hooks.

**Fix Applied:**

- Rewrote affected tests to render components with Testing Library.
- Mocked hook providers (`useAuth`, `useSmartResource`) and client shell wrappers.

**Prevention:**

- When migrating a page from server to client, update tests in the same change-set.
- Avoid direct invocation patterns (`await Page()`) for hook-based page components.

**Files Affected:**

- app/orders/**tests**/orders-page.admin.test.tsx

**Date:** 2026-04-09

---

## [Operations vendor detail crashes when analytics is missing]

**Symptom:**

- Opening a vendor from admin operations can throw `TypeError: Cannot read properties of undefined (reading 'totalSales')`.

**Root Cause:**

- Vendor detail UI assumed `vendor.analytics` object always exists.
- `/api/vendors/[id]` can return flat vendor metrics (for example `totalSales`, `averageRating`) without nested `analytics` object.

**Fix Applied:**

- Added defensive analytics normalization in vendor detail page.
- Read metrics from `vendor.analytics.*` first, then fallback to flat vendor fields.
- Guarded rating/sales rendering against undefined values.

**Prevention:**

- Treat nested analytics payloads as optional at UI boundaries.
- Normalize mixed legacy/new payload shapes before binding to presentation components.

**Files Affected:**

- app/(operations)/operations/vendors/[id]/page.tsx

**Date:** 2026-04-09

---

## [Checkout route redirected to unauthorized without console errors]

**Symptom:**

- Navigating to `/checkout` redirected to `/unauthorized` for some authenticated users.
- Browser console showed no obvious application error.

**Root Cause:**

- Middleware enforces role policy from `lib/rbac/routeConfig.ts`.
- `/checkout` was restricted to `BUYER` only, so authenticated `VENDOR`/`ADMIN` users were denied at middleware level.

**Fix Applied:**

- Expanded `/checkout` route roles to include `BUYER`, `VENDOR`, and `ADMIN`.

**Prevention:**

- Keep checkout eligibility policy aligned with actual product behavior (cart access + order flow expectations).
- Treat middleware redirects without console errors as likely route-policy mismatches first.

**Files Affected:**

- lib/rbac/routeConfig.ts

**Date:** 2026-04-08

---

## [Bug report screenshot required opening a new tab for viewing]

**Symptom:**

- In operations bug-report details, screenshot could only be viewed through an external link/new tab.

**Root Cause:**

- Modal rendered `screenshotUrl` as an anchor instead of an inline preview component.

**Fix Applied:**

- Replaced external screenshot link with inline Ant `Image` preview in bug-report detail modal.

**Prevention:**

- Prefer inline media preview for moderation/review workflows; keep full-size preview as optional overlay action.

**Files Affected:**

- app/(operations)/operations/bug-reports/page.tsx

**Date:** 2026-04-08

---

## [Cart remove/clear actions appeared non-responsive due confirmation flow mismatch]

**Symptom:**

- Clicking remove-item or clear-cart on `/cart` appeared to do nothing.
- No obvious browser-console error was surfaced by the user.

**Root Cause:**

- Cart actions depended on static modal confirmation helper behavior (`Modal.confirm`) rather than inline confirmation controls on the cart interaction points.
- In the affected UI path, confirmation did not reliably surface for the user, so the destructive callbacks were never executed.

**Fix Applied:**

- Switched cart clear/remove confirmations to inline Ant `Popconfirm` controls in:
  - `app/cart/page.tsx` (clear cart)
  - `components/features/CartItemComponent.tsx` (remove item)
- Wired callbacks directly to `clearCart` / `removeItem` on confirm.
- Added explicit `type="button"` on cart action buttons to avoid accidental form-submit behavior in nested contexts.

**Prevention:**

- Prefer inline confirmation controls (`Popconfirm`) for high-frequency per-item interactions.
- Keep destructive controls local to the action source when static modal behavior is inconsistent in a route.

**Files Affected:**

- app/cart/page.tsx
- components/features/CartItemComponent.tsx

**Date:** 2026-04-08

---

## [Vendor-content moderation feed mixed marketing submissions with non-marketing media]

**Symptom:**

- Operations moderation reviewers saw content that did not clearly belong to vendor marketing campaigns.
- Moderation context became ambiguous between campaign review and product-media handling.

**Root Cause:**

- Admin moderation query semantics were too broad for the intended marketing-review workflow.
- UI/navigation labels still used generic vendor-content language, reinforcing domain ambiguity.

**Fix Applied:**

- Constrained `/api/admin/vendor-content` filtering toward marketing-scoped submissions.
- Updated operations moderation page copy and navigation label to marketing-review terminology.
- Enforced explicit `targetPlatform` enum/default in vendor-content schema.

**Prevention:**

- Keep moderation endpoints aligned to explicit business-domain intent (marketing vs catalog media).
- Require channel metadata for campaign assets so moderation scope stays machine-filterable.

**Files Affected:**

- app/api/admin/vendor-content/route.ts
- app/(operations)/operations/vendor-content/page.tsx
- app/(operations)/operations/marketing-content/page.tsx
- lib/schemas/vendor-content.schemas.ts
- lib/navigation.ts

**Date:** 2026-04-08

---

## [Operations vendor stats collapse to zero from multi-status fan-out requests]

**Symptom:**

- Operations vendor stats/cards intermittently show `0` across statuses despite existing vendor records.
- Vendor management list can render empty after transient fetch failures.

**Root Cause:**

- Client page requested each vendor status in parallel (`APPROVED`, `PENDING`, `REJECTED`, `SUSPENDED`) and treated the batch as all-or-nothing.
- Request fan-out increased rate-limit and transient failure likelihood, causing fallback to empty arrays.

**Fix Applied:**

- Added admin-scoped `includeAllStatuses=true` support to `/api/vendors`.
- Updated operations vendors page to use one paginated all-status vendor fetch path and one paginated products fetch path.

**Prevention:**

- Avoid status-fan-out request patterns for core stats surfaces when a single paginated feed can serve as source of truth.
- Keep admin-only expanded status reads explicit and isolated from public defaults.

**Files Affected:**

- app/api/vendors/route.ts
- app/(operations)/operations/vendors/page.tsx

**Date:** 2026-04-08

---

## [TOP banner title requirement drift with image-only UX contract]

**Symptom:**

- Top banners still displayed title/text overlays even after UX requirement changed to image-only strip.
- TOP banners without title were filtered out by API/frontend guards.

**Root Cause:**

- Banner contracts still inherited HERO-oriented title assumptions.
- API and component guards rejected empty-title TOP records.

**Fix Applied:**

- Switched `TopAdBanner` to image-only rendering (no title/text overlay).
- Allowed TOP banners with empty title in banner API create path while keeping position/image validation.
- Updated admin banner editor UX to avoid forcing title input for TOP position.

**Prevention:**

- Keep per-position banner contracts explicit (TOP visual-only vs HERO text-driven).
- Avoid carrying shared validation rules across placement types when UX intent differs.

**Files Affected:**

- components/features/TopAdBanner.tsx
- app/api/banners/route.ts
- app/(operations)/operations/banners/page.tsx

**Date:** 2026-04-08

---

## [Product discovery query drift: category/sort links do not consistently affect products results]

**Symptom:**

- Category tags under discovery surfaces navigate to `/products?category=...` but products filtering does not consistently reflect selected category.
- Home links with sort query (`/products?sort=trending` or `/products?sort=new`) do not consistently produce sorted results.

**Root Cause:**

- URL query params are emitted by nav links but products-page state is not fully hydrated from those params.
- Category values/slugs are duplicated across components and not normalized through one shared mapping.
- Sort keys are not centralized and are partially missing from products-page filtering pipeline.

**Fix Applied:**

- Added canonical discovery contract in `lib/config/productDiscovery.ts` (category slug/value mapping, supported sort keys, query parser/serializer helpers).
- Updated products page to hydrate discovery state from URL query params and pass normalized state into `ProductsContent`.
- Updated `ProductsContent` to apply deterministic sorting and query-state URL synchronization using shared helpers.
- Replaced hardcoded home category/sort link generation with shared discovery config/query serialization.
- Added focused regression tests for discovery query parsing and products-page query hydration.

**Prevention:**

- Keep category/sort config in one shared module consumed by home tags, category nav, filter sidebar, and products-page query layer.
- Add regression tests that assert query param -> rendered results behavior, not only control-level interactions.

**Files Affected:**

- app/components/HomeContent.tsx
- components/features/CategoryNav.tsx
- app/products/page.tsx
- components/features/ProductsContent.tsx
- components/features/FilterSidebar.tsx

**Date:** 2026-04-08

---

## [Analytics user count silently zero due API payload key mismatch]

**Symptom:**

- Analytics cards show zero users or incomplete totals even when user records exist.
- No obvious frontend crash; counts appear stale/empty.

**Root Cause:**

- `getUsersClient()` expected `data.data` while `/api/users` returns `users`, causing empty-array fallback.

**Fix Applied:**

- Updated `getUsersClient()` to read `data.users` first (with legacy `data.data` fallback).
- Added analytics partial-load hardening (`Promise.allSettled`) so one failing dataset does not blank all cards.

**Prevention:**

- Keep client fetcher payload parsing aligned with API envelope contracts (`users`, `products`, etc.).
- When building KPI surfaces, avoid all-or-nothing `Promise.all` for independent datasets.

**Files Affected:**

- lib/data/clientDataFetchers.ts
- components/features/AnalyticsFeature.tsx

**Date:** 2026-04-06

---

## [Operations layout chrome duplication (double Header)]

**Symptom:**

- Operations pages under `/operations/*` render two stacked headers.
- Visual spacing/navigation appears broken specifically in operations workspace routes.

**Root Cause:**

- Root `app/layout.tsx` renders global `<Header />`, while `components/layout/RoleDashboardShell.tsx` also renders `<Header />`.
- Operations layout group is nested under root layout, so both chrome components render for the same route.

**Fix Applied:**

- Planning fix contract created (2026-04-05 queue): de-duplicate operations chrome by rendering header in exactly one layer (root or dashboard shell, not both), then run cross-route layout regression checks.

**Prevention:**

- Define explicit chrome ownership per route group in architecture docs.
- Add regression tests/assertions to detect duplicate global chrome on grouped routes.
- Avoid embedding global layout components (Header/Footer) inside nested feature shells unless root layout excludes those routes.

**Files Affected:**

- app/layout.tsx
- components/layout/RoleDashboardShell.tsx
- app/(operations)/operations/layout.tsx

**Date:** 2026-04-05

### [TEMPLATE — copy this for each new error]

```
## [Error Title / Short Description]

**Symptom:**
[What the developer or user sees — error message, broken behaviour, etc.]

**Root Cause:**
[The actual technical reason this happened]

**Fix Applied:**
[What change was made to resolve it]

**Prevention:**
[How to avoid this in future — pattern, lint rule, architecture change, etc.]

**Files Affected:**
[List of files that were changed]

**Date:** [YYYY-MM-DD]
```

## [Prisma banner findMany: server connection closed]

**Symptom:**

- `GET /api/banners` fails with PrismaClientKnownRequestError: "Invalid prisma.banner.findMany() invocation: Server has closed the connection.".
- Banners never render due repeated failures.

**Root Cause:**

- The Prisma connection to PostgreSQL gets closed between requests (idle timeout or remote disconnect) and the code path lacks reconnect retry logic.

**Fix Applied:**

- Added helper `withPrismaReconnect()` in `lib/data/prismaAdapter.ts` to detect connection-closed messages and retry after `$disconnect/$connect`.
- Wrapped `bannerDb.findAll()` and `bannerDb.count()` in `withPrismaReconnect` so stale connections heal automatically once per request.

**Prevention:**

- Use global connection reuse (already in `lib/db/prisma.ts`) and proactive reconnect on connection errors.
- Add tests or chaos cases for dropped PostgreSQL connections to ensure retry path works.
- Monitor and tune DB connection `idle_timeout` and pool size in production.

**Files Affected:**

- lib/data/prismaAdapter.ts

**Date:** 2026-03-25

## [Prisma adapter reconnect wrapper expanded to all core db adapters]

**Symptom:**

- Same `Server has closed the connection` errors may appear in users, products, orders, carts, buyers, vendors, wallets, etc.

**Root Cause:**

- not all adapters had `withPrismaReconnect` applied, so some endpoints stayed brittle.

**Fix Applied:**

- Applied `withPrismaReconnect` wrapper to these adapter methods:
  - `userDb`, `productDb`, `orderDb`, `bannerDb`, `buyerDb`, `vendorDb`, `cartDb`, `walletDb`, `transactionDb`, `reviewDb`, `addressDb`

**Prevention:**

- Always wrap Prisma operations in reconnect logic for production connections that may be dropped.

**Files Affected:**

- lib/data/prismaAdapter.ts

**Date:** 2026-03-25

## [PublicContent tests failing after runtime mock fallback removal]

**Symptom:**

- `lib/__tests__/publicContent.test.ts` fails with `TypeError: prisma.publicContent.upsert is not a function` after removing runtime `mockData` fallback paths.

**Root Cause:**

- Tests depended on `NEXT_PUBLIC_USE_MOCK_DATA=true` runtime branching in `lib/data/publicContent.ts` rather than mocking the Prisma/cache dependencies directly.

**Fix Applied:**

- Reworked `lib/__tests__/publicContent.test.ts` to mock `@/lib/db/prisma` publicContent methods (`findUnique`, `findMany`, `upsert`, `delete`) and `@/lib/cache/contentCache` helpers.
- Cleared in-memory mock stores and mock call state in `beforeEach` for deterministic runs.

**Prevention:**

- Data-layer tests should mock infrastructure modules (Prisma/cache/HTTP) explicitly, not rely on environment-driven fallback branches.
- When removing fallback paths, update affected tests in the same change set.

**Files Affected:**

- lib/**tests**/publicContent.test.ts

**Date:** 2026-04-01

## [Adapter method added but interface typing not updated]

**Symptom:**

- TypeScript fails with: `Object literal may only specify known properties, and 'getActive' does not exist in type 'CrudAdapter<...>'` when adding new adapter methods.

**Root Cause:**

- `lib/data/prismaAdapter.ts` gained `adRateConfigDb.getActive`, but the shared `CrudAdapter` interface in `lib/data/adapterTypes.ts` did not include this optional method.

**Fix Applied:**

- Added optional `getActive` to `CrudAdapter` in `lib/data/adapterTypes.ts`.
- Kept `adRateConfigDb.getActive` in Prisma adapter so API consumer shape stays consistent.

**Prevention:**

- When adding new adapter helper methods, update shared adapter interfaces in the same change set.
- Run `npx tsc --noEmit` immediately after adapter-surface changes.

**Files Affected:**

- lib/data/prismaAdapter.ts
- lib/data/adapterTypes.ts

**Date:** 2026-04-01

## [Config tests failing after compatibility env toggle removal]

**Symptom:**

- Env/config tests fail after deleting compatibility fields with errors/assertions referencing `env.usePrisma` and `env.enableMockBackend`.

**Root Cause:**

- `lib/__tests__/config-env.test.ts` still validated removed fields after runtime config surface was simplified.

**Fix Applied:**

- Updated tests to assert those deprecated fields are absent and to continue validating active config normalization behavior.

**Prevention:**

- When removing config keys, update tests/docs in the same commit.
- Treat config schema, feature flags, and config tests as a single synchronized unit.

**Files Affected:**

- lib/config/env.ts
- lib/config/features.ts
- lib/**tests**/config-env.test.ts
- PRODUCTION.md

**Date:** 2026-04-01

## [Prisma JSON input typing mismatch for order status history]

**Symptom:**

- TypeScript noEmit fails in `app/api/orders/route.ts` with `Type '{ ... }[]' is not assignable to type 'InputJsonValue | JsonNullValueInput | undefined'` when assigning `statusHistory` during order creation.

**Root Cause:**

- The route built a plain object-array payload for a Prisma JSON field, but strict typing inferred a structural type that did not satisfy Prisma's JSON input union without explicit typing.

**Fix Applied:**

- Typed/cast the constructed `statusHistory` payload as `Prisma.InputJsonValue` before passing it to Prisma create data.

**Prevention:**

- For Prisma JSON columns, construct payloads with explicit `Prisma.InputJsonValue` typing (or helper functions returning that type) in the same scope where data is composed.
- Re-run `npx tsc --noEmit` immediately after modifying JSON-typed create/update payloads.

**Files Affected:**

- app/api/orders/route.ts

**Date:** 2026-04-01

## [Push subscription VAPID key typing mismatch in TypeScript]

**Symptom:**

- `npx tsc --noEmit` fails in `lib/contexts/NotificationContext.tsx` at `pushManager.subscribe` with `No overload matches this call` for `applicationServerKey`.

**Root Cause:**

- Strict DOM typing expected a `BufferSource`, while the helper return type resolved to a `Uint8Array<ArrayBufferLike>` signature that TypeScript did not accept directly in this code path.

**Fix Applied:**

- Cast the computed VAPID key payload to `BufferSource` when assigning `applicationServerKey` in `pushManager.subscribe`.

**Prevention:**

- For web-push subscription code under strict TypeScript, type `applicationServerKey` explicitly as `BufferSource` when building from base64 helpers.
- Re-run `npx tsc --noEmit` immediately after editing service-worker/push subscription setup code.

**Files Affected:**

- lib/contexts/NotificationContext.tsx

**Date:** 2026-04-01

---

## [Client runtime refresh logs ERR_INVALID_URL in Vitest for relative /api fetchers]

**Symptom:**

- Runtime-enabled client surfaces print `Failed to parse URL from /api/...` in Vitest output when background refresh executes.

**Root Cause:**

- Relative browser-style `/api/*` fetch URLs are invoked during Node/Vitest execution where no browser base URL exists.

**Fix Applied:**

- Preserved non-blocking runtime refresh while keeping SSR/initial-prop hydration as primary render source.
- Added migration guidance to mock fetchers or provide explicit URL base in runtime-focused tests.

**Prevention:**

- In runtime unit tests, inject or mock client fetchers instead of allowing default relative browser fetch to execute in Node.
- Keep background refresh non-blocking so this class of test warning does not break rendering continuity.

**Files Affected:**

- app/components/HomeContent.tsx
- components/features/ProductsContent.tsx
- lib/data-runtime/runtimeClient.ts

**Date:** 2026-04-08

---

## Known Error Patterns

> **Section summary:** Recurring error categories seen in this tech stack. Agents should check this section when they match the pattern before investigating further.

### React / Next.js

**Hydration Mismatch**

- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, Date.now()) running during server render
- Fix: Wrap in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
- Prevention: Never access browser APIs outside useEffect in components

**Missing Key Prop**

- Symptom: `Each child in a list should have a unique "key" prop`
- Cause: `.map()` rendering without a stable unique key
- Fix: Add `key={item.id}` — use a stable unique ID, not the array index

---

### Node.js / Backend

**Unhandled Promise Rejection**

- Symptom: Server crashes silently or logs `UnhandledPromiseRejectionWarning`
- Cause: async function missing try/catch, or `.catch()` not attached to promise
- Fix: Wrap async route handlers in try/catch, use an async error middleware
- Prevention: Always use a global async error wrapper for Express routes

**Database Connection Pool Exhausted**

- Symptom: Requests hang indefinitely under load
- Cause: Connection pool limit too low or connections not being released
- Fix: Increase pool size in config, ensure `client.release()` in finally blocks
- Prevention: Always release DB connections in finally, not just success path

---

### Configuration / Environment

**Missing Environment Variable**

- Symptom: `undefined` values in production, features silently broken
- Cause: Variable defined in `.env.local` but not in production environment
- Fix: Add to deployment environment variables and validate on startup
- Prevention: Add a startup validation check that throws if required env vars are missing

---

## Resolved Errors Archive

> **Section summary:** Errors that have been fully resolved and are unlikely to recur. Kept for reference.

## [TSX parser/JSX in .ts service file]

**Symptom:**

- Build or typecheck fails with verbatim message from parser: `Expected '>', got 'firstName'` in `lib/services/email.ts`.
- Additional TypeScript errors follow from JSX syntax in non-TSX file.

**Root Cause:**

- `lib/services/email.ts` contained JSX literal expressions (e.g. `<VerifyEmail .../>`) while file extension was `.ts`; the TypeScript compiler only supports JSX in `.tsx` files.

**Fix Applied:**

- Replaced all `react: <Component ... />` cases with `react: React.createElement(Component, {...})` in `lib/services/email.ts`.
- Adjusted `sendOrderStatusUpdateEmail` status map lookup to avoid implicit `any` indexing by using typed lookup and fallback solid values.

**Prevention:**

- Enforce `*.tsx` for files that use JSX or always use `React.createElement` in `.ts` services.
- Add lint rule or PR check for JSX in `.ts` files.

**Files Affected:**

- lib/services/email.ts

**Date:** 2026-03-25

[Entries move here when the underlying cause has been permanently fixed]
