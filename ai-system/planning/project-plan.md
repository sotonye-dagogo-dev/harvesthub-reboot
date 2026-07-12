# Project Plan

> **Overview:** A phased roadmap for MyHarvestHub that guides work from foundational infrastructure through core product functionality to launch readiness. Update as progress is made.

---

## Cross-Platform Account Detection (2026-05-26)

> **Section summary:** Pre-signup email check against CIS backend to detect existing accounts across Harvesters platforms, with a "Sign In Instead" prompt UI.

**Feature Objective:**
When a user enters their email during signup, check CIS to see if that email already has accounts on other platforms (Reporting System, Faith Hub, DMHicc, etc.). If matches are found, display a prompt informing the user and offering to sign in with existing credentials instead.

**Why This Is Needed:**
- Users can silently create duplicate, unlinked identities across platforms
- No existing signup flow checks for cross-platform accounts
- CIS already tracks `PlatformUserMapping` but has no pre-signup query surface

**Implementation:**
- cis_backend: `GET /api/v1/users/check-email/:email` returns `{ exists, canonicalUser, platforms[] }`
- harvesthub-reboot: `lib/services/cisCheck.ts` + `components/ui/CrossPlatformAccountPrompt.tsx`
- Check fires on email blur (800ms debounce); blocks form submission until dismissed

## Cross-Repo Feature Spec - CIS Federation Rollout (Planned 2026-05-13)

> **Section summary:** Scope-locked rollout to connect MyHarvestHub to the Canonical Identity Service through a narrow signed webhook/status contract and config-driven env plumbing.

**Feature Objective:**
Add a platform-specific CIS handshake so MyHarvestHub can report readiness, accept signed identity sync events, and expose its own integration contract without forcing a local schema rewrite in the same batch.

**Why This Is Needed:**

- The workspace now includes CIS as the canonical identity layer for multi-repo coordination.
- MyHarvestHub needs a low-risk bridge that allows discovery and future syncs without coupling to CIS-owned tables right away.
- A small, explicit webhook/status surface is easier to validate and roll forward than an all-at-once identity migration.

**Acceptance Criteria:**

- `lib/config/env.ts` understands CIS env keys and normalizes them through typed helpers.
- `GET /api/cis/status` reports app readiness, platform slug, and webhook config status.
- `POST /api/cis/webhook` verifies signed payloads with the CIS webhook secret and returns a clear acknowledgment envelope.
- Webhook processing persists identity mappings to `CisIdentity` and event history to `CisWebhookEvent` without mutating local users.
- The rollout remains additive and backward-compatible with existing auth/order/payment flows.

**Rollout Order:**

1. Add CIS env/schema plumbing.
2. Add CIS config helper plus status/webhook routes.
3. Export the CIS config from the shared config barrel.
4. Update `ai-system` task/context/architecture docs and env example.
5. Run validation for the touched files.

---

## Phase 1 — Foundation (In Progress)

> **Section summary:** Core infrastructure and platform scaffolding that enables all features.

- [x] Establish Next.js App Router with route group conventions
- [x] Adopt strict TypeScript settings and global types (`lib/types.ts`)
- [x] Configure Tailwind + Ant Design theme with purple brand palette
- [x] Build mock backend layer (`lib/data/mockData.ts`, `lib/data/database.ts`)
- [x] Implement JWT auth + httpOnly cookie flow via API routes
- [x] Establish role-based layout routing (buyer, vendor, admin)
- [x] Create core UI component library (`components/ui/`) and feature scaffolds (`components/features/`)
- [x] Add starter test setup with Vitest
- [x] Solidify CI/Dev workflow (lint, build, test scripts)
- [ ] Consolidate role-based pages into single-page-per-feature (remove /buyer, /vendor, /admin page duplication)
- [ ] Build dynamic role-aware routing provider and config-driven page rendering service
- [ ] Migrate API route permissions to policy-driven router middleware
- [x] Standardize ad-related API handlers with shared response envelope + validation
- [x] Replace ad-media URL fields with upload-driven flow and offline draft/queue resilience
- [x] De-duplicate admin/vendor shell layout via a shared role dashboard container

---

## Phase 2 — Core Features

> **Section summary:** Key product functionality needed for a minimum viable marketplace.

- [ ] Buyer product browsing, filtering, and search
- [ ] Cart management, checkout flow, and order placement
- [ ] Vendor storefront management (product CRUD, inventory)
- [ ] Wallet system (deposit, withdrawal, balance) with mock transactions
- [ ] Order management dashboard (vendor + buyer views)
- [ ] Promotional banners and campaigns
- [x] Role-based access control for routes and API endpoints

---

## Phase 3 — Secondary Features

> **Section summary:** Enhancements that improve usability and business value.

- [ ] Reviews & ratings system for products and vendors
- [ ] Delivery and pickup scheduling (church pickup, home delivery)
- [ ] Notifications system (in-app & email) and optional web push
- [ ] Caching layer for public and frequently-read content (Redis + invalidation)
- [ ] Cloud asset handling (upload metadata persistence, safe failure paths)
- [x] Analytics dashboards for vendors and admins
- [ ] Search and filtering improvements (categories, locations)

---

## Phase 4 — Quality & Polish

> **Section summary:** UX polish, reliability hardening, and readiness for scaling.

- [ ] Full test coverage for critical flows (auth, checkout, orders)
- [ ] Accessibility audit and fixes (keyboard navigation, aria labels)
- [ ] Performance profiling and bundle optimization
- [ ] Error/empty/loading states refined across the app
- [x] Core-flow design-system modernization across signup, product browsing, cart, checkout, and operations dashboard
- [ ] Email layout consistency audit and rectification across wallet, auth, vendor, order, and notification senders
- [ ] Revisit all mock-backend logic for eventual Prisma migration

## Cloud Session Feature Spec - Email Layout Consistency Audit + Rectification (Planned 2026-05-02)

> **Section summary:** Scope-locked email consistency pass to ensure every application email uses the shared branded `EmailLayout` / template components, including the generic notification fallback and any sender-specific table-based content.

**Feature Objective:**
Audit all outbound email senders and route them through the shared branded email stack so wallet, auth, vendor, notification, and order emails render with consistent structure, typography, buttons, and table styling.

**Why This Is Needed:**

- The wallet deposit notification was still falling back to plain JSX instead of the shared email templates.
- Some sender entry points bypassed the wrapper helpers even though the underlying components already existed.
- Table-based emails need to keep their structured content while still inheriting the shared branded shell.

**Acceptance Criteria:**

- All outbound emails render through `lib/emails/*` templates or wrapper helpers.
- Generic notification emails use the shared layout and support structured detail tables when metadata provides them.
- Auth reset/verification senders call the shared wrapper methods instead of ad hoc `sendEmail` payloads.
- No plain JSX email payloads remain in notification dispatch paths.

**Rollout Order:**

1. Route notification fallback through a branded generic email template.
2. Switch direct auth senders to the shared wrapper helpers.
3. Add focused regression tests for generic notification rendering and routing.
4. Update architecture/docs to record the canonical email pipeline.
5. Run validation (`vitest` touched suites, `lint`, `build`) and close out the queue item.

---

## Phase 5 — Launch Preparation

> **Section summary:** Final steps to prepare for production deployment.

- [ ] Production environment configuration (env vars, secrets)
- [ ] Security review (auth, input validation, secrets handling)
- [ ] Deployment pipeline set up (GitHub Actions or CI/CD)
- [ ] Documentation & onboarding docs complete

---

## Cloud Session Feature Spec - Paystack Inline Popup + Webhook Alias Hardening (Planned 2026-04-19)

> **Section summary:** Scope-locked payment reliability pass to avoid server-side Paystack initialization/IP-allowlist failures by shifting initialization to client inline popup and preserving webhook-driven reconciliation.

**Feature Objective:**
Move Paystack payment initialization to browser inline popup flows across checkout/wallet/ad surfaces so serverless IP restrictions no longer block initialization, while preserving current backend verification and webhook reconciliation contracts.

**Why This Is Needed:**

- Server-side Paystack initialization can fail in hosted/serverless environments due to provider IP allowlist restrictions.
- Existing flows rely on `/api/payments/initialize` for Paystack checkout handoff, creating avoidable provider-edge failures.
- Webhook signature verification and reconciliation already exist and should remain canonical for authenticity checks.
- Business requested an explicit `/api/paystack-webhook` endpoint compatibility path.

**Acceptance Criteria:**

- Client payment surfaces use Paystack inline popup initialized with configured public key.
- Payment config contract returns sanitized public key readiness value without exposing secrets.
- Existing env naming remains supported, with fallback compatibility for `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`.
- `/api/paystack-webhook` accepts POST and routes through the existing webhook signature verification + reconciliation handler.
- No unrelated API/public contract regressions on checkout/wallet/ad submission flows.

**Rollout Order:**

1. Add runtime/public-key contract support.
2. Implement reusable inline popup utility.
3. Migrate checkout, wallet, and ad payment entry points.
4. Add webhook alias endpoint.
5. Run validation and sync `ai-system` closure docs.

---

## Cloud Session Feature Spec - Top/Hero Banner Navigator Rework + Fill Behavior (Planned 2026-04-18)

