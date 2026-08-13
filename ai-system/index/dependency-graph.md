# Dependency Graph

> **last-updated-by:** update-ai-system.md (2026-08-11)
> **Overview:** Current high-level dependency map for MyHarvestHub after operations-route consolidation and Prisma-first runtime cleanup.

---

## Module Dependency Map

```
app/layout.tsx
  -> app/providers.tsx
    -> lib/contexts/*
    -> lib/theme/*
    -> components/ui/*

app/(operations)/operations/*
  -> components/layout/Sidebar.tsx
  -> lib/navigation.ts
  -> lib/rbac/routeConfig.ts
  -> app/api/* (domain fetch/mutation)

components/layout/Header.tsx
  -> lib/navigation.ts
  -> lib/utils/*
  -> role-aware route decisions (/orders vs /operations/orders)

app/api/*
  -> lib/api/http.ts
  -> lib/schemas/*
  -> lib/data/database.ts
  -> lib/services/*
  -> lib/rbac/* (authorization checks where required)

lib/data/database.ts
  -> lib/data/prismaAdapter.ts
  -> lib/db/prisma.ts
  -> lib/types.ts

lib/data/prismaAdapter.ts
  -> @prisma/client
  -> prisma/schema.prisma (generated types)

app/api/upload/route.ts
  -> lib/services/cloudinary.ts (upload + isAssetInFolder destroy-scope guard; DELETE /api/upload)
  -> lib/services/asset.ts
  -> lib/middleware/rate-limit.ts
  -> lib/api/http.ts

lib/utils/uploadHelpers.ts
  -> app/api/upload/route.ts (DELETE /api/upload, owner-scoped asset removal)

app/signup/components/VerificationDocs.tsx
  -> app/api/upload/route.ts (POST customRequest uploads)
  -> lib/utils/uploadHelpers.ts (deleteUploadedAsset on replace/remove)
  -> lib/utils/localDraft.ts (form-draft persistence)

app/signup/components/AccountInfo.tsx
  -> app/api/upload/route.ts (POST profile upload, scoped guestUploadId)

app/api/orders/[id]/proof-of-payment/route.ts
  -> lib/db/prisma.ts
  -> lib/utils/auth.ts
  -> lib/middleware/rate-limit.ts

app/api/orders/[id]/proof-of-payment/acknowledge/route.ts
  -> lib/db/prisma.ts
  -> lib/utils/auth.ts
  -> lib/middleware/rate-limit.ts
  -> prisma/generated/client (ProofOfTransferStatus, PaymentStatus)

app/orders/[id]/page.tsx
  -> components/ui/ImageUpload.tsx
  -> app/api/orders/[id]/proof-of-payment/*

app/advertise/page.tsx (landing page, async server component)
  -> lib/config/siteContent.ts (advertisingConfig copy)
  -> lib/data/publicContent.ts (getPublicContentBySlug("advertise"))
  -> lib/rbac/routeConfig.ts (public route policy)

app/advertise/apply/page.tsx (full sponsored-application form)
  -> components/ui/ImageUpload.tsx
  -> lib/utils/localDraft.ts
  -> lib/utils/offlineQueue.ts
  -> lib/utils/paystackInline.ts
  -> app/api/upload/route.ts
  -> app/api/ad-applications|ads/apply

app/ad-application/page.tsx (simple public application form)
  -> components/ui/ImageUpload.tsx
  -> lib/utils/localDraft.ts
  -> lib/utils/offlineQueue.ts
  -> app/api/upload/route.ts
  -> app/api/ad-applications|ads/apply

# --- Banner/Ad Performance Tracking & Analytics ---

components/features/TopAdBanner.tsx | BannerCarousel.tsx | app/components/HomeContent.tsx
  -> lib/tracking/bannerTracking.ts (beacon/keepalive event emission)
  -> app/api/banners/[id] (PATCH|POST public tracking endpoint)

app/api/banners/[id]/route.ts
  -> lib/analytics/bannerAnalytics.ts (event type guard)
  -> lib/db/prisma.ts (BannerEvent insert + Banner counter increment)
  -> lib/utils/auth.ts (getCurrentUser, optional)
  -> lib/middleware/rate-limit.ts (IP rate limit)

app/api/admin/analytics/banners/route.ts
  -> lib/analytics/bannerAnalytics.ts (aggregateBannerAnalytics)
  -> lib/db/prisma.ts (Banner + BannerEvent reads)
  -> lib/utils/auth.ts (admin gate)

components/features/AnalyticsFeature.tsx | app/api/operations/dashboard/route.ts
  -> lib/data/clientDataFetchers.ts (getBannerAnalyticsClient)
  -> app/api/admin/analytics/banners (admin analytics read)

lib/services/notifications.ts
  -> lib/services/email.ts
  -> lib/services/push.ts
  -> lib/data/database.ts

# --- Universal Structured Content Editor ---

lib/content/structuredSections.ts
  (pure module — no imports from components or client-only code)

components/features/content/StructuredContentEditor.tsx
  -> lib/content/structuredSections.ts (types, createSection, labels)
  -> components/ui/Input.tsx | Button.tsx | openActionConfirm (ActionConfirmPresets)
  -> components/ui/ImageUpload.tsx (media upload, FolderType)

components/features/PublicContentAdminPanel.tsx
  -> components/features/content/StructuredContentEditor.tsx (allowedTypes TEXT/HERO/CALLOUT)
  -> lib/content/structuredSections.ts (serialize/parse/build/htmlToFallback)
  -> app/api/admin/public-content (fetch/mutation)

components/features/blog/BlogAdminPanel.tsx
  -> components/features/content/StructuredContentEditor.tsx (allowedTypes all five)
  -> lib/content/structuredSections.ts (serialize/parse/build/strip/htmlToFallback)
  -> lib/config/blog.ts (statuses, slugify, estimateReadTime)
  -> app/api/admin/blog (fetch/mutation)
```

