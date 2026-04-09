# Project Decisions

> **Overview:** Log of significant architectural, technical, and product decisions made during development. Agents consult this before proposing changes to avoid contradicting prior reasoning. Each entry records what was decided, why, and what the alternatives were.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Developer / AI agent / team]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

## Destructive Action Confirmation Uses a Provider-Registered Presenter Bridge

**Decision:** Route all `openActionConfirm` calls through a provider-registered presenter bridge (`App.useApp().modal.confirm`) with fallback to static `Modal.confirm`, so destructive confirmation dialogs render consistently across route groups.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Destructive actions in some surfaces (including operations product delete) could miss showing confirmation reliably when relying on static modal pathways only. Centralizing presenter wiring improves consistency and preserves single-source confirmation semantics.

**Alternatives Considered:**

- Keep static `Modal.confirm` only (rejected: context/render reliability drift across page shells).
- Replace each action with local `Popconfirm` wrappers (rejected: repeated per-action duplication and weaker global governance).

**Implications:**

- New destructive actions should continue using `openActionConfirm` presets and inherit shared behavior.
- Provider bootstrap must keep confirmation presenter registration active.

## SMS Channel Is Explicitly Disabled Until Delivery Support Ships

**Decision:** Keep SMS notification controls visible but disabled with clear "coming soon" messaging in UI and enforce `smsNotifications=false` in preferences API until SMS infrastructure is available.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
User-facing SMS toggle implied functionality that is not operational yet. Disabling both UX toggle and backend persistence path avoids false affordance and inconsistent expectations.

**Alternatives Considered:**

- Hide SMS setting completely (rejected: loses roadmap visibility for users/admins).
- Leave toggle editable and ignore server-side (rejected: misleading and erodes trust).

**Implications:**

- Preference payloads must report SMS as disabled regardless of persisted historical value.
- Re-enable only when channel delivery path and test coverage are ready.

## Operations Product Vendor Filter Must Preserve Explicit "All" Selection

**Decision:** In operations product management, preserve explicit `All vendors` selection and stop bootstrap logic from auto-forcing admin filter to the first vendor.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Admin filter selection reverted shortly after user interaction due to effect logic that reset filter state during vendor-options bootstrap, causing selector and list instability.

**Alternatives Considered:**

- Keep first-vendor auto-default behavior on every options refresh (rejected: overrides user intent and causes UI flicker/revert).
- Persist first-vendor default only in local draft state (rejected: still hides explicit all-vendor scope by default).

**Implications:**

- Selector state now reflects user intent and remains stable across refresh cycles.
- Similar filter bootstraps should avoid forced first-item selection unless explicitly required by business rules.

## Notification Assurance Pass Reuses Existing Persistence and Avoids Schema Migration

**Decision:** For the notifications assurance feature pass, keep the existing persisted in-app notification model (`notification` + `notificationPreference`) and avoid Prisma schema migration; add intelligence through config-driven templates/resolvers and frontend routing/composition changes instead.
**Date:** 2026-04-09
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
The repository already has functional notification CRUD, unread tracking, and preference persistence. Current user pain is discoverability (`/notifications` not acting as inbox), toggle truthfulness, and noisy processing UX rather than storage-model gaps. Avoiding schema change reduces risk and aligns with user directive for this pass.

**Alternatives Considered:**

- Introduce a new inbox schema or event-store model immediately (rejected: unnecessary migration scope for current assurance goals).
- Remove persistence and compute inbox purely from transient state (rejected: weak read/unread continuity and inconsistent cross-device experience).

**Implications:**

- Notification improvements should prioritize route accessibility, template resolution, and UI contract correctness.
- Existing dispatch and preference models remain source-of-truth, with clearer editable/enforced semantics in UI.
- Schema migrations are deferred unless a future feature requires new durable fields that cannot be derived from existing metadata.

## Notification Dispatch Uses Template Resolver with Mandatory Critical-Email Override

**Decision:** Resolve notification title/body/link/email subject through a config-driven template resolver in `dispatchNotification`, and bypass coarse optional type gating for mandatory order/payment/delivery email delivery.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The assurance scope required richer, consistent channel copy without schema changes and stronger preference integrity. Existing flow could suppress mandatory emails when grouped optional toggles were disabled because type-level gating short-circuited all channels.

**Alternatives Considered:**

- Keep hardcoded per-call title/body strings only (rejected: drift and no centralized template governance).
- Keep early type-gate return for all channels (rejected: violates mandatory critical-email guarantee).

**Implications:**

- Notification content is now centrally governed by template config with metadata/context enrichment.
- Critical system emails (order/payment/delivery) remain deliverable even when optional in-app/push grouped toggles are off.
- Existing persistence schema remains unchanged while messaging quality and compliance behavior improve.

## Runtime Processing Feedback Is Global and In-Flight Driven

**Decision:** Surface a universal processing indicator from provider scope by observing runtime store `inFlight` counters, and treat first-load resource states as loading until initial payload exists (to prevent transient false-empty states).
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Page-local loading text was inconsistent and could briefly show misleading empty/error copy (notably wallet). A global runtime signal improves user trust during silent refresh/mutation windows and aligns feedback with actual in-memory runtime activity.

**Alternatives Considered:**

- Keep per-page ad hoc loading labels only (rejected: inconsistent and easy to drift).
- Add processing toasts only around explicit button mutations (rejected: misses background refresh and bootstrap fetch activity).

**Implications:**

- Runtime store/state transitions must maintain accurate `inFlight` semantics for both load and mutation paths.
- Initial empty screens should gate on runtime bootstrap/loading state before rendering no-data messaging.
- Provider-level feedback reduces need for duplicated per-page processing indicators.

## Unified Runtime Warm-Start Is Route-and-Role Scoped

**Decision:** Runtime prefetch at bootstrap must be scoped by auth role plus route tags, instead of broad eager loading of all resources.
**Date:** 2026-04-08
**Made by:** AI cloud implementation session (GitHub Copilot)

