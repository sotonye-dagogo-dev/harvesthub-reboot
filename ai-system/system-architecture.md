# System Architecture

> **last-updated-by: ai-system v3 upgrade (2026-08-13)
> **Overview:** MyHarvestHub is a full-stack Next.js application that blends server components, API routes, and a mock data layer to simulate a backend. The architecture is designed for incremental migration to a real database while keeping the UI and business logic stable.

---

## High-Level Architecture

- **Frontend (Next.js App Router)**
  - Routes are grouped by user role: `(auth)`, `(buyer)`, `(vendor)`, `(admin)`.
  - Pages are server components by default, with client components only when interactivity or state is required.
  - Global layout and metadata are defined in `app/layout.tsx`.

- **Backend (Mock + API Routes)**
  - `lib/data/mockData.ts` provides seeded test data.
  - `lib/data/database.ts` implements in-memory CRUD operations and enforces referential integrity.
  - API routes under `app/api/*` expose the backend to the frontend and honor JWT auth.
  - Authentication is handled via JWTs stored in httpOnly cookies.

- **Data Layer / Future Migration**
  - Prisma schema lives in `prisma/schema.prisma` (currently used for type generation and planned DB migration).
  - Seed scripts in `prisma/seed.ts` bootstrap the database.

- **State & UX**
  - Auth and theme state are managed by `providers/` (e.g., `AuthProvider`, `ThemeProvider`).
  - Complex client state (cart, wallet) uses Zustand stores in `lib/store/`.

---

## Key Boundaries & Patterns

- **Server Actions** are used for mutations where possible (Next.js App Router patterns).
- **Zod schemas** validate incoming request bodies in `app/api/*` and server actions.
- **UI components** are located under `components/` with a split between `ui/` (generic) and `features/` (domain-specific).
- **Routing protection** is implemented via role-based checks in layouts and server-side guards.

- **Payment Fallback Architecture:** A config-driven off-platform payment path exists when main payment methods (Paystack, wallet) are disabled or gateway unavailable. Customers select `BANK_TRANSFER_PROOF` at checkout, pay via bank transfer off-platform, then upload proof of payment on the order detail page. Vendors/admins verify or reject the proof via the same page, which auto-updates order payment status to PAID.

- **Sponsors & Ads Public Flow:** Public-facing marketing landing page at `/advertise` (`app/advertise/page.tsx`) explains sponsored placements, process, and policies before interested parties proceed. Content is config-driven via `advertisingConfig` in `lib/config/siteContent.ts` and admin-editable through the existing `PublicContent` system (`getPublicContentBySlug("advertise")`, `PUBLISHED` body rendered with prose styles, config fallback otherwise; managed from `components/features/PublicContentAdminPanel.tsx`). The full sponsored-application form lives at `/advertise/apply` (`app/advertise/apply/page.tsx`); the simple public form stays at `/ad-application`. Footer quick-link "Advertise With Us" points to `/advertise`. Admin banner-management routes `/operations/banners` and `/operations/ads` and their navbar/sidebar entries are preserved unchanged.

- **Banner/Ad Performance Tracking & Analytics:** Banner events (IMPRESSION / CLICK / CONVERSION) are tracked end-to-end. Client surfaces (`TopAdBanner`, `BannerCarousel` hero + modal, `HomeContent` sidebar rail) emit fire-and-forget events via `lib/tracking/bannerTracking.ts` (stable localStorage `visitorId`, `navigator.sendBeacon` with keepalive-fetch fallback, per-session impression dedupe). Events hit the public, IP-rate-limited `PATCH|POST /api/banners/[id]` endpoint, which writes a `BannerEvent` row (authenticated user resolved from session when present) and increments the matching denormalized counter on `Banner` (`impressionCount` / `clickCount` / `conversionCount`). Admin analytics read from `GET /api/admin/analytics/banners` (`days`/`bannerId` filters) and aggregate via `lib/analytics/bannerAnalytics.ts` (total/unique/authenticated/anonymous splits + CTR/CR). Admin surfaces: operations dashboard metric cards + quick action, and a "Banner & Ad Performance" section in `AnalyticsFeature.tsx` fed by `getBannerAnalyticsClient`.

