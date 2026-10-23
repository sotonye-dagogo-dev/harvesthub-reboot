# Feature Plan — Services (Service-Marketplace) End-to-End Enablement

> **Metadata**
> - produced-by: `commands/plan-feature.md` (2026-09-29)
> - input artifact: `ai-system/artifacts/services-feature-request.pdf` → converted to `ai-system/artifacts/services-feature-request.md` (markitdown) and treated as a **feature request**, not an authoritative PRD
> - design reference: `ai-system/design-references/service-listing-order-room/DESIGN.md` (produced by `commands/generate-design-md.md`)
> - planning only — no implementation code written by this document
> - chains to: `planning/task-queue.md` (task list appended) + `checkpoints/session-log.md` (trace)

---

## 1. Feature summary

**What:** let a vendor publish, sell, and fulfil a **service** (digital or on-site) on the platform end-to-end — from signup category → service listing wizard → discovery → package purchase → requirements gate → fulfilment clock → delivery review → escrow release — plus the admin control surfaces needed to run it.

**Why:** the platform is product-only in practice. `ListingType.SERVICE` exists but is cosmetic (badge + stock-check bypass); there is no way to author service metadata, no service fulfilment lifecycle, no requirements collection, no order room, and no service-specific settlement.

**Existing assets we build on (this is why no parallel architecture is needed):**

| Asset | Where | State |
|---|---|---|
| `VendorCategory.SERVICES` ("Services" store category) | `lib/constants/index.ts:124,471`; `prisma/schema.prisma:61` | **live** — signup option #18 of 19 (`app/signup/components/StoreInfo.tsx:109`) |
| `ProductCategory.SERVICES` browse chip | `lib/constants/index.ts:196,561`; `lib/config/productDiscovery.ts:34` | **live** — home/header/browse |
| `ListingType.SERVICE` + `Product.serviceDetails Json?` | `prisma/schema.prisma:345-348,598` | **partial** — settable + filterable, never authored/read |
| `SERVICE_CATEGORIES` / `SERVICE_LOCATIONS` / `ServiceRateType` | `lib/constants/index.ts:756-814`; Prisma enums `:350-378` | **live** as constants, unused in forms |
| `CATEGORY_COMMISSION_DEFAULTS.SERVICES = 0.05` | `lib/constants/index.ts:732` | **live** — assigned to `Vendor.commissionRate` at signup |
| `Booking` model + `BookingCalendar.tsx` | `prisma/schema.prisma:1189`; `components/features/BookingCalendar.tsx` | **orphaned** — never mounted, no API |
| Settlement hold → release (escrow in substance) | `lib/services/orderLifecycle.ts:114,192` | **live** — hold at `DELIVERED`+`PAID`, release on confirm/auto-confirm |
| Requirements of config-driven admin surfaces | `CommerceLifecycleConfig`, `EmailTemplate`, `ProductVariationConfig`, `PublicContent` | **live** precedents to copy |

---

## 2. Scope reconciliation ("a pinch of salt")

The feature request was authored without codebase knowledge. Decisions on each PRD element:

| PRD element | Verdict | Rationale / what we do instead |
|---|---|---|
| New `services`, `service_packages`, `service_orders` tables (Postgres DDL, `BIGINT` ids) | **Reject** | The codebase uses Prisma + `cuid()` ids and already has `Product.listingType=SERVICE` + `serviceDetails Json?` + `Order`/`OrderItem`. A second order pipeline would fork payment, refund, payout, grouping and notification logic. **Extend `Product`/`OrderItem`.** |
| "Add Service → Configure Tiers → Checkout → Escrow → Requirements → Clock → Milestones → Release" | **Adopt** | Mapped onto the existing `OrderStatus` machine (§4.3). |
| Multi-step wizard saving drafts **database-side** per step | **Adopt, adapted** | New `/operations/services` wizard; instant drafts stay in `lib/utils/localDraft.ts` (existing, tested), and each validated step advances a server-side draft `Product` (`isActive=false`, `serviceDetails.draftStep`). |
| Google Maps API geofence circle | **Defer, flag-gated** | New paid external dependency + API key. Radius + zone/campus are captured and stored; the map preview sits behind `serviceGeoMapEnabled` (env, default `false`). |
| WebSocket / gRPC chat, `<300ms` SLA | **Reject (transport), adopt (feature)** | Stack is serverless (Vercel-style); there is **zero** WS/SSE infra in-repo. Order-room chat ships as **visibility-gated polling** behind an isolated transport module so WS/SSE can be swapped in later. SLA restated as a config-driven poll interval. |
| Amazon S3 uploads, client-side compression | **Reject** | Storage is Cloudinary (`lib/services/cloudinary.ts`) with server-side format/size enforcement. Images reuse the existing 5-slot product pipeline. |
| ClamAV / background antivirus hook | **Defer (documented gap)** | No scanner infra; we keep MIME/extension allowlists + Cloudinary `allowed_formats` + size caps, and record scanning as residual risk / future work. |
| Video: MP4 ≤ 50 MB, ≤ 60 s | **Adopt with limits** | New `service-video` upload folder; duration checked **client-side** (`HTMLVideoElement.duration`) — the server cannot verify duration without ffmpeg. |
| Markdown editor ≤ 1,200 chars | **Simplify** | Bounded `TextArea` with live counter + `whitespace-pre-line` rendering; **no raw HTML** (matches the escaped-render convention). |
| "Active verb phrasing ('I will…')" hard validation | **Soften** | Helper text + example, not a validator — a hard rule would reject legitimate non-English/terse titles. |
| Postal code baseline | **Adapt to market** | Campus/zone selector (existing lists) + optional postal text + radius + unit. |
| Auto-refund eligibility on late delivery | **Out of scope as stated** | Late delivery writes a `LATE` history flag and notifies; refunds go through the **existing** refund request/review flow (`refundWindowHours`), which already has vendor-clawback + buyer-credit logic. |
| Commission formula (gross × rate, net = gross − fee) | **Adopt, flag-gated** | `TransactionType.COMMISSION` exists but is **never written**. Implement it inside `releaseOrderSettlement` behind `serviceSettlementCommissionEnabled` (default `false` → byte-identical current behaviour). |
| Categories/campuses "admin-editable" | **Adopt in two tiers** (§6) | Enum-backed keys are **label/order/visibility** editable only; keys are immutable (a Postgres enum cannot be extended from a JSON row). Free-form lists get full CRUD. |

---

## 3. Architecture impact (existing modules affected)