**Reason:**
The unified runtime needs warm data for continuity, but broad prefetch would increase payload/memory pressure and hurt low-bandwidth users. Route+role scoped prefetch keeps first render fast while still preserving last-good in-memory data and background refresh continuity.

**Alternatives Considered:**

- Prefetch everything on boot (rejected: over-fetching and unnecessary memory churn).
- No prefetch, refresh only on-demand (rejected: visible cold-state flicker and repeated loading transitions).

**Implications:**

- Runtime registry entries should carry tags/scope metadata.
- Provider bootstrap must derive tags from pathname and role hints.
- Remaining migrations should preserve this bounded prefetch contract.

## Unified Data Runtime Uses Zustand-First Core with Adapter Boundary

**Decision:** Implement the cross-project in-memory data runtime on top of the existing Zustand foundation first, while enforcing a strict runtime adapter boundary so Redux/RxJS integrations remain possible without domain-level rewrites.
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
The platform already has active Zustand-driven state patterns and a newly established smart-resource foundation. A Zustand-first implementation minimizes migration disruption and delivery risk, while an adapter boundary preserves extensibility for future orchestration layers where stream-heavy workflows may benefit from RxJS or enterprise governance may prefer Redux.

**Alternatives Considered:**

- Immediate Redux migration as primary runtime core (rejected: higher migration overhead and broader short-term refactor risk).
- Immediate RxJS stream-first runtime (rejected: unnecessary complexity for current CRUD-heavy reliability goals).
- Keep page-local fetch patterns only (rejected: continued loading flicker, duplicated logic, and inconsistent cache/mutation behavior).

**Implications:**

- Runtime interfaces (resource registry, reconciler, mutation coordinator) must remain framework-agnostic at the domain boundary.
- New high-traffic surfaces should migrate to runtime subscriptions instead of ad hoc page-local fetch orchestration.
- Architecture docs must define adapter seams and migration guardrails before broad rollout.

## TOP Banner Is Image-Only and Title-Optional

**Decision:** Treat `TOP` banners as image-only strips with no frontend title/text overlay, and allow empty title payloads for `TOP` banner creation while keeping strict image and position validation.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The product requirement is that top banners should not render textual content. Requiring title text in API/form contracts created drift and confusing behavior where operators had to input content that should never be shown.

**Alternatives Considered:**

- Keep top-banner text in payload and hide only in CSS (rejected: contract drift and repeated operator confusion).
- Keep title required for all positions (rejected: conflicts with image-only top-banner UX intent).

**Implications:**

- Banner creation/editing UX must treat `TOP` as visual-only placement.
- `HERO`/`SIDEBAR` still require title content and keep text-forward rendering behavior.

## Operations Vendor Stats Must Use Admin All-Status Paginated Fetch

**Decision:** Replace multi-status parallel vendor fetch calls in operations vendor management with a single paginated fetch path using admin-scoped `includeAllStatuses=true`.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Parallel per-status requests increased rate-limit/error risk and could collapse vendor stats to zero despite existing data.

**Alternatives Considered:**

- Keep one request per status in parallel (rejected: brittle and prone to all-or-nothing failure behavior).
- Keep per-status requests but run sequentially (rejected: still repetitive and slower, with avoidable failure surface).

**Implications:**

- Operations vendor counts now depend on one authoritative paginated feed.
- `/api/vendors` must keep admin-only all-status expansion isolated from public defaults.

## Operations Data Refresh Uses In-Memory Smart Resource Cache

**Decision:** Standardize key operations pages on a shared `useSmartResource` hook that combines in-memory cache reuse, stale-time guarded refresh, interval background refresh, and equality-based state update suppression.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations pages were repeatedly issuing full reload fetches that increased backend pressure and produced disruptive loading flashes. A shared retrieval contract reduces request abuse while keeping data fresh.

**Alternatives Considered:**

- Keep page-specific fetch/useEffect implementations (rejected: duplicated logic and inconsistent loading/refresh behavior).
- Introduce a heavier external query library immediately (rejected: unnecessary migration scope for current reliability objective).

**Implications:**

- Operations pages using this pattern should provide non-blocking refresh indicators and optional manual refresh actions.
- New operations surfaces should prefer `useSmartResource` unless a documented exception exists.

## Vendor Marketing Moderation Is a Separate Operational Entity

**Decision:** Treat operations vendor-content moderation as a marketing-submission domain distinct from product-media management; constrain moderation query semantics and UI labeling accordingly.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Mixed moderation feeds made it unclear whether reviewers were handling campaign assets or product catalog media, causing operational ambiguity and higher mis-review risk.

**Alternatives Considered:**

- Keep one mixed feed and rely on ad hoc reviewer interpretation (rejected: error-prone and unclear responsibility boundaries).
- Split into fully separate tables immediately (rejected for this slice: larger migration than needed for immediate behavior correction).

**Implications:**

- Moderation route copy/navigation should use marketing-review terminology.
- Vendor marketing submissions should always carry explicit target-platform metadata.

## Entity Avatar Rendering Uses Shared Fallback Component

**Decision:** Use shared `EntityAvatar`/`VendorAvatar` for vendor and user image rendering with deterministic fallback icon/initial behavior on missing or failed image loads.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Repeated ad hoc avatar implementations caused inconsistent empty states and broken-image visual artifacts.

**Alternatives Considered:**

- Keep per-page avatar logic with local fallback snippets (rejected: duplication and inconsistency).
- Force placeholder URLs only at data layer (rejected: does not handle runtime image load failures).

**Implications:**

- New vendor/user avatar surfaces should compose through shared avatar component exports.
- UI behavior is now consistent when profile/store image URLs are absent or invalid.

## Shared Client Dashboard Shell for Non-Operations Vendor/Admin Routes

