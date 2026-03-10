# MyHarvestHub — Modification Plan

## Area 1: Social Media Links & Contact Info

> Replace placeholder social links, phone numbers, and standardize contact email.

### Files to modify:

- [x] **components/layout/Footer.tsx** — Replace 3 placeholder social links (FB→remove, IG→real, Twitter→X), add TikTok, update phone, update address
- [x] **app/(buyer)/contact/page.tsx** — Update phone, address (Lekki Lagos)
- [x] **app/(buyer)/about/page.tsx** — Update phone, address (Lekki Lagos)
- [x] **app/(buyer)/faqs/page.tsx** — Replace 4 personal team numbers with single support line
- [x] **app/(buyer)/privacy/page.tsx** — Update address
- [x] **lib/constants/index.ts** — Verify/update APP_CONFIG.SUPPORT_EMAIL, add social link constants
- [x] **.env.local** — Fix VAPID_SUBJECT to use support@myharvesthub.org

**Replacement values:**
| Field | New Value |
|-------|-----------|
| Instagram | `https://www.instagram.com/myharvesthub?igsh=eTllY20wMjA0NHhj&utm_source=qr` |
| X (Twitter) | `https://x.com/myharvesthub?s=21&t=KwO4wedcwGSnEO5ouE1o-w` |
| TikTok | `https://www.tiktok.com/@myharvesthub?_r=1&_t=ZS-94Y4nZ0omjV` |
| Phone/WhatsApp | `+234 701 203 7766` |
| Email | `support@myharvesthub.org` |
| Address | Lekki, Lagos, Nigeria |

---

## Area 2: Vendor Registration & Verification Documents

> Ensure vendor registration captures verification documents, fix admin approval bug.

- [x] **app/signup/layout.tsx** — Add `verification-docs` step between store-info and account-info for vendors
- [x] **app/signup/components/VerificationDocs.tsx** — NEW: Document upload component (valid ID + optional business registration)
- [x] **app/api/auth/register/route.ts** — Accept & store verification docs in `businessVerification` JSON field
- [x] **app/api/vendors/[id]/route.ts** — **CRITICAL BUG FIX**: Add `'status'` to `allowedFields` so admin approve/reject actually works
- [x] **app/admin/vendors/[id]/page.tsx** — Display uploaded verification documents for admin review
- [x] **prisma/seed.ts** — Add sample `businessVerification` data to seeded vendors

---

## Area 3: Remove Direct HICC References

> Remove only direct "Harvesters International Christian Centre" references. Keep all faith-based language, church pickup, campus, position, etc. Keep client-supplied FAQ/terms/about content as-is.

### Production code:

- [x] **app/(buyer)/contact/page.tsx** L68 — Replace "Harvesters International Christian Centre" address with "Lekki, Lagos, Nigeria"
- [x] **app/(buyer)/privacy/page.tsx** L184 — Replace "Harvesters International Christian Centre, Oregun, Lagos" → "Lekki, Lagos, Nigeria"
- [x] **app/(buyer)/about/page.tsx** L123 — Update "Oregun, Ikeja, Lagos" → "Lekki, Lagos, Nigeria"
- [x] **components/layout/Footer.tsx** L165 — Update "Oregun, Ikeja, Lagos" → "Lekki, Lagos, Nigeria"
- [x] **lib/data/mockData.ts** L659 — Change "Serving the Harvesters community" → generic
- [x] **lib/data/mockData.ts** L1773-1785 — Change "Harvesters Annual Convention 2026" and "Harvesters Oregun HQ" → generic church event names
- [x] **app/signup/layout.tsx** L113,143 — Verified: logo image exists (public/dark-bg-harvesters-Logo.jpg), filename is internal/not user-visible ✓

### Documentation (non-user-facing but good practice):

- [x] **README.md** L143 — "Harvesters International Christian Centre Technology Team" → "MyHarvestHub Team"
- [x] **.github/project-context.md** L7 — Update HICC reference
- [x] **.github/copilot-instructions.md** — Update "Oregun (Headquarters)" reference

**NOTE:** FAQ Q2 about HICC ownership is _client-supplied content_ — KEEP AS-IS.

---

## Area 4: Vendor Marketing Content Upload (NEW FEATURE)

> Vendors upload marketing content (images, videos, promo text) for platform-assisted marketing.

- [x] **prisma/schema.prisma** — Add `VendorContent` model with fields: id, vendorId, type (IMAGE/VIDEO/TEXT/PROMO_BANNER), title, description, mediaUrl, status (PENDING/APPROVED/REJECTED/ACTIVE), usageRights, targetPlatform, validFrom, validTo, timestamps
- [x] **app/api/vendors/[id]/content/route.ts** — NEW: GET (list) + POST (upload) content
- [x] **app/api/vendors/[id]/content/[contentId]/route.ts** — NEW: PUT (update) + DELETE content
- [x] **app/api/admin/vendor-content/route.ts** — NEW: GET all pending content for admin
- [x] **app/api/admin/vendor-content/[id]/route.ts** — NEW: PUT approve/reject content
- [x] **app/vendor/marketing-content/page.tsx** — NEW: Vendor dashboard page for uploading & managing content
- [x] **app/admin/vendor-content/page.tsx** — NEW: Admin moderation panel
- [x] **lib/types.ts** — Add VendorContent types
- [x] **lib/schemas/vendor-content.schemas.ts** — NEW: Zod validation schemas

---

## Area 5: Categories Overhaul + Commission Management

> Replace flat category enums with hierarchical category system from categories-directives.md. Add category-based default commission rates.

