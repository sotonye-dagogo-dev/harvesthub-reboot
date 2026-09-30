# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature.md (2026-09-29)
> - last-verified-against-code: 2026-09-29

**Status:** IN PROGRESS — `execute-feature.md` running for **Services (Service-Marketplace) End-to-End Enablement**.

- **Directive:** implement `planning/feature-plan-2026-09-29-services-marketplace.md` (T1–T8 in `planning/task-queue.md`).
- **Architecture impact:** YES (schema + new modules + new routes) → `update-ai-system.md` deep sync is mandatory at Step 5. Plan already approved via `plan-feature.md` (Session 101), so no re-sign-off needed.

## Step 1 — Plan (decomposed)

| # | Task | Tag | Key files |
|---|---|---|---|
| T1 | Option lists: model, config, service, hook, select, config+admin API, admin page, nav registration, consumer migration | `[M]` | `prisma/schema.prisma`, `lib/config/optionLists.ts`, `lib/services/optionLists.ts`, `lib/hooks/useOptionList.ts`, `components/ui/OptionListSelect.tsx`, `app/api/{config,admin}/option-lists/**`, `app/(operations)/operations/option-lists/page.tsx`, `lib/rbac/routeConfig.ts`, `lib/navigation.ts`, `components/layout/Sidebar.tsx` |
| T2 | Service data contract: Zod `serviceDetails`, `lib/config/serviceFulfillment.ts`, product API validation + SERVICE defaults, draft exclusion check, signup `serviceCategory`/`serviceLocation` persistence | `[M]` | `lib/schemas/service.schemas.ts`, `lib/config/serviceFulfillment.ts`, `app/api/products/route.ts`, `app/api/products/[id]/route.ts`, `app/signup/security-info/page.tsx`, `app/api/auth/register/route.ts` |
| T3 | Service listing wizard (5 steps) + generalised `StageTracker` + server-side drafts + `service-doc`/`service-video` uploads + route registration | `[L]` | `components/ui/StageTracker.tsx`, `components/features/services/**`, `app/(operations)/operations/services/page.tsx`, `lib/utils/uploadConfig.ts`, `app/api/upload/route.ts` |
| T4 | Storefront + discovery + service-aware checkout (`ServiceDetailPanel`, package picker, `CartItem.selectedPackage`, fee/address rules) | `[M]` | `components/features/services/*`, `app/products/[id]/page.tsx`, `components/features/ProductsContent.tsx`, `components/features/FilterSidebar.tsx`, `lib/store/cartStore.ts`, `app/checkout/page.tsx`, `app/api/orders/route.ts` |
| T5 | Service order lifecycle: `OrderStatus`+3, `NotificationType`+6, `OrderItem`+6 cols, `CommerceLifecycleConfig`+4 cols, transitions, requirements route, revision, confirm-delivery branch, service-fulfillment cron | `[XL]` | `prisma/schema.prisma`, `lib/constants/index.ts`, `lib/utils/format.ts`, `components/ui/StatusTag.tsx`, `app/api/orders/**`, `lib/services/serviceOrders.ts` |
| T6 | Order room UI + `OrderMessage` model + messages API + polling transport | `[L]` | `prisma/schema.prisma`, `lib/services/orderRoomTransport.ts`, `app/api/orders/[id]/messages/route.ts`, `components/features/services/*`, `app/orders/[id]/page.tsx` |
| T7 | Settlement commission (flag-gated) + service notifications/emails + settings UI | `[M]` | `lib/services/orderLifecycle.ts`, `lib/config/notificationTemplates.ts`, `lib/config/emailTemplates.ts`, `lib/services/{notifications,email}.ts`, `app/(operations)/operations/settings/page.tsx` |
| T8 | Feature flag gating, docs sync, full QA gate | `[S]` | `lib/config/features.ts`, ai-system docs |

## Progress

| Task | State | Evidence |
|---|---|---|
| T1 | **DONE** | schema pushed + generated; `lib/config/optionLists.ts`, `lib/services/optionLists.ts`, `lib/hooks/useOptionList.ts`, `components/ui/OptionListSelect.tsx`, 4 API routes, admin page + nav; consumers migrated (signup `UserInfo`/`StoreInfo`, `AddressForm`, `ProfilePage`); 30 tests green |
| T2 | **DONE** | `lib/schemas/service.schemas.ts` + `lib/config/serviceFulfillment.ts`; products POST/PUT validate `serviceDetails` (400 `SERVICE_DETAILS_INVALID`), SERVICE price/stock defaults, public GET defaults `isActive=true` + `includeInactive` gated to VENDOR/ADMIN; draft detail 404s for guests; signup + `convert-to-vendor` persist/validate `serviceCategory`/`serviceLocation`; 39 tests green (`lib/schemas/__tests__/service.schemas.test.ts`, `app/api/products/__tests__/route.service-listing.test.ts`, `app/api/auth/__tests__/register.service-fields.test.ts`) |
| T3 | **PARTIAL (interrupted)** | done: `components/ui/StageTracker.tsx` + signup re-export, `components/features/services/{wizardModel,videoValidation,serviceListingFlag}.ts`, `lib/utils/uploadConfig.ts` + `app/api/upload/route.ts` + `lib/services/cloudinary.ts` (`service-doc`/`service-video`), `lib/utils/localDraft.ts` (new key), barrel export. **open:** wizard component + 5 steps, `app/(operations)/operations/services/page.tsx`, route registration chain, tests; `npx tsc --noEmit` currently fails at `components/features/services/wizardModel.ts:407` (`serviceCategory` typed `string` vs `ServiceCategory`) |
| T4 | pending | storefront/detail panel/cart/checkout not started |
| T5–T8 | pending | lifecycle, order room, commission/emails, flags + docs |

## Step 2 — Self-check

- **project-context scope:** PASS — marketplace commerce extension; no new external integration (Cloudinary/Resend/Prisma reused); NGN/market conventions preserved; strict TS + defensive null handling maintained.
- **project-decisions conflicts:** PASS — config-driven (§Centralized RBAC & Config-Driven), additive schema + `db push` (§DB Sync Strategy), idempotent status/payout writes (§Order Status Lifecycle Deterministic), admin-managed lifecycle windows (§Commerce Lifecycle Timing), localStorage drafts (§Offline Draft + Queue), no `window.confirm` (§Destructive Action Confirmation), Prisma-only server fetchers, API response envelope + `withApiHandler`.
- **Out of scope honoured:** no Google Maps dependency by default, no WebSocket, no new npm dependencies, no antivirus, no parallel order tables.

## Step 3 — Implementation order

1. Schema + generated client (foundation for everything).
2. Constants/config mirrors + compile fixes.
3. Option-list layer (T1) → service contract (T2).
4. Parallel-safe UI chunks (T3/T4/T6 components), then wiring.
5. Lifecycle routes (T5) → order room wiring (T6) → commission/emails (T7).
6. Tests throughout; `sync-context.md` at mid-work checkpoint and close.

## Step 4 — QA gate (pending)

`npx prisma validate` → `npm run db:push` → `npm run db:generate` → `npx tsc --noEmit` → `npm run lint` → `npx vitest run` → `npm run build` → `npm run audit:dead-links`.

## Step 5 — Close (pending)

session-log, dev-history, task-queue check-off + `last-synced`, project-decisions, **`update-ai-system.md` deep sync (mandatory — `[XL]` + architecture impact)**, final `sync-context.md`, clear this file.