**Decision:** Reuse a single `ClientDashboardShell` wrapper for vendor/admin pages outside the operations route group (notably `/store-settings` and `/notifications/settings`) and keep buyer rendering outside this shell.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Manual per-page shell composition drifted from the canonical dashboard spacing/chrome contract, causing inconsistent sidebar/mobile-bottom-nav spacing behavior between routes.

**Alternatives Considered:**

- Keep per-page manual shell markup in each route (rejected: repeated drift and higher regression risk).
- Force these pages into operations route-group only (rejected: would change existing public/shared route behavior and compatibility expectations).

**Implications:**

- Vendor/admin pages that need dashboard chrome but live outside operations should compose through `ClientDashboardShell`.
- Buyer access paths can still render plain page layout when dashboard chrome is not required.

## Public Vendor Visibility Defaults Include Pending Vendors

**Decision:** Default public vendor list reads (`/api/vendors` and `getVendorsClient`) to include both `APPROVED` and `PENDING` vendors unless an explicit status filter is provided.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Public product/vendor surfaces could lose vendor identity for pending/unverified vendors when client vendor hydration was constrained to `APPROVED` only, leading to fallback labels and incomplete visibility.

**Alternatives Considered:**

- Keep `APPROVED`-only defaults and patch each UI surface locally (rejected: inconsistent behavior and repeated per-surface work).
- Include all statuses including suspended/rejected by default (rejected: exposes non-public moderation states).

**Implications:**

- Public vendor/product cards can resolve vendor identities consistently for unverified vendors.
- Status-sensitive operational views can still request explicit `status` filters.

## Product Discovery Uses URL-Driven Single Source of Truth Config

**Decision:** Category tags, filter tools, and sorting behavior for product discovery will be driven by a single shared config and URL query contract (shared parser/serializer), rather than duplicated local constants and ad hoc in-component mappings.
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
Audit showed drift between category tags and products filtering behavior: links write query params that products state does not consistently consume, sort params are emitted but ignored, and category definitions are duplicated across surfaces.

**Alternatives Considered:**

- Keep local in-component category/filter mappings and patch each bug independently (rejected: recurring drift risk and inconsistent UX).
- Make products discovery entirely local state without URL query contract (rejected: poor shareability/bookmarkability and weak cross-surface consistency).

**Implications:**

- Product discovery controls must parse and serialize through a shared helper layer.
- Category slug/value mappings should live in one config module and be reused by home tags, category navigation, and products filtering.
- Regression tests should validate query-to-results behavior end-to-end, not only isolated UI toggles.

## Product Discovery State Is URL-Synchronized with Deterministic Client Sorting

**Decision:** Products discovery (`/products`) hydrates from URL query params and keeps URL state synchronized as filters/search/sort change, while deterministic sorting is applied in client state using canonical sort keys.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Client-reported issues showed discovery links were not reliably reproducible or shareable. URL synchronization plus canonical sorting provides predictable behavior for click-through navigation, browser reload, and shared links.

**Alternatives Considered:**

- Keep query parsing only on initial page load without URL updates after interactions (rejected: weak shareability and inconsistent back/refresh behavior).
- Move all discovery sorting to API immediately (rejected for this slice: higher refactor scope; deterministic client sorting closes user-facing gap quickly while preserving existing data flow).

**Implications:**

- Discovery controls must update URL params through the shared serializer.
- Sort keys should only come from canonical `productDiscovery` config.
- Follow-up work should expand end-to-end tests for home click-through and filter sidebar mapping persistence.

## Vendor Review Status Updates Are Persistence-First, Email Is Non-Blocking

**Decision:** For admin vendor moderation, status mutation (`APPROVED`/`REJECTED`) is committed first, then review email dispatch is attempted as a non-blocking side effect with explicit response metadata (`emailDispatch`) and structured logging.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Vendor approval/rejection state must stay authoritative even when upstream email providers fail transiently. Blocking or rolling back moderation decisions on transport failures would create inconsistent operations state and admin confusion.

**Alternatives Considered:**

- Hard-fail moderation mutation when email send fails (rejected: ties core workflow correctness to external provider availability).
- Silent best-effort email with no response/reporting metadata (rejected: poor observability and unclear operator feedback).

**Implications:**

- UI should surface warning-level feedback when status succeeds but email dispatch fails.
- Retry/remediation can be added later without changing status transition semantics.
- Logs and API responses now provide audit-friendly send outcome markers.

## Banner Visibility Contract + Guided Public-Content Authoring

**Decision:** Enforce strict banner visibility/placement rules (no top-banner render for empty text payloads; avoid top/hero duplicate stacking) and redesign public-content editing around guided non-technical workflows (structured blocks, preview, upload-first media insertion, and fallback-consistent publishing).
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
Production-facing regressions showed that banner rendering and placement logic can create confusing homepage output, while current content-editing UX is too technical for non-developer operators and risks publish-time inconsistencies.

**Alternatives Considered:**

- Keep current permissive banner render behavior with best-effort frontend checks (rejected: repeats visibility/placement regressions).
- Keep raw/unstructured content editing interface (rejected: high editorial error rate and poor usability for non-technical admins).

**Implications:**

- Banner DTO normalization and frontend render guards must treat empty/whitespace text consistently.
- Homepage composition must guarantee single-responsibility placement for top and hero banner zones.
- Public-content tooling should default to guided structured editing with preview and upload-managed media contracts.
- Cache invalidation and fallback render semantics must remain aligned between editor publish flow and frontend reads.

## Ad Pricing + Analytics/User-Admin Reliability Fallback Contract

**Decision:** Keep ad application submission non-blocking when admin rate config is missing by applying explicit safe fallback rates, and harden analytics/user-admin pages to prefer partial data/fetch resilience over full-surface failure.
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Client-facing flows were blocked by strict dependency on admin-entered ad rates and brittle count/data retrieval assumptions. Platform reliability requirements favor graceful degradation (fallback values + partial rendering) so public submissions and operations insights remain functional while admin configuration catches up.

**Alternatives Considered:**

