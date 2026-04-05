# Cloud Session Temporary Execution Plan (2026-04-04)

> Purpose: Transfer interrupted local-session refactor work into a cloud session with a strict autonomous execution contract.

---

## Progress Audit Snapshot

### Completed Recently

- Public ad intake, vendor analytics scoping, and ad pricing/duration server enforcement are implemented.
- Canonical operations namespace migration was largely completed (`/operations/*`) with legacy redirects in place.
- Shared API wrapper migration is advanced across notifications, wallet, cart, push, availability, and reviews.
- Payment initialize/verify stubs exist and are wired into checkout/wallet flows.

### Current Risk State

- The working tree is heavily modified from interrupted local sessions and needs stabilization before new feature expansion.
- Several queue items remain open in signup reliability, PWA coverage, route/content hardening, and final production-readiness checks.

### Remaining Work Themes

- Signup/role validation defects (remove `Worker` as signup role, required-field parity, regression tests).
- Production-readiness finishers (dead-link audit, route consolidation closure, API standardization closure, cleanup).
- New follow-up requirements from product direction (email-change reverify channel, universal form retention, config-driven content/nav/help, payment fallback deprecation path, operations CRUD reliability, cloudinary-first upload governance).

### Confirmed Product Decisions (Locked for Cloud Execution)

- Vendor signup verification requires all three documents: valid ID, business registration certificate, and utility bill.
- `Worker` is not a signup role. `Member` and `Non-Member` must remain valid selectable values for church position without runtime or database breakage.
- Vendor `businessAddress` is required at signup and remains editable post-auth in vendor settings.
- Raw screenshot/image URL fields are deprecated in user flows; image evidence should use managed upload paths via Cloudinary.

### 2026-04-05 Exhaustive Audit Addendum

Audit synthesis (read-only) surfaced the following implementation priorities:

- Critical: operations chrome duplication (double Header rendering) must be fixed first.
- High: vendor product management UI route is missing in operations namespace.
- High: email-change reverification completion path remains incomplete.
- Medium: operations dashboard cards are placeholder-only and need live KPI wiring.
- Medium: `about` and `privacy` pages still need full config/public-content parity.
- Medium: advertise/profile usability gaps remain (field guidance + missing profile context fields).

Execution rule:

- Use `.ai-system/planning/task-queue.md` section `Cloud Session Execution Queue (2026-04-05 Exhaustive Audit)` as the authoritative order for this next implementation wave.

---

## 1. Feature Summary

Deliver a production-readiness completion wave that closes interrupted refactor gaps and implements missing platform-critical behavior end-to-end. The feature set ensures user/account/security flows, role-aware routing, content configurability, payment reliability, and admin operations all behave correctly under real usage and reduced connectivity assumptions.

Why needed:

- Prevent client-facing failures from partially wired flows.
- Remove hardcoded UX/config drift and dead-route risk.
- Ensure key business-critical flows (signup, verification, payments, bug reporting, operations CRUD) are resilient and test-covered.

---

## 2. Architecture Impact

Primary modules affected:

- Routing and guard surface: `app/`, `middleware.ts`, `lib/rbac/routeConfig.ts`, `lib/navigation.ts`.
- Auth/account lifecycle: `app/profile/*`, `app/verify-email/*`, `app/api/auth/*`, `app/api/users/*`.
- Shared form infrastructure: `lib/utils/localDraft.ts`, `lib/utils/offlineQueue.ts`, feature form components.
- Upload/asset pipeline: `app/api/upload/*`, bug report/ad/payment-proof forms, and Cloudinary service bindings.
- Content/config system: public content data/service layers, footer/header/help/dash nav consumers.
- Operations area: `app/(operations)/operations/*` and related APIs for users/vendors/banners/ads/bug reports.
- Payments: `app/api/payments/*`, order/wallet mutation routes, payment services.

Architectural direction:

- Keep single-feature route topology with role-aware behavior.
- Keep policy-driven authorization and centralized API response patterns.
- Keep config/content editable and avoid hardcoded user-visible content.

---

## 3. New Modules or Services Required

Expected additions (create only if missing):

- Email change + reverification service endpoints (request token, confirm token, redirect-safe completion).
- Shared form schema/label mapper utility (required/optional parity between Zod/schema and UI labels).
- Universal form draft binding helper (light wrapper around local draft and optional offline queue replay).
- Shared upload-field adapter to normalize cloud upload selection, preview, persistence, and server payload shape across forms.
- Help center config/content resolver for admin-editable help pages/subpages.
- Payment gateway production integration scaffolding for Paystack webhooks/verification (with feature-flagged fallback support).
- Cleanup inventory script/report for obsolete directories/files before bulk deletion.

