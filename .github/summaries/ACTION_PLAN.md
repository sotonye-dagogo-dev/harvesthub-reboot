# Action Plan - Fixing Mock Data Issues

**Status**: Analysis Complete, Implementation Ready  
**Created**: March 11, 2026  
**Owner**: Development Team

---

## Executive Summary

### Issues Identified

1. ✅ **FIXED: Logo Sizing** — Auth pages responsive (1 file updated)
2. 🔄 **IN PROGRESS: Mock Data** — Production shows fake data (22 files need updating)

### Root Causes

- Pages import `mockData.ts` directly without environment checks
- No production fallback to real database
- Client components can't use server-side Prisma

### Solution Provided

1. Server-side async fetchers with environment awareness
2. Client-safe HTTP fetchers for interactive pages
3. Fallback strategy for graceful error handling

---

## What's Already Done

### Files Modified ✅

```
✅ app/(auth)/login/page.tsx                    — Logo responsive
✅ app/(auth)/reset-password/page.tsx           — Logo responsive
✅ lib/data/dataFetchers.ts (NEW)               — Server fetchers
✅ lib/data/clientDataFetchers.ts (NEW)         — Client fetchers
✅ .github/summaries/ISSUES_RESOLUTION.md       — Full documentation
✅ .github/summaries/QUICK_FIX_GUIDE.md         — Implementation guide
```

### Environment Awareness

```
Development (NODE_ENV=development)
  → Mock data returned immediately
  → Fast development cycle

Production (NODE_ENV=production)
  → Database queries via Prisma
  → Redis caching enabled
  → Falls back to mock if DB fails
```

---

## Pages Awaiting Update

### Priority 1: Highest Impact (5 pages) — START HERE

These pages receive the most user traffic and have the highest visibility impact.

| File                            | Current                                | Solution                   | Complexity |
| ------------------------------- | -------------------------------------- | -------------------------- | ---------- |
| `app/page.tsx`                  | mockBanners, mockProducts, mockVendors | Data Container (server)    | Medium     |
| `app/(buyer)/products/page.tsx` | mockProducts, mockVendors              | Data Container             | Medium     |
| `app/(buyer)/vendors/page.tsx`  | mockVendors, mockProducts              | Data Container             | Low        |
| `app/(buyer)/orders/page.tsx`   | mockOrders                             | useEffect fetcher OR async | Low        |
| `app/admin/dashboard/page.tsx`  | All mock data                          | Async server component     | Medium     |

**Estimated Time**: 1-2 hours  
**Impact**: 80% of user experience improved

---

### Priority 2: Core Features (10 pages)

Important functionality, moderate user impact.

| File                                 | Current Mock Data                                 | Strategy               |
| ------------------------------------ | ------------------------------------------------- | ---------------------- |
| `app/(buyer)/products/[id]/page.tsx` | mockProducts, mockVendors, mockReviews            | Data Container         |
| `app/(buyer)/vendors/[id]/page.tsx`  | mockVendors, mockProducts, mockUsers, mockReviews | Data Container         |
| `app/(buyer)/orders/[id]/page.tsx`   | mockOrders, mockVendors                           | Async + client wrapper |
| `app/vendor/dashboard/page.tsx`      | mockProducts, mockOrders, mockVendors             | Data Container         |
| `app/vendor/products/page.tsx`       | mockProducts, mockVendors                         | Data Container         |
| `app/vendor/orders/page.tsx`         | mockOrders, mockProducts, mockUsers, mockVendors  | Data Container         |
| `app/admin/users/page.tsx`           | mockUsers                                         | Async server component |
| `app/admin/vendors/page.tsx`         | mockVendors, mockUsers, mockProducts              | Async server component |
| `app/admin/products/page.tsx`        | mockProducts, mockVendors                         | Async server component |
| `app/admin/orders/page.tsx`          | mockOrders, mockUsers                             | Async server component |

**Estimated Time**: 2-3 hours  
**Impact**: Additional 15% UX improvement

---

### Priority 3: Secondary Features (7 pages)

Lower traffic, but completes the migration.

| File                                 | Current Mock Data                                  | Strategy                |
| ------------------------------------ | -------------------------------------------------- | ----------------------- |
| `app/(buyer)/wallet/page.tsx`        | mockWallets, mockTransactions                      | useEffect fetcher       |
| `app/(buyer)/profile/page.tsx`       | mockAddresses                                      | Async server component  |
| `app/(buyer)/favourites/page.tsx`    | mockProducts, mockVendors                          | Data Container          |
| `app/vendor/analytics/page.tsx`      | mockProducts, mockOrders, mockReviews, mockVendors | Async server component  |
| `app/vendor/store-settings/page.tsx` | mockVendors                                        | Direct fetcher or async |
| `app/admin/banners/page.tsx`         | mockBanners                                        | Async server component  |
| `app/admin/analytics/page.tsx`       | All mock data                                      | Async server component  |

**Estimated Time**: 1-2 hours  
**Impact**: Completes migration

---

## Implementation Strategy by Pattern

### Pattern A: Async Server Component (Simplest)

**Use When**: Page doesn't need hooks, just displays data

```
Remove: "use client"
Add: async to component
Replace: mockData imports with dataFetchers
Time: ~5 minutes per file
```