- Keep 503 hard-fail on missing ad rates (rejected: blocks legitimate ad submissions and degrades trust).
- Add extensive new charting dependency for analytics visuals (rejected: unnecessary scope/risk for immediate recovery; lightweight DS-native chart blocks are sufficient).

**Implications:**

- Ad APIs and ad-rate endpoint should preserve a safe fallback path for missing admin config.
- Analytics surfaces should continue rendering when some datasets fail and should avoid all-or-nothing fetch behavior.
- User-management list actions must execute real API mutations (not local success-only stubs) to preserve admin CRUD expectations.

## Reusable Config-Driven Confirmations for Destructive/Removal Actions

**Decision:** Standardize destructive/removal-like UI actions on a shared confirmation utility with OOP-backed config builder/presets (`ActionConfirmBuilder` + `ActionConfirmPresets`) and concise copy conventions (short title/message/confirm text).
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations surfaces had mixed confirmation patterns (`Modal.confirm`, `Popconfirm`, custom modal state), leading to uneven UX and missed consistency for high-risk actions. A shared, config-driven confirmation helper improves clarity, reusability, and lowers regression risk while keeping adoption incremental.

**Alternatives Considered:**

- Continue page-level ad hoc confirm implementations (rejected: repeated drift and inconsistent copy/behavior).
- Build a heavy global modal state manager first (rejected: unnecessary scope for immediate production-readiness hardening).

**Implications:**

- New destructive/removal actions should use shared presets/builders unless there is a documented exception.
- Copy for confirm dialogs should stay concise and explicit (action + target).

## Operations Banners Must Use Real API Mutations (No Local-Only Success Paths)

**Decision:** Keep `/operations/banners` on real API-backed create/update/delete/toggle flows and align banner cache invalidation patterns to `cache:banners:*` fan-out keys.
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations audit showed the banners page emitted success toasts without persisting changes, causing false-positive UX and stale admin state. Converging on API-backed mutations with shared invalidation behavior preserves trust and ensures admin actions are end-to-end functional.

**Alternatives Considered:**

- Keep optimistic/local-only updates with delayed persistence (rejected: risk of silent data loss and admin confusion).
- Rebuild page around a different state library first (rejected: unnecessary scope for reliability fix).

**Implications:**

- Any future operations mutation surface should avoid stub success paths and always verify API response before success feedback.
- Banner cache keys should include filter dimensions while invalidation remains broad enough to clear all active/list permutations.

## Explicit Orders Scope Split + Domain Parity Matrix Enforcement

**Decision:** Keep `/orders` as buyer-history only, introduce `/operations/orders` for vendor/admin operations, and enforce a role/domain parity matrix across products, orders, vendors, wallet, notifications, ads, bug reports, and profile/store using route policy + navigation + tests.
**Date:** 2026-04-05
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Cross-domain audit closure required explicit separation between consumer history flows and operations workflows, especially for orders, to avoid scope leakage and ambiguous discoverability. A parity matrix contract ensures every domain has role-safe, discoverable entry points with consistent policy enforcement.

**Alternatives Considered:**

- Keep `/orders` shared for buyer/vendor/admin (rejected: blurs operations vs history use-cases and weakens policy clarity).
- Introduce role-specific duplicate URL trees again (rejected: conflicts with consolidated operations architecture and increases drift risk).

**Implications:**

- Middleware must preserve legacy compatibility for `/admin/orders` and `/vendor/orders`.
- Route registry, navigation, sidebar, and regression tests must remain synchronized whenever role-scope behavior changes.
- Dead-link/route audits are required whenever route discoverability is modified.

## Exhaustive Audit Priority Contract (2026-04-05)

**Decision:** Execute remaining production-readiness work in strict priority order: (1) operations layout chrome de-duplication, (2) vendor product-management workspace delivery, (3) email-change reverification completion, then (4) dashboard KPI/data wiring and (5) config-driven content migration/polish.
**Date:** 2026-04-05
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
The exhaustive audit surfaced one critical UX regression and multiple high-severity workflow gaps that have cross-surface dependencies. A strict sequence reduces regression risk and prevents low-priority polish from delaying critical-path fixes.

**Alternatives Considered:**

- Run all outstanding items in parallel (rejected: increases merge/test complexity and masks root-cause regressions).
- Continue broad mixed-priority batching (rejected: critical issues can remain open while medium/low tasks consume time).
- Delay operations UX fixes until final polish phase (rejected: vendor/admin usability remains impaired).

**Implications:**

- Cloud sessions should not start with medium/low polish tasks until layout duplication and vendor product workflow are closed.
- Queue/checkpoint docs must track deferred low-priority work explicitly (contact config source, vendor deactivation UX, webhook idempotency hardening).
- Regression gates should run after each high-risk slice instead of only at the end.

## Cloud Adjustment Execution: Signup + Upload Contract Enforcement

**Decision:** Enforce strict buyer/vendor-only signup role selection while keeping church position values (`MEMBER`, `NON_MEMBER`, `WORKER`) available through the `Position` enum; require vendor `businessAddress` and all three verification documents at signup; and enforce Cloudinary-managed URLs for upload-governed fields in bug-report and ad-application APIs.
**Date:** 2026-04-04
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The cloud adjustment queue required elimination of role drift (`Worker` as signup role), full requiredness parity across UI/client/API for vendor verification fields, and closure of raw image URL paths in governed flows. Implementing these together avoids inconsistent validation outcomes and prevents runtime/DB enum mismatch during vendor registration.

**Alternatives Considered:**

- Keep legacy signup role fallback for `worker` (rejected: conflicts with locked product decision and stage logic).
- Allow optional vendor verification docs or raw screenshot URLs in some flows (rejected: breaks requiredness parity and upload governance).
- Enforce Cloudinary only at UI layer (rejected: API-level enforcement is required for security and consistency).

**Implications:**