- **Universal Structured Content Editor:** All no-HTML authoring (public content pages and blog posts) shares one pure section model (`lib/content/structuredSections.ts`: `SectionType` = TEXT/HERO/CALLOUT/LIST/QUOTE, `ContentSection`, `createSection`, `serializeSectionsToHtml`, `parseSectionsFromMetadata`, `buildSectionMetadata`, `stripSectionMetadata`, `sectionsToPlainText`, `htmlToFallbackSection`) and one controlled client editor (`components/features/content/StructuredContentEditor.tsx`: `sections` + `onSectionsChange`, configurable `allowedTypes`, `mediaFolderType`, `minSections`, `showMedia`, `showButtons`; reuses `ui` primitives + `openActionConfirm`/`ActionConfirmPresets`). Content is stored twice per record: a generated HTML `body` (safe, escaped, `pc-*` wrapper classes, `\n`→`<br />`) for frontend rendering, and the structured `sections` array inside `metadata` (`editorVersion: 3`, `generatedAt`, `fallbackContract`) so editors round-trip without HTML knowledge. `PublicContentAdminPanel` exposes TEXT/HERO/CALLOUT only (behavior unchanged); `BlogAdminPanel` exposes all five types and keeps SEO/featured/author/status fields, with `metadata` = custom user JSON merged over `buildSectionMetadata(sections)` (reserved keys win, sections block stripped from the editable JSON field). Legacy raw-HTML blog posts flatten to a single TEXT section on edit via `htmlToFallbackSection` — no data migration.

---

## Deployment Considerations

- The current stack targets Vercel-style deployments but is compatible with any Node.js host.
- The mock backend can be replaced with a real Prisma + PostgreSQL backend by swapping the data layer implementation.
- Environment configuration is driven by `.env` files and `process.env` values (see `.env.example`).

---

## Verification CLI (agent-verifiable behavior)

The project exposes scripts an agent can invoke to observe and verify application behavior end-to-end (engineering principle §24). Check here before reaching for a manual check:

| Command | What it proves | When to use |
|---------|---------------|-------------|
| `npm run audit:routes` | Every configured role-aware route resolves to a real page/API handler (no broken links) | After adding/renaming routes, or before a quality-gate close |
| `npm run audit:sidebar-routes` | Every sidebar/navigation entry points at an existing route | After navigation changes, or before a quality-gate close |
| `npm run audit:dead-links` | Runs both route audits together | Route/navigation hygiene pass |
| `npx tsc --noEmit` | Type safety across the codebase (strict) | After any type-affecting change |
| `npm run lint` | ESLint compliance for touched files | Before commit/close |
| `npm test` (vitest) | Unit + integration coverage for touched scopes | Before marking work complete |

When a change creates a new verification need, extend one of these scripts rather than falling back to "manual reasoning, trust me."

---

## Rollback & Undo (deployment level)

This is the "undo" instinct applied one layer up from data (§22 covers user-facing undo; this covers deployments):

- **Previous-build promotion** — Vercel-style deployments keep prior successful builds; rollback is a re-deploy of the previous version. No custom mechanism in-repo.
- **DB migration reversibility** — Prisma migrations (`prisma migrate`) are down-migratable; `prisma migrate reset` rebuilds from seed for dev only.
- **Feature-flag kill switch** — config-driven feature flags (engineering principles §1) in `lib/config/` and `.env` can disable a bad feature without a deploy where the code path honors the flag.

Known constraint: there is no in-repo CI/CD rollback script; rollback relies on the deployment platform's previous-build retention.

---

## Configuration Points

| Config Key | Purpose | Location | Default |
|-----------|---------|----------|---------|
| `ENABLE_DESIGN_VIEWER` | Mounts the dev-only design-asset viewer at `/__design/*`; must be false in production builds | .env | false |
