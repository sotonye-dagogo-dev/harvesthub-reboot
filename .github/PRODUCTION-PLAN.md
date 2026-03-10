# HarvestHub — Production Execution Plan

> **Created**: March 7, 2026
> **Status**: In Progress
> **Approach**: Streams 0–11, dependency-ordered execution

---

## Audit Summary

| Area                            | Status                     | Notes                                |
| ------------------------------- | -------------------------- | ------------------------------------ |
| Pages (buyer/vendor/admin/auth) | 48+ pages built            | Full UI across all roles             |
| API Routes                      | 53+ handlers               | All on in-memory mock data           |
| Type System                     | ~600 lines                 | Comprehensive, strict mode           |
| Design System                   | 3-tier tokens              | Light/dark, Tailwind + Ant Design    |
| Auth                            | JWT + middleware           | Route protection working             |
| State                           | Zustand + Context          | Cart, favorites, auth, notifications |
| Build                           | Compiles (47 static pages) | 0 TS errors                          |
| SEO                             | Sitemap + Robots           | Dynamic sitemap, robots.txt added    |
| Database                        | None (mock only)           | No Prisma, no PostgreSQL             |
| Caching                         | None                       | No Redis                             |
| Images                          | None                       | No Cloudinary                        |
| Email                           | None                       | No email service                     |
| PWA                             | None                       | No manifest, no SW                   |
| Push Notifications              | None                       | —                                    |

### Existing TS Errors (0 — all resolved)

- ~~`Address` missing `streetAddress` (1)~~ ✅
- ~~`Order` missing `totalAmount` (1)~~ ✅
- ~~`Vendor` flat access to nested props — `description`, `logoUrl`, `allowsPickup`, `allowsDelivery`, `returnPolicy`, `shippingPolicy` (7)~~ ✅
- ~~`TopAdBanner` — `theme` possibly undefined (3)~~ ✅

---

## Architecture Decisions

| Decision           | Choice                                                | Rationale                                                    |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------ |
| Database ORM       | Prisma + Accelerate                                   | Type-safe, serverless-friendly, migration tooling            |
| Cache/Rate Limit   | Upstash Redis (shared DB, namespaced)                 | Already provisioned, namespace isolation prevents clashes    |
| Image Storage      | Cloudinary under `myharvesthub/` root folder          | Logical grouping, safe cleanup on edits                      |
| Email Provider     | Resend                                                | Built for Next.js/serverless, no SMTP config                 |
| PWA Framework      | Serwist (`@serwist/next`)                             | Maintained fork of next-pwa, Next.js 15 + App Router support |
| Push Notifications | Web Push API (`web-push`)                             | Standards-based, works with service worker                   |
| ACID Compliance    | `prisma.$transaction()` for all multi-table mutations | All-or-nothing guarantees                                    |

### Redis Namespacing Strategy

All keys are prefixed with `harvesthub:` to isolate from other projects sharing the same Upstash DB. The prefix is defined in ONE constant (`REDIS_KEY_PREFIX`) so migrating to a dedicated DB later requires only removing the prefix — zero code changes elsewhere.

```
harvesthub:cache:products:list:{hash}
harvesthub:cache:product:{id}
harvesthub:cache:vendor:{id}
harvesthub:cache:banners:active
harvesthub:ratelimit:{ip}
harvesthub:ratelimit:user:{userId}
harvesthub:push:sub:{userId}
```

### Cloudinary Folder Structure

Root folder: **`myharvesthub/`**

```
myharvesthub/
├── products/{vendorId}/          — Product images
├── vendors/{vendorId}/
│   ├── logo/                     — Store logo
│   └── banner/                   — Store banner
├── profiles/{userId}/            — User profile pictures
├── banners/                      — Platform promotional banners
├── ads/{userId}/                 — Sponsor/advertiser images
└── payments/{userId}/            — Proof-of-transfer uploads
```

### Safe Image Replacement Strategy

On edit operations (profile picture, store logo, product images, etc.):

1. Upload NEW image to Cloudinary
2. If upload succeeds → proceed with DB update
3. If DB update succeeds → delete OLD image from Cloudinary (fire-and-forget, log failures)
4. If DB update fails → delete NEW image (rollback), old image untouched
5. Never delete old image before confirming the full operation succeeds

---

## New Dependencies

```
# Database
prisma @prisma/client @prisma/extension-accelerate

# Cache + Rate Limiting
@upstash/redis @upstash/ratelimit

# Image Management
cloudinary

# Email
resend @react-email/components

# PWA
serwist @serwist/next @serwist/precaching @serwist/strategies

# Push Notifications
web-push @types/web-push
```

## New Environment Variables

