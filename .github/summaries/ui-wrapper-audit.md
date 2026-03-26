# MyHarvestHub UI Component Wrapper Audit Report

**Date**: 2026-02-24  
**Scope**: Full codebase scan (excluding node_modules/.next)

---

## A) EXISTING WRAPPERS (`components/ui/`)

### 1. `Badge` — [Badge.tsx](components/ui/Badge.tsx)

- **Props**: `children`, `variant` (default|primary|success|warning|danger|info), `size` (sm|md|lg), `className`
- **Export**: Named export `Badge`, type `BadgeProps`
- **Usage count**: 7 files
  - `components/features/OrderCard.tsx`, `ReviewCard.tsx`, `ProductCard.tsx`, `VendorCard.tsx`
  - `app/(buyer)/products/[id]/page.tsx`
  - `app/admin/users/page.tsx`, `admin/products/page.tsx`, `vendor/products/page.tsx`
- **Notes**: Only used in feature components & some pages; many pages use antd `Tag` instead for status badges (see Section C)

### 2. `Button` — [Button.tsx](components/ui/Button.tsx)

- **Props**: Extends `ButtonHTMLAttributes`. `variant` (primary|secondary|outline|ghost|danger), `size`, `loading`, `icon`, `fullWidth`, `children`
- **Export**: Named export `Button`, type `ButtonProps`
- **Usage count**: ~15 files
  - Feature components: `FilterSidebar`, `CartItem`, `WalletCard`, `ProductCard`
  - Layout: `Header`
  - Pages: `admin/banners`, `admin/vendors`, `admin/orders`, `buyer/wallet`, `buyer/profile`, `buyer/checkout`, `buyer/cart`, `buyer/orders/[id]`, `vendor/store-settings`, `vendor/products`, `vendor/products/[id]`, `vendor/orders/[id]`, `admin/products/[id]`, `admin/users/[id]`, `admin/vendors/[id]`, `admin/orders/[id]`
- **Conflict**: Antd `Button` is imported **directly** in 11+ files (error pages, auth pages, signup, notification features, search, review features)

### 3. `Card` / `CardHeader` / `CardContent` / `CardFooter` — [Card.tsx](components/ui/Card.tsx)

- **Props**: `children`, `className`, `padding` (none|sm|md|lg), `hoverable`, `bordered`
- **Export**: Named exports `Card`, `CardHeader`, `CardContent`, `CardFooter`
- **Usage count**: ~20 files
  - Dashboards: `admin/dashboard`, `vendor/dashboard`, `admin/analytics`, `vendor/analytics`
  - Feature components: `OrderCard`, `WalletCard`, `VendorCard`
  - Pages: `admin/banners`, `buyer/wallet`, `buyer/checkout`, `buyer/cart`, `buyer/orders/[id]`, etc.
- **Conflict**: Antd `Card` used directly in `NotificationPreferences.tsx`, `ProductFiltersSidebar.tsx`

### 4. `EmptyState` / `EmptyProducts` / `EmptyCart` / `EmptySearchResults` / `EmptyOrders` — [EmptyState.tsx](components/ui/EmptyState.tsx)

- **Props**: `icon`, `title`, `description`, `action` (object or ReactNode), `className`
- **Export**: Named exports for all 5 components
- **Usage count**: ~18 files using `EmptyState` directly
- **Conflict**: Antd `Empty` still used directly in `ReviewDisplay.tsx`, `SearchHistory.tsx`, `NotificationBell.tsx`, `NotificationDrawer.tsx`, `(buyer)/vendors/page.tsx`

### 5. `Input` — [Input.tsx](components/ui/Input.tsx)

- **Props**: Extends `InputHTMLAttributes`. `label`, `error`, `hint`, `prefix`, `suffix`, `fullWidth`
- **Export**: Named export `Input` (forwardRef), type `InputProps`
- **Usage count**: 2 files
  - `components/features/AddressForm.tsx`
  - `app/(buyer)/profile/page.tsx` (imported as `CustomInput`)
