 # HarvestHub Routes Audit Report

**Date:** February 19, 2026  
**Status:** Comprehensive Audit Complete

## Executive Summary

This document provides a complete audit of all routes, navigation links, and API endpoints in the HarvestHub application. It identifies broken links, missing pages, inconsistent routing patterns, and provides a remediation plan.

---

## 1. Existing Pages Inventory

### Auth Routes (Route Group: `(auth)`)

✅ `/login` - Login page  
✅ `/forgot-password` - Password recovery  
✅ `/reset-password` - Password reset with token

### Buyer Routes (Route Group: `(buyer)`)

✅ `/` - Homepage (buyer landing)  
✅ `/about` - About page  
✅ `/cart` - Shopping cart  
✅ `/checkout` - Checkout page  
✅ `/contact` - Contact page  
✅ `/faqs` - FAQs page  
✅ `/help` - Help center  
✅ `/notifications` - Notifications list  
✅ `/notifications/settings` - Notification preferences  
✅ `/orders` - Order history  
✅ `/privacy` - Privacy policy  
✅ `/products` - Product listing  
✅ `/products/[id]` - Product detail page  
✅ `/profile` - User profile  
✅ `/terms` - Terms of service  
✅ `/vendors` - Vendor directory  
✅ `/vendors/[id]` - Vendor store page  
✅ `/wallet` - Buyer wallet

### Vendor Routes (Route Group: `vendor`)

✅ `/vendor/dashboard` - Vendor dashboard  
✅ `/vendor/analytics` - Vendor analytics  
✅ `/vendor/orders` - Vendor order management  
✅ `/vendor/wallet` - Vendor wallet

### Admin Routes (Route Group: `admin`)

✅ `/admin/dashboard` - Admin dashboard  
✅ `/admin/banners` - Banner management  
✅ `/admin/orders` - Admin order management

### Other Routes

✅ `/signup` - Signup flow entry  
✅ `/signup/user-info` - User information step  
✅ `/signup/store-info` - Store information step (vendors)  
✅ `/signup/account-info` - Account information step  
✅ `/signup/security-info` - Security information step  
✅ `/signup-success` - Signup completion page  
✅ `/unauthorized` - Unauthorized access page  
✅ `/dashboard` - Role-based dashboard router  
✅ `/store-settings` - Store settings (legacy location)  
✅ `/products/management` - Products management router  
✅ `/orders/management` - Orders management router

---

## 2. Existing API Routes

### Authentication (`/api/auth`)

✅ POST `/api/auth/register` - User registration  
✅ POST `/api/auth/login` - User login  
✅ POST `/api/auth/logout` - User logout  
✅ POST `/api/auth/refresh` - Token refresh  
✅ GET `/api/auth/me` - Get current user  
✅ POST `/api/auth/forgot-password` - Request password reset  
✅ POST `/api/auth/reset-password` - Reset password with token

### Products (`/api/products`)

✅ GET `/api/products/search` - Search products  
✅ GET `/api/products/trending` - Get trending products  
✅ GET `/api/products/featured` - Get featured products  
✅ GET `/api/products/new-arrivals` - Get new arrivals  
✅ GET `/api/products/[id]/related` - Get related products

### Reviews (`/api/reviews`)

✅ GET `/api/reviews` - Get reviews (with filters)  
✅ POST `/api/reviews` - Create review  
✅ PUT `/api/reviews/[id]` - Update review  
✅ DELETE `/api/reviews/[id]` - Delete review  
✅ POST `/api/reviews/[id]/vote` - Vote on review helpfulness  
✅ POST `/api/reviews/[id]/flag` - Flag review

### Wallet (`/api/wallet`)

✅ GET `/api/wallet` - Get wallet details  
✅ GET `/api/wallet/balance` - Get wallet balance  
✅ GET `/api/wallet/transactions` - Get transaction history  
✅ POST `/api/wallet/deposit` - Deposit to wallet  
✅ POST `/api/wallet/withdraw` - Withdraw from wallet

### Notifications (`/api/notifications`)

