# Cloud Session Temp Plan — 2026-04-17 — Card Density + Footer Grid + Wallet Paystack Handoff

## Scope Lock

Implement only this corrective slice:

1. Home product sections: keep horizontal rails, reduce card width so about 2 products are visible at once.
2. Products/category viewer: responsive product-card grid should be 3 columns on mobile and tablet, 4 on large screens.
3. Find vendors page: apply similar responsive card density (3 columns mobile/tablet, 4 large).
4. Footer: grid the general footer links sections block (Quick Links, Support, Contact Us) on mobile.
5. Wallet deposit: fix blank-page redirect behavior and ensure direct handoff to Paystack checkout with fallback navigation.

Out of scope:

- No unrelated visual redesigns.
- No API contract changes outside wallet deposit handoff behavior.
- No schema migrations.

## Execution Slices

- [ ] Slice A — Home rail density restoration
  - Adjust only the home product rail item width classes to restore two-visible-card behavior.
- [ ] Slice B — Product discovery grid density restoration
  - Apply `3/3/4` responsive columns on products/category viewer grid.
- [ ] Slice C — Vendor discovery grid parity
  - Apply `3/3/4` responsive columns on `/vendors`.
- [ ] Slice D — Footer links-section mobile grid
  - Ensure Quick Links + Support + Contact Us sections are rendered as a mobile grid block.
- [ ] Slice E — Wallet deposit Paystack handoff reliability
  - Remove pre-open blank-tab flow.
  - Open Paystack authorization URL directly and fallback to same-tab navigation when popup is blocked.

## Validation Gates (required)

1. `npm run lint`
2. `npm run build`
3. Focused touched tests:
   - `npx vitest run app/wallet/__tests__/page.role-parity.test.tsx app/components/__tests__/HomeContent.banner-layout.test.tsx components/__tests__/ProductsContent.discovery-contract.test.tsx`

If focused tests fail due known baseline unrelated failures, record exact failure and confirm no regressions in touched logic.

## Documentation Sync List (required)

- `ai-system/planning/task-queue.md`
- `ai-system/checkpoints/session-log.md`
- `ai-system/summaries/dev-history.md`
- `ai-system/system-architecture.md` (only if architectural contract changed)
- `ai-system/memory/project-decisions.md` (only if a durable decision is introduced)
- `ai-system/repair-system.md` (only if new recurring failure pattern was discovered/fixed)

## Copy/Paste Single-Pass Kickoff Prompt

Read in this exact order:
1. ai-system/protocols/entry-protocol.md
2. ai-system/planning/task-queue.md
3. ai-system/planning/project-plan.md
4. ai-system/system-architecture.md
5. ai-system/design-system.md
6. ai-system/repair-system.md
7. ai-system/project-context.md
8. ai-system/memory/project-decisions.md
9. ai-system/planning/cloud-session-temp-plan-2026-04-17-card-density-footer-wallet-paystack.md

TASK: Execute this temp plan in one uninterrupted pass.

Rules:
- Scope lock: implement only the slices defined in this temp plan.
- Non-breaking lock: preserve public contracts and existing route/API behavior.
- Config-driven lock: avoid introducing hardcoded behavior outside touched responsive classes/handoff call path.
- UX lock: verify responsive behavior on mobile/tablet/large classes for touched grids/rails/footer.
- Complete implementation, validation, and docs sync in one run.

Completion output must include:
1. Completed slice checklist with status
2. Files changed by slice
3. Validation summary (`lint`, `build`, focused tests)
4. Blockers with exact file/line context
5. Documentation sync summary for all required `ai-system` docs