- **Conflict**: Antd `Input` is imported directly in **15+ files** (login, signup, vendor pages, admin pages, notification features, search, etc.)

### 6. `Loading` — [Loading.tsx](components/ui/Loading.tsx)

- **Exports**: `LoadingSpinner`, `LoadingOverlay`, `Skeleton`, `CardSkeleton`
- **Props**: Various sizes, message, variant, className
- **Usage count**: 2 files
  - `app/vendor/orders/page.tsx` (`LoadingSpinner`, `SimplePagination`)
  - `app/admin/orders/page.tsx` (`LoadingSpinner`)
- **Conflict**: Antd `Spin` used directly in 10 files. Antd `Skeleton` used in 3 loading.tsx files. Lucide `Loader2` used in 2 files. Custom `animate-spin` border spinner in `OptimizedImage.tsx`.

### 7. `Modal` / `ConfirmModal` — [Modal.tsx](components/ui/Modal.tsx)

- **Props**: `isOpen`, `onClose`, `title`, `children`, `footer`, `size`, `closeOnOverlayClick`, `showCloseButton`
- **Export**: Named exports `Modal`, `ConfirmModal`
- **Usage count**: 0 files (not imported anywhere!)
- **Conflict**: Antd `Modal` used directly in 8 files: `admin/vendors`, `admin/users/[id]`, `admin/products/[id]`, `admin/banners`, `vendor/products`, `buyer/wallet`, `buyer/orders/[id]`, `ReviewModerationPanel`

### 8. `Pagination` / `SimplePagination` — [Pagination.tsx](components/ui/Pagination.tsx)

- **Props**: `currentPage`, `totalPages`, `onPageChange`, `showFirstLast`, `maxVisiblePages`
- **Export**: Named exports `Pagination`, `SimplePagination`
- **Usage count**: 5 files
  - `buyer/wallet`, `buyer/products`, `buyer/orders`
  - `admin/orders`, `vendor/orders`

### 9. `PhoneInput` — [PhoneInput.tsx](components/ui/PhoneInput.tsx)

- **Props**: Extends `InputProps` (minus prefix/type). `defaultCountryCode` (default "+234")
- **Export**: Named export `PhoneInput` (forwardRef)
- **Usage count**: 2 files
  - `components/features/AddressForm.tsx`
  - `app/signup/components/UserInfo.tsx`

### 10. `Rating` — [Rating.tsx](components/ui/Rating.tsx)

- **Props**: `value`, `max`, `size`, `showValue`, `readonly`, `onChange`
- **Export**: Named export `Rating`, type `RatingProps`
- **Usage count**: 2 files
  - `components/features/ProductCard.tsx`
  - `app/(buyer)/products/[id]/page.tsx`
- **Conflict**: Antd `Rate` used directly in `ReviewDisplay.tsx`, `ReviewModerationPanel.tsx`

### 11. `Table` — [Table.tsx](components/ui/Table.tsx)

- **Props**: Generic `<T>`. `columns`, `data`, `keyExtractor`, `onSort`, `loading`, `emptyState`, `striped`, `hoverable`
- **Export**: Named export `Table`, types `TableProps`, `Column`
- **Usage count**: 0 files (not imported anywhere!)
- **Conflict**: Antd `Table` used directly in 5 files: `admin/vendors`, `admin/users`, `admin/products`, `admin/banners`, `vendor/products`, `ReviewModerationPanel`

### 12. `ThemeToggle` — [ThemeToggle.tsx](components/ui/ThemeToggle.tsx)

- **Props**: `className`, `variant` (icon|button)
- **Export**: Named export `ThemeToggle`
- **Usage count**: 1 file — `components/layout/Header.tsx`

---

## B) DIRECT ANT DESIGN USAGE

### Grouped by antd component:

| Antd Component            | Direct Import Count | Files                                                                                                                                                                                                                                                                                                   | Should Use Wrapper?                                  |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Button**                | 11 files            | error.tsx (×5), signup/StageTracker, signup-success, auth/login, auth/forgot-password, auth/reset-password, AdvancedSearchBar, SearchHistory, ReviewHelpfulVotes, NotificationBell, NotificationDrawer, NotificationPreferences, VendorResponse                                                         | **YES** — use `components/ui/Button`                 |
| **Result**                | 5 files             | error.tsx (×5), ErrorBoundary                                                                                                                                                                                                                                                                           | No (keep — error page-specific)                      |
| **Tag**                   | 14 files            | admin/vendors, admin/vendors/[id], admin/users, admin/users/[id], admin/products, admin/products/[id], admin/orders/[id], admin/analytics, vendor/products, vendor/orders/[id], buyer/orders/[id], buyer/vendors/[id], NotificationDrawer, ReviewModerationPanel, SearchFilterChips, SearchHistory      | **YES** — create `StatusTag` wrapper                 |
| **Modal**                 | 8 files             | admin/vendors, admin/banners, admin/users/[id], admin/products/[id], vendor/products, buyer/wallet, buyer/orders/[id], ReviewModerationPanel                                                                                                                                                            | **YES** — use `components/ui/Modal`                  |
| **Table**                 | 5 files             | admin/vendors, admin/users, admin/products, admin/banners, ReviewModerationPanel                                                                                                                                                                                                                        | **YES** — use `components/ui/Table`                  |
| **Input**                 | 13 files            | auth/login, auth/forgot-password, auth/reset-password, signup/UserInfo, signup/AccountInfo, signup/StoreInfo, admin/vendors, admin/products, admin/banners, vendor/products, vendor/store-settings (as AntInput), buyer/wallet, buyer/vendors, VendorResponse, ReviewModerationPanel, AdvancedSearchBar | **PARTIAL** — form inputs need antd Form integration |
| **Form**                  | 8 files             | auth/login, auth/forgot-password, auth/reset-password, signup/\* (×4), admin/banners, vendor/products/[id]                                                                                                                                                                                              | No (keep — antd Form is complex/feature-rich)        |
| **Select**                | 10 files            | admin/vendors, admin/users, admin/products, admin/banners, admin/orders/[id], vendor/products, vendor/products/[id], vendor/store-settings, vendor/orders/[id], buyer/vendors, ReviewDisplay                                                                                                            | No (keep — antd Select too complex to wrap simply)   |
| **Spin**                  | 10 files            | loading.tsx (×2), admin detail pages (×4), vendor detail pages (×2), NotificationBell, NotificationDrawer, NotificationPreferences, buyer/notifications/settings                                                                                                                                        | **YES** — use `LoadingSpinner`                       |
| **Skeleton**              | 3 files             | admin/loading, vendor/loading, buyer/loading                                                                                                                                                                                                                                                            | Could use custom `Skeleton`/`CardSkeleton`           |
| **message**               | 14 files            | Various pages for success/error toasts                                                                                                                                                                                                                                                                  | No (keep — antd message API is unique)               |
| **Badge** (antd)          | 3 files             | buyer/profile, buyer/orders, NotificationBell                                                                                                                                                                                                                                                           | **YES** — use `components/ui/Badge`                  |
| **Tabs**                  | 3 files             | buyer/orders, buyer/vendors/[id], buyer/profile, NotificationDrawer                                                                                                                                                                                                                                     | No (keep — complex antd component)                   |
| **Image**                 | 3 files             | signup/layout, ReviewPhotoGallery, ReviewModerationPanel                                                                                                                                                                                                                                                | No (keep — antd Image has preview gallery)           |
| **Descriptions**          | 3 files             | admin/vendors/[id], admin/users/[id], admin/products/[id]                                                                                                                                                                                                                                               | No (keep — antd-specific layout component)           |
| **Steps**                 | 2 files             | signup/StageTracker, buyer/orders/[id]                                                                                                                                                                                                                                                                  | No (keep)                                            |
| **Drawer**                | 2 files             | FilterDrawer, NotificationDrawer                                                                                                                                                                                                                                                                        | No (keep — complex component)                        |
| **Switch**                | 3 files             | vendor/store-settings, admin/products/[id], buyer/notifications/settings, NotificationPreferences                                                                                                                                                                                                       | No (keep)                                            |
| **DatePicker/TimePicker** | 2 files             | admin/banners, vendor/store-settings, NotificationPreferences                                                                                                                                                                                                                                           | No (keep)                                            |
| **Rate**                  | 2 files             | ReviewDisplay, ReviewModerationPanel                                                                                                                                                                                                                                                                    | **YES** — use `components/ui/Rating`                 |
| **Upload**                | 2 files             | signup/AccountInfo, buyer/profile                                                                                                                                                                                                                                                                       | No (keep — complex)                                  |
| **Radio**                 | 2 files             | FilterDrawer, buyer/checkout                                                                                                                                                                                                                                                                            | No (keep)                                            |
| **Collapse**              | 1 file              | ProductFiltersSidebar                                                                                                                                                                                                                                                                                   | No (keep)                                            |
| **Tooltip**               | 1 file              | admin/vendors                                                                                                                                                                                                                                                                                           | No (keep)                                            |
| **Progress**              | 1 file              | RatingDistribution, signup/SecurityInfo                                                                                                                                                                                                                                                                 | No (keep)                                            |
| **Divider**               | 2 files             | FilterDrawer, auth/login                                                                                                                                                                                                                                                                                | No (keep)                                            |
| **Alert**                 | 3 files             | auth/login, auth/forgot-password, auth/reset-password, signup/SecurityInfo                                                                                                                                                                                                                              | No (keep)                                            |
| **Avatar**                | 1 file              | admin/users                                                                                                                                                                                                                                                                                             | No (keep)                                            |
| **ConfigProvider**        | 1 file              | providers.tsx                                                                                                                                                                                                                                                                                           | No (keep — app-level)                                |