---

## 4. Data Flow

### Email Change + Reverification

1. User submits new email in profile/security settings.
2. API validates identity, uniqueness, and rate limits; stores pending email-change token.
3. Verification email sent to new address with secure tokenized link.
4. User verifies token; API updates canonical email and verification state.
5. Client receives deterministic redirect (for example login/profile) with success state.

### Universal Form Draft + Validation Parity

1. Form schema defines required vs optional fields.
2. UI label helper derives display labels from schema metadata.
3. Draft helper stores/restores form state non-blockingly.
4. Submission payload is validated server-side with matching schema.
5. Errors map back to field-level UI consistently.

### Platform Upload Asset Governance (Cloudinary-First)

1. Any screenshot/image field requests a managed upload via `/api/upload` with scoped intent.
2. Upload service validates file type/size, stores in Cloudinary, and returns canonical asset metadata.
3. Forms persist only canonical asset references (not ad-hoc raw URLs) in draft and submit payloads.
4. APIs reject unsupported raw URL payloads for upload-managed fields and return explicit validation errors.
5. Bug report, ad application, and other image-driven flows share the same upload contract and telemetry.

### Config-Driven Content + Navigation

1. UI requests nav/content/help definitions from config/public-content layer.
2. Admin updates content via operations interfaces.
3. Content cache invalidates and repopulates.
4. All user-visible links/pages consume updated config without hardcoded duplicates.

### Payment Path with Fallback Deprecation

1. Primary gateway flow initializes and verifies via Paystack handlers/webhooks.
2. Order/wallet mutations enforce verified payment state server-side.
3. Feature flag controls optional bank-transfer screenshot fallback.
4. Observability tracks fallback usage until safe deprecation/removal.

---

## 5. UI/UX Considerations (Design System Aligned)

- Maintain semantic DS tokens (avoid ad-hoc palette classes in shared primitives).
- Required fields should be labeled explicitly; optional labels only where truly optional.
- Persist user inputs across refresh/navigation for long forms (signup/vendor/ad/bug report).
- Replace free-text image URL entry points with clear upload-first controls and predictable success/error states.
- Keep loading/skeleton states stable to prevent layout shifts and icon/image flash.
- Remove duplicate layout artifacts (double header/footer) and unify route chrome behavior.
- Keep mobile-first usability and accessible interactions (focus states, keyboard support, clear error copy).

---

## 6. Potential Risks or Edge Cases

- Interrupted local diff may include overlapping/unverified changes; stabilization must come first.
- Email-change flow can create account lockout if token/session revocation rules are inconsistent.
- Schema/UI mismatch can persist if field metadata is not centralized.
- Prisma enum drift (especially `Position`) can continue causing vendor registration failures if schema and constants are not synchronized.
- Config-driven migration can temporarily break links if route aliases are removed too early.
- Payment webhook replay/idempotency errors can duplicate order/wallet mutations.
- Mixed upload strategies (raw URL + managed uploads) can create inconsistent moderation/security behavior and broken assets.
- Bulk deletion can remove still-referenced files if dependency audit is incomplete.
- Vendor verification policy must avoid blocking store setup while still protecting buyers at checkout.

Mitigations:

- Execute in phased slices with validation gates.
- Add regression tests at each risky boundary before broad cleanup.
- Keep compatibility redirects/feature flags until replacement paths are proven stable.

---

## 7. Concrete Implementation Tasks (Appended to Task Queue)

Cloud-session execution tasks are now in:

- `.ai-system/planning/task-queue.md` under `Cloud Session Continuation Queue (2026-04-04)`.

Task groups included there:

- Baseline stabilization of interrupted refactor work.
- Signup + role bug completion with `Worker` removed as signup role and `Position` enum parity restored.
- Vendor verification docs + requiredness parity (`ID + Business Registration + Utility Bill` required) and editable `businessAddress` lifecycle.
- Secure email-change/reverify channel.
- Universal form retention + schema/UI required-label parity.
- Config-driven links/content/help completion.
- Preferences wiring + mandatory system-notification behavior.
- Vendor verification-state policy enforcement.
- Bug-report and operations CRUD hardening.
- Platform-wide upload governance hardening: migrate raw image URL paths to Cloudinary-managed upload flow.
- Paystack production handler upgrade with feature-flag fallback.
- Bulk obsolete file/route cleanup and final production-readiness verification.

