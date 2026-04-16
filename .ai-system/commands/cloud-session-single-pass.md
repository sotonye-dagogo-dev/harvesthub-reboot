# Cloud Session Single Pass Command

> **Overview:** Use this command when work should be executed in a cloud session end-to-end in one uninterrupted pass. It enforces .ai-system compliance, strict scope control, non-breaking changes, and full documentation closure.

---

## Prompt

```
Read in this exact order:
1. .ai-system/agents/general-instructions.md
2. .ai-system/planning/task-queue.md
3. .ai-system/planning/project-plan.md
4. .ai-system/agents/system-architecture.md
5. .ai-system/agents/design-system.md
6. .ai-system/agents/repair-system.md
7. .ai-system/project-context.md
8. .ai-system/memory/project-decisions.md
9. [cloud temp plan file path]

TASK: Execute the referenced cloud temp plan in one pass.

Rules:
- Scope lock: implement only the queue block and slices defined in the temp plan.
- Non-breaking lock: preserve public contracts unless migration/versioning is explicitly planned.
- Config-driven lock: avoid hardcoded behavior where a config contract is expected.
- Modularity lock: keep responsibilities separated and reusable.
- UX lock: responsive behavior must be verified for desktop/mobile.
- Do not stop at analysis; implement, validate, and document in one run.

Required output at completion:
1. Completed task checklist with statuses
2. Files changed by slice
3. Validation outputs summary (lint, typecheck, tests)
4. Blockers (if any) with exact file/line context
5. Documentation sync summary for:
   - .ai-system/planning/task-queue.md
   - .ai-system/checkpoints/session-log.md
   - .ai-system/summaries/dev-history.md
   - .ai-system/agents/system-architecture.md (if changed)
   - .ai-system/memory/project-decisions.md (if changed)
   - .ai-system/agents/repair-system.md (if new fix pattern emerged)
```

---

## With Directive

```
Execute command: cloud-session-single-pass.md
TempPlan: [path to .ai-system/planning/cloud-session-temp-plan-YYYY-MM-DD-<feature>.md]
Directive: [optional strict focus note]

Examples:
Directive: Prioritize API idempotency and preserve all existing response envelopes
Directive: Keep migrations backward-compatible and avoid risky refactors
Directive: Run focused tests after each slice before moving on
```
