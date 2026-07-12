# Cloud Session Temp Plan — Home Rail Responsive Widths + Voucher Nav Access Points

Date: 2026-04-17
Scope: UI layout fix (home rail card density) + nav/routing wiring for voucher feature access

---

## Context & Problem Statements

### 1. Home product rail responsive density

The `HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS` constant in `app/components/HomeContent.tsx` currently
sets the same `calc((100%-0.75rem)/2)` width at all breakpoints (sm and lg), meaning exactly 2
product cards are always visible. The intended UX is a horizontal-scroll rail where **2 cards are
visible at small, 3 at medium, and 4 at large** screen sizes — excess cards scroll off to the right.

### 2. Voucher UI access points missing

The voucher feature is fully implemented (backend APIs, buyer `/vouchers` page, admin
`/operations/vouchers` CRUD page, checkout apply/remove UI) but its pages are unreachable via any
navigation surface:

- `/vouchers` is not in `routeConfig.ts` so RBAC middleware and nav helpers ignore it.
- `/operations/vouchers` is not in `routeConfig.ts` or the Sidebar `ADMIN_LINK_ORDER`.
- Neither page has a link in the Header (desktop or mobile) or in the admin operations dashboard
  quick-actions.

---

## Scope Lock

Implement only:

1. Fix home product rail item width for responsive 2 / 3 / 4 column density.
2. Wire voucher pages into all nav access surfaces (routeConfig, Sidebar, Header, dashboard quick-actions).

Do not:
- Change any API response contracts or backend voucher logic.
- Refactor unrelated components.
- Add new voucher features beyond nav access.

---

## Execution Slices

- [x] Slice 1 — Home rail responsive card widths
  - File: `app/components/HomeContent.tsx`
  - Change `HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS`:
    - sm (default): `w-[calc((100%-0.75rem)/2)]` — 2 visible
    - md: `md:w-[calc((100%-1.5rem)/3)]` — 3 visible
    - lg: `lg:w-[calc((100%-2.25rem)/4)]` — 4 visible
  - Keep `min-w-[10.5rem]` floor and `flex-shrink-0`.

- [x] Slice 2 — RBAC route registration
  - File: `lib/rbac/routeConfig.ts`
  - Add `/vouchers` route: not public, roles [BUYER, VENDOR, ADMIN], labelKey `vouchers`
  - Add `/operations/vouchers` route: not public, roles [ADMIN], labelKey `adminVouchers`

- [x] Slice 3 — Navigation labels
  - File: `lib/navigation.ts`
  - Add `vouchers: 'My Vouchers'` to labelMap
  - Add `adminVouchers: 'Vouchers'` to labelMap

- [x] Slice 4 — Admin Sidebar access
  - File: `components/layout/Sidebar.tsx`
  - Add `Ticket` import from lucide-react
  - Add `/operations/vouchers` to `ADMIN_LINK_ORDER` (after `/operations/users`)
  - Add `'/operations/vouchers': Ticket` to `iconMap`

- [x] Slice 5 — Header buyer nav link (desktop + mobile)
  - File: `components/layout/Header.tsx`
  - Import `Ticket` from lucide-react
  - Add Vouchers link for all authenticated users (BUYER / VENDOR / ADMIN) in both desktop nav
    and mobile menu, pointing to `/vouchers`

- [x] Slice 6 — Admin dashboard quick action
  - File: `app/api/operations/dashboard/route.ts`
  - Add a "Manage Vouchers" quick action to `getAdminMetrics` quickActions array with href
    `/operations/vouchers`

- [x] Slice 7 — Validation + docs closure
  - `npm run lint` ✅ no warnings or errors
  - `npm run build` ✅ passes (pre-existing sitemap warnings unchanged)

---

## Validation Gates

1. `npm run lint` passes (no new errors).
2. `npm run build` passes (pre-existing sitemap warnings allowed if unchanged).

---

## One-Pass Kickoff Prompt (Copy/Paste)

Read in this exact order:
1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. `ai-system/planning/cloud-session-temp-plan-2026-04-17-home-rail-responsive-voucher-nav.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only the slices listed in this temp plan.
- Non-breaking lock: preserve all public contracts and existing API payload shapes.
- Config-driven lock: avoid hardcoded behavior where config contracts already exist.
- Modularity lock: keep changes localized to the listed files only.
- UX lock: verify responsive behavior for the home rail (2/3/4 columns) and nav link placement.
- Do not stop at analysis; implement, validate, and document in one run.

Completion output must include:
1. Completed checklist by slice
2. Files changed by slice
3. Validation summary (lint + build)
4. Blockers (if any) with file/line context
5. Documentation sync summary for required `ai-system` files