> **Section summary:** Scope-locked UI refinement to remove intrusive top-banner controls, move hero controls into a compact below-image action panel, and enforce fill behavior for top/ad banner images.

**Feature Objective:**
Simplify banner UX by removing top-strip navigators entirely, relocating hero carousel controls into a thinner action panel under the hero image, and ensuring top/ad banner images fully fill containers without empty space.

**Why This Is Needed:**

- Client reports top/hero overlay navigators distort banner presentation and compete visually with imagery.
- Hero controls currently consume on-image space and increase perceived page height impact.
- Top/ad banner images should follow fixed placement guides and fill banner containers edge-to-edge.

**Acceptance Criteria:**

- Top banner shows no left/right/dot navigation controls while retaining rotation behavior.
- Hero carousel no longer overlays arrows/dots/Know More on the image; all are moved to a thin panel below the image.
- Hero panel nav and Know More controls use smaller button/text sizing to reduce vertical footprint.
- Top and ad banner images render fill-first with no empty container gaps.
- Existing banner behavior remains backward compatible (rotation, link actions, modal details).

**Rollout Order:**

1. Update top banner UI to remove navigator controls and enforce fill image strategy.
2. Refactor hero carousel to render a compact below-image action panel with nav + indicators + Know More.
3. Apply fill image strategy to ad/sidebar banner rendering and placement preview surfaces.
4. Refresh banner tests/contracts and run validation (`lint`, `build`, focused touched tests).
5. Sync `ai-system` planning/checkpoint/history and raise PR.

---

## Cloud Session Feature Spec - Design Token Compliance + Payment Initialize Diagnostics + Discount Parity (Planned 2026-04-19)

> **Section summary:** Scope-locked corrective pass to align hero control styling with semantic tokens, enforce dark-mode form-control surface parity, harden payment-initialize diagnostics for serverless/IP restrictions, and restore discounted pricing parity in cart/checkout.

**Feature Objective:**
Close user-visible UX and payment-operability gaps by ensuring design-system compliant controls, reliable dark-mode inputs, actionable Paystack initialization diagnostics, and accurate discount-aware cart/checkout totals.

**Why This Is Needed:**

- Hero action-panel nav controls still carry theme-bound styling instead of shared semantic token classes.
- Some native form controls display white backgrounds in dark mode, reducing UI consistency and readability.
- Payment initialization failures (`PAYMENT_PROVIDER_IP_NOT_ALLOWED`, SSL/TLS transport failures) need clearer serverless-aware operator guidance.
- Discounted products currently surface original pricing in cart/checkout instead of preserving original + discounted presentation and totals.

**Acceptance Criteria:**

- Hero banner prev/next nav controls use semantic DS tokens and preserve accessibility/focus behavior.
- Native `input/textarea/select` controls render DS surface/text tokens in dark mode by default.
- Payment initialize diagnostics explain serverless egress/API allowlist constraints and map SSL/TLS transport failures to provider-unavailable messaging.
- Cart and checkout display discounted line pricing with original-price strike-through when applicable.
- Order summaries include product-discount deduction and continue to apply voucher totals correctly.

**Rollout Order:**

1. Tokenize hero nav control styling.
2. Add global native-form-control dark-mode surface guard.
3. Update payment initialize error mapping and operations diagnostics copy.
4. Implement discount-aware cart state/UI parity across cart + checkout.
5. Run validation and sync `ai-system` closure docs.

---

## Cloud Session Feature Spec - WhatsApp Auth-Guard Continuation + Pickup Copy + Voucher Scope Expansion (Planned 2026-04-17)

> **Section summary:** Scope-locked implementation for authenticated WhatsApp handoff continuity, requested pickup copy replacement, and flexible voucher applicability/visibility controls.

**Feature Objective:**
Ensure WhatsApp contact redirection is auth-guarded with safe continuation through signup/email verification/login, update requested pickup copy, and expand vouchers to support configurable scope targeting (campus/category/product/vendor) plus private code-only vouchers hidden from buyer dashboards.

**Why This Is Needed:**

- Client requires a guarded and seamless WhatsApp redirect flow for unauthenticated users, including delayed/interrupted signup/verification completion paths.
- Product detail pickup copy must reflect updated business wording.
- Voucher operations need granular applicability controls and private/internal campaign vouchers that still work at checkout.

**Acceptance Criteria:**

- `/contact/whatsapp` requires authentication and safely persists continuation intent for unauthenticated users.
- After signup and successful verify-email/login completion, users resume the intended WhatsApp guard flow.
- Product detail pickup text reads: “Available at Sunday or Midweek services.”
- Admin voucher create/edit supports scope by campuses, categories, products, and vendors.
- Admin can mark voucher visibility as private (hidden from buyer voucher dashboard).
- Voucher validation enforces configured scope filters at checkout and buyer voucher dashboard excludes private vouchers.

**Rollout Order:**

1. Add redirect continuation helper and auth guard wiring in WhatsApp/login/signup/verify-email flow.
2. Apply pickup copy update.
3. Add reusable voucher scope parser/matcher utilities.
4. Extend admin voucher APIs and operations UI for scope/visibility configuration.
5. Enforce scope/visibility in buyer voucher listing and voucher validate endpoint.
6. Validate (`lint`, `build`, focused touched tests) and sync docs/PR.

---

## Cloud Session Feature Spec - Home/Product/Vendor Card Density + Footer Link Grid + Wallet Deposit Handoff (Planned 2026-04-17)

> **Section summary:** Scope-locked corrective pass for oversized product/vendor cards, footer link-section mobile layout, and wallet deposit redirect reliability to Paystack checkout.

**Feature Objective:**
Restore expected browsing density and responsive layout behavior across home rails, product/category discovery grids, and vendor discovery grids while fixing wallet deposit redirect behavior so users consistently reach Paystack checkout instead of blank pages.

**Why This Is Needed:**

- Product cards became oversized, reducing visible product density in home and discovery surfaces.
- Footer mobile layout only gridded quick-link items, not the full footer links block sections.
- Wallet deposit flow intermittently opened/left blank pages instead of reliably handing off to Paystack checkout.

**Acceptance Criteria:**

- Home product rails keep horizontal-scroll behavior while showing approximately two product cards at a time.
- Products/category discovery grid uses 3 columns on mobile/tablet and 4 columns on large screens.
- Find vendors page applies similar 3-column mobile/tablet and 4-column large-screen card density.
- Footer links block (Quick Links, Support, Contact Us) renders in a mobile grid layout instead of pure stacked sections.
- Wallet deposit initialization opens Paystack checkout directly (with safe fallback) and no longer depends on a pre-opened blank tab flow.

**Rollout Order:**

1. Restore home rail card width density.
2. Restore products discovery grid density.
3. Apply vendor discovery grid parity.
4. Grid footer links sections on mobile.
5. Stabilize wallet deposit handoff to direct Paystack open + fallback navigation.
6. Validate (`lint`, `build`, focused touched tests) and sync docs.

---

## Cloud Session Feature Spec - Production Readiness Completion (Planned 2026-04-04)

> **Section summary:** Execution spec for the cloud session to complete interrupted refactor work and deliver production-ready behavior across critical platform flows.

**Feature Objective:**
Stabilize and complete the in-progress refactor wave while implementing missing production-critical behavior across signup, account security, content configuration, operations CRUD, payment handling, and route integrity.

**Why This Is Needed:**

- Current work is interrupted with a large in-progress diff and partially complete queue items.
- Remaining hardcoded content/routes and incomplete flow wiring increase production risk.
- Signup, notification preferences, verification policies, and payment/fallback behaviors need end-to-end reliability before launch.

**Acceptance Criteria:**

- Role-aware routing is consistent and no dead links remain across header, footer, dashboards, and operations areas.
- Signup deprecates `Worker` as a user role, keeps `Member`/`Non-Member` as valid position options end-to-end, and has regression coverage for stage/state reliability.
- Users can safely change email and re-verify through a secure redirect-based flow.
- Required vs optional UI labels are schema-consistent across major forms; vendor verification enforces required ID + business registration + utility bill uploads; draft retention/restoration is universal and non-blocking.
- Vendor `businessAddress` is required at signup and remains editable post-auth in vendor settings/profile surfaces.
- Help/public content and user-visible links are config-driven and admin-editable.
- Vendor verification status rules are explicit and enforced without blocking store setup/product creation.
- Bug reporting works from submission through admin triage; operations CRUD flows are functional for key domains.
- Upload-managed flows are Cloudinary-first and no longer rely on raw screenshot/image URL entry for governed fields.
- Paystack integration path is production-ready with webhook-capable handlers; bank-transfer screenshot flow remains controlled by a feature flag fallback.
- Full quality gate passes (lint, typecheck, targeted/full tests, route audit) and `ai-system` docs are synchronized.

**Rollout Order:**

1. Stabilize existing interrupted diff + close open refactor wave gaps.
2. Fix signup/role validation defects and add tests.
3. Implement email-change + re-verification flow.
4. Apply universal form retention + schema/UI required-label alignment.
5. Complete config-driven content/navigation/help implementation.
6. Enforce settings/preferences behavior and vendor verification policy.
7. Finalize bug-report and operations CRUD reliability.
8. Harden payment integration with flagged fallback deprecation path.
9. Perform bulk cleanup and final production-readiness verification.

---

