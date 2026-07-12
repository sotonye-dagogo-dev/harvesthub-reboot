# Cloud Session Temp Plan — Top/Hero Banner Navigator Rework + Fill Behavior

Date: 2026-04-18
Scope: Remove top-banner navigators, relocate hero controls to compact below-image panel, enforce top/ad fill behavior, and ship PR-ready closure

---

## Context & Problem Statements

1. **Top-banner navigator controls are visually intrusive** and client wants them removed completely.
2. **Hero controls (arrows/dots/Know More) currently overlay the image**, increasing visual clutter and effective section weight.
3. **Top and ad banner assets must fill containers with no empty space**, relying on provided placement dimension guidance.

---

## Scope Lock

Implement only:

1. Top banner navigator removal + retained auto-rotation/link support.
2. Hero control relocation into a thin action panel below image with smaller control text sizing.
3. Fill-first image behavior for top and ad/sidebar banner renderers.
4. Targeted test updates and validation + docs closure + PR.

Do not:

- Refactor unrelated home/discovery layout sections.
- Change banner API contracts or schema.
- Alter unrelated global navigation/header/footer behavior.

---

## Execution Slices

- [ ] Slice 1 — Top banner simplification
  - Remove top banner left/right controls and bottom indicators.
  - Keep auto-rotation and click-through behavior intact.

- [ ] Slice 2 — Hero action panel relocation
  - Remove on-image hero controls (arrows/dots/Know More overlay).
  - Add compact panel below hero image containing nav, indicator, and Know More.
  - Reduce nav/Know More control text/button sizing while keeping keyboard focus visibility.

- [ ] Slice 3 — Fill-first image rendering parity
  - Update top and ad/sidebar banner image fit mode to fill container without empty space.
  - Align banner placement preview image fit to runtime expectations.

- [ ] Slice 4 — Validation and closure
  - Run `npm run lint`, `npm run build`, and focused touched banner tests.
  - Sync `ai-system` docs: queue, checkpoints, history, architecture/decisions if changed.
  - Raise PR.

---

## Validation Gates

1. `npm run lint` passes.
2. `npm run build` passes (allow existing known sitemap warnings if unchanged).
3. Focused touched banner tests pass.

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
9. `ai-system/planning/cloud-session-temp-plan-2026-04-18-banner-navigator-rework.md`

TASK: Execute this temp plan in one pass.

Rules:
- Scope lock: implement only slices listed in this temp plan.
- Non-breaking lock: preserve existing banner data contracts and rotation semantics.
- Config-driven lock: keep labels/timing based on existing banner config usage.
- Modularity lock: keep top-banner and hero behaviors isolated to their components.
- UX lock: validate desktop/mobile control placement and compact panel behavior.
- Do not stop at analysis; implement, validate, document, and raise PR in one run.

Completion output must include:
1. Completed checklist by slice
2. Files changed by slice
3. Validation summary
4. Blockers (if any)
5. Documentation sync summary for required `ai-system` files
