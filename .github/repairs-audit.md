# HarvestHub Repairs Audit

**Date:** 2026-02-20
**Scope:** Problems panel + `npx tsc --noEmit`
**TSC result:** ✅ No TypeScript compiler errors
**Linter errors resolved:** 18 problems across 9 files

---

## Error Inventory

### Group A — Missing `aria-label` on icon-only back buttons (axe/name-role-value)

All six detail pages have a back-navigation `<button>` wrapping only an `<ArrowLeft>` icon, with no `aria-label` or title. Screen readers cannot describe the button.

| #   | File                                | Line |
| --- | ----------------------------------- | ---- |
| A1  | `app/admin/vendors/[id]/page.tsx`   | 103  |
| A2  | `app/admin/users/[id]/page.tsx`     | 105  |
| A3  | `app/admin/orders/[id]/page.tsx`    | 128  |
| A4  | `app/admin/products/[id]/page.tsx`  | 100  |
| A5  | `app/vendor/products/[id]/page.tsx` | 151  |
| A6  | `app/vendor/orders/[id]/page.tsx`   | 127  |

**Fix:** Add `aria-label="Back to <section>"` and `title="Back to <section>"` to each button.

---

### Group B — Non-existent properties on `Vendor` type (TS2339)

The `Vendor` interface in `lib/types.ts` does not have `description`, `totalSales`, or `rating` as direct fields. The correct paths are `vendor.storeDescription`, `vendor.analytics.totalSales`, and `vendor.analytics.averageRating`.

| #   | File                              | Line     | Wrong property           | Correct path                     |
| --- | --------------------------------- | -------- | ------------------------ | -------------------------------- |
| B1  | `app/admin/vendors/[id]/page.tsx` | 142      | `vendor.description`     | `vendor.storeDescription`        |
| B2  | `app/admin/vendors/[id]/page.tsx` | 144      | `vendor.description`     | `vendor.storeDescription`        |
| B3  | `app/admin/vendors/[id]/page.tsx` | 160      | `vendor.totalSales ?? 0` | `vendor.analytics.totalSales`    |
| B4  | `app/admin/vendors/[id]/page.tsx` | 165 (×2) | `vendor.rating`          | `vendor.analytics.averageRating` |

---

### Group C — ESLint errors in `TopAdBanner.tsx`

| #   | Code                                       | Line | Issue                                                  | Fix                                                         |
| --- | ------------------------------------------ | ---- | ------------------------------------------------------ | ----------------------------------------------------------- |
| C1  | `@typescript-eslint/no-unused-vars`        | 65   | `dismissed` state variable is captured but never read  | Drop the value from destructuring: `const [, setDismissed]` |
| C2  | `@typescript-eslint/no-unused-expressions` | 208  | Ternary `A ? f() : g()` used as a standalone statement | Convert to `if/else`                                        |

---

### Group D — Invalid `aria-hidden` value (axe/aria)

| #   | File                                     | Line | Issue                                                                                     | Fix                                                      |
| --- | ---------------------------------------- | ---- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| D1  | `components/features/BannerCarousel.tsx` | 387  | `aria-hidden={!isActive}` passes a JS boolean; ARIA expects a string `"true"` or omission | Change to `aria-hidden={!isActive ? "true" : undefined}` |

---

### Group E — Inline styles (no-inline-styles warnings)

| #   | File                                     | Line | Style value                                                        | Resolution                                                                         |
| --- | ---------------------------------------- | ---- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| E1  | `components/features/BannerCarousel.tsx` | 313  | `{ "--accent": banner.accentColor }` CSS custom property (dynamic) | Add `{/* eslint-disable-next-line */}` — cannot be expressed as a class            |
| E2  | `components/features/BannerCarousel.tsx` | 398  | `width: 65%` (constant `DISPLAY_PANEL_PERCENT`)                    | Replace `style` prop with `className="w-[65%]"`                                    |
| E3  | `components/features/BannerCarousel.tsx` | 440  | `width: 35%` (constant `ACTION_PANEL_PERCENT`)                     | Replace `style` prop with `className="w-[35%]"`                                    |
| E4  | `app/admin/analytics/page.tsx`           | 239  | `width: ${percentage}%` (dynamically computed)                     | Add `{/* eslint-disable-next-line */}` — runtime value, cannot be a Tailwind class |