## Cloud Session Feature Spec - Exhaustive UX/Operations Closure (Planned 2026-04-05)

> **Section summary:** Follow-on execution spec built from an exhaustive read-only audit to close remaining production-readiness UX, layout, and operational workflow gaps.

**Feature Objective:**
Close the highest-risk post-adjustment gaps affecting operations usability, layout consistency, vendor workflow completion, and config-driven content behavior before final production sign-off.

**Why This Is Needed:**

- Exhaustive audit found one critical defect (duplicate operations header) and several high/medium workflow gaps still affecting role-specific usability.
- Vendor operations flow is still missing a first-class products management page despite backend CRUD capability.
- Email-change reverification and dashboard KPI wiring are only partially complete, leaving security/UX and operational visibility gaps.

**Acceptance Criteria:**

- Operations routes render a single header/footer chrome and pass regression checks for layout consistency.
- Vendors can manage their own catalog through `/operations/products` with role-safe CRUD behavior.
- Email-change verification is fully closed-loop (request -> verify -> atomic update -> re-auth-safe completion state).
- `/operations/dashboard` renders live role-scoped KPI cards and quick-action links rather than placeholder-only cards.
- `about` and `privacy` pages consume config/public-content pipeline with fallback content and admin editability.
- Core multi-context domains (`products`, `orders`, `vendors`, `wallet`, `notifications`) expose explicit role-scoped views with discoverable navigation and tested scope boundaries.
- Advertise form includes field-level guidance/help and profile surfaces expose missing church/business context fields with API parity.
- Final quality gates pass and deferred low-priority risks are explicitly documented in planning artifacts.

**Rollout Order:**

1. Fix layout duplication and confirm shared chrome behavior.
2. Implement `/operations/products` and sidebar route corrections.
3. Complete email-change reverification completion flow.
4. Wire dashboard KPI cards to live role-scoped metrics.
5. Migrate remaining static pages (`about`, `privacy`) to config/public-content.
6. Enforce cross-domain conceptual-view parity and dynamic accessibility for role-scoped domain surfaces.
7. Apply advertise/profile UX completeness updates.
8. Run full regression/route audit and finalize documentation closure.

---

## Feature Spec - Banner Integrity + Public Content Editor Redesign (Planned 2026-04-08)

> **Section summary:** Planning-only feature package requested for top-banner behavior correctness, analytics/count reliability, vendor-registration review communications, and non-technical content-editing UX.

**Implementation Status (2026-04-08):**

- Implemented: top-banner text normalization + suppression, TOP/HERO feed separation, analytics count contract hardening, vendor review visibility + email lifecycle dispatch, and structured public-content editor redesign with upload-first preview workflow.
- Validation coverage added for homepage banner composition and analytics partial-success/count behavior; feature queue items are now marked complete.

**Feature Objective:**
Stabilize user-facing banner presentation and operational metrics integrity while redesigning the public-content admin experience so non-technical administrators can confidently author, preview, and publish content using managed uploads and consistent fallback behavior.

**Why This Is Needed:**

- Top banner behavior still has edge-case regressions when text fields are empty.
- Banner placement can overlap with hero rendering in some composition states.
- Analytics counters need stronger source-of-truth validation to avoid drift from API payload changes.
- Vendor onboarding/review notifications need verified end-to-end email lifecycle checks.
- Existing public-content editing is too technical and does not provide safe guided preview and upload-first consistency.

**Architecture Impact:**

- `app/page.tsx`, banner rendering components, and banner placement/layout logic.
- Banner/public-content admin surfaces under `app/(operations)/operations/*`.
- Analytics data fetchers (`lib/data/clientDataFetchers.ts`, analytics feature modules, and relevant APIs).
- Vendor review workflow APIs and mail dispatch layers (`app/api/vendors/*`, `lib/services/email.ts`, notification services).
- Content data path (`app/api/public-content/*`, `lib/data/publicContent.ts`) and upload integration.

**Acceptance Criteria:**

- Top banner is not rendered when configured text content is empty/whitespace-only and no required media fallback is present.
- Banner placement rules prevent duplicate top-of-page rendering (top banner and hero do not stack unexpectedly).
- Operations analytics counts are validated against consistent API contract mappings with resilient partial-failure handling.
- Vendor registration review actions reliably trigger expected email notifications with audit-friendly status tracking.
- Public-content admin UX supports: page/section picker, structured editor blocks, live preview, upload-first media insertion, and publish-time fallback consistency with frontend rendering.

**UI/UX Constraints (Design-System Aligned):**

- Keep Ant Design form semantics with explicit labels/help states for non-technical users.
- Include draft-safe preview mode that mirrors published page rendering contract.
- Preserve required/optional label parity with schema validation.
- Maintain mobile-friendly editor interactions and clear success/error guidance.

**Risks and Edge Cases:**

- Empty string vs null handling may differ across content APIs and DB records.
- Banner cache invalidation may delay placement/text behavior after publish.
- Email provider transient failures can mask vendor-review communication state unless retriable and auditable.
- Structured editor schema drift can break legacy fallback rendering if migration contracts are not explicit.

**Rollout Order:**

1. Banner visibility and placement bug fixes + regression tests.
2. Analytics/count contract audit and API/client mapping hardening.
3. Vendor review + email workflow verification and lifecycle instrumentation.
4. Public-content editor redesign (structure + preview + uploads + fallback parity).
5. Full route/content regression verification and documentation sync.

---

## Feature Spec - Commerce Assurance Wave: Order-to-Payout Automation + Banner Parity + Vendor Contact Safety (Planned 2026-04-13, Reconciled 2026-04-14)

> **Section summary:** Reconciled implementation plan after stash/merge integrity audit. Phase A shipped in merged cloud commits, and Phase B has now been completed with admin-managed lifecycle configuration, multi-vendor split checkout safety, and migration-backed commerce config persistence.

**Implementation Status:**

- Phase A implemented (merged): deterministic enum-safe order status transitions, idempotent delivered payout guard, TOP banner preview/runtime parity, and guarded WhatsApp handoff route.
- Phase B implemented: buyer confirm-delivery endpoint/UI, auto-confirm scheduler, settlement release + withdrawal/reconciliation lifecycle, refund request/review lifecycle, lifecycle telemetry/notifications, vendor-card equal-height normalization, product-detail chat-with-vendor guard pointer, and safe multi-vendor checkout order splitting.
- Admin-manageable lifecycle config is now persisted via `CommerceLifecycleConfig` (`autoConfirmEnabled`, `autoConfirmHours`, `refundWindowHours`) and used by auto-confirm/refund routes.
- Migration executed: `20260414100529_add_commerce_lifecycle_config`.
- Validation status: lint + typecheck + route audits pass; full repository vitest still contains unrelated baseline failures while touched-scope suites pass.

**Feature Objective:**
Deliver a resilient commerce lifecycle that safely automates buyer confirmation fallback and downstream money movement while preserving traceability, then close frontend parity gaps for banner placement/rendering, vendor-card consistency, and vendor-contact safety.

**Why This Is Needed:**

- Phase A merged implementation initially secured deterministic status transitions and replay-safe delivered payout behavior, and this feature now closes the remaining confirmation/settlement/refund orchestration scope.
- Original planning scope explicitly required migration-aware lifecycle persistence and final schema/migration reporting.
- Client communication and release readiness require one source-of-truth documentation that distinguishes completed vs pending scope.

**Architecture Impact:**

- `app/api/orders/[id]/status/route.ts` and related tests for status transition guards and payout idempotency.
- `app/api/orders/*`, `app/api/wallet/*`, and `lib/services/payments.ts` for payment/settlement/refund lifecycle expansion.
- `components/features/BannerPlacementPreview.tsx`, `components/features/TopAdBanner.tsx`, `components/features/VendorCard.tsx`, and home composition surfaces for parity/layout contracts.
- `app/contact/whatsapp/page.tsx` and vendor profile CTA flow for off-platform safety guard + telemetry.
- `prisma/schema.prisma` + `prisma/migrations/*` for lifecycle persistence enhancements when Phase B model requires schema changes.

**Data Flow (Target End State):**

1. Buyer places order; payment verification sets canonical payment state.
2. Vendor/admin progresses order through canonical status transitions.
3. Buyer confirms delivery or scheduler auto-confirms after SLA window.
4. Confirmation triggers settlement release and payout lifecycle progression.
5. Refund requests, if any, follow controlled review/execution lifecycle with compensating ledger behavior.
6. Notification templates emit lifecycle events across in-app/email/push with inbox traceability metadata.
7. Banner and vendor card surfaces remain preview/runtime consistent and layout-stable across viewport sizes.

**UI/UX Considerations (Design-System Aligned):**

- Keep lifecycle status messaging explicit, readable, and role-aware in buyer/vendor/operations interfaces.
- Preserve guard-first interaction before external WhatsApp handoff and avoid ambiguous off-platform risk language.
- Maintain banner placement previews that accurately mirror runtime rendering behavior for TOP/HERO/SIDEBAR.
- Enforce equal-height vendor rail cards with clear truncation rules to avoid clipped critical metadata.

**Potential Risks or Edge Cases:**

- Scheduler replay/race conditions can create duplicate confirmations or release attempts without idempotent guards.
- Provider-stub verification semantics can mask production-only edge cases until gateway APIs are fully integrated.