### @ant-design/icons usage (6 files):

| Icon                                                                 | File                 |
| -------------------------------------------------------------------- | -------------------- |
| `PlusOutlined`, `LoadingOutlined`                                    | signup/AccountInfo   |
| `LeftOutlined`                                                       | signup/StageTracker  |
| `CheckCircleFilled`                                                  | signup-success/page  |
| `LockOutlined`, `CheckCircleOutlined`                                | auth/reset-password  |
| `MailOutlined`, `LockOutlined`, `EyeInvisibleOutlined`, `EyeTwoTone` | auth/login           |
| `MailOutlined`, `ArrowLeftOutlined`                                  | auth/forgot-password |

**Note**: The rest of the codebase uses **lucide-react** icons (68 files). The antd icons are isolated to auth/signup flows only.

---

## C) REPEATED UI PATTERNS

### C1. Status Badge / Tag Pattern (HIGHEST DUPLICATION)

**The same status-color mapping is duplicated across 8+ files:**

| Entity                | Color Map                                                                                                                                                         | Files                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Order Status**      | PENDING→orange, CONFIRMED→blue, PROCESSING→purple/cyan, READY→cyan/geekblue, SHIPPED→geekblue, DELIVERED/COMPLETED→green, CANCELLED→red, REFUNDED→magenta/volcano | `vendor/orders/[id]`, `admin/orders/[id]`, `buyer/orders/[id]`, `admin/analytics` |
| **Vendor Status**     | PENDING→orange, APPROVED→green, SUSPENDED→red, REJECTED→default/red                                                                                               | `admin/vendors`, `admin/vendors/[id]`, `admin/analytics`                          |
| **User Status**       | ACTIVE→green, INACTIVE→default, BANNED→red                                                                                                                        | `admin/users/[id]`                                                                |
| **User Role**         | BUYER→blue/green, VENDOR→purple/blue, ADMIN→red/purple                                                                                                            | `admin/users`, `admin/users/[id]` (colors don't even match!)                      |
| **Payment Status**    | PENDING→orange, PAID→green, FAILED→red, REFUNDED→purple                                                                                                           | `buyer/orders/[id]`, `vendor/orders/[id]`, `admin/orders/[id]`                    |
| **Product Stock**     | stock>10→green, stock>0→orange, 0→red                                                                                                                             | `vendor/products`, `admin/products`                                               |
| **Review Flag**       | flagged→red, active→green                                                                                                                                         | `ReviewModerationPanel`                                                           |
| **Notification Type** | Type-based color map                                                                                                                                              | `NotificationDrawer`                                                              |

**Also**: `OrderCard.tsx` uses the custom `Badge` wrapper with a separate `statusConfig` mapping — a **third** approach to status rendering.

### C2. Loading / Spinner Pattern (3 DIFFERENT APPROACHES)

| Approach                            | Files                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom wrapper `LoadingSpinner`** | `vendor/orders`, `admin/orders` (2 files)                                                                                                                                                                                                                                                |
| **Antd `Spin`**                     | `loading.tsx` (root), `auth/loading`, `admin/vendors/[id]`, `admin/products/[id]`, `admin/users/[id]`, `admin/orders/[id]`, `vendor/products/[id]`, `vendor/orders/[id]`, `buyer/notifications/settings`, `NotificationBell`, `NotificationDrawer`, `NotificationPreferences` (12 files) |
| **Lucide `Loader2` + animate-spin** | `dashboard/page.tsx`, `store-settings/page.tsx` (2 files)                                                                                                                                                                                                                                |
| **Antd `Skeleton`**                 | `admin/loading`, `vendor/loading`, `buyer/loading` (3 files)                                                                                                                                                                                                                             |
| **Custom CSS spinner**              | `OptimizedImage.tsx` (1 file)                                                                                                                                                                                                                                                            |

### C3. Empty State Pattern (2 DIFFERENT APPROACHES)

| Approach                        | Files                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **Custom `EmptyState` wrapper** | 18 files (well-adopted)                                                         |
| **Antd `Empty`**                | `ReviewDisplay`, `SearchHistory`, `NotificationBell`, `buyer/vendors` (4 files) |
| **Inline "No X yet" text**      | `RatingDistribution`, `buyer/profile` (2 files)                                 |

### C4. Stat Card Pattern (DUPLICATED INLINE)

The exact same pattern — `{title, value, icon, color, bgColor}` rendered in a Card with icon — is copy-pasted in:

- `app/admin/dashboard/page.tsx` (6 stats)
- `app/vendor/dashboard/page.tsx` (4 stats)
- `app/vendor/analytics/page.tsx` (5 stats)
- `app/admin/orders/page.tsx` (stats section)

All use identical JSX:

```tsx
<Card className={stat.bgColor}>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-ds-text-secondary">{stat.title}</p>
      <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
    </div>
    <Icon className={`h-12 w-12 ${stat.color}`} />
  </div>
</Card>
```

### C5. Price / Currency Display (MOSTLY CONSISTENT)

- **`formatCurrency()` from `@/lib/utils`** — used in ~25 files (well-adopted)
- **Inline `₦${price.toLocaleString()}`** — used in 5 files: `SearchBar`, `SearchFilterChips`, `CartItemComponent`, `admin/dashboard`, `admin/orders`, `FilterDrawer`, `ProductFiltersSidebar` (local `formatCurrency` redefined!)
- **Duplicate `formatCurrency` definition** in `app/_utils/index.ts` (separate from `lib/utils/index.ts`)

### C6. Form Input Pattern

- Antd `Form` + `Form.Item` + antd `Input` — used in all auth pages and signup flow (8 files)
- Custom `Input` wrapper — used in only 2 files
- The custom Input wrapper is **not compatible with antd Form** (which expects antd's controlled components)

### C7. Cart Item Component (DUPLICATE)

Two nearly identical cart item components exist:

- `components/features/CartItem.tsx` — uses custom `Button` wrapper + `formatCurrency`
- `components/features/CartItemComponent.tsx` — uses inline `₦` formatting, no wrapper imports

---

## D) RECOMMENDED NEW WRAPPERS & ENHANCEMENTS

### D1. NEW: `StatusTag` Component (HIGH PRIORITY)

**Rationale**: Status-to-color mapping is duplicated in 8+ files with inconsistencies.

```
Location: components/ui/StatusTag.tsx
Purpose: Centralize all status badge rendering with antd Tag
Features:
  - Pre-defined color maps for: OrderStatus, VendorStatus, UserStatus, UserRole, PaymentStatus
  - Dot indicator variant
  - Optional icon
  - Consistent color mapping across the entire app
```

### D2. NEW: `StatCard` Component (HIGH PRIORITY)

**Rationale**: Identical stat card JSX copy-pasted in 4+ dashboard files.

```
Location: components/ui/StatCard.tsx
Purpose: Reusable stat/metric card for dashboards
Props: title, value, icon, color, bgColor, trend?, trendLabel?
```

### D3. ENHANCE: Migrate antd `Spin` → `LoadingSpinner` (MEDIUM PRIORITY)

**Rationale**: 12 files use antd `Spin` while a custom `LoadingSpinner` exists but is only used in 2 files.

**Action**: Either:

- Enhance `LoadingSpinner` to support all sizes and page-level centering
- Or standardize on antd `Spin` everywhere and remove the custom component
- Also replace Lucide `Loader2` in 2 files

### D4. ENHANCE: Migrate antd `Empty` → `EmptyState` (LOW PRIORITY)

**Rationale**: 4 files still use antd `Empty` despite the custom `EmptyState` being well-adopted.

**Action**: Replace antd `Empty` in `ReviewDisplay`, `SearchHistory`, `NotificationBell`, `buyer/vendors` with `EmptyState`.

### D5. ADOPT: `Modal` wrapper (MEDIUM PRIORITY)

**Rationale**: Custom `Modal` and `ConfirmModal` exist in `components/ui/` but have **0 usages**. 8 files use antd `Modal` directly.

**Action**: Either adopt the custom Modal in new code, or remove it and standardize on antd Modal. The custom Modal is pure Tailwind (no antd dependency) which may cause style conflicts.

### D6. ADOPT: `Table` wrapper (MEDIUM PRIORITY)

**Rationale**: Custom `Table` exists but has **0 usages**. 5 files use antd `Table` directly.

**Action**: Similar to Modal — decide whether to adopt or remove. Antd Table has more features (pagination, filters, sorting built-in), so the custom wrapper may be redundant unless it's enhanced.

### D7. NEW: `PriceDisplay` Component (LOW PRIORITY)

**Rationale**: While `formatCurrency()` is widely used, 5+ files still inline `₦${x.toLocaleString()}`. A component would ensure consistency.

```
Location: components/ui/PriceDisplay.tsx
Props: amount, size?, strikethrough?, className?
Renders: formatted ₦ amount with consistent styling
```

### D8. CLEANUP: Remove duplicate `CartItemComponent` (LOW PRIORITY)

**Rationale**: Two nearly identical cart item components. Consolidate into one.

### D9. CLEANUP: Remove duplicate `formatCurrency` in `app/_utils/index.ts` (LOW PRIORITY)

**Rationale**: Duplicate of `lib/utils/index.ts`. Remove and ensure all files import from `@/lib/utils`.

### D10. STANDARDIZE: Icon library (INFORMATIONAL)

**Current state**:

- **lucide-react**: 68 files (primary icon library)
- **@ant-design/icons**: 6 files (only auth/signup flows)

**Recommendation**: Gradually migrate the 6 auth/signup files to lucide-react for consistency. The antd icons are only used because those pages use antd Form components with icon prefixes.

---

## Summary

| Category                        | Count                | Status                              |
| ------------------------------- | -------------------- | ----------------------------------- |
| Existing UI wrappers            | 12 components        | Mixed adoption                      |
| Wrappers with 0 usage           | 2 (`Modal`, `Table`) | Dead code or not yet adopted        |
| Direct antd imports             | 60 across ~35 files  | Needs consolidation                 |
| lucide-react imports            | 68 files             | Consistent                          |
| Duplicated status color maps    | 8+ locations         | **Needs centralization**            |
| Duplicated stat card pattern    | 4 files              | **Needs extraction**                |
| Inconsistent loading approaches | 5 variants           | **Needs standardization**           |
| Inconsistent empty state        | 3 approaches         | Mostly good, 4 files need migration |