---

## Implementation Plan

- [x] **Step 1 — Group A:** Add `aria-label` + `title` to all 6 icon-only back buttons
- [x] **Step 2 — Group B:** Fix `vendor.description` → `storeDescription`, `totalSales` → `analytics.totalSales`, `rating` → `analytics.averageRating`
- [x] **Step 3 — Group C:** Fix `dismissed` unused-var + ternary-as-expression in `TopAdBanner.tsx`
- [x] **Step 4 — Group D:** Fix `aria-hidden` boolean → string in `BannerCarousel.tsx`
- [x] **Step 5 — Group E:** Replace constant-width inline styles with Tailwind classes; suppress unavoidable dynamic inline-style warnings

---

## Ad-Hoc Repairs Log

---

### 2026-02-20 — Session 3 broad repairs (12 problems, 3 files)

#### Group N — Unused imports in `admin/vendors/page.tsx` (@typescript-eslint/no-unused-vars)
- `Badge` imported from `@/components/ui` but never rendered.
- `VENDOR_CATEGORIES` imported from `@/lib/constants` but never used.
- **Fix:** Remove both from their respective import statements.

#### Group O — `useMemo` called conditionally (react-hooks/rules-of-hooks)
Both `admin/vendors/page.tsx` and `admin/analytics/page.tsx` have an early `if (user?.role !== "ADMIN") { return null; }` guard **before** their `useMemo` calls. If the early return fires on one render then doesn't on the next, the hook call order changes — violating the Rules of Hooks.

| File | Hooks affected |
|---|---|
| `app/admin/vendors/page.tsx` | `useMemo` (filteredVendors) |
| `app/admin/analytics/page.tsx` | `useMemo` × 4 (stats, orderStatusData, topVendors, topProducts) |

- **Fix:** Hoist all `useMemo` calls to above the early return guard. The memos only reference static `mockData` constants and local state — safe to compute unconditionally.

#### Group P — Unused `vendorId` parameters in handler functions (`admin/vendors/page.tsx`)
Three handlers — `handleApprove`, `handleReject`, `handleSuspend` — declare a `vendorId: string` parameter that is never read in the body.
- **Fix:** Prefix each with `_` (`_vendorId`) to signal intentional non-use and silence the linter.

#### Group Q — `aria-hidden` dynamic ternary cannot be statically validated (`axe/aria`)
`components/features/BannerCarousel.tsx` line 388: `aria-hidden={!isActive ? "true" : "false"}` — both branches are valid ARIA string literals, but the static axe analyzer treats the whole JSX expression as `{expression}` and cannot evaluate it at parse time.
- **Fix:** Add `// eslint-disable-next-line axe/aria` with an explanatory comment on the line before the attribute. `axe/aria` **is** a real ESLint rule (unlike `no-inline-styles`) so the directive is valid and will not create a "definition not found" error.

#### Group R — `no-inline-styles` warnings (lines 239 analytics, 313 BannerCarousel) — NO ACTION
These are VS Code HTML language service warnings, **not** ESLint rules. Validated in Session 2: adding `eslint-disable-next-line no-inline-styles` caused new "rule definition not found" errors. Both dynamic inline styles are necessary (`width: ${percentage}%` progress bar, `--accent` CSS custom property) and cannot be replaced with Tailwind classes. No action taken.

#### Implementation Plan (Session 3)
- [x] **N** — Remove unused `Badge` and `VENDOR_CATEGORIES` imports from `admin/vendors/page.tsx`
- [x] **O** — Hoist all `useMemo` calls above early return in `admin/vendors/page.tsx` and `admin/analytics/page.tsx`
- [x] **P** — Rename unused `vendorId` params to `_vendorId` in all three handlers
- [x] **Q** — Add `eslint-disable-next-line axe/aria` before `aria-hidden` attribute in `BannerCarousel.tsx`
- [x] **R** — No action for `no-inline-styles` HTML service warnings (not real ESLint rules)