- Prisma enum migration is required in environments where `Position` lacks `MEMBER`/`NON_MEMBER`/`WORKER`.
- Signup and settings changes must preserve cross-step draft state for `idType` and uploaded document metadata.
- Any new upload-managed fields should follow the same “upload-first + Cloudinary URL validation” contract.

## Post-Cloud Signup + Upload Governance Correction Contract

**Decision:** Enforce corrected product contract after cloud review: remove `Worker` as signup user role, keep `Member`/`Non-Member` valid as church position values without enum drift, require all three vendor verification documents plus required signup `businessAddress` (always editable post-auth), and standardize image evidence fields on Cloudinary-managed upload flows (deprecate raw URL inputs).
**Date:** 2026-04-04
**Made by:** AI planning session (GitHub Copilot) with explicit user confirmation

**Reason:** Post-cloud audit identified regressions/drift against intended behavior (Worker role exposure, requiredness/label mismatch, persistence issues, and raw screenshot URL paths). A locked corrective contract is required so the next cloud execution does not reintroduce ambiguous assumptions.

**Alternatives Considered:**

- Keep Worker as a selectable signup role (rejected: conflicts with intended product model and backend role scope).
- Keep mixed required/optional verification doc behavior (rejected: misleading UX and validation confusion).
- Keep raw image URL fallback in bug report/media fields (rejected: weak upload governance and inconsistent asset lifecycle).

**Implications:**

- Cloud implementation must prioritize enum/schema parity and run Prisma migration + client generation if schema changes are made.
- Form labels, validation schema, API validation, and DB constraints must remain aligned for requiredness-critical fields.
- Upload flows across bug report and similar forms should converge on a single managed Cloudinary pipeline.

## Centralized RBAC & Config-Driven Architecture

**Decision:** Introduce a centralized, declarative RBAC policy registry and a typed configuration layer to replace hardcoded route lists and scattered `process.env` usage.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Current route protection is brittle (hardcoded arrays in `middleware.ts`) and configuration is scattered across env vars and constants. A single source of truth improves auditability, reduces drift, and enables deny-by-default security.

**Alternatives Considered:** Continuing with the existing middleware array approach (quick, but risky and hard to maintain) or using file-system scanning to infer protection (complex for Next.js and not explicitly declarative).

**Implications:**

- Require refactor of `middleware.ts`, route layouts, and some API handlers to consume the new policy registry.
- Provide a safe pattern for future routing changes and feature flags.
- Enable better automation (tests, reporting) against access policies.

## Adapter Pattern for Data Layer

**Decision:** Define a shared data adapter interface and explicitly require either the mock or Prisma implementation for each domain. If a domain adapter is not implemented, the system should fail fast with a clear error.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Current mix of mock and Prisma adapters in `lib/data/database.ts` is difficult to reason about and can silently fall back to mocks in production. A strict adapter contract prevents partial cutovers and ensures expected behavior.

**Alternatives Considered:** Keeping the existing `USE_PRISMA` toggle with implicit fallback (unsafe) or delaying the full adapter work (slows migration).

**Implications:**

- Additional work to define and implement adapter interfaces per domain (users, products, orders, carts, wallets, vendors, etc.)
- Tests need to validate both mock and Prisma implementations.

## Production Readiness Baseline

**Decision:** Treat the project as production-critical by enforcing robustness in email delivery, notifications, caching, and cloud asset handling before opening the platform to real users.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Early-stage MVP systems often fail due to unreliable email/notification delivery and cache inconsistencies, which can harm trust and create hard-to-debug issues. Explicitly planning for these areas reduces regression risk and makes the product more stable.

**Implications:**

- Email paths must be resilient and non-blocking, with retries and clear failure logging.
- In-app notifications should persist and be replayable, with optional push delivery.
- Cached content must have a clear invalidation mechanism.
- Cloud uploads must persist metadata and tolerate partial failures without blocking core flows.

## Unified Role-Driven Route Refactor

**Decision:** Migrate from role-prefixed directories (`/buyer`, `/vendor`, `/admin`) to unified feature routes with dynamic config-driven rendering based on user role and permissions.
**Date:** 2026-03-23
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Role-specific pages create duplication and inconsistent behavior. A single route + policy-driven layout simplifies maintenance and improves feature coverage for all user types.

**Implications:**

- Remove/deprecate folder routes: `/buyer`, `/vendor`, `/admin` when safe.
- Create shared route entries: `/orders`, `/wallet`, `/profile`, `/dashboard`, etc.
- Ensure each shared route adapts with `RoleAwareFeatureRenderer` + a central policy registry.
- Use reusable component primitives in `components/features` and `components/ui` with config props to vary presentation (cards, KPIs, tables).

## Typed Runtime Configuration Module

**Decision:** Introduce `lib/config` as the only runtime config entry point, with parsed env values and explicit feature flags consumed by core services.
**Date:** 2026-03-20
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Scattered direct `process.env` access made behavior inconsistent across services and hard to test. A central typed module enables safe defaults, clearer toggles, and predictable behavior in middleware/services.

**Alternatives Considered:** Keep reading env values inline in each module (minimal effort but brittle) or add a heavy external config framework (unnecessary complexity for current scope).

**Implications:**

- Services should import `env`/`featureFlags` instead of raw env access where practical.
- New runtime toggles should be added to `lib/config/env.ts` first.

## Buyer-to-Vendor Self-Serve Conversion

**Decision:** Implement a dedicated buyer conversion route (`/become-vendor`) backed by a self-scoped endpoint (`/api/users/me/convert-to-vendor`) that performs role upgrade + vendor upsert atomically and reissues JWT cookies.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Buyers needed an easy and explicit channel to become vendors without creating a second account. Existing vendor creation APIs assumed role was already `VENDOR`, which blocked self-serve conversion and created user friction.

**Alternatives Considered:** Reusing signup flow for existing users (causes duplicate-account risk) and admin-only vendor creation (high operational overhead and slower onboarding).

**Implications:**