```env
# Prisma (Accelerate)
DATABASE_URL=prisma://accelerate.prisma-data.net/...
DIRECT_URL=postgresql://...

# Upstash Redis (shared DB — all keys namespaced with harvesthub:)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudinary (root folder: myharvesthub/)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend (Email)
RESEND_API_KEY=
NEXT_PUBLIC_EMAIL_FROM=noreply@harvesthub.ng

# Web Push (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@myharvesthub.org

# Bank Account (for transfers)
NEXT_PUBLIC_BANK_NAME=
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=
NEXT_PUBLIC_BANK_ACCOUNT_NAME=

# Ad/Banner Rate
NEXT_PUBLIC_AD_DAILY_RATE=5000
```

---

## Dependency Graph

```
Stream 0 (Tech Debt)            ─── FIRST (blocks everything)
         │
         ├──► Stream 1 (Prisma/DB)    ─── FOUNDATION
         │         │
         │         ├──► Stream 2 (Redis — namespaced)
         │         ├──► Stream 6 (Availability Check)
         │         ├──► Stream 8 (Bank Transfer)
         │         ├──► Stream 9 (Vouchers)
         │         ├──► Stream 10 (Milestones)
         │         │
         │         └──► Stream 3 (Cloudinary — myharvesthub/) ──┐
         │                   │                                    │
         │                   ├──► Stream 7 (Ads)                  │
         │                   └──► Stream 11 (Store Enhancements)  │
         │                                                        │
         ├──► Stream 4 (Email)  ──── PARALLEL                     │
         │                                                        │
         └──► Stream 5 (PWA)    ──── PARALLEL                     │
```

**Execution phases:**

| Phase | Streams            | Can Parallelize                 |
| ----- | ------------------ | ------------------------------- |
| A     | 0                  | No — prerequisite               |
| B     | 1                  | No — foundation                 |
| C     | 2, 3, 4, 5         | Yes — independent of each other |
| D     | 6, 7, 8, 9, 10, 11 | Yes — all depend on B+C only    |

---

## Stream 0: Fix Existing Tech Debt

> Prerequisite for everything. Unblocks clean builds.

- [x] **0.1** Fix 12 TypeScript errors
  - [x] Fix `Address.streetAddress` → use `addressLine1`
  - [x] Fix `Order.totalAmount` → use `total`
  - [x] Fix `Vendor` flat prop access (7 errors) → access via `storeSettings.*` or add convenience aliases
  - [x] Fix `TopAdBanner` theme possibly undefined (3 errors) → add null guards
- [x] **0.2** Update Campus enum + constants
  - [x] Replace 7 Lagos-only campuses with client's 34 campuses: London, Birmingham, Glasgow, Manchester, Houston, North London, Kent, Toronto, Gbagada, Magodo, Ikorodu, Ibadan Jericho, Akobo, Apapa, Surulere, Abeokuta, Ilupeju, Yaba, Port Harcourt, Oluyole, Ogba, Anthony, Alimosho, Ikeja, Ikoyi, Isolo, Iyana Ipaja, Abule Egba, Ghana, Abuja, Lekki, Globe, Ajah, Online
  - [x] Update `CAMPUS_LOCATIONS` constant array with all 34 entries
  - [x] Update `Campus` enum to match
- [x] **0.3** Add Position enum + constants
  - [x] Create `Position` enum: `HOD`, `ASST_HOD`, `SUB_TEAM_LEADER`, `TEAM_LEAD`, `SMALL_GROUP_LEADER`, `ASST_SMALL_GROUP_LEADER`, `ZONAL_COORDINATOR`, `COMMUNITY_LEADER`, `DISTRICT_PASTOR`
  - [x] Create `POSITION_OPTIONS` constant array with label/value pairs
  - [x] Add `position` field to `Vendor` interface in `lib/types.ts`
- [x] **0.4** Update vendor registration flow
  - [x] Update `StoreInfo.tsx` — add Position selector dropdown
  - [x] Update `StoreInfo.tsx` — replace campus dropdown with new 34-campus list
  - [x] Update registration Zod schema to include `position` validation
- [x] **0.5** Update all campus/position references across codebase
  - [x] Mock data — update vendor campus values
  - [x] Vendor filter options
  - [x] Vendor profile/store-settings pages
  - [x] Admin vendor management pages
- [x] **0.6** Verify clean build with zero TS errors

---

## Stream 1: Database Layer — Prisma + PostgreSQL (Accelerate)

> Foundation. All other streams depend on this.

- [ ] **1.1** Install Prisma + dependencies
  - [ ] `npm install prisma @prisma/client @prisma/extension-accelerate`
  - [ ] `npx prisma init`
- [ ] **1.2** Create `prisma/schema.prisma`
  - [ ] User model (with `registrationSequence`, `emailVerificationToken`, `emailVerificationExpiry`)
  - [ ] Vendor model (with `campus`, `position`, `storeLogo`, `storeBanner`)
  - [ ] Buyer model
  - [ ] Product model + ProductVariant
  - [ ] Order model + OrderItem + OrderStatusHistory
  - [ ] Cart model + CartItem
  - [ ] Wallet model + Transaction
  - [ ] Review model
  - [ ] Banner model
  - [ ] Address model
  - [ ] Notification model + NotificationPreference
  - [ ] Advertisement model + AdvertiserPayment
  - [ ] Voucher model + VoucherRedemption
  - [ ] ProductAvailabilityRequest model
  - [ ] UserMilestone model
  - [ ] ProofOfTransfer model
  - [ ] PushSubscription model
  - [ ] All enums (UserRole, OrderStatus, PaymentStatus, etc.)
  - [ ] All indexes and unique constraints
  - [ ] All relations with proper cascade rules