### 5A: Category System (Implemented via expanded enums + constants-based hierarchy)

_NOTE: Instead of a DB `Category` model with self-relation, categories were implemented as expanded Prisma enums (19 VendorCategory values, ~45 ProductCategory subcategories) with a `CATEGORY_SUBCATEGORIES` mapping in constants. This avoids migration complexity while providing the same UI hierarchy._

- [x] **prisma/schema.prisma** — Expanded VendorCategory (19 values) and ProductCategory (~45 subcategory values) enums
- [x] **lib/constants/index.ts** — Updated enums, VENDOR_CATEGORIES array, CATEGORY_SUBCATEGORIES mapping
- [x] **lib/utils/format.ts** — Updated formatVendorCategory with all 19 categories
- [x] **components/features/FilterDrawer.tsx** — Updated hardcoded categories
- [x] **app/(buyer)/products/page.tsx** — Updated category display
- [x] **app/page.tsx** — Updated homepage featured categories
- [x] **app/vendor/products/[id]/page.tsx** — Updated category selection
- [x] **prisma/seed.ts** — Updated seed data with new category values
- [x] **lib/data/mockData.ts** — Updated mock data category references
- [x] **components/features/CategoryNav.tsx** — Takes categories as props; no internal changes needed ✓
- [x] **components/features/FilterSidebar.tsx** — Takes categories as props; no internal changes needed ✓
- [x] **components/features/ProductFiltersSidebar.tsx** — Updated to use PRODUCT_SUBCATEGORIES with scrollable list
- [x] **app/(buyer)/vendors/page.tsx** — Updated to use formatVendorCategory for labels
- [x] **app/vendor/products/page.tsx** — Updated to use PRODUCT_CATEGORY_LABELS
- [x] **app/admin/products/page.tsx** — Updated to use PRODUCT_CATEGORY_LABELS
- [x] **app/signup/components/StoreInfo.tsx** — Already uses VENDOR_CATEGORIES from constants ✓
- [x] **lib/schemas/product.schemas.ts** — Uses z.nativeEnum(ProductCategory), already correct ✓
- [x] **lib/schemas/auth.schemas.ts** — Uses z.nativeEnum(VendorCategory), already correct ✓

### 5B: Commission Management System

_NOTE: Implemented with `CommissionConfig` model (per-category rate overrides) + `CATEGORY_COMMISSION_DEFAULTS` constants, instead of CommissionTier/CategoryCommission models._

- [x] **prisma/schema.prisma** — Added `CommissionConfig` model (id, category @unique, rate, timestamps)
- [x] **lib/constants/index.ts** — Added `CATEGORY_COMMISSION_DEFAULTS` per-category rates, removed church-affiliated tier
- [x] **app/api/admin/commission/route.ts** — NEW: GET/PUT commission config per category
- [x] **app/admin/settings/page.tsx** — Refactored with "Vendor Tiers" + "Category Defaults" tabs
- [x] **app/api/auth/register/route.ts** — Vendor commission based on category default (not church-affiliated)

---

## Area 6: Service Worker Fixes

> Prevent SW from caching itself, ensure page content is available offline.

- [x] **next.config.mjs** — Add SW file exclusion to Serwist config
- [x] **app/sw.ts** — Add self-exclusion pattern, ensure HTML pages are cached via stale-while-revalidate
- [x] **public/offline.html** — NEW: Static offline fallback page
- [x] **app/error.tsx** — Added network error detection with dedicated offline UI (WifiOff icon, retry button)

---

## Area 7: PWA Offline Resilience & Performance (Added during implementation)

> Allow dashboard navigation offline, protect network-dependent operations, preserve auth state offline, add Remember Me feature, optimize navigation performance.

### Offline & Caching:

- [x] **app/sw.ts** — Rewritten with 3 runtime caching strategies: NetworkFirst for pages (3s timeout), StaleWhileRevalidate for RSC payloads, NetworkFirst for auth/me (2s timeout). Offline.html as last resort only.
- [x] **lib/hooks/useNetworkStatus.ts** — NEW: `useNetworkStatus()` hook + `checkOnline()` guard for network-dependent operations
- [x] **app/error.tsx** — Added `isNetworkError()` detection with dedicated offline UI (WifiOff icon, retry/home buttons)

### Auth Offline Resilience:

- [x] **lib/contexts/AuthContext.tsx** — localStorage-backed user cache; `fetchUser()` falls back to cached data on network failure instead of clearing auth; login/logout manage cache
- [x] **app/api/auth/login/route.ts** — Accepts `rememberMe` flag, passes to `setAuthCookies`
- [x] **lib/utils/cookies.ts** — `setAuthCookies` accepts `rememberMe`: true → 8h access/30d refresh, false → 15min access/7d refresh

### Remember Me Feature:

- [x] **app/(auth)/login/page.tsx** — Added Remember Me checkbox with localStorage auto-toggle persistence

### Constants & Helpers (Category UI Propagation):

- [x] **lib/constants/index.ts** — Added PRODUCT_SUBCATEGORIES, PRODUCT_CATEGORY_LABELS, SUBCATEGORY_TO_PARENT, getSubcategoryValues()

---

## Implementation Order

1. **Area 1** — Social links & contact (quick wins)
2. **Area 3** — HICC references (quick, overlaps with Area 1 files)
3. **Area 6** — Service worker (small, independent)
4. **Area 2** — Vendor verification docs (medium)
5. **Area 5** — Categories + Commission (largest, schema changes)
6. **Area 4** — Vendor marketing content (new feature, after schema stabilizes)
7. **Area 7** — PWA offline resilience & performance
