# Cloud Session Temp Plan — WhatsApp Auth Guard Continuation + Pickup Copy + Voucher Scope Expansion

Date: 2026-04-17
Scope: Auth-guarded WhatsApp redirect continuity + pickup copy update + dynamic voucher scope/visibility controls

---

## Context & Problem Statements

1. **WhatsApp guard currently allows unauthenticated external handoff flow** and does not guarantee post-signup continuation/refire to the same guarded chat intent.
2. **Pickup copy needs wording update** from “available at Sunday service (1st and 2nd) midweek” style to “available at Sunday or Midweek services”.
3. **Voucher controls need expansion** so operations can configure applicability by campuses/categories/products/vendors and create private code-only vouchers not shown on buyer voucher dashboard.

---

## Scope Lock

Implement only:

1. Auth guard + safe continuation/refire for `/contact/whatsapp` through signup → verify-email → login.
2. Pickup copy update on product detail.
3. Voucher scope/visibility expansion in admin APIs/UI and buyer/checkout interpretation.

Do not:

- Refactor unrelated auth flows.
- Add schema migrations unless strictly required.
- Change unrelated checkout/payment contracts.

---

## Execution Slices

- [x] Slice 1 — WhatsApp auth guard continuation safety
  - Guard `/contact/whatsapp` for authenticated users.
  - Persist safe internal continuation path for delayed/interrupted signup.
  - Refire continuation after successful verify-email + login.

- [x] Slice 2 — Pickup wording update
  - Update product detail pickup copy to “Available at Sunday or Midweek services”.

- [x] Slice 3 — Voucher dynamic scope + private visibility controls
  - Add reusable voucher scope parser/matcher (campus/category/product/vendor + visibility).
  - Extend admin voucher create/update/list behavior for new scope inputs and hidden/private voucher mode.
  - Extend operations voucher UI form/table to configure and display new scope/visibility state.

- [x] Slice 4 — Voucher interpretation in buyer flows
  - Hide private vouchers from `/api/vouchers/my` dashboard payload.
  - Enforce configured voucher scope in `/api/vouchers/validate` using checkout context.
  - Send checkout context when applying voucher.

- [x] Slice 5 — Validation + docs closure + PR
  - Run `npm run lint`, `npm run build`, and focused touched tests.
  - Sync `.ai-system` docs (`task-queue`, `session-log`, `dev-history`, architecture/decisions if required).
  - Raise PR.

---

## Validation Gates

1. `npm run lint` passes.
2. `npm run build` passes (allowing known sitemap warnings if unchanged).
3. Focused touched tests for WhatsApp guard and voucher flows pass.

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
9. `.ai-system/planning/cloud-session-temp-plan-2026-04-17-whatsapp-auth-voucher-expansion.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only the slices listed in this temp plan.
- Non-breaking lock: preserve public contracts and avoid risky regressions.
- Config-driven lock: keep voucher logic configurable and interpretable.
- Modularity lock: use shared helpers for redirect safety and voucher scope parsing.
- UX lock: ensure mobile/desktop continuity and no dead-end in signup-to-chat continuation.
- Do not stop at analysis; implement, validate, and document in one run.

Completion output must include:
1. Completed checklist by slice
2. Files changed by slice
3. Validation summary
4. Blockers (if any)
5. Documentation sync summary for required `.ai-system` files