**Files**: admin pages mostly

**Example**:

```typescript
// Remove "use client"
import { getUsers } from "@/lib/data/dataFetchers";

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <UsersList users={users} />;
}
```

---

### Pattern B: Data Container (Recommended)

**Use When**: Page needs hooks (useCart, useFavorites) after displaying data

```
Split file into:
  - page.tsx (server, fetches data)
  - ComponentName.tsx (client, uses hooks)
Time: ~15 minutes per file
```

**Files**: buyer, vendor pages mostly

**Example**:

```typescript
// page.tsx (Server)
import { getProducts } from "@/lib/data/dataFetchers";
import { ProductsList } from "./ProductsList";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsList products={products} />;
}

// ProductsList.tsx (Client)
"use client";
import { useCart } from "@/lib/store/cartStore";

export function ProductsList({ products }) {
  const { addItem } = useCart();
  return (...);
}
```

---

### Pattern C: useEffect Fetcher (Quick Fix)

**Use When**: Server Component conversion is too complex right now

```
Keep: "use client"
Add: useEffect with data fetcher API calls
Time: ~10 minutes per file
```

**Files**: Orders page, Wallet page if quick fix needed

**Example**:

```typescript
"use client";
import { useEffect, useState } from "react";
import { getOrdersClient } from "@/lib/data/clientDataFetchers";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getOrdersClient().then(setOrders);
  }, []);

  return <OrdersList orders={orders} />;
}
```

---

## Testing Checklist

### Before Any Change

- [ ] Verify database is seeded and populated
- [ ] Confirm Node_ENV matches expected value
- [ ] API routes working: `curl http://localhost:3000/api/products`

### After Each File Update

- [ ] No TypeScript errors
- [ ] Dev server starts without errors
- [ ] Page displays without breaking
- [ ] Data is NOT the original mock data (e.g., Demo Vendor, Demo Products)

### Before Production Deploy

- [ ] All 22 files updated
- [ ] No files directly import mockData anymore (for main pages)
- [ ] Tested with NODE_ENV=production locally
- [ ] Real data from database visible on all pages
- [ ] Mobile responsiveness works
- [ ] Logo sizing correct on all breakpoints
- [ ] Performance acceptable

---

## Rollout Timeline

### Day 1

- [ ] Review this action plan with team
- [ ] Assign Priority 1 pages to developers
- [ ] Update 5 Priority 1 pages
- [ ] Test combined changes
- [ ] Deploy to staging

### Day 2

- [ ] Deploy Priority 1 to production
- [ ] Start Priority 2 pages
- [ ] Update 10 Priority 2 pages
- [ ] Comprehensive testing

### Day 3

- [ ] Deploy Priority 2 to production
- [ ] Update remaining 7 Priority 3 pages
- [ ] Final testing suite
- [ ] Production deployment

---

## Success Metrics

| Metric                      | Before | After  | Target |
| --------------------------- | ------ | ------ | ------ |
| Real data displayed         | 0%     | 100%   | 100%   |
| Mock data visibility        | 100%   | 0%     | 0%     |
| Mobile viewport breakpoints | 1      | 3+     | 3+     |
| Database query latency      | N/A    | <100ms | <100ms |
| Cache hit rate              | N/A    | >80%   | >80%   |
| User trust (no fake data)   | Low    | High   | High   |

---

## Risk Mitigation

### Risk: Database connection fails

**Mitigation**: Automatic fallback to mock data  
**Verification**: Test with DB offline

### Risk: Page breaks due to data structure change

**Mitigation**: Type safety with TypeScript  
**Verification**: Build passes `npm run build`

### Risk: Performance degradation

**Mitigation**: Redis caching in place  
**Verification**: Monitor API response times

### Risk: Missing data in database

**Mitigation**: Seed script re-run  
**Verification**: `npx prisma db seed`

---

## Resource Files

| File                                     | Purpose                      |
| ---------------------------------------- | ---------------------------- |
| `.github/summaries/ISSUES_RESOLUTION.md` | Complete analysis & strategy |
| `.github/summaries/QUICK_FIX_GUIDE.md`   | Step-by-step implementation  |
| `lib/data/dataFetchers.ts`               | Server-side fetchers         |
| `lib/data/clientDataFetchers.ts`         | Client-side fetchers         |

---

## Questions & Answers

**Q: Why can't I just remove all mock data imports?**  
A: Some pages use Client Components that need hooks. Can't make them async without breaking interactivity.

**Q: Will this affect build size?**  
A: No, mock data imports will be dead code. Tree-shaking will remove them.

**Q: How long will each page take to fix?**  
A: Priority 1: 10-15min each. Priority 2: 15-20min each. Priority 3: 5-15min each.

**Q: What if we run out of time?**  
A: Priority 1 fixes 80% of user-visible issues. Minimum viable deployment.

**Q: Can we auto-generate these changes?**  
A: Not reliably due to component complexity. Manual review ensures quality.

---

## Next Steps

1. ✅ Review this plan with team
2. ⏳ Assign developers to Priority 1 pages
3. ⏳ Follow QUICK_FIX_GUIDE.md for implementation
4. ⏳ Run tests before committing
5. ⏳ Deploy to staging, then production
6. ⏳ Monitor production logs for any fallback scenarios