- Role transition now happens in one endpoint with clear validation and idempotent vendor upsert behavior.
- Auth tokens are refreshed immediately to keep middleware authorization and navigation in sync with the new role.
- Store settings loading/saving now prefers self-scoped endpoints over broad list-fetch + client filtering.

## Shared API Response Envelope + Handler Wrapper

**Decision:** Introduce `lib/api/http.ts` as the common API response layer (`apiSuccess`, `apiError`, `withApiHandler`) and migrate route handlers incrementally.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** API routes had inconsistent response shapes and repetitive try/catch patterns, which increased frontend branching and maintenance cost.

**Alternatives Considered:** Continue route-by-route custom `NextResponse.json` handling (faster short term but accumulates drift) or add a third-party framework abstraction (overhead for current size).

**Implications:**

- Route handlers should progressively converge on shared envelope behavior.
- Validation and error observability become easier to standardize.

## Offline Draft + Queue Strategy for Network-Dependent Forms

**Decision:** Add lightweight local draft persistence and offline queue replay utilities (`lib/utils/localDraft.ts`, `lib/utils/offlineQueue.ts`) and apply first to ad applications.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Network interruptions caused data-loss risk and blocked form submissions, especially for media-heavy workflows.

**Alternatives Considered:** Keep only service-worker background sync (less control at form level) or rely on user manual retry (poor UX and high abandonment risk).

**Implications:**

- Forms can preserve user progress and queue submission safely when offline.
- Replay handlers must stay idempotent and validation-safe.

## Guest Upload Channel for Ad Application Media

**Decision:** Allow unauthenticated uploads only for ad and payment-proof folders through `/api/upload`, protected by strict IP rate limiting and optional metadata persistence skip.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Public ad application flow required upload capability but upload endpoint previously required auth, forcing manual URL entry.

**Alternatives Considered:** Require login for all uploads (blocks public ad onboarding) or keep URL-only fields (poor reliability and invalid assets).

**Implications:**

- Public ad workflows can use the same upload pipeline as authenticated users.
- Scope is intentionally restricted to ad/payment-proof media to reduce abuse surface.

## Canonical Operations Route Namespace

**Decision:** Introduce `/operations/*` as the canonical management workspace route surface and redirect legacy `/admin/*` and `/vendor/*` entry paths through middleware.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Management pages were still spread across role-prefixed URL trees, which made route policy, navigation, and migration sequencing brittle. A single operations namespace allows grouped architecture migration without breaking existing bookmarks.

**Alternatives Considered:** Hard cutover by deleting legacy routes immediately (high regression risk) and keeping role-prefixed URLs indefinitely (continues route sprawl and duplication).

**Implications:**

- New navigation and policy definitions should target `/operations/*` paths first.
- Legacy links keep working via redirect compatibility while feature pages are gradually moved to shared implementations.
- Middleware now owns canonical-path normalization for old management URLs.

## Semantic Token Priority for Shared UI Variants

**Decision:** Prefer semantic design-system tokens (surface, border, text) over palette-hardcoded shades for shared component variants, starting with `Button` secondary styling.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Palette-coupled classes in shared primitives increase maintenance overhead and can drift from dark-mode/readability targets when theme palettes evolve.

**Alternatives Considered:** Keep existing palette-specific secondary button classes (quick/no refactor) or redesign the entire button system in one pass (high-risk/large scope).

**Implications:**

- Shared primitives should default to semantic DS tokens where possible.
- Future token/theme updates will require fewer component-level class rewrites.

## API/Adapter-Only Runtime Data Paths (Client/Page Layer)

**Decision:** Remove direct page-level and client-fetcher runtime imports of `mockData` so UI data retrieval uses API/adapter-backed paths only, with explicit empty/null degradation on failures.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Runtime `NEXT_PUBLIC_USE_MOCK_DATA` branches in pages/fetchers can mask backend/adapter failures and create production drift where UI appears healthy while database integrations are broken.

**Alternatives Considered:** Keep mock fallback for development convenience (faster local debugging but high migration ambiguity) or hard-fail the entire page on fetch errors (poor UX resilience).

**Implications:**

- Client/page data paths now surface backend failure via empty-state UX instead of local dataset substitution.
- Remaining migration work should focus on server-fetcher fallbacks (`lib/data/dataFetchers.ts`, `lib/data/publicContent.ts`) to complete Prisma cutover confidence.

## Prisma-Only Server Fetchers + Explicit Infra Mocks in Tests

**Decision:** Remove runtime mock fallback branches from server fetcher modules (`lib/data/dataFetchers.ts`, `lib/data/publicContent.ts`) and require tests to mock Prisma/cache modules explicitly.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Server-side fallback imports can hide real database integration failures, and tests coupled to env-driven fallback mode break once cutover is complete.

**Alternatives Considered:** Keep server fallback paths for local convenience (maintains migration ambiguity) or skip test updates (causes brittle failing suites after cutover).

**Implications:**

- Server fetchers now align with strict Prisma-first runtime behavior.
- Data-layer tests should mock infrastructure dependencies (Prisma/cache) instead of relying on `NEXT_PUBLIC_USE_MOCK_DATA` pathing.

## Strict Prisma-First Adapter/Bootstrap Selection

**Decision:** In runtime adapter selection, pin `lib/data/database.ts` to Prisma-backed adapters and remove dependency on `USE_PRISMA` toggling, while keeping missing-adapter fail-fast behavior.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Environment-based adapter switching can produce inconsistent behavior between environments and obscure integration issues during migration.

**Alternatives Considered:** Keep `USE_PRISMA` runtime switching (convenient but ambiguous) or delete mock scaffolding entirely in one pass (higher-risk while residual references still exist).

**Implications:**

- Runtime domain adapter resolution now follows a single Prisma-first path.
- Adapter-layer tests should mock `prismaAdapter` directly when isolated behavior is needed.
- Remaining mock cleanup should target non-adapter client/runtime references and documentation consistency.