---

## 8. Required Updates for system-architecture.md

When implementation lands, update architecture docs for:

- Email-change + re-verification flow (new sequence under auth/account flows).
- Universal form retention/restore flow and schema-label parity strategy.
- Position enum synchronization decision (`Member`/`Non-Member` support) and migration note.
- Config-driven help/content/navigation data flow and cache invalidation points.
- Vendor verification-state order gating behavior.
- Cloudinary-first upload asset pipeline and field-level rejection policy for raw URLs.
- Paystack production webhook/verification flow plus fallback feature-flag behavior.
- Cleanup milestone in architecture history (legacy route/component removal completion).

---

## Cloud Model Autonomous Execution Instructions

1. Read in order:
   - `.ai-system/agents/general-instructions.md`
   - `.ai-system/planning/task-queue.md`
   - `.ai-system/planning/project-plan.md`
   - `.ai-system/agents/system-architecture.md`
   - `.ai-system/agents/design-system.md`
   - `.ai-system/agents/repair-system.md`
   - `.ai-system/project-context.md`
   - This file.
2. Start with baseline stabilization (do not skip): audit current diff and run lint/typecheck/tests.
3. Execute queue tasks top-to-bottom in small validated slices.
4. After each major slice, update:
   - `.ai-system/planning/task-queue.md`
   - `.ai-system/checkpoints/session-log.md`
   - `.ai-system/summaries/dev-history.md`
   - `.ai-system/memory/project-decisions.md` (if decisions were made)
   - `.ai-system/agents/system-architecture.md` (if flow/structure changed)
5. Keep compatibility guards/redirects/flags until replacement behavior is proven by tests.
6. Before stopping, run final quality gate:
   - `npm run lint`
   - `npx tsc --noEmit`
   - targeted + high-risk Vitest suites
   - if Prisma enum/schema changes were made, create and apply a migration (`prisma migrate dev`) and regenerate Prisma client
   - route/dead-link sanity checks
7. End only when queue items are marked accurately and residual risks are explicitly documented.

---

## Cloud Kickoff Prompt (2026-04-05)

Use this exact prompt to start the next cloud coding session:

```
You are continuing MyHarvestHub production-readiness execution in a cloud session.

Read in order:
1) .ai-system/agents/general-instructions.md
2) .ai-system/planning/task-queue.md
3) .ai-system/planning/project-plan.md
4) .ai-system/agents/system-architecture.md
5) .ai-system/agents/design-system.md
6) .ai-system/agents/repair-system.md
7) .ai-system/project-context.md
8) .ai-system/planning/cloud-session-temp-plan-2026-04-04.md

Then execute ONLY this queue block, in order:
- .ai-system/planning/task-queue.md -> "Cloud Session Execution Queue (2026-04-05 Exhaustive Audit)"

Hard requirements:
- Fix operations double-header duplication first before any feature expansion.
- Deliver vendor operations products page and sidebar routing correction.
- Complete email-change reverification closure end-to-end with secure token handling.
- Replace placeholder operations dashboard cards with live role-scoped KPI cards.
- Migrate about/privacy to config/public-content pattern with fallback safety.
- Improve advertise/profile field completeness per queue tasks.
- Keep Cloudinary-first upload governance and existing signup role/verification decisions intact.

Validation gates after each major slice:
- npm run lint
- npx tsc --noEmit
- targeted vitest suites for touched flows
- route/dead-link audit scripts when nav/routes are touched

Documentation updates required after each major slice:
- .ai-system/planning/task-queue.md
- .ai-system/checkpoints/session-log.md
- .ai-system/summaries/dev-history.md
- .ai-system/memory/project-decisions.md (if new decisions)
- .ai-system/agents/system-architecture.md (if architecture/data flow changed)

Do not stop after analysis. Implement, validate, and document in one pass. If blocked, record exact blocker and proceed to next non-blocked task.
```

---

## Definition of Done for Cloud Session

- Cloud Session Execution Queue (2026-04-05 Exhaustive Audit) items are completed or explicitly marked blocked with reason.
- No critical route/API/auth/payment/signup regressions remain.
- Vendor signup accepts valid `Member`/`Non-Member` position selections without backend/database errors.
- Vendor verification enforces all three required documents and `businessAddress` remains editable post-auth.
- Upload-managed flows no longer rely on raw screenshot/image URLs where Cloudinary upload pipeline is expected.
- All changed behavior is test-backed at least by targeted regression coverage.
- `.ai-system` artifacts reflect final state accurately.
