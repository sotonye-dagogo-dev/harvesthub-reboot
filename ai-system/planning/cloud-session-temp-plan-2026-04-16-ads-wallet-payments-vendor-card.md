# Cloud Session Temporary Execution Plan (2026-04-16)

> Purpose: Execute one uninterrupted cloud session for ad/banner duplication prevention, sidebar ad rail containment and motion behavior, wallet action-row containment, payment initialize hardening, origin-aware WhatsApp chat intent, dynamic metadata parity, and home vendor-card redesign.

---

## Operation Snapshot

This handoff packages planning completed locally:

- Feature spec in ai-system/planning/project-plan.md:
  - Feature Spec - Ads/Wallet UX Reliability + Payment Initialize Hardening + WhatsApp Intent + Metadata Parity (Planned 2026-04-16)
- Queue block in ai-system/planning/task-queue.md:
  - Cloud Session Execution Queue (2026-04-16) — Ads Duplication Guard + Sidebar Rail + Wallet/Payment + WhatsApp Intent + Metadata + Vendor-Card UX

Execution target for cloud session: implement all slices in one pass, validate each slice, and fully sync .ai-system artifacts.

---

## Read Order (Mandatory)

1. ai-system/protocols/entry-protocol.md
2. ai-system/planning/task-queue.md
3. ai-system/planning/project-plan.md
4. ai-system/system-architecture.md
5. ai-system/design-system.md
6. ai-system/repair-system.md
7. ai-system/project-context.md
8. ai-system/memory/project-decisions.md
9. This file

---

## Locked Constraints

- Scope lock: implement only the 2026-04-16 cloud session queue block.
- Non-breaking lock: preserve API envelopes and route contracts; if changes are needed, provide compatibility guards.
- Config-driven lock: spacing/overflow/scroll speeds and similar behavior must be configurable, not hardcoded.
- Modularity lock: factor reusable logic into shared helpers/hooks/config modules.
- Responsiveness lock: desktop and mobile behaviors must both be intentional and tested.
- Duplication lock: guard against duplicate writes from rapid submit, retries, and parallel route surfaces.
- Docs lock: after each major slice, update queue + checkpoint + history (and architecture/decisions/repair when changed).

---

## Feature Objective

Harden UX and mutation reliability in high-visibility commerce surfaces by preventing duplicate ad/banner writes, enforcing bounded sidebar rail layout behavior, fixing wallet action overflow, classifying Paystack initialize failures into actionable app-level signals, improving chat intent payload quality, enforcing dynamic metadata parity, and standardizing vendor card layout for consistent rendering.

---

## Execution Slices (Run In Order, No Planning Stop)

### Slice 0 - Bootstrap, Diff Audit, Baseline

Deliverables:

- Verify required .ai-system files are readable.
- Audit changed files and keep strict scope.
- Run baseline checks for touched domains.

Validation:

- npx tsc --noEmit

Docs:

- Add cloud kickoff note to session log.

### Slice 1 - Banner/Ad Duplication Guardrails

Deliverables:

- Add client-side submit lock and idempotency metadata for:
  - app/(operations)/operations/banners/page.tsx
  - app/advertise/page.tsx
  - app/ad-application/page.tsx
- Add API-side dedupe/idempotency handling for:
  - app/api/banners/route.ts
  - app/api/banners/[id]/route.ts
  - app/api/ad-applications/route.ts
  - app/api/ads/apply/route.ts
- Reconcile semantics between ad-application endpoints to avoid route-level duplication drift.

Validation:

- Focused tests for duplicate submit replay and idempotent response behavior.

Docs:

- Queue + checkpoint + repair update if a new duplication pattern is fixed.

### Slice 2 - Sidebar Rail Overflow + Auto-Scroll Behavior

Deliverables:

- Add/extend config module for rail sizing, gap, max height, and motion behavior.
- Desktop behavior: parent-safe containment with internal vertical scroll.
- Mobile behavior: horizontal rail with bounded tile sizing and no parent overflow.
- Optional auto-scroll: implement pause/resume safety for hover, focus, press/hold, touch, and manual interaction.
- Reduce desktop sidebar gap to compact client-approved spacing.

Validation:

- Focused UI tests for overflow classes, pause/resume behavior, and manual interaction safety.

Docs:

- Queue + checkpoint + architecture update for sidebar rail contract.

### Slice 3 - Wallet Action-Row Containment Fix

Deliverables:

- Ensure Deposit/Withdraw controls never escape wallet card/container on desktop and narrow tablet breakpoints.
- Preserve existing role/policy behavior and messaging.

Validation:

- Focused wallet page layout test(s) for action container bounds.

Docs:

- Queue + checkpoint update.

### Slice 4 - Payment Initialize Hardening (Paystack IP Restriction)

Deliverables:

- Add explicit provider error mapping in initialize path for Paystack IP restriction and similar upstream hard failures.
- Return user-safe message with actionable code, and operator guidance payload where appropriate.
- Confirm and preserve amount contract: initialize requires app-supplied amount prior to provider checkout.
- Add optional operations diagnostics visibility for payment initialization failure taxonomy.

Validation:

- Focused API tests for mapped provider error handling (including IP-not-allowed scenario).

Docs:

- Queue + checkpoint + decisions (if contract taxonomy changes).

