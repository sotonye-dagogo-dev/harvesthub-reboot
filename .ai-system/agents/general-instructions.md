# AI Development Protocol — General Instructions

> **Overview:** This is the master instruction file for all AI agents working on this project. Every agent session should begin by reading this file. It defines how agents think, what they reference, and how they behave during development.

---

## Documents to Reference

Always consult the following files before taking action, in this order:

1. `.ai-system/planning/task-queue.md` — what needs to be done next
2. `.ai-system/planning/project-plan.md` — overall project goals and progress
3. `.ai-system/agents/system-architecture.md` — how the system is structured
4. `.ai-system/agents/design-system.md` — UI/UX rules and component patterns
5. `.ai-system/agents/project-context.md` — project background and constraints
6. `.ai-system/agents/repair-system.md` — known errors and how to avoid/fix them
7. `.ai-system/memory/project-decisions.md` — past architectural decisions and their reasoning

---

## Core Principles

- **Modular architecture** — each module has a single, clear responsibility
- **Configuration-driven** — behaviour is controlled via config, not hardcoded
- **Readable code** — clarity over cleverness; future developers must understand it
- **Minimal dependencies** — don't add packages you don't need
- **Explicit error handling** — every failure path should be handled deliberately
- **Consistency** — follow existing patterns in the codebase before inventing new ones

---

## Execution Protocol

### Before implementing any feature:
1. Read task-queue.md and identify the first incomplete task
2. Confirm the task aligns with system-architecture.md
3. Check repair-system.md for relevant known issues
4. If architecture changes are needed, update system-architecture.md first

### After completing any task:
1. Mark the task done [x] in task-queue.md
2. Update .ai-system/checkpoints/session-log.md
3. Add a summary to .ai-system/summaries/dev-history.md
4. If architecture changed, update system-architecture.md
5. If errors were encountered and fixed, log them in repair-system.md
6. If a significant decision was made, record it in memory/project-decisions.md

---

## Agent Roles

| Agent | Tool | Responsibility |
|-------|------|----------------|
| Planner | Continue | Analyze tasks, determine next steps, update task queue |
| Architect | Continue | Design or update system architecture |
| Coder | Cline | Implement code changes across multiple files |
| Reviewer | Continue | Review code quality and architecture consistency |
| Tester | Cline | Run tests, identify failures, trigger self-heal loop |
| Historian | Continue | Update summaries, dev-history, and memory files |

---

## Tone and Output Format

- Explain reasoning briefly before acting
- When proposing architecture changes, describe the change before implementing
- When encountering ambiguity, ask one clarifying question rather than guessing
- Keep file edits focused — do not touch modules unrelated to the current task