**Schema / Migration Implications:**

- Phase A merged with no Prisma schema migration.
- Phase B added schema migration for admin lifecycle configuration persistence:
  - Model: `CommerceLifecycleConfig`
  - Migration: `20260414100529_add_commerce_lifecycle_config`
  - Enum changes: none
  - Backfill/default strategy: runtime singleton upsert with defaults (`autoConfirmEnabled=true`, `autoConfirmHours=48`, `refundWindowHours=72`) avoids explicit one-off backfill script.
- Residual risk statement: repository-wide full vitest still has pre-existing unrelated failures; touched commerce/whatsapp/product suites pass.

**Rollout Order (Reconciled):**

1. Preserve and lock delivered Phase A behavior with no regressions.
2. Maintain admin lifecycle config integrity and enforce reasonable bounds on operational values.
3. Continue payment-provider hardening for transfer/reconciliation webhooks.
4. Reduce unrelated legacy full-suite test failures to restore full green baseline.

---

## Feature Spec - Product Discovery Filter/Sort Contract Hardening (Planned 2026-04-08)

> **Section summary:** Planning package to audit and correct category-tag filtering, products-page filter/sort behavior, and single-source-of-truth config alignment for product discovery.

**Feature Objective:**
Ensure category tags and all discovery controls (search/filter/sort) consistently produce the expected product results across home and products pages, using one canonical config contract for category and query behavior.

**Why This Is Needed:**

- Home/category links currently emit URL query parameters that are not fully consumed by products-page state.
- Home links include sort query parameters (`sort=trending`, `sort=new`) but products-page logic currently does not honor sort query state.
- Category definitions and slug/value mapping are duplicated, increasing drift risk between UI tags, filters, and backend query semantics.
- Existing filter coverage is component-level, but end-to-end query-to-results behavior is under-tested.

**Architecture Impact:**

- `app/components/HomeContent.tsx` for category tags and discoverability links.
- `components/features/CategoryNav.tsx` for URL parameter generation and active state.
- `app/products/page.tsx` + `components/features/ProductsContent.tsx` for query parsing, filter/sort state hydration, and result rendering.
- `components/features/FilterSidebar.tsx` for UI filter controls and outward contract shape.
- `lib/constants/index.ts` (or extracted config module) for canonical category/sort definitions.
- `app/api/products/route.ts` and `lib/data/clientDataFetchers.ts` for query contract consistency.

**New Modules or Services Required:**

- `lib/config/productDiscovery.ts` (or equivalent): canonical definitions for category groups, URL slug mapping, supported sort keys, and default filter state.
- `lib/utils/productDiscoveryQuery.ts` (or equivalent): parse/serialize helpers for URL query params <-> filter state <-> API query payload.
- Optional: lightweight discovery-state hook in `lib/hooks` to centralize products-page query synchronization.

**Data Flow:**

1. User selects category tag or sort control on home/products surface.
2. UI writes canonical query params using shared query serializer.
3. Products page hydrates filter/sort state from URL via shared parser.
4. Products query execution applies canonical mapping (category slug -> category enum/subcategory set) and sort rules.
5. Results, active chips, and category active-state UI reflect one synchronized contract.
6. API/client query layer uses identical key set and default behavior.

**UI/UX Considerations (Design-System Aligned):**

- Keep filter/sort controls mobile-friendly and consistent with existing DS tokens and spacing.
- Ensure active category/sort state is visually explicit and keyboard accessible.
- Preserve clear empty-state messaging when strict filters return no products.
- Keep query-state behavior shareable/bookmarkable via URL without surprising resets.

**Potential Risks or Edge Cases:**

- Slug-to-enum mismatch for parent category vs product subcategory values may produce false-empty result sets.
- Mixed local filtering and API filtering can cause inconsistent pagination counts if not unified.
- Query param backward compatibility is required for previously shared links.
- Sort behavior for equal timestamps/review counts needs deterministic tie-breaking.

**Architecture Doc Updates Needed:**

- Add a product-discovery query contract note in `ai-system/system-architecture.md` under data flow.
- Add `lib/config/productDiscovery.ts` to module breakdown once implemented.

**Rollout Order:**

1. Audit and document current category/filter/sort drift points.
2. Introduce canonical discovery config + query parser/serializer.
3. Wire home tags, category nav, and products page to shared query contract.
4. Align API/client query handling and sorting semantics.
5. Add integration/regression tests and finalize docs.

---

## Feature Spec - Commerce UX Hardening + Payment Integrity + Orders Grouping + Settings Persistence (Planned 2026-04-14)

> **Section summary:** Planning package to close high-priority user-reported runtime gaps spanning checkout/payment correctness, wallet/settings reliability, order lifecycle operations, navigation discoverability, and banner/operator UX polish.

**Feature Objective:**
Stabilize end-user and operations confidence by enforcing payment-verification hard stops, complete settings persistence wiring, richer lifecycle feedback/toasts, grouped multi-vendor order traceability, and improved ad/banner/operator usability.

**Why This Is Needed:**

- Live validation reported critical payment integrity risk: provider reference not found while order still placed.
- Settings UI currently exposes controls whose persistence behavior is partial or inconsistent (notably commission settings).
- Order and wallet experiences contain visibility/actionability gaps (cancel/refund affordances, balance/action parity, grouped-order reference).
- Notification discoverability, guard copy, and header category scope need route-aware UX tightening.

**Implementation Progress (2026-04-14):**

- Completed notification tightening slice: header/hamburger/dashboard nav now expose notifications with unread badges.
- Added in-app new-notification toast signaling on fresh unread items detected during notification polling.
- Wired notification push preference save flow to browser subscribe/unsubscribe orchestration (including graceful permission-denied messaging).
- Completed Track A banner/operator UX slice: explicit sidebar rail behavior contracts, larger hero modal media preview, and inline existing-image preview in banner form.
- Completed Track H navigation/guard-copy slice: desktop categories now route-scoped to home/products and WhatsApp guard copy now enforces in-platform payment guidance.
- Delivered major Track C/E foundations: commission settings now persist via dedicated API and operations orders now use a sortable/filterable table with reasoned status updates.
- Delivered partial Track F traceability: orders listing now returns derived `orderGroupId` and grouped summary aggregates.

**Architecture Impact:**

- Checkout/payment stack (`app/checkout/page.tsx`, `app/api/orders/route.ts`, `app/api/payments/*`, `lib/services/payments.ts`) for hard verification gating and error-to-feedback mapping.
- Settings orchestration (`app/(operations)/operations/settings/page.tsx`, `app/api/admin/commission/route.ts`, `app/api/admin/commerce-config/route.ts`) for full persistence parity.
- Orders lifecycle/operations (`app/(operations)/operations/orders/page.tsx`, `app/orders/[id]/page.tsx`, `app/api/orders/[id]/status/route.ts`, `app/api/orders/[id]/cancel/route.ts`) for reasoned status transitions and actionable buyer/admin surfaces.
- Grouped multi-vendor lifecycle (`app/checkout/page.tsx`, `app/api/orders/route.ts`, order data model paths) for durable order-group identity and safe bulk operations.
- Banner/nav UX (`app/components/HomeContent.tsx`, `components/features/BannerCarousel.tsx`, `app/(operations)/operations/banners/page.tsx`, `components/layout/Header.tsx`, WhatsApp guard flow) for scroll contracts, preview clarity, and route-scoped navigation.
- Email/notification content (`lib/emails/*`, notification/nav surfaces) for styled completeness and discoverability.

**Acceptance Criteria:**

- Checkout cannot finalize orders when paystack verification fails or reference is not found.
- Wallet-insufficient and other operational failures produce immediate user-facing feedback, not console-only errors.
- Admin commission and lifecycle settings both persist and reload accurately from backend state.
- Wallet page displays correct role-appropriate balance metrics and exposes intended deposit/withdraw actions with clear restrictions.
- Operations orders use a data-table workflow with status-action notes/reasons and traceable audit history.
- Buyer order detail clearly exposes cancel/refund actions only when eligible.
- Multi-vendor checkout creates/returns durable order-group identifiers and supports grouped lifecycle operations with mixed-status safety.
- Order/lifecycle emails use styled templates and include structured summaries and order metadata.
- Header/hamburger exposes notifications entry and desktop categories strip appears only on home/products routes.
- Notification push toggle changes trigger browser subscription sync (enable/disable) instead of preference-only persistence drift.
- WhatsApp guard copy includes explicit instruction to complete payment through the platform.

**Potential Risks / Edge Cases:**

- Payment webhook/provider race conditions can conflict with synchronous verify calls without idempotent reference-state handling.
- Group bulk operations require partial-success semantics when some suborders are ineligible.
- Settings orchestration across multiple endpoints can create split-brain saves without coordinated transaction or section-level error reporting.
- Expanded toast feedback may create noise without standardized severity/throttle policy.

**Rollout Order:**

1. Payment integrity hard-stop + checkout feedback correctness.
2. Settings persistence parity and wallet balance/action correctness.
3. Orders operations data-table + reasoned status transitions + buyer cancel/refund eligibility UX.
4. Grouped multi-vendor lifecycle and bulk safety workflows.
5. Banner/operator/nav/guard UX polish and notification discoverability.
6. Email template completeness audit and lifecycle content upgrades.
7. Validation matrix, evidence capture, and `ai-system` synchronization.