## Eliminate Direct Client Mock Imports in Core UX Flows

**Decision:** Remove direct client-side `mockData` imports from profile/search flows and back them with API responses (`/api/products` suggestions and `/api/users/[id]/addresses`).
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Client-level mock imports introduce hidden runtime divergence and can mask API/data-layer regressions in production-like environments.

**Alternatives Considered:** Keep dev-only fallback imports (quick local convenience but ambiguous behavior) or leave profile addresses static (simpler but stale/incorrect user data).

**Implications:**

- Search suggestions and profile addresses now reflect API-backed state consistently.
- Future resilience work should prefer explicit empty/error UI states over hidden data substitution.

## Slim Prisma Adapter Facade for `lib/data/database.ts`

**Decision:** Replace `lib/data/database.ts` monolithic mock+toggle implementation with a slim Prisma-adapter facade that preserves `db`/`*Db` exports and fail-fast missing-adapter behavior.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** The old file carried large in-memory mock state and dead runtime branches after Prisma-first cutover, increasing maintenance overhead and startup noise.

**Alternatives Considered:** Keep the existing file with `usePrisma=true` pinning only (lower immediate risk but retains dead code bulk) or remove the facade entirely (would force broad route import churn).

**Implications:**

- Runtime no longer instantiates legacy mock datasets from `lib/data/database.ts`.
- Existing route consumers of `db` continue to function without import changes.
- Remaining cleanup should focus on deprecating obsolete env flags and documentation references.

## Remove Compatibility Env Toggles from Runtime Config

**Decision:** Remove `USE_PRISMA` and `ENABLE_MOCK_BACKEND` from the active runtime config surface (`lib/config/env.ts`, `lib/config/features.ts`) and update tests/docs accordingly.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Adapter/runtime behavior is now Prisma-first by design; keeping legacy toggle fields in config encourages drift and false assumptions.

**Alternatives Considered:** Keep toggles as inert/deprecated fields (backward-compatible but confusing) or keep them active (reintroduces branching risk).

**Implications:**

- Runtime configuration no longer exposes mock/prisma selection flags.
- Deployments should rely on database connectivity/config only (e.g., `DATABASE_URL`, `DIRECT_URL`) for data-layer readiness.
- Tests and operational docs must no longer reference these toggle vars as required behavior controls.

## Gateway-Agnostic Payment Stub Contract

**Decision:** Introduce a single payment service contract (`initializePayment`, `verifyPayment`) that supports `PAYSTACK` and `FLUTTERWAVE`, exposed via `/api/payments/initialize` and `/api/payments/verify`.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Checkout and wallet flows needed backend integration seams before enabling real provider calls. A shared contract avoids duplicating gateway logic across routes/components.

**Alternatives Considered:** Build provider-specific routes first (faster initially but duplicates validation/auth logic) or defer all backend work until full integration (blocks incremental wiring/testing).

**Implications:**

- Frontend flows can begin wiring against stable API contracts immediately.
- Future real integrations should replace internals of `lib/services/payments.ts` while preserving API route interfaces where possible.

## Route Checkout/Wallet Through Unified Payment Contract

**Decision:** Wire checkout card flow and wallet deposit flow through `/api/payments/initialize` and `/api/payments/verify` before downstream domain actions.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Using a shared payment contract in live client flows validates API seams early and avoids future frontend rework when real gateway APIs are enabled.

**Alternatives Considered:** Keep UI-only placeholders until full gateway integration (delays validation of backend contracts) or wire gateway-specific logic directly in pages (duplicates behavior and raises migration risk).

**Implications:**

- Checkout and wallet UI now exercise backend payment endpoints in normal flow.
- Remaining work should enforce verified status in order and wallet persistence layers instead of treating stub success as informational.

## Public Ad Intake Uses Dedicated Unauthenticated Route

**Decision:** Use `/ad-application` as the canonical public ad-intake path and keep it explicitly public in RBAC route policy.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Public advertisers should not be forced into auth-gated flows, and footer/navigation links needed a single stable target for campaign submissions.

**Alternatives Considered:** Reuse `/advertise` as a mixed-mode route (creates auth ambiguity and UI coupling) or require login for ad submission (higher onboarding friction and lower conversion).

**Implications:**

- Footer and policy references should point to `/ad-application` as canonical entry.
- Public submit endpoints must enforce validation and rate-limiting to offset unauthenticated access.

## Vendor Analytics Must Be Store-Scoped

**Decision:** In vendor-facing analytics views, compute KPI cards from current-vendor orders/products only; platform-wide aggregates are reserved for admin contexts.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Vendor users were exposed to non-scoped platform totals, which can mislead business decisions and leak aggregate operational context.

**Alternatives Considered:** Keep shared aggregates for all roles (inaccurate for vendor dashboards) or split into separate analytics pages immediately (larger refactor than needed for current queue scope).

**Implications:**

- Shared analytics components need role-aware data scoping before rendering KPI summaries.
- Future analytics expansions should maintain explicit role-scoping boundaries in both API and UI layers.

## Server-Side Payment Verification as Mutation Gate

**Decision:** Enforce payment verification on server mutation boundaries by requiring gateway/reference metadata and verifying status inside `/api/orders` (card payments) and `/api/wallet/deposit` before persisting order/wallet state.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Client-side verification checks alone are insufficient as a source of truth; backend mutation endpoints must validate payment status to prevent unverified card orders or wallet credits.

**Alternatives Considered:** Keep verification only in client flow (faster but bypassable) or postpone enforcement until full provider integration (leaves a verification gap in current behavior).

**Implications:**

- Card order creation now rejects missing/unverified payment references when payment features are enabled.
- Wallet deposit crediting now rejects missing/unverified payment references before balance mutation.
- Order and transaction records now carry verification metadata useful for audit/reconciliation and future webhook-based settlement flows.

## Unified Notification Fan-Out Service