✅ GET `/api/notifications` - Get notifications  
✅ PUT `/api/notifications/[id]/read` - Mark notification as read  
✅ PUT `/api/notifications/read-all` - Mark all as read  
✅ DELETE `/api/notifications/[id]` - Delete notification  
✅ GET `/api/notifications/preferences` - Get notification preferences  
✅ PUT `/api/notifications/preferences` - Update notification preferences

### Banners (`/api/banners`)

✅ GET `/api/banners` - Get banners  
✅ POST `/api/banners` - Create banner (admin)  
✅ PUT `/api/banners/[id]` - Update banner (admin)  
✅ DELETE `/api/banners/[id]` - Delete banner (admin)

### Admin Reviews (`/api/admin/reviews`)

✅ GET `/api/admin/reviews` - Get all reviews (admin)  
✅ PUT `/api/admin/reviews/[id]` - Update review status (admin)  
✅ POST `/api/admin/reviews/[id]/flag` - Flag/unflag review (admin)

---

## 3. Broken References & Missing Routes

### 🔴 CRITICAL: Missing Pages

#### Vendor Pages

- ❌ `/vendor/products` - Referenced in Sidebar.tsx (line 26)
- ❌ `/vendor/store-settings` - Referenced in Sidebar.tsx (line 30)

#### Admin Pages

- ❌ `/admin/vendors` - Referenced in Sidebar.tsx (line 35)
- ❌ `/admin/products` - Referenced in Sidebar.tsx (line 36)
- ❌ `/admin/users` - Referenced in Sidebar.tsx (line 38)
- ❌ `/admin/analytics` - Referenced in Sidebar.tsx (line 40) and dashboard.tsx (line 34)

#### Order Detail Pages

- ❌ `/orders/[id]` - Referenced in OrderCard.tsx (line 63)
  - Needed for viewing individual order details

#### Legal/Info Pages

- ❌ `/cookies` - Referenced in Footer.tsx (line 192)

### 🔴 CRITICAL: Missing API Endpoints

#### Products API

- ❌ GET `/api/products` - Base products list endpoint (pagination)
- ❌ GET `/api/products/[id]` - Get single product details
- ❌ POST `/api/products` - Create product (vendor)
- ❌ PUT `/api/products/[id]` - Update product (vendor)
- ❌ DELETE `/api/products/[id]` - Delete product (vendor)
- ❌ GET `/api/products/[id]/reviews` - Get product reviews (referenced in ReviewDisplay.tsx line 41)

#### Orders API

- ❌ GET `/api/orders` - Get user's orders
- ❌ POST `/api/orders` - Create order (referenced in tests)
- ❌ GET `/api/orders/[id]` - Get single order (referenced in tests line 163)
- ❌ POST `/api/orders/[id]/cancel` - Cancel order (referenced in tests line 189)
- ❌ PUT `/api/orders/[id]/status` - Update order status (vendor/admin)

#### Cart API

- ❌ GET `/api/cart` - Get cart contents (referenced in tests line 30)
- ❌ POST `/api/cart/items` - Add item to cart (referenced in tests line 48)
- ❌ PUT `/api/cart/items/[id]` - Update cart item (referenced in tests line 65)
- ❌ DELETE `/api/cart/items/[id]` - Remove cart item (referenced in tests line 80)
- ❌ DELETE `/api/cart/clear` - Clear cart (referenced in tests line 107)

#### Vendors API

- ❌ GET `/api/vendors` - Get vendor list
- ❌ GET `/api/vendors/[id]` - Get vendor details
- ❌ PUT `/api/vendors/[id]` - Update vendor profile
- ❌ GET `/api/vendors/[id]/products` - Get vendor's products

#### Users API

- ❌ GET `/api/users` - Get users (admin)
- ❌ GET `/api/users/[id]` - Get user details
- ❌ PUT `/api/users/[id]` - Update user profile
- ❌ DELETE `/api/users/[id]` - Delete user (admin)

#### Reviews API (Missing Routes)