---

### 2026-02-20 — Session 2 broad repairs (40 problems, 8 files)

#### Group F — Duplicate `User` identifier in `admin/users/[id]/page.tsx` (TS2300, TS2693)
- `import type { User }` from `@/lib/types` clashes with `import { User }` icon from lucide-react.
- **Fix:** Rename lucide import to `UserIcon`; update all JSX usages accordingly.

#### Group G — Non-existent properties on `User` type (TS2339)
- `profileUser.status` — `User` has no `status` field; code needs 3-state statuses (ACTIVE / INACTIVE / BANNED).
- `profileUser.phone` — correct field is `phoneNumber`.
- **Fix:** Add `status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | null` to `User` in `lib/types.ts`; change `phone` → `phoneNumber` references.

#### Group H — Non-existent properties on `OrderItem` / `Order` (TS2339, TS2322)
Two detail pages (`admin/orders/[id]`, `vendor/orders/[id]`) reference fields that don't match the actual types:
- `item.image` → correct field is `item.productImage`
- `order.fulfillmentType` → correct field is `order.deliveryMethod`
- `order.deliveryAddress` rendered as `ReactNode` but is `Address | null` — must be formatted as a string
- `order.pickupSchedule` → correct nested object is `order.pickupDetails` (`PickupDetails` type)
- **Fix:** Replace each wrong reference with its correct counterpart; format `Address` inline.

#### Group I — Non-existent properties on `Product` type (TS2339)
`admin/products/[id]/page.tsx` references fields missing from `Product`:
- `product.unit` (no such field) → render `"—"`
- `product.originalPrice` → `product.compareAtPrice`
- `product.rating` → `product.averageRating`
- `product.allowsPickup` / `product.allowsDelivery` (belong to `Vendor.storeSettings`) → `product.vendor?.storeSettings?.allowsPickup ?? false`
- **Fix:** Replace each with correct property path.

#### Group J — Unused imports (no-unused-vars)
- `vendor/orders/[id]` — `Phone` imported but never used.
- `admin/orders/[id]` — `MapPin`, `Clock`, `Truck` imported but never used.
- **Fix:** Remove from import lists.

#### Group K — `<img>` elements (no-img-element)
Four files use raw `<img>` instead of Next.js `<Image />`:
- `admin/products/[id]/page.tsx` (product gallery)
- `admin/orders/[id]/page.tsx` (order item thumbnail)
- `vendor/orders/[id]/page.tsx` (order item thumbnail)
- `vendor/products/[id]/page.tsx` (product image preview)
- **Fix:** Replace `<img>` with `<Image fill className="object-cover" sizes="...">` inside already-positioned parent containers.

#### Group L — Spurious `eslint-disable-next-line no-inline-styles` comments (definition not found)
The previous session added `// eslint-disable-next-line no-inline-styles` comments; the rule doesn't exist in the ESLint config (it's from VS Code's HTML language service), creating a new error.
- **Fix:** Remove both `eslint-disable` comments from `BannerCarousel.tsx` and `admin/analytics/page.tsx`.

#### Group M — `aria-hidden` still invalid (axe/aria)
`aria-hidden={!isActive ? "true" : undefined}` still triggers the rule. The validator requires both states to be explicit strings.
- **Fix:** Change to `aria-hidden={!isActive ? "true" : "false"}`.

#### Implementation Plan (Session 2)
- [x] **F/G** — Fix `User` duplicate identifier + add `status` field to type + fix `phone` → `phoneNumber`
- [x] **H** — Fix `OrderItem.image`, `Order.fulfillmentType`, `Order.deliveryAddress`, `Order.pickupSchedule`
- [x] **I** — Fix all non-existent `Product` fields
- [x] **J** — Remove unused icon imports
- [x] **K** — Replace all `<img>` with `<Image />`
- [x] **L** — Remove invalid `eslint-disable` comments
- [x] **M** — Fix `aria-hidden` to explicit string pair
