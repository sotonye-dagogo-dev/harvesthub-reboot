# Cloud Session Temp Plan — Design Token Compliance + Payment Init Diagnostics + Discount Parity

Date: 2026-04-19  
Scope: UI design-system compliance hardening, Paystack initialize diagnostics refinement, and cart/checkout discount parity

---

## Context & Problem Statements

1. Hero banner action-panel navigation controls still rely on theme-specific styling; controls should align to shared design-system semantic tokens.
2. Some form controls remain visually white in dark mode; platform-wide DS-safe input/textarea/select surface fallback is needed.
3. Wallet/checkout payment initialization can fail with transport/provider restrictions (`ERR_SSL_PROTOCOL_ERROR`, `PAYMENT_PROVIDER_IP_NOT_ALLOWED`) and needs clearer operator diagnostics for serverless deployments.
4. Cart/checkout should honor product discount pricing (original vs discounted display and totals) while preserving voucher discount behavior.

---

## Scope Lock

Implement only:

1. Hero banner action-panel nav control token alignment.
2. Native form control dark-mode surface compliance improvement.
3. Payment initialize error-diagnostics/operator guidance refinement for API IP allowlist + serverless egress context.
4. Cart/checkout discount parity across line items and totals, with voucher flow untouched except accurate composition with discounted subtotal.
5. Focused tests for touched pricing logic plus validation/documentation closure.

Do not:

- Change payment provider credentials/runtime secrets contract.
- Introduce new dependencies.
- Refactor unrelated home/operations modules.

---

## Execution Slices

- [ ] Slice 1 — Hero action panel token compliance
  - Replace hardcoded/variant theme styling on prev/next controls with semantic DS token classes.
  - Preserve accessibility labels and focus states.

- [ ] Slice 2 — Platform form surface dark-mode compliance
  - Add base styling guard for native `input/textarea/select` so dark mode does not regress to white backgrounds.
  - Preserve existing component-level class overrides.

- [ ] Slice 3 — Payment initialize diagnostics hardening
  - Update payment error mapping/operator guidance for `PAYMENT_PROVIDER_IP_NOT_ALLOWED` to reflect serverless/Vercel egress realities.
  - Extend provider-unavailable pattern matching for SSL/TLS transport failures.
  - Mirror updated operator guidance in operations settings diagnostics copy.

- [ ] Slice 4 — Cart/checkout discount parity
  - Ensure cart state stores effective unit price plus original discount metadata.
  - Ensure add-to-cart entry points apply discounted pricing.
  - Render original + discounted amounts in cart/checkout line items and add product-discount rows in summaries.
  - Preserve voucher discount total behavior and stacking order.

- [ ] Slice 5 — Validation + closure
  - Run `npm run lint`, `npm run build`, and focused touched tests.
  - Sync `.ai-system` docs (`task-queue`, `session-log`, `dev-history`, repair/decisions if needed).
  - Run parallel validation and raise PR.

---

## Validation Gates

1. `npm run lint` passes.
2. `npm run build` passes (known sitemap warnings allowed if unchanged).
3. Focused touched tests pass:
   - `lib/store/__tests__/cartStore.reconcile.test.ts`
   - `app/api/payments/initialize/__tests__/route.test.ts`

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
9. `.ai-system/planning/cloud-session-temp-plan-2026-04-19-design-payment-discount-assurance.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only slices listed in this temp plan.
- Non-breaking lock: preserve existing API response envelopes and checkout/wallet public contracts.
- Config-driven lock: keep payment diagnostics and UI copy contract-based, no credential logic shortcuts.
- UX lock: maintain responsive layout and accessibility.
- Do not stop at analysis; implement, validate, document, and raise PR in one run.