- ❌ POST `/api/reviews/[id]/response` - Vendor response to review (referenced in VendorResponse.tsx line 48)

### 🟡 WARNING: Inconsistent Routes

#### Dashboard Routing Issue

- Issue: `/dashboard/page.tsx` exists as a router that redirects based on role
- Problem: Redirects to `/vendor-analytics` (line 29) which doesn't exist
- Expected: Should redirect to `/vendor/analytics` ✅

#### Store Settings Location

- Issue: `/store-settings/page.tsx` exists at root level
- Expected: Should be at `/vendor/store-settings` for consistency
- Current: Accessible at both locations (confusing)

#### Products/Orders Management

- Issue: `/products/management/page.tsx` and `/orders/management/page.tsx` are routers
- Purpose: They redirect based on role, but could be handled by middleware
- Consideration: These might be legacy from refactoring

### 🟡 WARNING: Dead Links in Navigation

#### Footer.tsx

- Line 192: Links to `/cookies` (doesn't exist)

#### Help Page

- Line 78: Links to dynamic `topic.link` values (need verification)

#### Not Found Page

- All links appear valid ✅

---

## 4. Navigation Link Inventory

### Header.tsx Links

✅ `/` - Logo/home  
✅ `/login` - Login button  
✅ `/signup` - Signup button  
✅ `/cart` - Cart icon  
✅ `/wallet` - Wallet icon  
✅ `/profile` - Profile menu  
⚠️ Dynamic dashboard link via `getDashboardLink()` function

### Footer.tsx Links

**Shop Section:**
✅ `/products`  
✅ `/vendors`  
✅ `/signup`  
✅ `/about`

**Support Section:**
✅ `/help`  
✅ `/faqs`  
✅ `/terms`  
✅ `/privacy`

**Legal Section:**
✅ `/terms`  
✅ `/privacy`  
❌ `/cookies` - **MISSING PAGE**

### Sidebar.tsx Links (Vendor)

✅ `/vendor/dashboard`  
❌ `/vendor/products` - **MISSING PAGE**  
✅ `/vendor/orders`  
✅ `/vendor/analytics`  
✅ `/vendor/wallet`  
❌ `/vendor/store-settings` - **MISSING PAGE**

### Sidebar.tsx Links (Admin)

✅ `/admin/dashboard`  
❌ `/admin/vendors` - **MISSING PAGE**  
❌ `/admin/products` - **MISSING PAGE**  
✅ `/admin/orders`  
❌ `/admin/users` - **MISSING PAGE**  
✅ `/admin/banners`  
❌ `/admin/analytics` - **MISSING PAGE**

---

## 5. Programmatic Navigation Analysis

### router.push() Calls

All router.push() calls reviewed - most are valid, one issue found:

**Issue in dashboard.tsx:**

- Line 29: `redirect("/vendor-analytics")` ❌ Should be `/vendor/analytics`

### redirect() Calls

All redirect() calls in Server Components appear valid ✅

### Middleware Redirects

- Middleware uses `getDashboardRoute()` helper
- Routes to correct dashboards based on role ✅

---

## 6. API Call Analysis

### Missing API Routes Being Called

**In Test Files:**

- `/api/orders` - Multiple calls (GET, POST)
- `/api/orders/[id]` - GET, status updates
- `/api/orders/[id]/cancel` - POST
- `/api/cart` - GET
- `/api/cart/items` - POST, DELETE
- `/api/cart/items/[id]` - PUT, DELETE
- `/api/cart/clear` - DELETE

**In Components:**

- `/api/products/[id]/reviews` - ReviewDisplay.tsx (line 41)
- `/api/reviews/[id]/response` - VendorResponse.tsx (line 48)

---

## 7. Route Group Structure Issues

### Current Structure

```
app/
├── (auth)/          # Auth pages - GOOD ✅
├── (buyer)/         # Buyer pages - GOOD ✅
├── vendor/          # Vendor pages - INCONSISTENT ⚠️
├── admin/           # Admin pages - INCONSISTENT ⚠️
├── signup/          # Signup flow - GOOD ✅
└── [misc pages]     # Scattered pages - NEEDS CLEANUP ⚠️
```

### Issues

1. **Vendor/Admin not in route groups:** Unlike `(auth)` and `(buyer)`, vendor and admin routes are NOT in route groups. This is acceptable but inconsistent.

2. **Scattered root-level pages:**
   - `/dashboard/page.tsx` - Router page (consider moving logic to middleware)
   - `/store-settings/page.tsx` - Should be at `/vendor/store-settings`
   - `/products/management/page.tsx` - Router page (legacy?)
   - `/orders/management/page.tsx` - Router page (legacy?)
   - `/unauthorized/page.tsx` - OK at root level

---

## 8. Dynamic Route Analysis

### Existing Dynamic Routes

✅ `/products/[id]/page.tsx` - Product details  
✅ `/vendors/[id]/page.tsx` - Vendor store

### Missing Dynamic Routes

❌ `/orders/[id]/page.tsx` - Order details  
❌ `/admin/vendors/[id]/page.tsx` - Admin vendor detail  
❌ `/admin/users/[id]/page.tsx` - Admin user detail  
❌ `/api/products/[id]/route.ts` - Single product API  
❌ `/api/orders/[id]/route.ts` - Single order API  
❌ `/api/vendors/[id]/route.ts` - Single vendor API  
❌ `/api/users/[id]/route.ts` - Single user API

---

## Remediation Plan

### Phase 1: Critical Missing Pages (Fix Broken Navigation)

- [ ] Create `/vendor/products/page.tsx` - Product management list
- [ ] Create `/vendor/store-settings/page.tsx` - Store settings
- [ ] Create `/admin/vendors/page.tsx` - Vendor management list
- [ ] Create `/admin/products/page.tsx` - Product moderation
- [ ] Create `/admin/users/page.tsx` - User management
- [ ] Create `/admin/analytics/page.tsx` - Analytics dashboard
- [ ] Create `/cookies/page.tsx` - Cookie policy page
- [ ] Create `/orders/[id]/page.tsx` - Order detail page (shared by all roles)

### Phase 2: Critical API Endpoints (Backend Functionality)

- [ ] Create `/api/products/route.ts` - GET (list with pagination/filters)
- [ ] Create `/api/products/[id]/route.ts` - GET, PUT, DELETE
- [ ] Create `/api/products/[id]/reviews/route.ts` - GET product reviews
- [ ] Create `/api/orders/route.ts` - GET, POST
- [ ] Create `/api/orders/[id]/route.ts` - GET, PUT, DELETE
- [ ] Create `/api/orders/[id]/cancel/route.ts` - POST
- [ ] Create `/api/cart/route.ts` - GET
- [ ] Create `/api/cart/items/route.ts` - POST
- [ ] Create `/api/cart/items/[id]/route.ts` - PUT, DELETE
- [ ] Create `/api/cart/clear/route.ts` - DELETE
- [ ] Create `/api/vendors/route.ts` - GET
- [ ] Create `/api/vendors/[id]/route.ts` - GET, PUT
- [ ] Create `/api/vendors/[id]/products/route.ts` - GET vendor products
- [ ] Create `/api/users/route.ts` - GET (admin)
- [ ] Create `/api/users/[id]/route.ts` - GET, PUT, DELETE
- [ ] Create `/api/reviews/[id]/response/route.ts` - POST vendor response

### Phase 3: Fix Broken Redirects

- [ ] Fix `/dashboard/page.tsx` line 29: `/vendor-analytics` → `/vendor/analytics`

### Phase 4: Cleanup & Consistency

- [ ] Move `/store-settings/page.tsx` → `/vendor/store-settings/page.tsx`
- [ ] Remove or deprecate `/products/management/page.tsx` (if unused)
- [ ] Remove or deprecate `/orders/management/page.tsx` (if unused)
- [ ] Document purpose of `/dashboard/page.tsx` router or move to middleware

### Phase 5: Enhanced Features (Nice to Have)

- [ ] Create `/vendor/products/[id]/page.tsx` - Edit individual product
- [ ] Create `/vendor/orders/[id]/page.tsx` - Vendor order detail
- [ ] Create `/admin/vendors/[id]/page.tsx` - Admin vendor detail
- [ ] Create `/admin/users/[id]/page.tsx` - Admin user detail
- [ ] Create `/admin/orders/[id]/page.tsx` - Admin order detail
- [ ] Create `/admin/products/[id]/page.tsx` - Admin product moderation

### Phase 6: Testing & Validation

- [ ] Test all navigation links from Header
- [ ] Test all navigation links from Footer
- [ ] Test all Sidebar links (vendor & admin)
- [ ] Test all programmatic navigation (router.push, redirect)
- [ ] Test all API endpoints with proper authentication
- [ ] Verify role-based access control on all routes
- [ ] Test 404 handling for invalid routes
- [ ] Test unauthorized access handling

### Phase 7: Documentation Updates

- [ ] Update routing documentation with new structure
- [ ] Document API endpoint conventions
- [ ] Create route naming conventions guide
- [ ] Update developer onboarding docs

---

## Additional Notes & Considerations

### 1. Route Naming Conventions

**Current Pattern:**

- Buyer routes: No prefix (e.g., `/products`, `/orders`)
- Vendor routes: `/vendor/*` prefix
- Admin routes: `/admin/*` prefix
- Auth routes: No prefix, grouped in `(auth)`

**Recommendation:** This is a solid pattern. Maintain consistency.

### 2. API Versioning

**Current:** No API versioning (e.g., `/api/v1/`)  
**Consideration:** Add versioning before production for future-proofing

### 3. Role-Based Route Protection

**Current Implementation:**

- Middleware handles auth redirects
- Some pages do client-side role checks
- Mix of server and client protection

**Recommendation:**

- Standardize on middleware protection
- Keep client checks for UX only
- Add server-side checks in API routes

### 4. Dynamic Route SEO

**Consideration:** Product and vendor pages need:

- Proper metadata exports
- OpenGraph tags
- Structured data (JSON-LD)

### 5. Route Transitions

**Current:** Standard Next.js navigation  
**Enhancement:** Consider adding loading states for better UX

### 6. Error Boundaries

**Current:** Has `not-found.tsx` and `error.tsx`  
**Recommendation:** Ensure error.tsx exists at all layout levels

### 7. Deprecated Routes

**Question:** Are these legacy from Martgram refactor?

- `/products/management/page.tsx`
- `/orders/management/page.tsx`
- `/store-settings/page.tsx` (root level)

**Action:** Review git history and either remove or document purpose

### 8. Mobile Navigation

**Current:** Bottom nav for mobile in Sidebar.tsx  
**Issue:** Only shows first 5 links  
**Recommendation:** Add "More" menu for vendors/admins with >5 nav items

### 9. Search & Filter Routes

**Current:** Uses query params (e.g., `/products?category=ELECTRONICS`)  
**Alternative:** Could use dynamic routes (e.g., `/products/category/electronics`)  
**Recommendation:** Current approach is fine for SEO and flexibility

### 10. Internationalization (i18n)

**Current:** No i18n support  
**Future:** If adding multi-language, use Next.js i18n routing

---

## Conclusion

The HarvestHub routing architecture is generally well-structured but has several critical gaps that need addressing:

**Critical Issues:** 15 missing pages, 20+ missing API endpoints  
**Medium Issues:** 1 broken redirect, 1 dead link  
**Minor Issues:** Structural inconsistencies, deprecated routes

**Priority:** Focus on Phase 1 (navigation) and Phase 2 (API endpoints) to restore full functionality.

**Timeline Estimate:**

- Phase 1: 2-3 days
- Phase 2: 4-5 days
- Phase 3: 1 hour
- Phase 4-7: 2-3 days

**Total Estimated Effort:** 9-11 days of development work

---

**Audit Completed By:** GitHub Copilot (Claude Sonnet 4.5)  
**Last Updated:** February 19, 2026
