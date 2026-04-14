# Cloud Session Temporary Execution Plan (2026-04-13)

> Purpose: Execute the commerce assurance wave in one uninterrupted cloud session: order confirmation automation, settlement release, payout/refund lifecycle, banner parity hardening, vendor-card consistency, and guarded WhatsApp contact flow.

---

## Operation Snapshot

This handoff packages planning already completed locally:

- Feature spec in `.ai-system/planning/project-plan.md`:
  - `Feature Spec - Commerce Assurance Wave: Order-to-Payout Automation + Banner Parity + Vendor Contact Safety (Planned 2026-04-13)`.
- Implementation queue in `.ai-system/planning/task-queue.md`:
  - `Feature Planning Queue (2026-04-13) - Commerce Assurance Wave: Order-to-Payout Automation + Banner Parity + Vendor Contact Safety`.
- Decision log in `.ai-system/memory/project-decisions.md`:
  - `Commerce Assurance Wave Uses Lifecycle-First Orchestration with Explicit Migration Budget`.

Execution target for cloud session: implement all slices in one pass, validate each slice, and fully sync .ai-system artifacts.

---

## Read Order (Mandatory)

1. `.ai-system/agents/general-instructions.md`
2. `.ai-system/planning/task-queue.md`
3. `.ai-system/planning/project-plan.md`
4. `.ai-system/agents/system-architecture.md`
5. `.ai-system/agents/design-system.md`
6. `.ai-system/agents/repair-system.md`
7. `.ai-system/project-context.md`
8. `.ai-system/memory/project-decisions.md`
9. This file

---

## Locked Constraints

- Scope lock: implement only the queue block for 2026-04-13 commerce assurance wave.
- Lifecycle lock: keep transitions deterministic, idempotent, and append-only in audit timelines.
- Scheduler lock: no blocking request-path loops; timed jobs must be idempotent and retry-safe.
- Banner parity lock: operations preview must match runtime behavior for each placement and viewport.
- Contact safety lock: WhatsApp redirect must be guard-first with explicit user acknowledgement.
- Compliance lock: after each major slice, update queue + session log + dev history (and decisions/architecture/repair when changed).

---

## Feature Objective

Deliver a resilient commerce lifecycle that safely automates buyer confirmation fallback and downstream money movement while preserving traceability, then close frontend parity gaps for banner placement/rendering, vendor-card consistency, and vendor-contact safety.

---

## Execution Slices (Run In Order, No Planning Stop)

### Slice 0 - Bootstrap, Diff Audit, Baseline

Deliverables:

- Verify required .ai-system files exist and are readable.
- Audit changed files to avoid conflicts.
- Run baseline checks before edits.

Validation:

- `npm run lint`
- `npx tsc --noEmit`

Docs:

- Add cloud kickoff note to session log.

### Slice 1 - Commerce Lifecycle State Machine + Migration Plan

Deliverables:

- Normalize order status transitions and remove unsupported transition values in handlers.
- Define explicit event timeline contract for delivery confirmation, auto-confirm, settlement release, payout/refund transitions.
- Draft/implement Prisma schema updates required for lifecycle persistence.

Validation:

- Focused type/lint checks on schema, constants, and order route handlers.

Docs:

- Queue + checkpoint + decision update (if scope changes).

### Slice 2 - Buyer Delivery Confirmation + 48-Hour Auto-Confirm

Deliverables:

- Add buyer confirmation endpoint/UI trigger for delivered orders.
- Add scheduled auto-confirm handler for overdue delivered orders.
- Add idempotency guard to avoid duplicate confirm/release effects.

Validation:

- Targeted tests for manual confirm, auto-confirm, and duplicate-trigger safety.

Docs:

- Queue + checkpoint + dev-history updates.

### Slice 3 - Settlement Release + Wallet Ledger Integrity

Deliverables:

- Implement held-to-available settlement release tied to confirmation event.
- Ensure release writes durable timeline/audit records.
- Prevent negative-balance or double-release anomalies.

Validation:

- Targeted tests for release success/failure/race scenarios.

Docs:

- Queue + checkpoint + architecture flow sync (if needed).

### Slice 4 - Payout Orchestration (Manual Withdrawal + Auto-Bank Transfer)

Deliverables:

- Separate payout intent/request from provider transfer completion.
- Add provider abstraction for Paystack transfer lifecycle updates.
- Add retry/failure/idempotency handling with provider reference tracking.

Validation:

- Targeted payout lifecycle tests (pending -> processing -> success/failure).

Docs:

- Queue + checkpoint + dev-history updates.

### Slice 5 - Refund Lifecycle + Reconciliation

Deliverables:

- Add refund request/review/execution flow with audit timeline.
- Handle pre-release vs post-release compensation paths.
- Keep order/payment/refund states consistent under concurrency.

