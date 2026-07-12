# Cloud Session Temp Plan — Hero Action Icons + Sidebar Modal Routing

Date: 2026-04-18  
Scope: Minor UI/UX refinements for hero action controls, hero border rounding, and sidebar ad modal-first behavior

---

## Context & Problem Statements

1. Hero action panel controls should be compact icon-first controls instead of text-heavy buttons.
2. Hero "Know More" should be represented as a simple info icon trigger.
3. Hero image area should keep visibly rounded borders (including lower corners).
4. Sidebar ad tile clicks should open modal details first (same behavior as hero Know More), rather than immediate redirect.

---

## Scope Lock

Implement only:

1. Hero action panel control iconization (caret-only prev/next, info icon know-more trigger).
2. Hero viewport rounded-border restoration for image panel.
3. Sidebar ad tile interaction change to open shared ad detail modal viewer.
4. Focused test updates and validation/documentation closure for touched scope.

Do not:

- Change banner API schema/contracts.
- Refactor unrelated home rails/discovery sections.
- Introduce new dependencies.

---

## Execution Slices

- [ ] Slice 1 — Hero action panel icon controls
  - Convert hero prev/next buttons to icon-only caret controls.
  - Replace text Know More button with info icon button while preserving accessible label semantics.

- [ ] Slice 2 — Hero rounded border restoration
  - Ensure hero image viewport has explicit rounded edges so lower image corners remain rounded.

- [ ] Slice 3 — Sidebar modal-first interaction
  - Route sidebar tile click to shared modal details viewer flow.
  - Pass clicked sidebar banner payload into modal and keep CTA actions inside modal.

- [ ] Slice 4 — Validation + closure
  - Run `npm run lint`, `npm run build`, and focused touched tests.
  - Sync `ai-system` docs (`task-queue`, `session-log`, `dev-history`) and raise PR.

---

## Validation Gates

1. `npm run lint` passes.
2. `npm run build` passes (known sitemap warnings allowed if unchanged).
3. Focused touched tests pass:
   - `components/__tests__/BannerCarousel.visual-contract.test.tsx`
   - `app/components/__tests__/HomeContent.banner-layout.test.tsx`

---

## One-Pass Kickoff Prompt (Copy/Paste)

Read in this exact order:
1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. `ai-system/planning/cloud-session-temp-plan-2026-04-18-hero-sidebar-modal-icons.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only slices listed in this temp plan.
- Non-breaking lock: preserve banner data contracts and existing autoplay behavior.
- Modularity lock: keep shared modal logic reusable across hero/sidebar.
- UX lock: maintain responsive layout and keyboard accessibility.
- Do not stop at analysis; implement, validate, document, and raise PR in one run.