| Module | Change | Breaking? |
|---|---|---|
| `prisma/schema.prisma` | +3 `OrderStatus` values, +6 `NotificationType` values, `OrderItem` +6 columns, `Vendor` +2 columns, `CommerceLifecycleConfig` +4 columns, +2 models (`OptionList`, `OrderMessage`), +1 enum (`OptionListTier`) | No — additive; applied via `npm run db:push` per the **DB sync decision** (`project-decisions.md` → *db push + migrations baselined*), then `prisma generate` |
| `lib/constants/index.ts` | Mirror new `OrderStatus` / `NotificationType` values; new `SERVICE_MILESTONES`, `SERVICE_ATTRIBUTE_*` fallbacks | No — additive |
| `lib/utils/format.ts:53` (`Record<OrderStatus,string>`) | Compile-forced addition of 3 labels (already has `\|\| status` fallback) | No |
| `components/ui/StatusTag.tsx:18` (`ORDER_STATUS_COLORS`) | 3 new colour entries; unknown values already fall back to `"default"` | No |
| `app/api/orders/[id]/status/route.ts:27` (`VALID_TRANSITIONS`) | Service-branch transitions + hold-on-`IN_REVIEW` | No — product path untouched |
| `app/(operations)/operations/orders/page.tsx:47` (`STATUS_TRANSITIONS`) | Mirror of the server map (existing duplicated contract — must move in lockstep) | No |
| `app/api/orders/route.ts` | Service-order status seeding, `serviceConfig`/`listingType` snapshot on items, service-only fee/address rules | No — gated on `items.every(SERVICE)` |
| `app/checkout/page.tsx` | Package selection carry-through, service-only delivery-fee/address rules, updated notice | No |
| `lib/store/cartStore.ts` | Optional `CartItem.selectedPackage` (zustand `persist` — old carts lack it and must still work) | No |
| `app/api/orders/[id]/confirm-delivery/route.ts` | Accept service orders in `IN_REVIEW` → transition + release in one transaction | No |
| `app/api/orders/auto-confirm/route.ts` | Use `serviceAutoApproveHours` for service orders | No |
| `lib/services/orderLifecycle.ts` | Hold on `IN_REVIEW` (service), optional commission split on release | No — default-off flag |
| `lib/services/notifications.ts` + `lib/config/notificationTemplates.ts` | 6 new `NotificationType` entries (compiler-enforced by `Record<NotificationType,…>`) mapped to the `orderUpdates` preference | No |
| `app/api/upload/route.ts` + `lib/utils/uploadConfig.ts` + `lib/services/cloudinary.ts` | New folder types `service-doc` (PDF), `service-video` (MP4), `order-attachment`; `resource_type: video` branch | No — additive `VALID_FOLDER_TYPES` entries |
| `app/(operations)/operations/products/page.tsx` | Service rows link to the wizard; product CRUD otherwise unchanged | No |
| `app/signup/*` + `app/api/auth/register/route.ts` | Persist the already-collected `serviceCategory`/`serviceLocation` (currently **silently dropped**) | No |
| Select consumers (signup, profile, address, checkout) | Read options through the option-list layer with hardcoded fallback | No — identical defaults |
| `lib/rbac/routeConfig.ts`, `lib/navigation.ts`, `components/layout/Sidebar.tsx` | Register `/operations/services` and `/operations/option-lists` | No — additive entries; `npm run audit:dead-links` required |

**Nothing existing is removed or re-typed.** Every behavioural change to a shared path is either additive or gated behind a config flag that defaults to today's behaviour.

---

## 4. New modules & data flow

### 4.1 New files (by area)

**Option lists (admin-editable + hardened fallbacks)**
- `lib/config/optionLists.ts` — `OPTION_LIST_KEYS` (typed union), `OPTION_LIST_FALLBACKS`, option row type, `resolveOptionLabel`.
- `lib/services/optionLists.ts` — `getOptionList(key)` (DB → validate → merge → **catch → fallback → never throws**), `upsertOptionList`, cache + invalidation.
- `lib/hooks/useOptionList.ts` — client hook: hook data → fallback; empty/missing → fallback.
- `app/api/config/option-lists/route.ts`, `app/api/config/option-lists/[key]/route.ts`
- `app/api/admin/option-lists/route.ts`, `app/api/admin/option-lists/[key]/route.ts`
- `components/ui/OptionListSelect.tsx` — select bound to a list key + explicit fallback; renders an empty-state (never throws) when both are empty.
- `app/(operations)/operations/option-lists/page.tsx` — admin editor.

**Service listing authoring**
- `lib/schemas/service.schemas.ts` — Zod for `serviceDetails` (packages, extras, attributes, slots, requirement fields, media, description) + step-slice schemas.
- `lib/config/serviceFulfillment.ts` — char/size/count limits, tier keys, delivery-day & revision option sets, milestone fallback, poll interval, countdown warning hours, env flags.
- `components/features/services/ServiceListingWizard.tsx` + `steps/*` (Basics, Packages, Location, Media, Requirements)
- `components/features/services/ServicePackageMatrix.tsx`, `ServiceRequirementsBuilder.tsx`, `ServiceAvailabilityGrid.tsx`
- `app/(operations)/operations/services/page.tsx` — list + wizard (`?new` / `?edit=<id>`).

**Storefront**
- `components/features/services/ServiceDetailPanel.tsx` (packages, availability, "what I need from you"), `ServicePackagePicker.tsx`.