Validation:

- Targeted tests for refund state matrix and compensating ledger behavior.

Docs:

- Queue + checkpoint + repair note if new bug pattern emerges.

### Slice 6 - Commerce Notifications Matrix

Deliverables:

- Add template coverage for delivery confirmation windows, auto-confirm, settlement release, payout states, refund states.
- Ensure mandatory critical notifications remain enforced.

Validation:

- Targeted notification template/dispatch tests for new lifecycle events.

Docs:

- Queue + checkpoint + decisions (if channel policy changes).

### Slice 7 - Banner Parity + Vendor Card Consistency + WhatsApp Guard

Deliverables:

- Enforce placement-specific dimension contract and runtime/preview parity for TOP/HERO/SIDEBAR.
- Implement homepage vendor-card equal-height normalization.
- Add pre-redirect WhatsApp safety warning flow + telemetry marker.

Validation:

- Banner composition and contract tests.
- Vendor-card layout contract test(s).
- WhatsApp guard interaction tests.

Docs:

- Queue + checkpoint + architecture notes update.

### Slice 8 - Final Quality Gate + Documentation Closure

Deliverables:

- Complete all queue items in the 2026-04-13 section or mark blockers with exact reasons.
- Ensure migration reporting is explicit in final summary.

Validation (required):

- `npm run lint`
- `npx tsc --noEmit`
- Focused/full Vitest for touched slices
- `npm run audit:dead-links`
- `npm run audit:sidebar-routes`

Docs (required):

- `.ai-system/planning/task-queue.md`
- `.ai-system/checkpoints/session-log.md`
- `.ai-system/summaries/dev-history.md`
- `.ai-system/memory/project-decisions.md` (if new decisions)
- `.ai-system/agents/system-architecture.md` (if flow/module updates)
- `.ai-system/agents/repair-system.md` (if new bug/fix patterns are discovered)

---

## Definition of Done

- 2026-04-13 commerce assurance queue section is complete (or blocked with exact reasons).
- Buyer confirmation + 48-hour auto-confirm works with idempotency guarantees.
- Settlement/payout/refund lifecycles are persisted, auditable, and notification-aware.
- Banner parity and vendor-card consistency contracts are enforced and tested.
- WhatsApp handoff is guarded with explicit safety acknowledgement and telemetry.
- Final report clearly states whether schema changed and which Prisma migration(s) were created/applied.
- Validation gates pass and .ai-system artifacts are synchronized.

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
You are continuing MyHarvestHub in a cloud session to implement the commerce assurance wave in one uninterrupted pass.

Read in this exact order:
1) .ai-system/agents/general-instructions.md
2) .ai-system/planning/task-queue.md
3) .ai-system/planning/project-plan.md
4) .ai-system/agents/system-architecture.md
5) .ai-system/agents/design-system.md
6) .ai-system/agents/repair-system.md
7) .ai-system/project-context.md
8) .ai-system/memory/project-decisions.md
9) .ai-system/planning/cloud-session-temp-plan-2026-04-13-commerce-assurance-wave.md

Execution scope (strict):
- Implement ONLY this queue block from .ai-system/planning/task-queue.md:
  "Feature Planning Queue (2026-04-13) - Commerce Assurance Wave: Order-to-Payout Automation + Banner Parity + Vendor Contact Safety"
- Execute all slices in the temp plan in order.
- Do not stop at analysis; implement, validate, and document in one pass.

Locked constraints:
- Keep lifecycle transitions deterministic and idempotent.
- Add guard-first WhatsApp redirect with safety disclaimer before external handoff.
- Keep banner placement preview behavior aligned with runtime rendering.
- If schema changes are needed, create Prisma migration(s) and report them explicitly.

Validation gate after each major slice:
- targeted lint and typecheck for touched scope
- targeted vitest suites for changed behavior

Final gate required:
- npm run lint
- npx tsc --noEmit
- focused/full vitest for touched scope
- npm run audit:dead-links
- npm run audit:sidebar-routes

Documentation updates required after each major slice:
- .ai-system/planning/task-queue.md
- .ai-system/checkpoints/session-log.md
- .ai-system/summaries/dev-history.md
- .ai-system/memory/project-decisions.md when decisions are made
- .ai-system/agents/system-architecture.md when structure/flow changes
- .ai-system/agents/repair-system.md when new bug/fix patterns are discovered

Final reporting requirement (mandatory):
At the end, include a dedicated "Schema & Migration Report" section that states:
1) Whether schema changes were made (Yes/No)
2) Exact Prisma models/fields/enums changed
3) Migration name(s) created/applied
4) Backfill/default strategy used
5) Residual migration risks, if any

Stop condition:
- Finish all queue items in the commerce assurance section, or mark exact blockers and continue with remaining non-blocked slices.
```
