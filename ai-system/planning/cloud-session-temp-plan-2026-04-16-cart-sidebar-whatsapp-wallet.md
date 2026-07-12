# Cloud Session Temporary Execution Plan (2026-04-16)

> Purpose: Execute one uninterrupted cloud session for cart freshness/reconciliation, checkout live pre-payment validation, sidebar overflow containment, WhatsApp guard redirect restoration, and wallet deposit handoff reliability.

---

## Operation Snapshot

This handoff packages planning completed locally:

- Feature spec in `ai-system/planning/project-plan.md`:
  - `Feature Spec - Cart State Reconciliation + Sidebar Overflow Guard + WhatsApp/Wallet Handoff Reliability (Planned 2026-04-16)`
- Queue block in `ai-system/planning/task-queue.md`:
  - `Cloud Session Execution Queue (2026-04-16) — Cart Freshness + Checkout Live Validation + Sidebar/WhatsApp/Wallet Reliability`

Execution target for cloud session: implement all slices in one pass, validate changes, and sync `ai-system` artifacts.

---

## Read Order (Mandatory)

1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. This file

---

## Locked Constraints

- Scope lock: implement only the queue block for this 2026-04-16 reliability pass.
- Non-breaking lock: preserve existing route contracts and response envelopes.
- Safety lock: cart/order validation must handle product unavailability and stock drift safely.
- Runtime lock: reuse in-memory/runtime product data where available before doing live checks.
- UX lock: desktop/mobile layout must remain responsive; sidebar must not create page overflow.
- Completion lock: do not stop at analysis; implement, validate, and document in one run.

---

## Execution Slices (Run In Order, No Planning Stop)

### Slice 0 - Baseline + Scope Audit

- Confirm required `ai-system` files are readable.
- Confirm baseline command state and existing failures.

Validation:

- `npm run lint`
- `npm run build`
- `npm run test` (capture known unrelated failures)

### Slice 1 - Cart Runtime Reconciliation

- Add reusable cart reconciliation in `lib/store/cartStore.ts`.
- Reconcile persisted cart items against runtime product cache with safe remove/clamp/update behavior.
- Apply reconciliation feedback in cart UI.

Validation:

- Focused cart/store-related tests if present.

### Slice 2 - Checkout Live Pre-Payment Guard

- Reconcile checkout cart with runtime cache on load.
- Perform live product-state refresh right before payment/order processing.
- Pause checkout when cart changed and require user re-review before continuing.
- Keep final DB checks in order creation path intact.

Validation:

- Focused checkout/order tests if present.

### Slice 3 - Sidebar Overflow Containment

- Fix home sidebar rail width/overflow classes so normal desktop widths do not overflow the page.
- Preserve intended internal rail scrolling behavior.

Validation:

- Home/banner layout focused tests.

### Slice 4 - WhatsApp + Wallet Handoff Reliability

- Restore reliable external navigation in `/contact/whatsapp`.
- Restore reliable wallet deposit payment handoff with popup-safe fallback behavior.

Validation:

- Focused WhatsApp and wallet page tests.

### Slice 5 - Final Validation + Documentation Closure

Validation (required):

- `npm run lint`
- `npm run build`
- Focused `vitest` for touched suites

Docs (required):

- `ai-system/planning/task-queue.md`
- `ai-system/checkpoints/session-log.md`
- `ai-system/summaries/dev-history.md`
- `ai-system/system-architecture.md` (if changed)
- `ai-system/memory/project-decisions.md` (if changed)
- `ai-system/repair-system.md` (if changed)

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
Execute command: cloud-session-single-pass.md
TempPlan: ai-system/planning/cloud-session-temp-plan-2026-04-16-cart-sidebar-whatsapp-wallet.md
Directive: Raise a PR when you're done. Keep scope locked to cart refresh/live checkout checks, sidebar overflow containment, WhatsApp redirect restoration, and wallet deposit reliability fixes.
```