---

## Feature Spec - Unified In-Memory Data Runtime + Seamless Refresh (Planned 2026-04-08)

> **Section summary:** Planning package for project-wide data loading/rendering reliability: preloaded role-accessible data, in-memory continuity, optimistic mutation sync, and low-interruption background refresh.

**Feature Summary:**
Design and roll out a unified client data runtime so user-accessible data is loaded early, kept in memory, and updated predictably with minimal visual interruption. Mutations should update UI-state and backend safely, while background DB refreshes reconcile state without blank states, unnecessary spinners, or noisy rerenders.

**Why This Is Needed:**

- Multiple pages still perform page-local fetch patterns that re-trigger cold-loading, visible emptiness, and repeated waits.
- Some flows experience transient DB connection errors (`connection closed`) even after prior successful data load.
- Refresh behavior can show loading indicators even when payloads are unchanged, creating UX jitter.
- Data comparison and refresh orchestration are inconsistent across pages.

**Architecture Impact:**

- `lib/hooks/useSmartResource.ts` (existing) will evolve into a shared runtime surface instead of isolated page usage.
- New runtime modules under `lib/data-runtime/*` (resource registry, cache policy, refresh scheduler, mutation coordinator, reconciler).
- App bootstrap/provider layer in `app/providers.tsx` for role-aware warm-up loading and hydration.
- Existing client fetchers in `lib/data/clientDataFetchers.ts` and selected API consumers across `app/*` and `components/*`.
- Optional event-stream integration boundary for future RxJS channels (without hard coupling initial rollout).

**New Modules or Services Required:**

- `lib/data-runtime/resourceRegistry.ts`: declarative resource map (key, fetcher, scope, stale/ttl policy).
- `lib/data-runtime/runtimeConfig.ts`: config-driven policy defaults (retry, backoff, spinner thresholds, compare strategy).
- `lib/data-runtime/runtimeStore.ts`: in-memory state graph (resources, status flags, timestamps, in-flight ops).
- `lib/data-runtime/mutationCoordinator.ts`: optimistic update + rollback + DB commit reconciliation.
- `lib/data-runtime/reconciler.ts`: payload comparison/merge pipeline for silent refresh and non-disruptive updates.
- `lib/data-runtime/prefetch.ts`: role/context-aware initial warm-up loader for accessible resources.
- `lib/data-runtime/telemetry.ts`: lightweight instrumentation for load latency, refresh churn, and retry/error rates.

**Data Flow:**

1. App bootstrap resolves auth/role context.
2. Prefetch layer loads role-accessible resources into runtime store (warm start).
3. UI components subscribe to runtime resources (not page-local cold fetch by default).
4. User-triggered mutations apply optimistic in-memory change and dispatch backend request.
5. On backend success, reconciler confirms/normalizes resource state; on failure, rollback + user-safe error feedback.
6. Background refresh scheduler pulls DB snapshots on policy intervals or explicit triggers.
7. Compare/merge step suppresses no-op UI updates when payload is semantically unchanged.
8. Loading indicators only surface when stale/no-data thresholds are crossed; otherwise refresh remains silent.

**UI/UX Considerations (Design-System Aligned):**

- Preserve existing page content during refresh whenever valid cached data exists.
- Use DS loaders (`PageLoader`, `SectionLoader`, skeletons) only for true cold/empty states.
- Provide subtle, non-blocking refresh cues (timestamp/badge) for background sync activity.
- Keep destructive/loading states scoped to affected controls, not full-page flicker.

**Potential Risks or Edge Cases:**

- Over-prefetching can inflate initial payload and memory usage if role/scope boundaries are not strict.
- Incorrect compare semantics can suppress legitimate updates or cause stale UI.
- Optimistic updates across relational datasets can drift without deterministic reconciliation contracts.
- Retry loops on transient connection errors can degrade UX if backoff/circuit-breaker policy is weak.
- Mixed legacy fetch patterns and new runtime subscriptions can create inconsistent state sources during migration.

**Architecture Doc Updates Needed:**

- Add a dedicated "Unified Data Runtime Flow" section to `ai-system/system-architecture.md`.
- Extend module breakdown to include `lib/data-runtime/*` runtime services.
- Add migration guidance for retiring page-local ad hoc fetch patterns in favor of registry-driven resource access.

**Implementation Approach Decision (Planning):**

- Primary rollout uses existing Zustand-compatible ecosystem and extends current smart-resource patterns to a centralized runtime.
- Redux Toolkit and RxJS were considered; introduce adapter boundaries so either can be added incrementally where justified (for example, high-frequency streaming domains), but avoid immediate full-stack rewrite risk.

**Rollout Order:**

1. Define runtime architecture contracts and resource registry.
2. Implement core runtime store/reconciler/mutation coordinator.
3. Add role-aware warm-start prefetch during app bootstrap.
4. Migrate highest-latency/high-churn pages first (operations + core buyer flows).
5. Add telemetry + guardrails for refresh churn and connection error retries.
6. Expand migration coverage and retire legacy page-local fetch anti-patterns.
7. Validate full regression matrix and finalize documentation.

---

## Feature Spec - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning (Planned 2026-04-09)

> **Section summary:** Planning package to make notifications discoverable and trustworthy: expose a real inbox route, enforce truthful toggle behavior, and reduce noisy global processing indicators and refresh churn.

**Feature Summary:**
Create a clear, user-facing notification inbox experience that matches email/push/in-app delivery expectations, fix preference toggles so UI behavior matches backend reality, and tune runtime activity messaging so background refresh does not constantly interrupt users with repetitive processing copy.

**Why This Is Needed:**

- `/notifications` currently renders preferences instead of an inbox timeline, despite existing notification CRUD APIs and existing bell/drawer components.
- Preference toggles appear editable but are collapsed into coarse backend flags (`orderUpdates`, `promotions`) and mandatory channels, creating misleading UX when values rebound.
- Runtime/background refresh cadence and global in-flight messaging can surface frequent `Processing... task N` copy that feels noisy and non-actionable.
- User requirement is to avoid Prisma schema migration in this pass unless absolutely required.

**Architecture Impact:**

- `app/notifications/page.tsx` and `app/notifications/settings/page.tsx` route semantics and dashboard-shell behavior.
- `components/features/NotificationDrawer.tsx`, `components/features/NotificationBell.tsx`, and new inbox-page composition surface.
- `components/features/NotificationPreferences.tsx` plus `app/api/notifications/preferences/route.ts` contract mapping.
- `lib/contexts/NotificationContext.tsx` polling cadence and explicit user-triggered refresh behavior.
- `lib/services/notifications.ts` to introduce config-driven template resolution and cross-channel payload shaping.
- `app/providers.tsx` runtime activity notifier copy/threshold behavior.
- `lib/config/runtime.ts` and runtime resource policy usage where interval defaults are currently too eager.

**New Modules or Services Required:**

- `lib/config/notificationTemplates.ts`: canonical per-notification-type template configuration (title/body variants, CTA labels, optional preview/media hints, priority).
- `lib/services/notificationTemplateResolver.ts`: context-aware resolver using user profile/status/audit timestamps to generate channel-safe content.
- `components/features/NotificationInbox.tsx` (or equivalent): full-page inbox timeline reusing existing mark-read/delete/filter patterns.
- Optional `lib/config/runtimeActivityCopy.ts` (or in-place config) for threshold-based global status labels.

**Data Flow:**

1. Domain events call `dispatchNotification` with `type`, user target, and metadata.
2. Template resolver derives per-channel message content (in-app/email/push) from config + contextual state (signup date, verification transitions, ad/content status, order/payment timeline).
3. Existing in-app persistence path remains source-of-truth (`notification` table) with no schema migration in this feature pass.
4. Inbox page (`/notifications`) reads notifications via API/runtime context, supports read/unread filters, mark-all-read, and CTA navigation.
5. Settings page (`/notifications/settings`) manages preferences with explicit lock-state semantics for mandatory channels.
6. Runtime activity notifier emits calmer threshold-based copy and suppresses short/background-only churn.

**UI/UX Considerations (Design-System Aligned):**

- `/notifications` should be a first-class inbox timeline page, not a settings-only surface.
- Keep `/notifications/settings` as dedicated preferences management with explicit editable vs enforced controls.
- Use lock/tooltip/info copy for non-editable mandatory switches to avoid false affordances.
- Support richer cards where needed (status icon, optional image preview, CTA button) without breaking compact list readability.
- Replace raw task-count copy with human phrasing tiers (for example: `Just a moment`, `Almost there`, `This might take a while`).
- Prefer manual refresh plus long idle refresh thresholds (5-10 min) over aggressive interval polling.

**Potential Risks or Edge Cases:**

- Template drift across in-app/email/push can create inconsistent user messaging if config ownership is unclear.
- Mandatory-channel enforcement must remain explicit to avoid compliance/security regressions.
- Reducing auto refresh too far can leave stale unread counts unless manual refresh affordances are prominent.
- Existing `NotificationBell` local fetch state and context-based notifications can diverge if not consolidated.

**Architecture Doc Updates Needed:**