**Service order lifecycle + order room**
- `lib/services/serviceOrders.ts` — `orderHasServiceItems`, `orderIsServiceOnly`, deadline computation, late detection, transition helpers.
- `app/api/orders/[id]/requirements/route.ts` (buyer)
- `app/api/orders/[id]/messages/route.ts` (GET/POST, participants only)
- `app/api/orders/service-fulfillment/route.ts` — cron sibling of `auto-confirm`: requirements timeout, late flagging, service auto-approve.
- `components/features/services/ServiceTimeline.tsx`, `ServiceRequirementsForm.tsx`, `ServiceCountdown.tsx`, `OrderRoomChat.tsx`, `ServiceDeliveryModal.tsx`, `ServiceRevisionPanel.tsx`, `ServiceOrderRoom.tsx` (composition).
- `lib/services/orderRoomTransport.ts` — polling transport, isolated so WS/SSE can replace it.

**Emails**
- `DEFAULT_EMAIL_TEMPLATES` keys (`lib/config/emailTemplates.ts`) + `NOTIFICATION_TEMPLATE_CONFIG` entries; subject override applied in `sendNotificationEmail` (mirroring the existing bug-email pattern).

### 4.2 Data flow (end-to-end)

```
[1] Signup ── "Store Category: Services" (already exists)
      └─ serviceCategory/serviceLocation now PERSISTED to Vendor (bug fix)

[2] Vendor → /operations/services wizard (5 steps)
      Step1 Basics → Step2 Tiers/Extras → Step3 Location&Availability (PHYSICAL only)
      → Step4 Media → Step5 Requirements Gateway
      each validated step → localDraft + PATCH server draft Product (isActive=false)
      publish → Product{listingType:SERVICE, isActive:true, price=base package,
                        stock=SERVICE_UNLIMITED_STOCK, serviceDetails=<typed Json>}

[3] Discovery → /products?category=services chip, listingType filter,
      service-category filter, service badge + package prices, detail panel

[4] Buyer picks package → CartItem.selectedPackage → checkout
      service-only cart → deliveryFee = 0, no address requirement, requirements-notice

[5] POST /api/orders → Order + OrderItems{listingType, serviceConfig snapshot,
      requirementAnswers:null, revisionsRemaining, deadlineAt:null}
      paid + service-only → status = AWAITING_REQUIREMENTS

[6] Requirements gate
      buyer POST /api/orders/[id]/requirements → validates required fields (incl. FILE)
      → OrderItem.requirementAnswers + requirementsSubmittedAt
      → AWAITING_REQUIREMENTS → IN_PROGRESS, deadlineAt = now + deliveryDays·24h
      → notify + email seller
      cron: >serviceRequirementsTimeoutHours (48) still awaiting
      → REQUIREMENTS_TIMEOUT history + seller penalty-free cancel eligibility

[7] Fulfilment clock → order room (timeline, chat polling, countdown,
      seller ServiceDeliveryModal)

[8] Seller submits delivery → IN_PROGRESS → IN_REVIEW
      → ensurePayoutHoldOnDelivery (PAYOUT PENDING, escrow ledger)
      → if now > deadlineAt → LATE history flag (idempotent) + notify

[9] Buyer "Accept Delivery & Release" (existing confirm-delivery, extended)
      or cron auto-approve after serviceAutoApproveHours (72)
      → IN_REVIEW → DELIVERED → releaseOrderSettlement
      → [flag on] commission = gross × rate; vendor receives gross − commission;
         COMMISSION transaction written as audit

[10] Buyer rejects in IN_REVIEW → IN_PROGRESS, revisionsRemaining−=1, deadline re-armed
     Buyer refund → existing refund request/review flow
```

### 4.3 Order-status state machine (service orders only)

```
PENDING ────────────────► AWAITING_REQUIREMENTS ──► IN_PROGRESS ──► IN_REVIEW ──► DELIVERED
   │                                │                    ▲   │          │              │
   └─► CANCELLED                    └─► CANCELLED        │   └──────────┘              └─► REFUNDED
                                            (timeout)    │     (revision requested)
                                                         └── (requirements submitted)
```

Product orders keep the current `PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP →
OUT_FOR_DELIVERY → DELIVERED` path **unchanged**. `serviceKind = items.every(SERVICE)` —
a single `Order` has exactly one status, so a mixed product+service cart from one vendor takes the
product path (service line items still carry `serviceConfig`, and the order room surfaces their
requirement answers as non-gating context). This is a deliberate scope decision, documented in
`project-decisions.md`.

