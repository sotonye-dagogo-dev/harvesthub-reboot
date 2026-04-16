# Cloud Session Handoff Template

> Purpose: Standard handoff template for one-pass cloud implementation with strict .ai-system compliance.

---

## Operation Snapshot

- Feature spec:
  - [reference section in .ai-system/planning/project-plan.md]
- Queue block:
  - [reference section in .ai-system/planning/task-queue.md]
- Related decisions:
  - [reference section in .ai-system/memory/project-decisions.md]

---

## Read Order (Mandatory)

1. .ai-system/agents/general-instructions.md
2. .ai-system/planning/task-queue.md
3. .ai-system/planning/project-plan.md
4. .ai-system/agents/system-architecture.md
5. .ai-system/agents/design-system.md
6. .ai-system/agents/repair-system.md
7. .ai-system/project-context.md
8. .ai-system/memory/project-decisions.md
9. This temp plan file

---

## Locked Constraints

- Scope lock: [exact queue block name]
- Non-breaking lock: [contract compatibility requirement]
- Config-driven lock: [what must be configuration-backed]
- Modularity lock: [modules/services separation requirement]
- UX lock: [responsive + accessibility constraints]
- Validation lock: [required lint/typecheck/tests per slice]
- Docs lock: queue + checkpoint + history updates are mandatory

---

## Feature Objective

[2-4 sentence objective]

---

## Execution Slices (Ordered)

### Slice 0 - Bootstrap and Baseline

Deliverables:

- [ ] Verify .ai-system bootstrap files are readable
- [ ] Check current diff and avoid scope collisions
- [ ] Run baseline checks

Validation:

- [command]

Docs:

- [required updates]

### Slice 1 - [name]

Deliverables:

- [ ] item

Validation:

- [command]

Docs:

- [required updates]

### Slice 2 - [name]

Deliverables:

- [ ] item

Validation:

- [command]

Docs:

- [required updates]

### Slice Final - Quality Gate + Documentation Closure

Deliverables:

- [ ] Complete queue items or mark blockers with exact reason

Validation (required):

- npm run lint
- npx tsc --noEmit
- [focused tests]

Docs (required):

- .ai-system/planning/task-queue.md
- .ai-system/checkpoints/session-log.md
- .ai-system/summaries/dev-history.md
- .ai-system/agents/system-architecture.md (if changed)
- .ai-system/memory/project-decisions.md (if changed)
- .ai-system/agents/repair-system.md (if changed)

---

## Definition of Done

- [ ] Queue block complete or explicitly blocked with evidence
- [ ] Validation gate passed
- [ ] .ai-system artifacts synchronized

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
You are continuing MyHarvestHub in a cloud session.

Read in this exact order:
1) .ai-system/agents/general-instructions.md
2) .ai-system/planning/task-queue.md
3) .ai-system/planning/project-plan.md
4) .ai-system/agents/system-architecture.md
5) .ai-system/agents/design-system.md
6) .ai-system/agents/repair-system.md
7) .ai-system/project-context.md
8) .ai-system/memory/project-decisions.md
9) [this temp plan file path]

Execution scope (strict):
- Implement ONLY the queue block referenced by this temp plan.
- Execute all slices in order without stopping at analysis.
- Keep changes non-breaking, config-driven, modular, and responsive.

Validation requirement:
- Run focused validation after each major slice.
- Run final lint, typecheck, and touched tests.

Documentation requirement:
- Update queue, session log, and dev history.
- Update architecture/decisions/repair docs when behavior or patterns change.
```