- Add `Notification Inbox + Template Resolver Flow` to `ai-system/system-architecture.md`.
- Update module breakdown for new notification template config/resolver modules and inbox feature surface.
- Update runtime flow notes to distinguish user-triggered refresh from low-priority background refresh and describe global notifier suppression thresholds.

**Rollout Order:**

1. Normalize route intent (`/notifications` inbox, `/notifications/settings` preferences) and navigation entry points.
2. Implement inbox page composition using existing API/context primitives.
3. Add config-driven template resolver and connect it to notification dispatch.
4. Refactor preferences mapping so toggles persist truthfully with lock-state UX for enforced channels.
5. Tune runtime/notification refresh cadence and global processing copy/threshold logic.
6. Add regression tests and run targeted validation matrix.
7. Sync architecture/repair/decision/checkpoint artifacts.

---

## Feature Spec - Paystack Confirmation Reliability + Cross-Flow Payment Feedback (Planned 2026-04-22)

> **Section summary:** Planning package to resolve Paystack success-without-platform-update failures caused by server-side verify reachability limits, and to standardize in-flight/redirect/error feedback across wallet, checkout, and ad-payment flows.

**Feature Summary:**
Harden payment completion reliability by introducing a webhook-aware confirmation strategy that survives server-side Paystack verify/IP allowlist failures, while delivering consistent user-visible feedback states (`redirecting`, `verifying`, `pending confirmation`, `failed`) across all Paystack entry points.

**Why This Is Needed:**

- Users can complete payment in Paystack and still see platform-side failure due to verification call constraints (`Your IP address is not allowed to make this call`).
- Current inline flow removes initialization IP dependence but still hard-blocks on immediate server-side verification for completion.
- Wallet/checkout/ad surfaces do not consistently show actionable toasts for in-flight redirect/verification failure states.
- Webhook route currently appends audit metadata and updates pending transaction status, but does not fully cover domain finalization parity for every payment domain.

**Architecture Impact:**

- Client payment surfaces:
  - `app/wallet/page.tsx`
  - `app/checkout/page.tsx`
  - `app/advertise/page.tsx`
  - `app/ad-application/page.tsx`
- Payment verification and domain mutation routes:
  - `app/api/wallet/deposit/route.ts`
  - `app/api/orders/route.ts`
  - `lib/services/adApplicationSubmission.ts`
  - `app/api/payments/verify/route.ts`
- Provider integration and status mapping:
  - `lib/services/payments.ts`
  - `lib/config/payments.ts`
- Webhook reconciliation path:
  - `app/api/payments/webhook/route.ts`
  - `app/api/paystack-webhook/route.ts`

**New Modules or Services Required:**

- `lib/services/paymentConfirmation.ts` (shared confirmation policy for `SUCCESS`, `FAILED`, `PENDING_CONFIRMATION`, `GATEWAY_UNAVAILABLE`).
- `lib/config/paymentFeedback.ts` (shared user-safe copy map for redirecting/verifying/pending/failure toasts).
- `lib/services/paymentReconciliation.ts` (domain finalization hooks invoked from webhook for wallet/order/ad domains, idempotent by reference).

**Data Flow (Target):**

1. User starts card payment from wallet/checkout/ad flow.
2. Client emits immediate in-flight feedback (`Redirecting to secure payment...`) before opening Paystack inline popup.
3. Paystack callback returns reference to client and client submits to domain API route.
4. Domain API attempts synchronous verify.
5. If verify is `SUCCESS`, domain commits immediately.
6. If verify is transport/IP-gated but gateway event is expected, route persists safe pending confirmation state and returns accepted/pending response (not silent failure).
7. Webhook `charge.success` reconciles by reference and finalizes domain state idempotently (wallet credit, order payment state transition, ad-application status transition).
8. Client surfaces deterministic success/failure/pending feedback and provides retry/refresh actions.

**UI/UX Considerations (Design-System Aligned):**

- All Paystack entry points must show a pre-open toast: `Redirecting to secure payment...`.
- Replace generic popup-close and verification errors with mapped, user-safe copy and explicit next step.
- When confirmation is pending, show neutral status with retry/refresh CTA instead of terminal failure.
- Keep toast semantics consistent with DS status intent (`info`, `success`, `warning`, `error`) and avoid duplicate stacked notifications.

**Potential Risks / Edge Cases:**

- Duplicate finalization if webhook and synchronous verify both succeed without idempotent guards.
- Amount/currency mismatch handling must remain strict even when fallback confirmation is used.
- Pending confirmations can become stale without timeout/reconciliation policy.
- Existing references that use legacy callback expectations may require compatibility handling.

**Architecture Doc Updates Needed:**

- Add `Payment Confirmation Fallback Flow (Inline + Webhook Reconciliation)` in `ai-system/system-architecture.md`.
- Extend module breakdown to include shared payment confirmation/reconciliation services.
- Update payment verification flow section to distinguish synchronous success path from webhook-driven fallback path.

**Rollout Order:**

1. Add shared payment confirmation state model and error-copy map.
2. Add consistent client toasts (`redirecting`, `verifying`, `pending`, `failed`) across wallet/checkout/ad pages.
3. Implement pending-confirmation acceptance path in wallet/order/ad server routes.
4. Expand webhook reconciliation to finalize domain outcomes idempotently by reference.
5. Add observability and admin diagnostics for pending/failed/success confirmation transitions.
6. Run focused regression suite for wallet, checkout, ads, verify, and webhook idempotency paths.
7. Sync queue/checkpoints/history/architecture artifacts.

## Feature Spec - Ads/Wallet UX Reliability + Payment Initialize Hardening + WhatsApp Intent + Metadata Parity (Planned 2026-04-16)

> **Section summary:** Planning package for cloud-session single-pass delivery of ad/banner duplication prevention, sidebar rail overflow safety + motion, wallet action containment, Paystack initialize hardening, vendor chat intent improvements, dynamic metadata parity, and home vendor-card redesign.

**Feature Summary:**
Deliver a non-breaking reliability and UX correction wave that hardens ad/banner submission flows against duplicate writes, fixes sidebar-rail containment/scroll behavior across breakpoints, prevents wallet action overflow, improves payment initialize diagnostics for Paystack upstream failures, upgrades vendor chat intent payloads, audits dynamic metadata parity, and redesigns vendor cards for stable layout and readability.

**Why This Is Needed:**

- Duplicate writes can occur during banner create/edit and ad submission paths due repeated user triggers and overlapping endpoint surfaces.
- Sidebar ad rail can exceed parent bounds and lacks robust desktop/mobile overflow behavior under dense content.
- Wallet action row can overflow desktop container in specific viewport widths.
- Payment initialize can fail quickly with provider message (`Your IP address is not allowed to make this call`) and currently lacks user-safe, operator-actionable classification.
- Product/vendor chat handoff currently lacks origin-aware prefilled intent text + canonical source URL payload.
- Product page "Chat with vendor" affordance should visually include WhatsApp iconography in expected brand color.
- Dynamic pages need verified title/description/image/url metadata parity with safe fallbacks.
- Home vendor cards show clipping/stacking inconsistencies and require a fixed, reusable layout contract.

**Architecture Impact:**

- Ad/banner mutation paths:
  - `app/api/banners/route.ts`
  - `app/api/banners/[id]/route.ts`
  - `app/api/ad-applications/route.ts`
  - `app/api/ads/apply/route.ts`
  - `app/(operations)/operations/banners/page.tsx`
  - `app/advertise/page.tsx`
  - `app/ad-application/page.tsx`
- Home banner and vendor presentation:
  - `app/components/HomeContent.tsx`
  - `components/features/VendorCard.tsx`
  - `components/features/BannerCarousel.tsx` (if rail motion helpers are shared)
- Vendor chat intent + guard routing:
  - `app/products/[id]/page.tsx`
  - `app/vendors/[id]/page.tsx`
  - `app/contact/whatsapp/page.tsx`
  - `app/api/telemetry/off-platform-contact/route.ts` (if payload contract evolves)
- Dynamic metadata generation audit:
  - `app/products/[id]/page.tsx`
  - `app/vendors/[id]/page.tsx`
  - any other dynamic listing/detail pages with route params.
- Wallet UI containment:
  - `app/wallet/page.tsx`
- Payment initialize + gateway diagnostics:
  - `app/api/payments/initialize/route.ts`
  - `lib/services/payments.ts`
  - optional operations diagnostics surfacing in settings/payments panel.

**New Modules or Services Required (preferred):**

- `lib/config/adRail.ts` for desktop/mobile rail dimensions, gap tokens, max-height, motion interval, pause behavior.
- `lib/utils/idempotency.ts` (or route-local equivalent) for request-key generation + duplicate suppression strategy.
- `lib/utils/autoScrollRail.ts` (or component hook) to support safe auto-scroll with hover/touch pause and manual override.
- `lib/config/paymentErrors.ts` to map provider errors (including IP restrictions) to stable app-level codes/messages.
- `lib/utils/whatsappIntent.ts` for origin-aware prefilled message + URL composition (`product`, `vendor`, fallback).
- `lib/seo/dynamicMetadata.ts` for shared dynamic metadata builder with Open Graph/Twitter + safe fallback mapping.

**Data Flow:**

