# Cloud Session Temp Plan — Paystack Inline Popup + Webhook Alias Hardening

Date: 2026-04-19  
Scope: Client-side Paystack inline initialization, runtime public-key contract, webhook endpoint compatibility alias, and documentation closure

---

## Context & Problem Statements

1. Current Paystack payment entry points initialize transactions through server-side API calls that can fail under provider IP allowlist constraints.
2. The platform already has webhook signature verification and reconciliation logic, but partner configuration may expect `/api/paystack-webhook` path compatibility.
3. Public key naming may vary by environment (`PAYSTACK_PUBLIC_KEY`, mode-based keys, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`), so compatibility fallback is required.

---

## Scope Lock

Implement only:

1. Runtime-safe payment-config exposure for Paystack public key (sanitized).
2. Reusable inline popup launcher utility for browser flows.
3. Checkout, wallet deposit, and ad-payment entry point migration from server initialize to inline popup.
4. `/api/paystack-webhook` route alias to existing webhook handler.
5. Focused test updates and validation/documentation closure.

Do not:

- Rewrite order/deposit verification business rules outside this migration.
- Introduce new payment libraries/dependencies.
- Refactor unrelated checkout/wallet/ad modules.

---

## Execution Slices

- [ ] Slice 1 — Config contract + env compatibility
  - Extend env/public runtime resolution to support existing key names plus `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` fallback.
  - Expose sanitized `paystackPublicKey` in `/api/payments/config`.

- [ ] Slice 2 — Reusable Paystack inline utility
  - Add script-loader + popup launcher utility wrapping `https://js.paystack.co/v1/inline.js`.
  - Include deterministic client reference helper and callback/close handling.

- [ ] Slice 3 — Client flow migration
  - Migrate checkout card flow to inline popup initialization.
  - Migrate wallet deposit and ad payment initialization to inline popup.
  - Preserve existing mutation contracts and error messaging patterns.

- [ ] Slice 4 — Webhook compatibility endpoint
  - Add `/api/paystack-webhook` POST route that reuses existing webhook signature-verification/reconciliation handler.

- [ ] Slice 5 — Validation + closure
  - Run `npm run lint`, `npm run build`, and focused touched tests.
  - Sync `.ai-system` docs (`task-queue`, `session-log`, `dev-history`, architecture/decisions if needed).
  - Raise PR.

---

## Validation Gates

1. `npm run lint` passes.
2. `npm run build` passes.
3. Focused touched tests pass:
   - `app/ad-application/__tests__/page.test.tsx`
   - `app/api/payments/webhook/__tests__/route.test.ts`

---

## One-Pass Kickoff Prompt (Copy/Paste)

Read in this exact order:
1. `.ai-system/agents/general-instructions.md`
2. `.ai-system/planning/task-queue.md`
3. `.ai-system/planning/project-plan.md`
4. `.ai-system/agents/system-architecture.md`
5. `.ai-system/agents/design-system.md`
6. `.ai-system/agents/repair-system.md`
7. `.ai-system/project-context.md`
8. `.ai-system/memory/project-decisions.md`
9. `.ai-system/planning/cloud-session-temp-plan-2026-04-19-paystack-inline-webhook-assurance.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only slices listed in this temp plan.
- Non-breaking lock: preserve existing API response envelopes and downstream mutation contracts.
- Config-driven lock: honor existing Paystack env naming and avoid hardcoding keys.
- UX lock: preserve responsive behavior and clear payment-state feedback.
- Do not stop at analysis; implement, validate, document, and raise PR in one run.
