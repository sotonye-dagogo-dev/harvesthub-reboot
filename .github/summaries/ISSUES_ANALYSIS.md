# Issues Analysis - Mock Data in Production & Logo Sizing

**Date**: March 11, 2026  
**Status**: Analysis Complete — Fixes Ready

---

## Issue 1: Mock Data on Production Version ⚠️ CRITICAL

### Problem

All pages throughout the application are hard-coded to import and use mock data from `@/lib/data/mockData.ts` without any environment checks. This means even in production (`NODE_ENV=production`), users are seeing fake data instead of real database data.

### Root Cause

The application was built with mock data during development and never transitioned to use the database in production. There are no environment-aware data fetching utilities.

### Affected Files (22 total)

**Home & Buyer Pages:**

- `app/page.tsx` (home) — uses mockBanners, mockProducts, mockVendors
- `app/(buyer)/products/page.tsx` — uses mockProducts, mockVendors
- `app/(buyer)/products/[id]/page.tsx` — uses mockProducts, mockVendors, mockReviews
- `app/(buyer)/orders/page.tsx` — uses mockOrders
- `app/(buyer)/orders/[id]/page.tsx` — uses mockOrders, mockVendors
- `app/(buyer)/wallet/page.tsx` — uses mockWallets, mockTransactions
- `app/(buyer)/profile/page.tsx` — uses mockAddresses
- `app/(buyer)/favourites/page.tsx` — uses mockProducts, mockVendors
- `app/(buyer)/vendors/page.tsx` — uses mockVendors, mockProducts
- `app/(buyer)/vendors/[id]/page.tsx` — uses mockVendors, mockProducts, mockUsers, mockReviews

**Vendor Pages:**

- `app/vendor/dashboard/page.tsx` — uses mockProducts, mockOrders, mockVendors
- `app/vendor/products/page.tsx` — uses mockProducts, mockVendors
- `app/vendor/orders/page.tsx` — uses mockOrders, mockProducts, mockUsers, mockVendors
- `app/vendor/analytics/page.tsx` — uses mockProducts, mockOrders, mockReviews, mockVendors
- `app/vendor/store-settings/page.tsx` — uses mockVendors

**Admin Pages:**

- `app/admin/dashboard/page.tsx` — uses mockUsers, mockVendors, mockProducts, mockOrders, mockReviews
- `app/admin/users/page.tsx` — uses mockUsers
- `app/admin/vendors/page.tsx` — uses mockVendors, mockUsers, mockProducts
- `app/admin/products/page.tsx` — uses mockProducts, mockVendors
- `app/admin/orders/page.tsx` — uses mockOrders, mockUsers
- `app/admin/banners/page.tsx` — uses mockBanners
- `app/admin/analytics/page.tsx` — uses mock data for analytics

### Impact

- Users see fake data (fake products, orders, vendors) in production
- Real database data is never displayed
- Trust is broken; users can't perform real transactions
- Analytics show fake metrics

### Solution

Create environment-aware data fetching utilities that:

1. **Development**: Return mock data (current behavior)
2. **Production**: Fetch from database using Prisma
3. Replace all direct `mockData` imports with these utilities

### Files to Create/Modify

1. `lib/data/dataFetchers.ts` — New file with environment-aware fetchers
2. Replace 22 page imports with fetcher calls

---

## Issue 2: Logo Oversized on Auth Pages (Mobile Unfriendly)

### Problem

Login page and other auth pages use `text-3xl` (30px) for the brand name/logo, which is too large on small devices (mobile phones), causing layout issues.

### Affected Files

- `app/(auth)/login/page.tsx` — Line 65: `className="text-3xl font-bold text-ds-text-brand"`
- `app/(auth)/reset-password/page.tsx` — Line ~x: Uses Typography.Title (may be oversized)
- `app/(auth)/forgot-password/page.tsx` — Line ~x: Uses Typography.Title (may be oversized)

### Root Cause

No responsive font sizing applied. Mobile-first approach not implemented for auth layouts.

### Solution

Use responsive Tailwind classes:

- **Change from**: `text-3xl`
- **Change to**: `text-xl sm:text-2xl` or `text-xl md:text-2xl lg:text-3xl`

This provides:

- Mobile (base): Small font (1.25rem/20px)
- Tablet+: Medium font (1.5rem/24px)
- Desktop+: Large font (1.875rem/30px)

### Files to Modify

1. `app/(auth)/login/page.tsx` — Update logo heading class
2. `app/(auth)/reset-password/page.tsx` — Update Typography.Title
3. `app/(auth)/forgot-password/page.tsx` — Update Typography.Title

---

## Implementation Plan

### Phase 1: Fix Logo Sizing (Quick Win)

1. Update auth pages with responsive font classes
2. Test on mobile/tablet/desktop
3. **Estimated time**: 15 minutes

### Phase 2: Fix Mock Data (Major Fix)

1. Create `lib/data/dataFetchers.ts` with environment-aware utilities
2. Update 22 files to use new fetchers
3. Test data is displayed correctly in production
4. **Estimated time**: 2-3 hours

### Recommended Order

- Start with logo sizing (immediate impact, low risk)
- Then tackle mock data (more complex, higher impact)