1. User submits banner/ad mutation from operations or public forms.
2. Client includes request guard metadata (idempotency key / submission fingerprint) and disables repeat-submit while in-flight.
3. API mutation path validates dedupe window and either commits once or returns idempotent replay-safe response.
4. Home sidebar rail renders bounded cards from active sidebar banners using config-driven overflow/motion policy.
5. Desktop rail scrolls vertically within container bounds; mobile rail scrolls horizontally with manual + optional auto motion.
6. Wallet action row renders in constrained responsive container with no button escape.
7. Product/vendor chat CTA builds context-aware WhatsApp intent text and canonical source URL before routing through guard page.
8. Dynamic page metadata is generated from entity fields (name, description, image/logo, canonical URL) with safe fallbacks.
9. Payment initialize failures are classified into user-safe API errors with actionable operator diagnostics.

**UI/UX Considerations (Design-System Aligned):**

- Keep ad-rail behavior intentional and accessible: pause motion on hover/focus/touch-hold; never hijack click/tap navigation.
- Reduce desktop sidebar tile gap to client-approved compact spacing using DS tokens, not ad hoc values.
- Product chat CTA should include clear WhatsApp iconography in expected green brand tone.
- Prefilled WhatsApp messages should read naturally and include source-aware context + URL.
- Vendor card contract:
  - smaller logo,
  - store name beside logo,
  - smaller verification badge below name,
  - full-width secondary info block under header,
  - fixed-height card sections and text ellipsis/clamp.
- Wallet action buttons must remain fully visible in desktop and narrow tablet widths.

**Potential Risks or Edge Cases:**

- Over-aggressive duplicate suppression can block legitimate rapid edits if idempotency window is too broad.
- Auto-scroll can fight user interaction without strict pause/resume and pointer-safe handling.
- Provider error mapping can leak sensitive payload details if not sanitized.
- Long or malformed entity text can degrade prefilled WhatsApp message quality without normalization/clamping.
- Missing dynamic metadata fields can produce weak social previews without fallback hierarchy.
- Divergent behavior between `/api/ad-applications` and `/api/ads/apply` can reintroduce duplication unless contracts are unified.

**Architecture Doc Updates Needed:**

- Add a dedicated `Ad/Banner Idempotent Mutation Flow` note in `ai-system/system-architecture.md`.
- Extend home banner composition flow with explicit sidebar overflow + motion contract.
- Add payment initialize error taxonomy note for operator diagnostics and user-safe feedback.
- Add `Context-Aware WhatsApp Intent Flow` note for product/vendor origin payload composition.
- Add `Dynamic Metadata Parity Flow` note for entity-backed title/description/image/url with fallback order.

**Rollout Order:**

1. Mutation dedupe/idempotency contracts for banner/ad creation/edit/submission.
2. Sidebar rail overflow contract + responsive scrolling + optional auto motion safeguards.
3. Wallet action-row containment fixes.
4. Payment initialize error classification + diagnostics hardening.
5. Product/vendor chat intent payload + WhatsApp icon consistency.
6. Dynamic metadata parity audit and targeted hardening for dynamic pages.
7. Vendor card redesign and fixed-dimension consistency.
8. Focused tests + lint/typecheck + docs sync.

---

## Feature Spec - Placement-Aware Upload Validation + Responsive Header Search (Planned 2026-04-15)

> **Section summary:** Planning package for two user-facing upgrades: non-blocking upload-time placement-ratio warnings for banner/sponsored creatives, and a fully functional navbar search experience with live suggestions + recent searches across screen sizes.

**Feature Summary:**
Add hard validation logic at upload time that checks image dimensions against selected placement contracts (`TOP`, `HERO`, `SIDEBAR`) and warns users when ratios do not match expected guidance. In parallel, replace the current static header search input with a production-ready interactive search dropdown that shows live suggestions and recent searches in a responsive, accessible layout.

**Why This Is Needed:**

- Banner/ad uploads currently accept images without placement-fit feedback, increasing the chance of letterboxing/cropping in runtime slots.
- Header search is currently a non-functional static input, while users expect immediate suggestions and recent-search shortcuts.
- Existing search behavior is split between multiple components, creating drift and inconsistent UX.

**Architecture Impact:**

- `components/ui/ImageUpload.tsx` upload callback contract and UI warning rendering.
- `lib/constants/index.ts` (`AD_BANNER_DIMENSIONS`) and new placement-validation utility contracts.
- Banner/sponsored forms:
  - `app/(operations)/operations/banners/page.tsx`
  - `app/advertise/page.tsx`
  - `app/ad-application/page.tsx`
- Navbar/search surfaces:
  - `components/layout/Header.tsx`
  - `components/features/SearchBar.tsx`
  - `components/features/AdvancedSearchBar.tsx` (merge/deprecate path)
- Suggestion data source contract:
  - `app/api/products/search/route.ts`
  - `lib/data/clientDataFetchers.ts`

**New Modules or Services Required:**

- `lib/utils/bannerPlacementValidation.ts`: reusable ratio validation helpers and warning message builders.
- Optional `lib/config/search.ts`: shared constants for debounce delay, max suggestions, and recent-history limit.
- Optional `components/features/HeaderSearch.tsx`: dedicated responsive search composition used by header.

**Data Flow:**

1. User selects placement and uploads ad/banner image.
2. `/api/upload` returns image metadata (`width`, `height`, `format`) with URL/publicId.
3. Client compares uploaded ratio to selected placement ratio from `AD_BANNER_DIMENSIONS` via shared validator.
4. If out-of-tolerance, UI shows a non-blocking warning (upload remains successful).
5. User can keep image or re-upload for a closer ratio fit.

6. User types in header search.
7. Debounced query requests live suggestions from product search API.
8. Dropdown renders suggestion list + recent searches from localStorage.
9. User selects suggestion/recent item or submits query.
10. Navigation goes to canonical discovery route (`/products?search=...`) and query is saved to recent history.

**UI/UX Considerations (Design-System Aligned):**

- Warning UX for ratio mismatch must be explicit but non-blocking, with clear expected-vs-actual ratio copy.
- Reuse shared dimensions guidance text so warning language matches guidance cards exactly.
- Search dropdown should include loading/empty/error states, hover/focus states, and keyboard accessibility.
- Responsive behavior must preserve readability at mobile widths (320px+) and avoid overlap with nav controls.
- Maintain consistent token usage for borders, surfaces, shadow, spacing, and text hierarchy.

**Potential Risks or Edge Cases:**

- Upload metadata may be missing for unsupported files; validator must fail gracefully without crashing form flow.
- Overly strict ratio tolerance can produce noisy warnings for acceptable creatives.
- Multiple search implementations can diverge if not consolidated into one shared contract.
- Rapid typing can cause stale suggestion responses; requests must be debounced and response-race safe.
- localStorage access must be guarded for SSR and malformed history payloads.

**Architecture Doc Updates Needed:**

- Add a `Banner Upload Placement Validation Flow` to `ai-system/system-architecture.md`.
- Add a `Header Search Suggestion + Recent History Flow` to `ai-system/system-architecture.md`.
- Update module breakdown for `bannerPlacementValidation` utility and whichever shared header-search component is adopted.

**Rollout Order:**

1. Define placement validator utility + upload metadata contract updates.
2. Integrate warn-only validation into operations banners + sponsored forms.
3. Consolidate search components and wire functional header search in desktop/mobile layouts.
4. Add focused tests for validator, upload warnings, and header search interactions.
5. Run touched-scope validation and sync architecture/checkpoint/history artifacts.

---

## Completed

---

## Feature Spec - Cart State Reconciliation + Sidebar Overflow Guard + WhatsApp/Wallet Handoff Reliability (Planned 2026-04-16)

> **Section summary:** One-pass reliability closure for cart freshness, checkout pre-payment safety, sidebar containment, WhatsApp guard redirect continuity, and wallet deposit handoff.

**Feature summary:**
Ensure cart and checkout surfaces reconcile against current product reality, prevent sidebar rail overflow on standard desktop widths, restore WhatsApp guard redirection, and make wallet deposit payment handoff reliable.

**Architecture impact:**

- `lib/store/cartStore.ts` for reusable cart/catalog reconciliation.
- `app/cart/page.tsx` and `app/checkout/page.tsx` for in-memory runtime reconciliation and checkout pre-payment refresh guard.
- `app/components/HomeContent.tsx` for sidebar rail width/overflow containment.
- `app/contact/whatsapp/page.tsx` for redirect behavior after guard acknowledgement.
- `app/wallet/page.tsx` for robust payment-window handoff behavior in deposit initialization.

**New modules/services required:**

- None. Reuse existing cart store + runtime data (`home:products`) + existing payment/WhatsApp routes.

**Data flow:**

1. Buyer navigates to cart/checkout with persisted cart state.
2. Cart items reconcile against runtime product cache (`home:products`) and clamp/remove stale/unavailable entries.
3. On checkout action, live product snapshots are fetched right before payment/order processing and cart is reconciled again.
4. If drift is detected, checkout pauses and buyer reviews updated totals/items before continuing.
5. Card deposit/WhatsApp handoff uses redirect-safe navigation path that does not depend on popup timing after async work.

**UI/UX considerations (design-system aligned):**

- Keep user messaging concise and actionable when cart changes are applied.
- Preserve existing card, modal, and action-button visual contracts.
- Ensure sidebar rail remains bounded within parent grid columns without creating horizontal page overflow.