- [ ] **1.3** Configure Prisma Accelerate
  - [ ] Set `DATABASE_URL` (prisma:// accelerate URL)
  - [ ] Set `DIRECT_URL` (direct postgres connection for migrations)
  - [ ] Configure datasource in schema
- [ ] **1.4** Create `lib/db/prisma.ts`
  - [ ] Singleton pattern with Accelerate extension
  - [ ] Global instance for dev hot-reload (`globalThis.__prisma`)
- [ ] **1.5** Run initial migration
  - [ ] `npx prisma migrate dev --name init`
  - [ ] Verify schema matches type definitions
- [ ] **1.6** Create `prisma/seed.ts`
  - [ ] Migrate mock data from `mockData.ts` to seed script
  - [ ] Maintain referential integrity
  - [ ] Configure `prisma db seed` script
- [ ] **1.7** Migrate all API routes from in-memory to Prisma
  - [ ] Auth routes (6 endpoints)
  - [ ] User routes (2 endpoints)
  - [ ] Product routes (8 endpoints)
  - [ ] Vendor routes (3 endpoints)
  - [ ] Cart routes (5 endpoints)
  - [ ] Order routes (4 endpoints)
  - [ ] Wallet routes (5 endpoints)
  - [ ] Review routes (5 endpoints)
  - [ ] Banner routes (2 endpoints)
  - [ ] Notification routes (5 endpoints)
  - [ ] Admin routes (3 endpoints)
- [ ] **1.8** Implement ACID transaction utilities
  - [ ] `lib/db/transactions.ts` — wrappers for multi-step ops
  - [ ] Order creation: cart → order → wallet debit → transaction → notification (all-or-nothing)
  - [ ] Wallet operations: balance check → debit/credit → transaction log (atomic)
  - [ ] Voucher redemption: validate → apply → increment usage (atomic)
- [ ] **1.9** Remove mock data layer
  - [ ] Delete or archive `lib/data/mockData.ts`
  - [ ] Delete or archive `lib/data/database.ts`
  - [ ] Update all imports

---

## Stream 2: Caching + Rate Limiting — Upstash Redis (Namespaced)

> Depends on: Stream 1

### Key Design: All keys prefixed `harvesthub:` for shared DB isolation

- [ ] **2.1** Install Upstash packages
  - [ ] `npm install @upstash/redis @upstash/ratelimit`
- [ ] **2.2** Create `lib/cache/redis.ts`
  - [ ] Upstash Redis singleton
  - [ ] `REDIS_KEY_PREFIX = 'harvesthub:'` constant (single source — change only this to migrate DB)
  - [ ] Typed helpers: `cacheGet<T>(key)`, `cacheSet(key, data, ttlSeconds)`, `cacheInvalidate(key)`, `cacheInvalidatePattern(pattern)`
  - [ ] All helpers auto-prepend prefix
- [ ] **2.3** Create `lib/cache/keys.ts`
  - [ ] Key factory functions (all return prefixed keys):
    - `productListKey(filterHash)` → `harvesthub:cache:products:list:{hash}`
    - `productKey(id)` → `harvesthub:cache:product:{id}`
    - `vendorKey(id)` → `harvesthub:cache:vendor:{id}`
    - `bannerKey()` → `harvesthub:cache:banners:active`
    - `userWalletKey(userId)` → `harvesthub:cache:user:{userId}:wallet`
- [ ] **2.4** Create rate limit middleware
  - [ ] `lib/middleware/rate-limit.ts`
  - [ ] `rateLimitByIP()` — public routes (60 req/min)
  - [ ] `rateLimitByUser()` — authenticated routes (120 req/min)
  - [ ] `rateLimitStrict()` — auth endpoints (10 req/5min)
  - [ ] Returns 429 with `Retry-After` header
  - [ ] Rate limit keys prefixed: `harvesthub:ratelimit:*`
- [ ] **2.5** Add caching to read-heavy API routes
  - [ ] Products list (5min TTL)
  - [ ] Product detail (10min TTL)
  - [ ] Vendor list (5min TTL)
  - [ ] Vendor detail (10min TTL)
  - [ ] Active banners (30min TTL)
  - [ ] Invalidate relevant cache on write operations
- [ ] **2.6** Apply rate limiting to all API routes
  - [ ] Auth routes — strict (10/5min)
  - [ ] Public read routes — standard (60/min by IP)
  - [ ] Authenticated routes — standard (120/min by user)
  - [ ] Upload routes — strict (20/min)

---

## Stream 3: Cloudinary — Image Management

> Depends on: Stream 1. Root folder: `myharvesthub/`

### Folder structure:

```
myharvesthub/
├── products/{vendorId}/
├── vendors/{vendorId}/logo/
├── vendors/{vendorId}/banner/
├── profiles/{userId}/
├── banners/
├── ads/{userId}/
└── payments/{userId}/
```

### Safe replacement: Upload new → DB update → delete old (only on full success)

- [ ] **3.1** Install Cloudinary SDK
  - [ ] `npm install cloudinary`
- [ ] **3.2** Create `lib/services/cloudinary.ts`
  - [ ] Configure Cloudinary instance (singleton)
  - [ ] `uploadImage(file, folder, options)` — uploads to `myharvesthub/{folder}`, returns `{ url, publicId }`
  - [ ] `deleteImage(publicId)` — safe delete with error logging (never throws)
  - [ ] `replaceImage(file, folder, oldPublicId)`:
    1. Upload new image
    2. Return `{ newUrl, newPublicId, cleanupOld: () => deleteImage(oldPublicId) }`
    3. Caller invokes `cleanupOld()` only AFTER successful DB update
  - [ ] Server-side validation: file type (jpeg/jpg/png/webp), file size (max 5MB products, 2MB profiles, 10MB banners)
  - [ ] Folder path builders: `getProductFolder(vendorId)`, `getVendorLogoFolder(vendorId)`, etc.
- [ ] **3.3** Create upload API route
  - [ ] `POST /api/upload` — authenticated, role-gated
  - [ ] Accepts: file (multipart), folder type (product/vendor-logo/vendor-banner/profile/banner/ad/payment-proof)
  - [ ] Returns: Cloudinary URL + publicId
  - [ ] Rate-limited (20 uploads/min)
- [ ] **3.4** Update vendor store settings
  - [ ] Store logo upload with preview + old image safe cleanup
  - [ ] Store banner upload with preview + old image safe cleanup
- [ ] **3.5** Update product forms
  - [ ] Multi-image upload (max 5) with drag/drop reorder
  - [ ] Main image selection
  - [ ] Old images cleaned up only after successful product update
- [ ] **3.6** Update profile pages
  - [ ] Profile picture upload with preview
  - [ ] Old picture cleanup after successful update
- [ ] **3.7** Update banner management (admin)
  - [ ] Banner image upload
  - [ ] Old image cleanup on banner update
- [ ] **3.8** Implement proof-of-transfer upload
  - [ ] Stored under `myharvesthub/payments/{userId}/`
  - [ ] Used in bank transfer payment flow (Stream 8)
- [ ] **3.9** Implement bulk cleanup utility
  - [ ] On vendor deletion: delete all images under `myharvesthub/vendors/{vendorId}/` and `myharvesthub/products/{vendorId}/`
  - [ ] On product deletion: delete all product images
  - [ ] On ad deletion: delete ad image
  - [ ] Cleanup runs as background task, logged, does not block the delete operation

---

## Stream 4: Email Service

> Independent of DB setup but needed for auth flows

- [ ] **4.1** Install Resend + React Email
  - [ ] `npm install resend @react-email/components`
- [ ] **4.2** Create `lib/services/email.ts`
  - [ ] Resend client singleton
  - [ ] `sendEmail(to, subject, template, data)` — generic sender
  - [ ] Error handling: log failures, never throw (non-blocking for most operations)
- [ ] **4.3** Create email templates (`lib/emails/`)
  - [ ] `VerifyEmail.tsx` — account verification with token link
  - [ ] `ResetPassword.tsx` — password reset link
  - [ ] `WelcomeEmail.tsx` — post-verification welcome
  - [ ] `OrderConfirmation.tsx` — order placed confirmation
  - [ ] `OrderStatusUpdate.tsx` — status change notification
  - [ ] `VendorApproval.tsx` — vendor approved/rejected
  - [ ] `AvailabilityRequest.tsx` — vendor receives availability check
  - [ ] `AvailabilityResponse.tsx` — buyer receives vendor response
  - [ ] `WithdrawalRequest.tsx` — withdrawal submitted/processed
  - [ ] `LowStockAlert.tsx` — vendor low stock warning
  - [ ] All templates: branded with HarvestHub purple, responsive, plain-text fallback
- [ ] **4.4** Add email verification flow
  - [ ] `emailVerificationToken` + `emailVerificationExpiry` fields (already in updated User model)
  - [ ] `POST /api/auth/verify-email` — validates token, marks `emailVerified: true`
  - [ ] `POST /api/auth/resend-verification` — rate limited (3/hour)
  - [ ] Block login for unverified accounts (with resend prompt)
  - [ ] Verification email sent on registration
- [ ] **4.5** Update forgot/reset password flow
  - [ ] Send reset link via Resend with secure token
  - [ ] Rate limit reset requests (3/hour)
  - [ ] Token expires in 1 hour
- [ ] **4.6** Add transactional emails
  - [ ] Order confirmation → buyer
  - [ ] Order status updates → buyer
  - [ ] Vendor approval/rejection → vendor
  - [ ] Availability request → vendor
  - [ ] Availability response → buyer
  - [ ] Withdrawal processed → vendor
- [ ] **4.7** Email preferences integration
  - [ ] Tie into existing NotificationPreference model
  - [ ] Users can opt out per category
  - [ ] Check preference before sending

---

## Stream 5: PWA — Progressive Web App

> Independent. Can start in parallel with other Phase C streams.

- [ ] **5.1** Install Serwist
  - [ ] `npm install serwist @serwist/next`
- [ ] **5.2** Create `public/manifest.json`
  - [ ] `name: "HarvestHub"`, `short_name: "HarvestHub"`
  - [ ] `theme_color: "#9333ea"`, `background_color: "#ffffff"`
  - [ ] `display: "standalone"`, `start_url: "/"`
  - [ ] Icons at: 72, 96, 128, 144, 152, 192, 384, 512px
  - [ ] `categories: ["shopping", "business"]`
- [ ] **5.3** Generate PWA icons
  - [ ] All required sizes from source logo
  - [ ] Place in `public/icons/`
- [ ] **5.4** Configure service worker (`app/sw.ts`)
  - [ ] **Static assets**: Cache-first (CSS, JS, fonts, images)
  - [ ] **Pages (HTML)**: Stale-while-revalidate (show cached, fetch fresh in background)
  - [ ] **API GET requests**: Network-first with cache fallback (product listings, vendor data)
  - [ ] **API mutations (POST/PUT/PATCH/DELETE)**: Network-only — never cache, fail with offline message
  - [ ] **Image CDN (Cloudinary)**: Cache-first with 7-day expiry
  - [ ] Precache app shell on install
- [ ] **5.5** Configure `next.config.mjs` for Serwist
  - [ ] Wrap config with `withSerwist()`
  - [ ] Set SW source and output paths
  - [ ] Disable SW in development (optional)
- [ ] **5.6** Create `OfflineNotice` component
  - [ ] Uses `navigator.onLine` + `online`/`offline` event listeners
  - [ ] **Offline state (collapsed)**: Small pill/banner at bottom — "You're offline"
  - [ ] **Offline state (expanded on tap)**: "You're currently offline. The data being displayed was last updated at [timestamp]. Some actions require an internet connection. Please try again when you're back online."
  - [ ] **Back-online state**: "You're back online!" — auto-dismisses after 4 seconds
  - [ ] Dismissable (user can close), reappears if still offline on next navigation
  - [ ] Persists `lastDataTimestamp` in sessionStorage for "last updated" display
  - [ ] Mounted in root layout, above all content, fixed position
- [ ] **5.7** Create offline-safe action wrapper
  - [ ] `lib/utils/offline.ts` — `withOnlineCheck(action, fallbackMessage?)`
  - [ ] Wraps fetch/mutation calls: if `!navigator.onLine`, show toast "You're offline. Please try this when you're connected." and prevent execution
  - [ ] Used in: checkout, cart mutations, form submissions, profile updates, wallet operations
- [ ] **5.8** Update root layout for PWA
  - [ ] Add `<link rel="manifest" href="/manifest.json">`
  - [ ] Add `<meta name="theme-color" content="#9333ea">`
  - [ ] Add `<meta name="apple-mobile-web-app-capable" content="yes">`
  - [ ] Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
  - [ ] Add apple-touch-icon links
  - [ ] Mount `<OfflineNotice />` component
- [ ] **5.9** Push notifications
  - [ ] `PushSubscription` model in DB (userId, endpoint, keys, createdAt)
  - [ ] `POST /api/push/subscribe` — store subscription
  - [ ] `POST /api/push/unsubscribe` — remove subscription
  - [ ] `lib/services/push.ts` — `sendPushNotification(userId, title, body, data)`
  - [ ] Generate VAPID keys (`web-push generate-vapid-keys`)
  - [ ] Client-side: request permission on user opt-in (not on page load)
  - [ ] Service worker `push` event handler — show notification
  - [ ] `notificationclick` handler — navigate to relevant page
  - [ ] Notification types: order updates, availability requests/responses, promotions, vendor alerts
  - [ ] Respect user NotificationPreference settings

---

## Stream 6: Product Availability Confirmation (Checkout)

> Depends on: Stream 1 (DB). UI can be started in parallel.

- [ ] **6.1** Add `ProductAvailabilityRequest` model (in Prisma schema — Stream 1.2)
  - [ ] Fields: `id`, `buyerId`, `vendorId`, `items` (JSON — [{productId, quantity, productName}]), `status` (PENDING/CONFIRMED/DECLINED/EXPIRED), `buyerNote`, `vendorResponse`, `expiresAt` (24h), `createdAt`, `respondedAt`
- [ ] **6.2** Create API routes
  - [ ] `POST /api/availability-requests` — buyer creates request (one per vendor in cart)
  - [ ] `GET /api/availability-requests` — list for buyer or vendor (role-filtered)
  - [ ] `GET /api/availability-requests/[id]` — detail
  - [ ] `PATCH /api/availability-requests/[id]` — vendor confirms/declines with response message
- [ ] **6.3** Update checkout flow
  - [ ] New step after delivery selection, before payment: "Confirm Availability"
  - [ ] Groups cart items by vendor
  - [ ] "Request Availability" button per vendor (or all at once)
  - [ ] Real-time status display per vendor (PENDING → CONFIRMED/DECLINED)
  - [ ] Proceed to payment only when ALL vendors confirm
  - [ ] Auto-expire after 24h with buyer notification
  - [ ] Allow buyer to remove declined items and proceed with confirmed ones
- [ ] **6.4** Vendor notification for availability requests
  - [ ] In-app notification (existing system)
  - [ ] Push notification (Stream 5)
  - [ ] Email notification (Stream 4)
  - [ ] Vendor dashboard: prominent "Pending Requests" section
- [ ] **6.5** Buyer notification for vendor responses
  - [ ] In-app + push + email on confirm/decline
  - [ ] Checkout page auto-updates status (polling or optimistic)

---

## Stream 7: Sponsor/Advertiser System

> Depends on: Stream 1 (DB), Stream 3 (Cloudinary for ad images under `myharvesthub/ads/`)

- [ ] **7.1** Add `Advertisement` + `AdvertiserPayment` models (in Prisma schema — Stream 1.2)
  - [ ] Advertisement: `id`, `advertiserId` (userId), `title`, `subtitle`, `ctaText`, `ctaLink`, `imageUrl`, `imagePublicId` (for Cloudinary cleanup), `status` (PENDING_PAYMENT/PENDING_APPROVAL/APPROVED/ACTIVE/EXPIRED/REJECTED), `dailyRate`, `startDate`, `endDate` (calculated), `totalPaid`, `rejectionReason`, `impressions`, `clicks`, `createdAt`
  - [ ] AdvertiserPayment: `id`, `advertisementId`, `amount`, `proofOfTransferUrl`, `proofPublicId`, `bankReference`, `status` (PENDING/VERIFIED/REJECTED), `verifiedBy`, `verifiedAt`, `createdAt`
- [ ] **7.2** Create advertiser pages
  - [ ] `app/(buyer)/advertise/page.tsx` — Landing: explain ad program, rates, CTA to submit
  - [ ] `app/(buyer)/advertise/submit/page.tsx` — Form: title, subtitle, CTA text, CTA link, image upload, desired start date, duration (days), calculated cost display, bank details for transfer, proof-of-transfer upload
  - [ ] `app/(buyer)/advertise/my-ads/page.tsx` — User's ads dashboard: list with status, impressions/clicks, renew expired ads
- [ ] **7.3** Create API routes
  - [ ] `POST /api/ads` — submit new ad
  - [ ] `GET /api/ads/my-ads` — authenticated user's ads
  - [ ] `GET /api/ads/[id]` — ad details
  - [ ] `POST /api/ads/[id]/renew` — extend expired ad (new payment)
  - [ ] `GET /api/admin/ads` — admin: list all ads with filters
  - [ ] `PATCH /api/admin/ads/[id]` — admin: approve/reject, verify payment
  - [ ] `GET /api/ads/active` — public: active ads for display
- [ ] **7.4** Create admin ad management
  - [ ] `app/admin/ads/page.tsx` — List pending/approved/active/expired ads
  - [ ] Verify proof of payment
  - [ ] Approve/reject with reason
  - [ ] Configure daily rate (platform setting)
  - [ ] View ad performance (impressions, clicks)
- [ ] **7.5** Integrate ads into display rotation
  - [ ] Active ads shown in `BannerCarousel` and/or `TopAdBanner` alongside platform banners
  - [ ] Track impressions (on view) and clicks (on CTA click)
  - [ ] Auto-expire: check `endDate < now()` on every fetch, mark as EXPIRED
  - [ ] Badge to distinguish "Sponsored" from platform banners
- [ ] **7.6** Cloudinary integration for ads
  - [ ] Ad images uploaded to `myharvesthub/ads/{userId}/`
  - [ ] Proof-of-transfer to `myharvesthub/payments/{userId}/`
  - [ ] Safe delete on ad removal/rejection (after DB update)
- [ ] **7.7** Ad expiry handling
  - [ ] On fetch: filter expired, update status
  - [ ] Optional: Vercel Cron job to batch-expire daily
  - [ ] Notification to advertiser 3 days before expiry + on expiry

---

## Stream 8: Bank Transfer Payment + Deprecate Gateways

> Depends on: Stream 1 (DB), Stream 3 (Cloudinary for proof uploads)

- [ ] **8.1** Update payment types
  - [ ] Add `BANK_TRANSFER_PROOF` to `PaymentMethod` enum
  - [ ] Deprecate `CARD`, `USSD` from active UI selection (keep in enum for backward compat)
  - [ ] Add `ProofOfTransfer` model: `id`, `orderId`, `userId`, `imageUrl`, `imagePublicId`, `bankReference`, `amount`, `status` (PENDING/VERIFIED/REJECTED), `verifiedBy`, `verifiedAt`, `createdAt`
- [ ] **8.2** Add bank account configuration
  - [ ] Constants or DB-based admin-configurable bank accounts
  - [ ] Display: bank name, account number, account name
- [ ] **8.3** Update checkout payment step
  - [ ] Show bank account details for transfer
  - [ ] Proof-of-transfer image upload (to `myharvesthub/payments/{userId}/`)
  - [ ] Bank reference field
  - [ ] Order created as `PENDING` with `paymentStatus: PENDING`
  - [ ] Wallet payment option remains (instant debit)
- [ ] **8.4** Create payment verification flow
  - [ ] Admin view: orders with pending payment proofs
  - [ ] Admin can verify/reject with notes
  - [ ] On verify: update `paymentStatus: PAID`, proceed with order
  - [ ] On reject: notify buyer, allow resubmission
  - [ ] Email + in-app notification on outcome
- [ ] **8.5** Wallet deposit via bank transfer
  - [ ] Same flow: show bank details → upload proof → admin verifies → credit wallet
  - [ ] `POST /api/wallet/deposit-request` with proof
  - [ ] Admin wallet management page
- [ ] **8.6** Clean up payment gateway references
  - [ ] Remove Paystack/Flutterwave env vars from `.env`
  - [ ] Remove from UI payment method selector
  - [ ] Keep types for future re-integration

---

## Stream 9: Discount Vouchers & Coupons

> Depends on: Stream 1 (DB)

- [ ] **9.1** Add `Voucher` + `VoucherRedemption` models (in Prisma schema — Stream 1.2)
  - [ ] Voucher: `id`, `code` (unique), `type` (PERCENTAGE/FIXED_AMOUNT/FREE_DELIVERY), `value`, `minOrderAmount`, `maxDiscount` (cap for %), `usageLimit`, `usedCount`, `perUserLimit`, `validFrom`, `validTo`, `isActive`, `applicableCategories` (JSON), `applicableVendors` (JSON), `createdBy`, `createdAt`
  - [ ] VoucherRedemption: `id`, `voucherId`, `userId`, `orderId`, `discountApplied`, `redeemedAt`
- [ ] **9.2** Create admin voucher management
  - [ ] `app/admin/vouchers/page.tsx` — CRUD for vouchers
  - [ ] Create: code (auto-generate or custom), type, value, limits, dates, restrictions
  - [ ] Bulk generate with prefix (e.g., `LAUNCH-XXXX` × 100)
  - [ ] List with usage stats, active/inactive toggle
  - [ ] View redemption history per voucher
- [ ] **9.3** Create API routes
  - [ ] `POST /api/admin/vouchers` — create voucher (admin only)
  - [ ] `GET /api/admin/vouchers` — list all vouchers (admin)
  - [ ] `PATCH /api/admin/vouchers/[id]` — update/deactivate (admin)
  - [ ] `POST /api/vouchers/validate` — buyer validates code (returns discount preview)
  - [ ] `POST /api/vouchers/redeem` — apply to order (atomic: validate + increment usage + create redemption record)
- [ ] **9.4** Update checkout flow
  - [ ] Voucher/coupon code input field in order summary
  - [ ] "Apply" button → validates → shows discount
  - [ ] Discount line item in order summary
  - [ ] Prevent double-use: check per-user limit before applying
  - [ ] Voucher code stored on Order record
- [ ] **9.5** Voucher notification
  - [ ] Admin can send push/email notification for new promotional vouchers

---

## Stream 10: User Management + Milestone Tracking

> Depends on: Stream 1 (DB)

- [ ] **10.1** Add `UserMilestone` model (in Prisma schema — Stream 1.2)
  - [ ] Fields: `id`, `userId`, `milestoneType` (enum), `label`, `achievedAt`, `metadata` (JSON)
  - [ ] Milestone types: `FIRST_1000_VENDORS`, `FIRST_1000_BUYERS`, `FIRST_PURCHASE`, `FIRST_SALE`, `FIRST_REVIEW`, `VENDOR_100_SALES`, `CUSTOM`
- [ ] **10.2** Add `registrationSequence` to User model
  - [ ] Auto-increment on creation
  - [ ] Separate sequences for vendors and buyers (or single global with role filter)
- [ ] **10.3** Implement automatic milestone triggers
  - [ ] On vendor registration: if vendor count ≤ 1000, assign `FIRST_1000_VENDORS`
  - [ ] On buyer registration: if buyer count ≤ 1000, assign `FIRST_1000_BUYERS`
  - [ ] On first purchase: assign `FIRST_PURCHASE`
  - [ ] On first sale: assign `FIRST_SALE`
  - [ ] Triggers run inside same transaction as the parent operation
- [ ] **10.4** Update admin user management
  - [ ] `app/admin/users/page.tsx` — enhanced filters:
    - Filter by registration sequence range (e.g., first 1000)
    - Filter by milestone type
    - Sort by registration date/sequence
  - [ ] Tag users with milestone badges visually
  - [ ] Export user lists (CSV) with milestone data
- [ ] **10.5** Admin milestone dashboard
  - [ ] `app/admin/milestones/page.tsx`
  - [ ] View all milestone types and counts
  - [ ] Create custom milestones
  - [ ] Assign milestones to users manually (batch or individual)
  - [ ] Export milestone reports
- [ ] **10.6** User-facing milestone display
  - [ ] Badge on user profile (e.g., "Early Adopter — #42")
  - [ ] Badge on vendor storefront if applicable

---

## Stream 11: Vendor Store Enhancements

> Depends on: Stream 1 (DB), Stream 3 (Cloudinary)

- [ ] **11.1** Update vendor storefront page layout
  - [ ] Facebook/LinkedIn-style profile layout:
    - Full-width store banner (fallback gradient if no banner)
    - Circular store logo overlapping banner bottom-left
    - Store name + campus badge + position badge
    - Verification status indicator
    - Rating + review count
    - Contact info (WhatsApp, email)
  - [ ] Tabs: Products, Reviews, About
- [ ] **11.2** Store banner + logo upload (in store-settings)
  - [ ] Banner: recommended 1200×400, max 10MB
  - [ ] Logo: square, min 200×200, max 5MB
  - [ ] Upload to `myharvesthub/vendors/{vendorId}/banner/` and `.../logo/`
  - [ ] Preview before save
  - [ ] Safe image replacement (new upload → DB update → delete old)
- [ ] **11.3** Update vendor registration flow
  - [ ] Optional banner/logo upload as part of store-info step (or sub-step)
  - [ ] Can be skipped and added later via store-settings
- [ ] **11.4** Vendor profile editing
  - [ ] Position editable from store-settings
  - [ ] Campus editable from store-settings
  - [ ] Changes update all relevant displays (storefront, admin panel, etc.)

---

## Post-Implementation Checklist

- [x] All TypeScript strict mode errors resolved (`npx tsc --noEmit` clean)
- [ ] All API routes use Prisma transactions for multi-table mutations
- [ ] All API routes have rate limiting applied
- [ ] All image uploads go through Cloudinary with safe replacement
- [ ] All Redis keys namespaced with `harvesthub:` prefix
- [ ] Email verification required for new accounts
- [ ] PWA installable with offline support
- [ ] Push notifications working with user preference respect
- [ ] Voucher system tested: create, validate, redeem, per-user limits
- [ ] Availability confirmation flow tested: request → confirm/decline → proceed
- [ ] Ad system tested: submit → payment proof → admin approval → display → expire
- [ ] Bank transfer flow tested: order → proof upload → admin verify → confirm
- [ ] Milestone tracking verified: first 1000, custom milestones
- [ ] Vendor storefront: banner + logo + campus + position displaying correctly
- [x] All 34 campuses + 9 positions available in registration + editing
- [ ] Clean production build (`npm run build`) with zero errors
- [ ] Security: no exposed secrets, no raw SQL, all inputs validated with Zod
- [ ] Performance: caching on read-heavy routes, pagination on all lists

---

## Completed API Routes & SEO (Added March 2026)

> The following routes were added to fill gaps in the existing mock API layer.

### API Routes Added

- [x] `POST /api/vendors` — Create vendor profile (admin or vendor user)
- [x] `GET/PUT /api/vendors/[id]/store-settings` — Read and update vendor store settings
- [x] `GET /api/vendors/[id]/analytics` — Vendor analytics with product/order data
- [x] `GET/PUT /api/users/[id]/profile` — User profile with role-specific enrichment
- [x] `PUT /api/users/[id]/password` — Change password (current password verification for non-admin)

### SEO Files Added

- [x] `app/sitemap.ts` — Dynamic sitemap with static pages, active products, and approved vendors
- [x] `app/robots.ts` — robots.txt disallowing private routes, linking to sitemap

### Existing API Routes (48 handlers, verified complete)

- Auth: login, register, logout, me, refresh, forgot-password, reset-password (7 routes)
- Products: list, create, get, update, delete, search, trending, featured, new-arrivals, reviews, related (11 routes)
- Cart: get, add item, update item, remove item, clear (5 routes)
- Orders: list, create, get, update, delete, status update, cancel (7 routes)
- Users: list, get, update, delete (4 routes)
- Vendors: list, get, update, products (4 routes)
- Wallet: get, balance, transactions, deposit, withdraw (5 routes)
- Reviews: list, create, get, update, delete, vote, response, flag (8 routes)
- Banners: list, create, get, update, delete, patch (6 routes)
- Notifications: list, create, delete, read, preferences, read-all (6 routes)
- Admin: reviews list, review delete, review flag (3 routes)