---

## Core Edges

- `app/*` -> `components/*`: UI composition.
- `app/*` -> `app/api/*`: client/server fetch to domain APIs.
- `app/api/*` -> `lib/*`: validation, auth checks, business logic, persistence.
- `lib/data/*` -> `lib/db/*` -> Prisma client: database access path.
- `lib/services/*` -> external providers (Cloudinary, Resend, Web Push, Paystack stubs).
- `middleware.ts` -> `lib/rbac/routeConfig.ts`: canonical route normalization + role enforcement.

---

## External Dependencies

| Package                                                                          | Purpose                                     | Used In                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `next`                                                                           | App Router framework and API runtime        | `app/`, `middleware.ts`                   |
| `react`, `react-dom`                                                             | UI runtime                                  | `app/`, `components/`                     |
| `antd`, `@ant-design/icons`                                                      | UI primitives and iconography               | `components/ui/`, feature pages           |
| `tailwindcss`                                                                    | Utility styling and token classes           | `app/_styles/`, UI components             |
| `zod`                                                                            | Request/schema validation                   | `lib/schemas/`, `app/api/*`               |
| `jose`                                                                           | JWT auth token handling                     | auth helpers and routes                   |
| `bcryptjs`                                                                       | Password hashing                            | auth/register/login handlers              |
| `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `@prisma/extension-accelerate` | ORM, schema, and DB access                  | `lib/db/`, `lib/data/`, `prisma/`         |
| `cloudinary`                                                                     | Managed media upload pipeline               | `lib/services/cloudinary.ts`, upload APIs |
| `resend`                                                                         | Transactional email transport               | `lib/services/email.ts`                   |
| `web-push`                                                                       | Browser push notifications                  | `lib/services/push.ts`                    |
| `@upstash/redis`                                                                 | Cache/invalidation and rate-related helpers | `lib/cache/*`, API endpoints              |
| `zustand`                                                                        | Client-side state stores                    | `lib/store/*`                             |
| `@serwist/next`, `serwist`                                                       | PWA/service worker integration              | `app/sw.ts`, build integration            |

---

## Drift + Risk Notes

- Historical docs referenced `(buyer)/(vendor)/(admin)` route groups, but canonical management routes now live under `app/(operations)/operations/*`.
- Avoid reintroducing raw media URL entry for upload-governed fields; upload APIs enforce managed URLs for governed flows.
- `scripts/auditSidebarRoutes.ts` must stay synchronized with `components/layout/Sidebar.tsx` data-shape changes to avoid false route-audit failures.
- Off-platform payment with proof upload: `BANK_TRANSFER_PROOF` payment method gated by `bankTransferFallbackEnabled` env var and `paymentsEnabled` DB toggle. The proof-of-payment lifecycle spans `app/api/orders/[id]/proof-of-payment/*` for upload and vendor acknowledgment, and `app/orders/[id]/page.tsx` for buyer upload UI and vendor verify/reject UI.

---

## Hotspots

- `app/api/*` breadth: many mutation surfaces with role constraints.
- `lib/rbac/routeConfig.ts`: source of truth for route scope behavior.
- `components/layout/Header.tsx` and `components/layout/Sidebar.tsx`: discoverability and scope entry points.
- `app/api/upload/route.ts`: security/rate-limit/governed upload contract.
- `prisma/generated/*`: very large generated artifacts in packed snapshots.