**Potential risks/edge cases:**

- Product fetch failures during preflight should not falsely clear carts.
- Runtime refresh cadence can re-trigger cart reconciliation; notifications must remain non-spammy.
- Popup blockers may still prevent new-tab behavior; same-tab fallback must preserve completion path.

**Architecture doc updates needed:**

- Add reconciliation note to architecture docs only if cart lifecycle contract is formally documented there in this pass.

---

## Feature Spec - Home/Discovery/Voucher Restoration + Deals Foundation + Product Detail Expansion + Table Standardization (Planned 2026-04-17)

> **Section summary:** Planning package for homepage layout corrections, discovery/search expansion with campus indexing, voucher/coupon lifecycle restoration, trending/deals confirmation, product detail enrichment, and reusable table standardization.

**Feature summary:**
Deliver a tightly scoped reliability and UX restoration wave across buyer and operations surfaces by fixing sidebar and product-card layout regressions, extending search to campus-aware discovery, restoring vouchers/coupons end-to-end, confirming and hardening the trending algorithm with deals foundations, enriching product detail context, and eliminating overflow-prone non-standard tables.

**Why this is needed:**

- Home desktop sidebar rail can visually exceed hero bounds and tile sizing still feels oversized in dense ad scenarios.
- Some product-listing surfaces are rendering card layouts inconsistently (single-card full-width behavior instead of expected grid density).
- Search currently does not fully leverage campus index in API and query/filter surfaces.
- Voucher/coupon backend artifacts exist but checkout/public/admin end-to-end UX is incomplete and not fully operational.
- Trending logic currently relies on a narrow metric (sales/review slices) and lacks a dedicated deals-ready contract for discounted limited-time products.
- Product detail page needs stronger buyer confidence context (vendor stats, policy info, similar products context richness).
- Multiple operations tables still use ad hoc/Ant table implementations that create horizontal overflow and inconsistent behavior.

**Architecture impact:**

- Home/discovery UI:
  - `app/components/HomeContent.tsx`
  - `components/features/ProductsContent.tsx`
  - `components/features/ProductCard.tsx` and related list wrappers
  - `lib/config/adRail.ts`
- Search/campus indexing:
  - `app/api/products/route.ts`
  - `app/api/products/search/route.ts`
  - `lib/data/prismaAdapter.ts` and/or search fetcher adapters used by product discovery
  - `lib/config/productDiscovery.ts`
- Voucher/coupon restoration:
  - `app/api/vouchers/*`
  - `app/api/admin/vouchers/*`
  - `app/checkout/page.tsx`
  - operations/admin voucher management page(s) under `app/(operations)/operations/*`
  - authenticated voucher history page(s) under `app/*`
  - transaction-safe helpers in `lib/db/transactions.ts`
- Trending/deals foundation:
  - `app/api/products/trending/route.ts`
  - home/deals composition in `app/components/HomeContent.tsx`
  - optional config module for trending/deals weighting/windows under `lib/config/*`
- Product detail expansion:
  - `app/products/[id]/page.tsx`
  - supporting API/data access selectors for vendor stats/policy/related products
- Table standardization:
  - `components/ui/Table.tsx` (and potential reusable data-table wrapper)
  - operations pages currently using direct `antd` table primitives (for example banners/users and similar pages)

**New modules/services required (preferred):**

- `lib/config/trendingDeals.ts` for scoring weights, recency windows, discount/deal eligibility, and limited-period thresholds.
- `lib/services/vouchers.ts` (or equivalent shared service) to unify validate/apply/redeem semantics and prevent route drift.
- `app/(operations)/operations/vouchers/page.tsx` for CRUD management UI using shared table/form patterns.
- `app/vouchers/page.tsx` (or profile subsection) for authenticated users to view available/used voucher history.
- Shared table wrapper enhancements (or migration guidelines) to enforce overflow-safe defaults across operations lists.

**Data flow (target):**

1. Discovery search includes product text + vendor name + vendor campus index filters in API and UI query state.
2. Buyer can enter voucher/coupon at checkout; system validates against limits, applicability, validity windows, and order total.
3. Voucher redemption is transaction-safe: redemption record write + usage counter update + order discount linkage happen atomically.
4. Authenticated user can view voucher inventory and redemption usage timeline.
5. Admin manages vouchers via CRUD surface with predictable validation and status visibility.
6. Trending score contract is confirmed and parameterized; deals section derives from trending products that meet active discount/promo time constraints.
7. Product detail page surfaces richer vendor stats/policy metadata plus related/similar products in stable responsive sections.
8. Operations tables render through reusable overflow-safe table components with consistent mobile/desktop behavior.

**UI/UX considerations (design-system aligned):**

- Desktop sidebar rail height should not exceed hero visual footprint when rendered side-by-side.
- Sidebar ad tiles should remain compact and square with consistent spacing tokens.
- Product-card collections must preserve expected multi-column grid behavior on supported breakpoints.
- Voucher entry feedback at checkout must be explicit, reversible, and non-destructive.
- Voucher history and admin management surfaces should use clear status chips (active, expired, used, exhausted, inactive).
- Product detail enrichment sections should be scannable and stacked responsively without overwhelming primary buy information.
- Table surfaces should retain readability with horizontal containment and avoid viewport-level overflow.

**Potential risks/edge cases:**

- Campus-index search could widen query scope and impact response performance without proper indexing/selectivity.
- Voucher race conditions (near-simultaneous redemption at usage limits) require strict transactional guards.
- Deals/trending weighting changes may unexpectedly reorder products without explainability if configuration is opaque.
- Migrating tables may regress sorting/actions if each page has bespoke column/action logic.
- Product detail enrichment can introduce heavy queries unless vendor/policy/related selectors are bounded and cached.

**Architecture doc updates needed:**

- Add/refresh discovery flow notes for campus-aware search.
- Add voucher lifecycle flow covering validate/apply/redeem/history/admin.
- Add trending/deals scoring flow and time-window constraints.
- Add operations table standardization guidance for overflow-safe reusable table usage.

**Rollout order:**

1. Homepage sidebar bound/tile-sizing and product-card grid consistency fixes.
2. Campus-index search contract expansion (API + discovery state/UI controls).
3. Voucher/coupon restoration end-to-end (checkout apply, user history, admin CRUD, transactional safety).
4. Trending algorithm confirmation + configurable deals foundation.
5. Product detail page enrichment (vendor stats, delivery policy, related/similar products).
6. Operations table migration to reusable overflow-safe table contract.
7. Focused validation and documentation sync.

---

## Cloud Session Feature Spec - Home Rail Layout + Discovery Grid/Pagination + Mobile Footer Link Grid (Planned 2026-04-17)

> **Section summary:** One-pass feature package to enforce home-as-rail browsing while keeping dedicated discovery pages grid-based and paginated, plus mobile footer quick-link grid readability.

**Feature Objective:**
Align marketplace browsing layouts by making home card sections horizontally scrollable rails, while preserving gridded + paginated exploration on dedicated products/category-view and vendors discovery pages.

**Why This Is Needed:**

- Home currently mixes category-first discovery with dense card grids, which reduces quick-scan browsing on smaller viewports.
- Dedicated discovery pages should remain structured, filter-driven, and paginated for deeper exploration.
- Footer quick links are currently linear on mobile and need a compact, scannable grid format.

**Architecture Impact:**

- `app/components/HomeContent.tsx` (home product/vendor presentation contract).
- `app/vendors/VendorsContent.tsx` (find-vendors page pagination while retaining grid layout).
- `components/layout/Footer.tsx` (quick-links mobile layout contract).
- No API contract changes required.

**Acceptance Criteria:**

- Home product-card sections (featured, trending, new arrivals, hot deals) render as horizontal scroll rails, not multi-column grids.
- Home vendor-card section renders as a horizontal rail, not grid.
- Dedicated `/products` and category-driven product exploration continue to render grid cards with pagination.
- `/vendors` (find vendors) renders grid cards with pagination controls.
- Footer quick links render in a mobile-friendly grid without harming desktop readability.

**UI/UX Constraints (Design-System Aligned):**

- Preserve existing card visuals, spacing tokens, and typography; only adjust container layout behavior.
- Rails must keep cards fixed-width and scrollable with no viewport overflow regressions.
- Grid+pagination behavior on dedicated pages must remain deterministic after filters/search change.
- Footer quick-link mobile grid should remain keyboard-accessible and link order-preserving.

**Risks and Edge Cases:**

- Horizontal rail sizing can accidentally clip card content on narrow devices if item widths are too large.
- Vendor pagination must reset page index after filter changes to prevent empty pages.
- Footer quick-link grid must avoid wrapping regressions for longer labels.

**Rollout Order:**

1. Update home card sections to horizontal rails.
2. Add pagination to vendors discovery grid.
3. Convert footer quick links to mobile grid contract.
4. Validate lint/build/focused tests and sync `ai-system` docs.

---

> **Section summary:** Tasks that have already shipped in the current repository state.

- [x] Rename and rebrand Martgram to MyHarvestHub (project metadata, README)
- [x] Upgrade Next.js to v15 and React to v19
- [x] Integrate Ant Design and Tailwind with purple-first theme
- [x] Create initial mock data and in-memory database layer
- [x] Establish basic auth (login, register, logout) APIs
