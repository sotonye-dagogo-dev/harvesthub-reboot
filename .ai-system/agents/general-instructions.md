# AI Development Protocol — General Instructions

> **IMPORTANT:** This is the master instruction file for all AI agents working on this project. Every agent session **must** begin by reading this file. It defines how agents think, what they reference, and how they behave during development.

---

## Bootstrap / Health Check (MANDATORY)

Before doing anything else, verify that `.ai-system/` exists and is complete.

1. Ensure `.ai-system/` exists.
2. Ensure the following files exist and are readable:
   - `.ai-system/agents/general-instructions.md`
   - `.ai-system/planning/task-queue.md`
   - `.ai-system/planning/project-plan.md`
   - `.ai-system/memory/project-decisions.md`
3. If any are missing, create them using the canonical templates in `.ai-system/commands/` (or create minimal stubs that match the expected structure).
4. Confirm that `.github/copilot-instructions.md` explicitly directs agents to `.ai-system/agents/general-instructions.md` (this file is treated as “legacy pointer only”).

If this sanity check fails, stop and fix it before making any code changes.

---

## Documents to Reference (in this order)

1. `.ai-system/agents/general-instructions.md` (this file)
2. `.ai-system/planning/task-queue.md` — next actions
3. `.ai-system/planning/project-plan.md` — overall goals & progress
4. `.ai-system/agents/system-architecture.md` — system structure
5. `.ai-system/agents/design-system.md` — UI patterns / tokens
6. `.ai-system/agents/repair-system.md` — known issues + fixes
7. `.ai-system/project-context.md` — business context + constraints
8. `.ai-system/memory/project-decisions.md` — past architectural decisions

---

## Planning & Memory (required)

Every time you make a plan or decide on architecture:

- **Save the plan** in `.ai-system/planning/project-plan.md` (or a new planning doc under `.ai-system/planning/`)
- **Write the task list** into `.ai-system/planning/task-queue.md`
- **Record decisions** in `.ai-system/memory/project-decisions.md`
- **Log session actions** in `.ai-system/checkpoints/session-log.md`
- For any discovered bug or pattern, **add it** to `.ai-system/agents/repair-system.md`

---

## Cloud Session Handoff Protocol (required for remote execution)

When work will be executed in a cloud session, package handoff artifacts before implementation starts:

1. Add a feature spec section in `.ai-system/planning/project-plan.md`.
2. Add a concrete execution block in `.ai-system/planning/task-queue.md` with ordered, testable tasks.
3. Create a feature-scoped cloud temp plan in `.ai-system/planning/cloud-session-temp-plan-YYYY-MM-DD-<feature>.md`.
4. Include a copy/paste kickoff prompt in the temp plan with:
   - explicit read order,
   - strict scope lock,
   - non-blocking and backward-compatible constraints,
   - required validation gates,
   - required documentation sync list.
5. Use `.ai-system/commands/cloud-session-single-pass.md` when preparing prompts for one-pass cloud execution.

If cloud execution is requested without these artifacts, create/update them first.

---

## Core Principles

- **Modular architecture** — each module has a single, clear responsibility.
- **Configuration-driven** — behavior is controlled via config, not hardcoded.
- **Readable code** — clarity over cleverness; future developers must understand it.
- **Minimal dependencies** — do not add packages you don’t need.
- **Explicit error handling** — every failure path should be handled deliberately.
- **Consistency** — follow existing patterns in the codebase before inventing new ones.
- **Memory-first** — record everything; don’t rely on “remembering” between sessions.

---

## Execution Protocol

### Before implementing any feature:

1. Run the bootstrap/health check (above).
2. Read `task-queue.md` and identify the first incomplete task.
3. Confirm it aligns with `system-architecture.md`.
4. Check `repair-system.md` for relevant known issues.
5. If architecture changes are needed, update `system-architecture.md` before coding.

### After completing any task:

1. Mark the task done [x] in `task-queue.md`.
2. Update `.ai-system/checkpoints/session-log.md`.
3. Add a summary to `.ai-system/summaries/dev-history.md`.
4. If architecture changed, update `system-architecture.md`.
5. If errors were encountered and fixed, log them in `repair-system.md`.
6. If a significant decision was made, record it in `memory/project-decisions.md`.

---

## Agent Roles

| Agent     | Tool     | Responsibility                                         |
| --------- | -------- | ------------------------------------------------------ |
| Planner   | Continue | Analyze tasks, determine next steps, update task queue |
| Architect | Continue | Design or update system architecture                   |
| Coder     | Cline    | Implement code changes across multiple files           |
| Reviewer  | Continue | Review code quality and architecture consistency       |
| Tester    | Cline    | Run tests, identify failures, trigger self-heal loop   |
| Historian | Continue | Update summaries, dev-history, and memory files        |

---

## Tone and Output Format

- Explain reasoning briefly before acting.
- When proposing architecture changes, describe the change before implementing.
- When encountering ambiguity, ask one clarifying question rather than guessing.
- Keep file edits focused — do not touch modules unrelated to the current task.
- Always provide a clear “next step” at the end of every response.