---

## 5. UI/UX considerations (design-system conformance)

- Reference: `design-references/service-listing-order-room/DESIGN.md` — semantic `ds-*` tokens only, no raw hex, dark mode free.
- Wizard progress reuses the signup **`StageTracker`** pattern; it must first be generalised (`labels[]` prop, responsive `grid-cols-1 sm:grid-cols-3 lg:grid-cols-5` — today's `grid-cols-3` + hardcoded `stageNames` cannot host 5 steps) and moved to `components/ui/` with `app/signup/components/StageTracker.tsx` kept as a thin re-export (**non-breaking**).
- Full-page wizard (not a modal): a 5-step form with a 3-tier matrix, calendar grid and field builder cannot fit a modal and must hold at 320px.
- Notices (requirement gate, late delivery, timeout) reuse the checkout notice shape
  (`border-ds-border-brand bg-ds-brand-surface p-4` + icon + eyebrow/detail).
- Statuses render through `StatusTag` (`ORDER_STATUS_COLORS` gains 3 entries); countdown uses `--ds-status-error*` below the warning threshold and `--ds-status-warning*` approaching it — colour is always paired with text (accessibility rule: never colour alone).
- Forms: antd `Form.Item` rules, errors under the field, one primary action per step, explicit Back/Next with draft-saved indicator.
- Every list surface reads from `OptionListSelect` (fallback-aware); empty options render an empty-state, never an uncontrolled crash.
- Destructive/irreversible actions (delete draft, cancel order, cancel service order) go through the registered confirmation presenter (`openActionConfirm` / `ActionConfirmPresets`).

---

## 6. Admin-editable option lists + non-existence hardening (the requested modification)

**Not yet implemented — this is new work.**

New Prisma model (mirrors the `ProductVariationConfig` / `EmailTemplate` `key @unique` precedent):

```prisma
enum OptionListTier { DISPLAY FREEFORM }

model OptionList {
  id        String         @id @default(cuid())
  key       String         @unique
  tier      OptionListTier @default(DISPLAY)
  options   Json           // ordered [{ value, label, description?, enabled?, group? }]
  isActive  Boolean        @default(true)
  updatedBy String?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  @@map("option_lists")
}
```

**Registered keys** (code-registered union — admins cannot invent keys):

| Key | Tier | Hardcoded fallback |
|---|---|---|
| `campusLocations` | DISPLAY | `CAMPUS_LOCATIONS` |
| `vendorCategories` / `productSubcategories` / `listingTypes` | DISPLAY | `VENDOR_CATEGORIES`, `CATEGORY_SUBCATEGORIES`, `LISTING_TYPES` |
| `serviceCategories` / `serviceLocations` / `serviceRateTypes` / `serviceTiers` | DISPLAY | existing service constants + `SERVICE_TIER_KEYS` |
| `serviceAttributes` | FREEFORM (options carry `group`) | `DEFAULT_SERVICE_ATTRIBUTES` (new) |
| `serviceRequirementFieldTypes` | DISPLAY | `TEXT / SELECT / FILE` |
| `serviceMilestones` | FREEFORM | `SERVICE_MILESTONES` (Ordered → Requirements Submitted → Work Started → In Review → Complete) |
| `deliveryZones` / `pickupServices` / `positions` | DISPLAY | existing constants |

**Tier semantics**
- **DISPLAY** — admin may edit labels/descriptions, reorder, and hide options. **Values are immutable** (they must match a Prisma enum member). Hiding a value blocks *new* selections but legacy rows keep rendering via the fallback label.
- **FREEFORM** — full add/remove/edit; the fallback is the initial seed and the recovery source if the row is deleted or malformed.

**Hard rules (the "prevent crashes" part)**
1. `getOptionList` **never throws**: DB error → fallback; missing row → fallback; malformed `options` JSON → validated shape, invalid entries dropped, else fallback.
2. Unregistered key → `404 OPTION_LIST_NOT_FOUND` envelope (existing shared API envelope), client falls back.
3. `resolveOptionLabel(key, value)` → `label ?? value ?? ""`; unknown values always render something.
4. Empty `options` after all fallbacks → the control renders an explicit empty-state; it never renders `undefined.length` or an uncontrolled `<select>`.
5. **Server-side validation always uses the code/Prisma enum key set** — an admin can hide a campus or a category, never inject a non-existent one.
6. Every consumer gets a test for: DB down, row absent, unknown key, empty options, unknown stored value.

**Admin surface:** `/operations/option-lists` (label/reorder/enable editor; FREEFORM rows also add/remove), registered through `routeConfig.ts` → `navigation.ts` → `Sidebar.tsx` (`ADMIN_LINK_ORDER` + `iconMap`), then `npm run audit:dead-links`.

---

## 7. Config keys added

| Key | Purpose | Location | Default |
|---|---|---|---|
| `serviceRequirementsTimeoutHours` | 48 h no-requirements window → seller penalty-free cancel | `CommerceLifecycleConfig` (admin settings UI) | 48 |
| `serviceAutoApproveHours` | Auto-approve + release window for service orders | `CommerceLifecycleConfig` | 72 (PRD's 3 days) |
| `serviceCountdownWarningHours` | Countdown turns error-coloured below this | `CommerceLifecycleConfig` | 12 |
| `serviceSettlementCommissionEnabled` | Writes `COMMISSION` txn and pays vendor net at release | `CommerceLifecycleConfig` | **false** (today's behaviour) |
| `orderRoomPollMs` | Order-room chat/timeline poll interval | `lib/config/serviceFulfillment.ts` | 10000 |
| `serviceGeoMapEnabled` | Mount the geofence map preview | `.env` | false |
| `serviceListingEnabled` | Feature flag / kill switch for the whole service surface | `lib/config/features.ts` | true |

---

## 8. Emails & notifications

Route **all six** service events through the existing `dispatchNotification` fan-out (in-app row + email + push, preference-gated by `orderUpdates`), with copy from `NOTIFICATION_TEMPLATE_CONFIG` and admin-editable subjects via new `DEFAULT_EMAIL_TEMPLATES` keys:

| NotificationType | Recipient | Trigger |
|---|---|---|
| `SERVICE_REQUIREMENTS_REQUESTED` | buyer | paid service order created |
| `SERVICE_REQUIREMENTS_SUBMITTED` | seller | requirements POST succeeds |
| `SERVICE_DELIVERED` | buyer | seller submits delivery (approve & release CTA) |
| `SERVICE_RELEASED` | seller | settlement released (net amount in metadata) |
| `SERVICE_REVISION_REQUESTED` | seller | buyer requests revision in `IN_REVIEW` |
| `SERVICE_REQUIREMENTS_TIMEOUT` | seller (+ buyer reminder) | cron, 48 h elapsed |

- `Record<NotificationType, …>` in `notificationTemplates.ts` is compiler-enforced — the entries must land in the same change as the enum values.
- Add subject-override support in `sendNotificationEmail` mirroring `sendBugResolvedEmail` (`lib/services/email.ts:314`), so admins can edit subjects without a deploy.
- Dedicated React templates are **optional**; only add one if `NotificationEmail`'s CTA shape cannot express the "Accept & Release" button (implementation-time check). Templates share `EmailLayout`, so the cost is low either way.
- Tests: extend `lib/emails/__tests__/order-templates.test.tsx` + `lib/services/__tests__/notifications.order-email-routing.test.ts` patterns.

---

## 9. Potential risks & edge cases

1. **Enum growth breaks compile at `Record<OrderStatus,…>` sites** — expected, and is the checklist: `lib/utils/format.ts:53`, any `ordersByStatus` builders. `StatusTag`'s `Record<string,string>` will *not* warn — entries must be added manually or statuses show grey.
2. **Duplicated transition maps** (`VALID_TRANSITIONS` server vs `STATUS_TRANSITIONS` client) — must be edited together; add a test asserting they agree.
3. **Schema sync** — per the DB-sync decision, `npm run db:push` + `prisma generate` + explicit migration recording/baselining; a forgotten push reproduces the Session-98 P2022 login outage.
4. **Draft leakage** — verify `GET /api/products` excludes `isActive=false` drafts from public browse before creating server-side drafts.
5. **Legacy data** — `revisionsRemaining = null` → hide the revision UI; existing service listings have `serviceDetails = null` → detail panel falls back to the plain product view; old cart items have no `selectedPackage` → price falls back to `product.price`.
6. **Mixed carts** — documented single-status limitation (§4.3); show a checkout notice when a cart mixes product and service items from one vendor.
7. **Idempotency** — requirements POST, revision, release, late-flag and timeout must all be safe to replay (cron retries + double-clicks); reuse `releaseOrderSettlement`'s idempotent contract.
8. **Timezones** — `deadlineAt` computed and compared in UTC server-side, rendered in the viewer's local time.
9. **Cancel/reputation** — confirm the cancel path writes no negative vendor reputation before enabling penalty-free timeout cancels; if any exists, gate it.
10. **Uploads** — video duration is client-verified only; `resource_type: video` is the riskiest change in `cloudinary.ts` and must be covered by a test; no antivirus (documented residual risk).
11. **Option-list abuse** — a malformed/oversized `options` JSON must degrade to fallback, and admin PUT must validate shape + bounds before persisting.
12. **Nav regression** — two new routes; `audit:dead-links` / `audit:sidebar-routes` are mandatory (the `variation-config` page is the existing example of a route that skipped registration).
13. **Feature-flag blast radius** — `serviceListingEnabled=false` must hide the nav entry, the wizard and the storefront service panel while leaving existing service-flagged products readable.

---

## 10. Concrete task list

Appended to `planning/task-queue.md` as **Feature Planning Queue (2026-09-29) — Services / Service-Marketplace Enablement**. Summary of dependencies:

```
T1 [M] Option lists + admin editor + fallback hardening      (no deps)
T2 [M] Service data contract + server validation + signup fix (T1 for selects)
T3 [L] Service listing wizard (5 steps) + drafts             (T1, T2)
T4 [M] Storefront, discovery & service-aware checkout        (T2)
T5 [XL] Service order lifecycle + requirements gate + cron   (T2, T4)
T6 [L] Order room UI (timeline, requirements, countdown,
       chat, delivery CTA, revisions)                        (T5)
T7 [M] Settlement commission + service emails/notifications  (T5)
T8 [S] Flag gating, docs sync, QA gate                       (T3–T7)
```

Each `[L]`/`[XL]` task runs the full `execute-feature.md` pipeline (in-progress checkpoint → implement → `verify-work.md` QA gate → sync → `update-ai-system.md` deep sync), per its chaining contract.

---

## 11. Architecture doc updates required

- **`system-architecture.md`** — new bullets: service listing/fulfilment lifecycle, option-list system with fallback contract, order-room polling transport; add the new rows to the Configuration Points table; bump `last-verified-against-code`.
- **`project-context.md`** — target-users row for service providers; move deferred items (Google Maps, WebSocket, antivirus) into *Out of Scope* explicitly.
- **`design-system.md`** — re-verify staleness; flag "multi-step wizard/StepTracker" as a **promotion candidate only** (human decision — the command must not write this file).
- **`memory/project-decisions.md`** — record: extend-Product-not-parallel-tables; polling-over-WebSocket (transport isolated); option-list DISPLAY vs FREEFORM tier with immutable enum keys; `serviceKind = all-items-service`; commission flag-gated default-off.
- **`index/repo-map.md`**, **`index/dependency-graph.md`**, **`summaries/dev-history.md`** — sync at close.

---

## 12. Verification commands (QA gate)

| Command | Purpose |
|---|---|
| `npx prisma validate` + `npm run db:push` + `npm run db:generate` | schema applies cleanly |
| `npx tsc --noEmit` | strict types incl. forced `OrderStatus` additions |
| `npm run lint` | touched files |
| `npx vitest run` | colocated `__tests__` (conventions: `*.route.test.ts`, `page.<scenario>.test.tsx`) |
| `npm run build` | `prisma generate && next build` |
| `npm run audit:dead-links` | both new routes registered in routeConfig + sidebar |