**Decision:** Introduce a centralized notification dispatcher (`lib/services/notifications.ts`) that fans out per event to in-app persistence, Resend-backed email, and web-push delivery, gated by notification preference flags.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Notification delivery logic was fragmented across routes and mostly limited to direct in-app inserts, with no consistent way to honor user channel preferences or trigger push/email alongside in-app updates.

**Alternatives Considered:** Keep per-route ad-hoc notification writes (simple but inconsistent and hard to extend) or defer channel unification until later (prolongs behavioral drift and missed delivery paths).

**Implications:**

- Order and wallet payment flows now emit notifications via a single preference-aware service.
- Browser push subscriptions registered by clients can be reused across all future notification events without duplicating route-specific push code.
- Channel expansion (e.g., SMS) can be added in one service boundary instead of editing many API routes.

## Cloud Session Execution Contract for Interrupted Refactor Work

**Decision:** Use a dedicated temporary handoff plan file plus queue-driven execution contract for cloud sessions when local sessions are interrupted (`.ai-system/planning/cloud-session-temp-plan-2026-04-04.md`).
**Date:** 2026-04-04
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Repeated local power/connectivity interruptions created context-loss risk and incomplete task sequencing. A strict handoff contract keeps implementation deterministic across model capability levels.

**Alternatives Considered:** Rely only on conversational summary handoff (fast but fragile) or restart planning from scratch in cloud session (wastes time and risks divergence from queued priorities).

**Implications:**

- Cloud session must begin by reading `.ai-system` docs and the temporary handoff plan before coding.
- Work execution is required to follow queued order with validation gates and checkpoint updates after each workstream.
- Architecture, decisions, queue status, and dev-history updates are part of delivery, not optional post-work cleanup.

## Email-Change Reverification Reuses Verify-Email Pipeline

**Decision:** Implement email-change confirmation as a tokenized reverification path using the existing `/verify-email` client + `/api/auth/verify-email` API, with a token prefix (`email-change:`) that encodes the pending email and triggers email mutation on successful verification.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Reusing the existing verification pipeline reduces risk and avoids duplicating token lifecycle logic while still supporting secure email mutation and explicit post-change re-authentication.

**Alternatives Considered:** Separate dedicated verify-email-change endpoint (more code surface and duplicated verification concerns) or immediate email update without reverification (higher account takeover risk).

**Implications:**

- Email changes now require a successful verification link click before the canonical email is updated.
- Auth cookies are cleared after email mutation to force a fresh login with new identity credentials.
- Profile security UX must communicate that email change is pending until verification completes.

## Notification Preferences API Compatibility Contract

**Decision:** Keep `/api/notifications/preferences` as the backend source of truth, but normalize it to accept/return the field shape consumed by current notification settings UIs while preserving mandatory critical email delivery behavior in service fan-out.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Existing UI pages use a richer preference shape than persisted DB columns; normalizing at API boundary prevents breaking clients and allows gradual UI convergence.

**Alternatives Considered:** Rewrite all settings UIs immediately to DB shape (higher regression risk for current sprint) or leave mismatch unresolved (settings appear saved but do not control behavior correctly).

**Implications:**

- Settings pages can reliably load/save preferences without contract drift.
- Critical system notifications (order/payment/delivery) continue to send email even when optional channels are disabled.
- Future schema expansions should preserve API-level normalization to avoid UI breakage.

## Bug-Report API Normalization for User/Admin Flows

**Decision:** Normalize bug-report API payloads to map UI-facing fields (`subject/details/priority/adminNotes`) to persisted Prisma fields (`title/description/severity/metadata`) at route boundaries.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** User submission and admin triage pages were built against a UI-first contract that diverged from DB naming, causing CRUD reliability issues.

**Alternatives Considered:** Refactor all frontend bug-report screens to DB field names (larger UI churn) or keep mixed mappings per page (fragile and error-prone).

**Implications:**

- Bug-report lifecycle now remains stable across submit/list/detail/status/notes flows.
- Admin operations pages receive consistent normalized records regardless of DB internals.
- Additional bug metadata can be introduced in JSON without breaking UI contracts.

## Config-Driven Footer and Help Surfaces

**Decision:** Centralize footer/help navigation and descriptive content in `lib/config/siteContent.ts` and consume it in layout/page components instead of hardcoded strings/links.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Hardcoded content and route references made navigation hard to audit and increased dead-link risk during route migrations.

**Alternatives Considered:** Leave content hardcoded in each component (continued drift) or move immediately to fully DB-driven runtime content for every section (higher implementation cost in this slice).

**Implications:**

- Public navigation/help content is now easier to audit and update in one place.
- `/help/[slug]` route-safe subpages can be driven by config slugs and optionally enriched by public-content entries.
- Next step can migrate this config source to admin-managed persisted content with minimal component churn.

## Role/Domain Conceptual-View Parity Contract

**Decision:** Enforce explicit role-scoped conceptual views for multi-context domains (products, orders, vendors, wallet, notifications, ads, bug reports, profile/store) via discoverable routes/navigation and scope-safe API behavior, with a parity matrix tracked in the execution queue.
**Date:** 2026-04-05
**Made by:** AI planning/handoff session (GitHub Copilot)

**Reason:** Some domains evolved with mixed access patterns (for example products now have explicit public vs operations views, while orders still rely mostly on one shared route). This creates discoverability drift, implicit scope assumptions, and risk of role-context confusion during future refactors.

**Alternatives Considered:** Keep role filtering purely at API/data layer with shared routes (fewer pages but lower UX clarity), or fork fully separate per-role page trees (clear separation but higher duplication and maintenance burden).

**Implications:**

- Cloud execution must validate and close role/domain parity gaps using a matrix-driven checklist rather than ad-hoc page edits.
- Orders must have explicit scope semantics (buyer-history vs vendor/admin operations) with compatible redirects for legacy role-prefixed paths.
- Navigation, route policy, middleware redirects, and API scope checks must be updated together and regression-tested as one unit.