### Slice 5 - Chat Intent Context + WhatsApp Icon Consistency

Deliverables:

- Update product-page chat CTA to include WhatsApp icon in expected green styling.
- Add origin-aware prefilled chat message composition for product-page context:
  - includes product name,
  - includes canonical product URL,
  - uses meaningful conversational starter text.
- Add origin-aware prefilled chat message composition for vendor-page context:
  - includes vendor/store name,
  - includes canonical vendor URL,
  - uses meaningful conversational starter text.
- Ensure `/contact/whatsapp` guard payload receives normalized context fields with safe fallback behavior.

Validation:

- Focused tests for origin-aware chat payload generation and CTA rendering consistency.

Docs:

- Queue + checkpoint + architecture update for WhatsApp intent flow.

### Slice 6 - Dynamic Metadata Parity Audit + Hardening

Deliverables:

- Audit dynamic pages (`products/[id]`, `vendors/[id]`, and adjacent dynamic detail routes as applicable) for metadata completeness.
- Ensure metadata includes `title`, `description`, `image`, and canonical `url` with safe fallback hierarchy.
- Align metadata outputs to Open Graph/Twitter expectations for robust social previews.

Validation:

- Focused tests for metadata fallback behavior on missing name/description/media.

Docs:

- Queue + checkpoint + architecture update for dynamic metadata parity flow.

### Slice 7 - Vendor Card Redesign + Fixed Size Contract

Deliverables:

- Update vendor card layout:
  - smaller logo,
  - store name beside logo,
  - smaller verified/unverified badge below name,
  - full-width secondary info block beneath header.
- Add fixed section sizes and ellipsis/clamp to prevent clipping and card-size drift.
- Keep component reusable and DS-token aligned.

Validation:

- Focused VendorCard rendering tests for structure, truncation, and stable dimensions.

Docs:

- Queue + checkpoint + architecture notes if card contract changes are documented.

### Slice 8 - Final Quality Gate + Documentation Closure

Deliverables:

- Complete all queue items in 2026-04-16 section or mark blockers with exact reasons.

Validation (required):

- npx next lint --file app/components/HomeContent.tsx --file components/features/VendorCard.tsx --file app/wallet/page.tsx --file app/api/payments/initialize/route.ts --file app/advertise/page.tsx --file app/ad-application/page.tsx --file app/(operations)/operations/banners/page.tsx --file app/products/[id]/page.tsx --file app/vendors/[id]/page.tsx --file app/contact/whatsapp/page.tsx
- npx tsc --noEmit
- npm test -- [touched suites]

Docs (required):

- ai-system/planning/task-queue.md
- ai-system/checkpoints/session-log.md
- ai-system/summaries/dev-history.md
- ai-system/system-architecture.md (if changed)
- ai-system/memory/project-decisions.md (if changed)
- ai-system/repair-system.md (if changed)

---

## Definition of Done

- 2026-04-16 queue block is complete (or blocked with exact evidence).
- No duplicate write behavior remains in targeted banner/ad mutation flows.
- Sidebar ad rail is parent-safe, responsive, and interaction-safe.
- Wallet action row is fully contained in desktop view.
- Payment initialize failures are mapped and actionable for both users and operators.
- Product/vendor chat payloads are origin-aware, meaningful, and include canonical source URLs.
- Dynamic product/vendor metadata includes title/description/image/url with safe fallbacks.
- Vendor cards render consistently with fixed structure and no clipping.
- Validation gate passes and .ai-system artifacts are synchronized.

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
You are continuing MyHarvestHub in a cloud session to execute the 2026-04-16 UX/reliability package in one uninterrupted pass.

Read in this exact order:
1) ai-system/protocols/entry-protocol.md
2) ai-system/planning/task-queue.md
3) ai-system/planning/project-plan.md
4) ai-system/system-architecture.md
5) ai-system/design-system.md
6) ai-system/repair-system.md
7) ai-system/project-context.md
8) ai-system/memory/project-decisions.md
9) ai-system/planning/cloud-session-temp-plan-2026-04-16-ads-wallet-payments-vendor-card.md

Execution scope (strict):
- Implement ONLY this queue block from ai-system/planning/task-queue.md:
  Cloud Session Execution Queue (2026-04-16) — Ads Duplication Guard + Sidebar Rail + Wallet/Payment + WhatsApp Intent + Metadata + Vendor-Card UX
- Execute all slices in the temp plan in order.
- Do not stop at analysis; implement, validate, and document in one pass.

Locked constraints:
- Keep all changes non-breaking and backward-compatible unless explicit migration/compat notes are provided.
- Use config-driven modules/helpers for motion/spacing/overflow behavior.
- Ensure desktop and mobile behavior are both verified.
- Ensure duplicate writes are prevented for banner/ad flows.
- Ensure chat intent payloads are origin-aware and include meaningful prefilled text + canonical URL.
- Ensure dynamic metadata parity (`title`, `description`, `image`, `url`) with safe fallbacks.

Validation gate after each major slice:
- touched lint + typecheck + focused tests

Final gate required:
- npx tsc --noEmit
- touched lint for modified files
- focused vitest suites for touched behavior

Documentation required before completion:
- update queue, session log, dev history
- update architecture/decisions/repair docs when behavior or patterns changed
```
