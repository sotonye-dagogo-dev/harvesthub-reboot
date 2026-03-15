# Orchestrator

> **Overview:** This document explains how AI agents (and human contributors) should use the `.ai-system` framework to navigate, plan, and modify the MyHarvestHub codebase.

---

## Purpose

The orchestrator provides a single source of truth for running automated workflows (planning, refactoring, repairs) and is the recommended entry point for any task that touches multiple areas of the codebase.

---

## Key Files & Their Roles

- `.ai-system/agents/` — Contains domain-specific guidance for agents (architecture, design, repair, and project context).
- `.ai-system/planning/` — High-level plan and task queue for delivering features and fixes.
- `.ai-system/index/` — Maps repository structure and dependency relationships.
- `.ai-system/memory/` — Stores decisions and lessons learned.
- `.ai-system/summaries/` — Records major milestones and completed work.

---

## How to Use This System

1. **Start with context**: Read `.ai-system/ai-context.md` and `.ai-system/agents/project-context.md`.
2. **Understand architecture**: Consult `.ai-system/system-architecture.md` and `.ai-system/index/repo-map.md`.
3. **Plan work**: Review `.ai-system/planning/project-plan.md` and `.ai-system/planning/task-queue.md`.
4. **Track progress**: Update `.ai-system/checkpoints/session-log.md` and `.ai-system/summaries/dev-history.md`.
5. **Run fixes**: Use the guidance in `.ai-system/repair-system.md` and `.github/repair-instructions.md`.

---

## Keeping the System Updated

- When you add new major features or restructure folders, update `.ai-system/index/repo-map.md` and `.ai-system/index/dependency-graph.md`.
- When you make architectural decisions, record them in `.ai-system/memory/project-decisions.md`.
- When you learn something important (e.g., a limitation or best practice), add it to `.ai-system/memory/lessons-learned.md`.
