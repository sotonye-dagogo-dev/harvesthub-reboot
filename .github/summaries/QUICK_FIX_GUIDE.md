# Quick Implementation Guide - Fixing Mock Data in Production

This guide shows exact code changes for the 5 most critical pages.

## Quick Reference

**Problem**: Pages use `mockData` directly  
**Solution**: Fetch from database/API using environment-aware fetchers  
**Priority**: Highest impact pages first

---

## 1. Home Page (`app/page.tsx`)

**Current Issue**: Shows mock banners, products, and vendors  
**Fix Method**: Server Component + Data Container Pattern

### Change Required

Convert from using `mockProducts`, `mockBanners`, `mockVendors` to fetching real data:

**Key Changes**:

1. Remove `"use client"` directive (currently on line 1)
2. Import fetcher instead of mockData (line 9)
3. Make component async
4. Use real data with fallback to mock as error handler

```typescript
// OLD (line 1)
"use client";

// NEW
// Remove "use client" - make it a Server Component
```

```typescript
// OLD (line 9)
import { mockBanners, mockProducts, mockVendors } from "@/lib/data/mockData";

// NEW
import { getBanners, getProducts, getVendors } from "@/lib/data/dataFetchers";
```

```typescript
// OLD (entire component)
export default function HomePage() {
  const activeBanners = mockBanners.filter(...)
  // ... uses mockProducts, mockVendors directly

// NEW
export default async function HomePage() {
  const banners = await getBanners();
  const products = await getProducts();
  const vendors = await getVendors();

  // Filter on server
  const activeBanners = banners
    .filter(b => b.isActive && b.position === "HERO" && (!b.endDate || new Date(b.endDate) >= new Date()))
    .sort((a, b) => a.displayOrder - b.displayOrder)

  // ... rest of component uses 'banners', 'products', 'vendors'
}
```

**But wait!** This page uses `useCart()`, `useFavorites()`, `useGuestGuard()` hooks!

**Better Solution**: Data Container Pattern

- Keep a client component for interactivity
- Create server component for data fetching
- Pass data as props

---

## 2. Products Page (`app/(buyer)/products/page.tsx`)

**Current Issue**: Shows mock products and vendors  
**Status**: Likely uses hooks (needs client component)

### Recommended Fix: Data Container Pattern

**Step 1**: Get current imports and hooks

- Check if uses `useCart`, `useFavorites`, `useAuth`, `useRouter`, etc.
- These REQUIRE client component

**Step 2**: Create server component for data

```typescript
// app/(buyer)/products/page.tsx
import { getProducts, getVendors } from "@/lib/data/dataFetchers";
import { ProductsList } from "./ProductsList";

export default async function ProductsPage() {
  const [products, vendors] = await Promise.all([
    getProducts(),
    getVendors(),
  ]);

  return <ProductsList products={products} vendors={vendors} />;
}
```

**Step 3**: Create client component for interactivity

```typescript
// app/(buyer)/products/ProductsList.tsx
"use client";

import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import type { Product, Vendor } from "@/lib/types";

interface ProductsListProps {
  products: Product[];
  vendors: Vendor[];
}

export function ProductsList({ products, vendors }: ProductsListProps) {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Use 'products' and 'vendors' props instead of mockProducts/mockVendors
  return (
    // ... render products
  );
}
```

---

## 3. Vendors Page (`app/(buyer)/vendors/page.tsx`)

**Current Issue**: Shows mock vendors  
**Fix Method**: Similar to Products Page

```typescript
// OLD
"use client";
import { mockVendors, mockProducts } from "@/lib/data/mockData";

export default function VendorsPage() {
  // Uses mockVendors directly
}

// NEW - app/(buyer)/vendors/page.tsx (Server Component)
import { getVendors } from "@/lib/data/dataFetchers";
import { VendorsList } from "./VendorsList";

export default async function VendorsPage() {
  const vendors = await getVendors();
  return <VendorsList vendors={vendors} />;
}

// NEW - app/(buyer)/vendors/VendorsList.tsx (Client Component)
"use client";
import { useRouter } from "next/navigation";

export function VendorsList({ vendors }) {
  const router = useRouter();
  // Render using 'vendors' prop
}
```

---

## 4. Orders Page (`app/(buyer)/orders/page.tsx`)

**Current Issue**: Shows mock orders  
**Fix Method**: Fetch user-specific orders

```typescript
// OLD
import { mockOrders } from "@/lib/data/mockData";

// NEW
import { getOrdersByBuyerId } from "@/lib/data/dataFetchers";
import { getCurrentUser } from "@/lib/utils/auth";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user?.buyer?.id) {
    return <div>Not authorized</div>;
  }

  const orders = await getOrdersByBuyerId(user.buyer.id);
  return <OrdersList orders={orders} />;
}
```

---

## 5. Admin Dashboard (`app/admin/dashboard/page.tsx`)

**Current Issue**: Shows summary of mock data  
**Fix Method**: Aggregate real data

```typescript
// OLD
import { mockUsers, mockVendors, mockProducts, mockOrders } from "@/lib/data/mockData";

// NEW
import {
  getUsers,
  getVendors,
  getProducts,
  getOrders
} from "@/lib/data/dataFetchers";

export default async function AdminDashboard() {
  const [users, vendors, products, orders] = await Promise.all([
    getUsers(),
    getVendors(),
    getProducts(),
    getOrders(),
  ]);

  const stats = {
    totalUsers: users.length,
    totalVendors: vendors.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    recentOrders: orders.slice(0, 10),
  };

  return <Dashboard stats={stats} />;
}
```

---

## Testing Your Changes Locally

### Before Deployment

1. **Start local dev server**

   ```bash
   npm run dev
   ```

2. **Check .env**

   ```
   NODE_ENV=production  # or development for testing
   ```

3. **Verify database is running**

   ```bash
   npx prisma studio  # Should show seeded data
   ```

4. **Test endpoint**
   Open browser: `http://localhost:3000/api/products`
   Should show real data (not mock)

5. **Test page**
   Open browser: `http://localhost:3000/`
   Should show real data (not mock names like "Demo Vendor")

### Common Issues

| Issue                            | Solution                                        |
| -------------------------------- | ----------------------------------------------- |
| "Cannot use async in use client" | Remove "use client" OR split into server+client |
| "mockData not found"             | Replace `mockBanners` etc with fetched data     |
| Still seeing mock data           | Check NODE_ENV in .env is set correctly         |
| Type errors                      | Ensure returned data matches expected types     |

---

## Automatic Code Generation (For Future)

Once the pattern is established, subsequent pages can follow Template:

```typescript
// Template for any page needing real data
import { getData } from "@/lib/data/dataFetchers";
import { PageContent } from "./PageContent";

export default async function Page() {
  const data = await getData(); // Replace with actual fetcher
  return <PageContent data={data} />;
}
```

---

## Success Criteria ✓

After implementing these 5 pages:

- [ ] No pages import `mockData` directly (for critical paths)
- [ ] Production shows real database data
- [ ] Data updates are reflected immediately (no stale mock data)
- [ ] Performance is fast (API routes have Redis caching)
- [ ] Mobile/tablet/desktop all responsive
- [ ] Logo sizing works on all devices
- [ ] No console errors related to data
