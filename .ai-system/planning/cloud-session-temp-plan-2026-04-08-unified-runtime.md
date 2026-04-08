# Cloud Session Temporary Execution Plan (2026-04-08)

> Purpose: Execute the Unified In-Memory Data Runtime + Seamless Refresh feature end-to-end in one cloud session using phased slices, strict validation gates, and full .ai-system compliance.

---

## Operation Snapshot

This handoff packages the planning work already completed in local session:

- Feature spec authored in `.ai-system/planning/project-plan.md`:
  - Section: `Feature Spec - Unified In-Memory Data Runtime + Seamless Refresh (Planned 2026-04-08)`.
- Implementation queue appended in `.ai-system/planning/task-queue.md`:
  - Section: `Feature Planning Queue (2026-04-08) - Unified In-Memory Data Runtime + Seamless Refresh`.
- Architecture decision logged in `.ai-system/memory/project-decisions.md`:
  - `Unified Data Runtime Uses Zustand-First Core with Adapter Boundary`.
- Planning checkpoint recorded in `.ai-system/checkpoints/session-log.md` (Session 37).

Execution target for cloud session: implement all runtime slices in one pass, validate each slice, and fully sync all .ai-system artifacts.

---

## Source of Truth Inputs (Read First)

1. `.ai-system/agents/general-instructions.md`
2. `.ai-system/planning/task-queue.md`
3. `.ai-system/planning/project-plan.md`
4. `.ai-system/agents/system-architecture.md`
5. `.ai-system/agents/design-system.md`
6. `.ai-system/agents/repair-system.md`
7. `.ai-system/project-context.md`
8. `.ai-system/memory/project-decisions.md`
9. This file

---

## Locked Decisions and Constraints

- Runtime core: Zustand-first implementation.
- Extensibility: strict adapter boundary to preserve future Redux/RxJS integration options.
- Migration strategy: phased coexistence with legacy page-local fetch patterns until each surface is migrated.
- UX objective: keep visible data stable during refresh and avoid unnecessary loading flicker.
- Reliability objective: retries for transient connection errors with bounded backoff and anti-storm controls.
- Governance objective: every major slice must update queue, checkpoint, and summary docs before continuing.

---

## Feature Objective

Create a centralized, config-driven client data runtime that:

- preloads role-accessible resources,
- keeps data in-memory for continuity across views,
- applies optimistic mutation updates with deterministic rollback and reconciliation,
- performs silent background refresh with semantic compare to suppress no-op rerenders,
- and maintains high reliability under transient DB/API instability.

---

## Execution Slices (Implement In Order)

### Slice 0 - Bootstrap and Baseline

Deliverables:

- Verify required .ai-system files are present and readable.
- Audit current git/worktree status to avoid unsafe overlap.
- Run baseline checks before coding.

Validation:

- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run` (targeted baseline if full suite is too heavy to start)

Docs:

- Add cloud-session kickoff note in `session-log.md`.

### Slice 1 - Runtime Contracts and Boundaries

Deliverables:

- Add `lib/data-runtime` contracts for:
  - resource key policy,
  - resource scope policy (public/auth/role),
  - invalidation contract,
  - runtime adapter interfaces.
- Document legacy coexistence strategy at code-level comments and architecture notes.

Validation:

- Targeted lint/typecheck for new runtime modules.

Docs:

- Mark first queue item progress in `task-queue.md`.
- Record any new contract decisions in `project-decisions.md`.

### Slice 2 - Config-Driven Resource Registry and Policies

Deliverables:

- Implement declarative `resourceRegistry` with typed policy fields:
  - stale,
  - ttl,
  - retry,
  - compare strategy,
  - scope.
- Add runtime defaults under `lib/config` for:
  - spinner threshold,
  - retry backoff,
  - silent-refresh behavior.

Validation:

- Targeted unit tests for policy parsing/defaulting and registry shape.

Docs:

- Update queue progress and checkpoint log.

### Slice 3 - Runtime Store and Reconciler

Deliverables:

- Build centralized in-memory runtime store with:
  - per-resource status,
  - timestamps,
  - in-flight metadata,
  - last-good snapshot handling.
- Implement semantic compare + merge to avoid no-op UI updates.
- Preserve visible data during refresh unless data is truly absent.

Validation:

- Targeted tests for compare/merge semantics and stale-safe merge behavior.

Docs:

- Update queue and session checkpoint.

### Slice 4 - Mutation Coordinator (Optimistic Safety)

Deliverables:

- Add optimistic patch application and deterministic rollback path.
- Add server-success reconciliation for normalized payloads.
- Enforce domain-aware error mapping so failed writes do not poison runtime state.

Validation:

- Targeted tests for optimistic success, optimistic failure rollback, and reconciliation.

Docs:

- Record mutation-safety decisions if behavior contracts are finalized.

### Slice 5 - Warm-Start Prefetch in App Bootstrap

Deliverables:

- Add role-aware prefetch orchestration into app provider/bootstrap flow.
- Preload only route/feature-relevant resources (no broad over-fetching).
- Ensure first render consumes warm in-memory data when available.

Validation:

- Targeted tests for role-scoped preload behavior.
- Manual smoke checks on first render/loading continuity.

Docs:

- Update queue and checkpoint with migrated bootstrap notes.

### Slice 6 - Migrate High-Impact Operations Surfaces

Deliverables:

- Migrate operations pages to runtime subscriptions:
  - dashboard,
  - users,
  - vendors,
  - products,
  - bug reports,
  - orders.
- Remove duplicate local loading flags where runtime status already covers state.

Validation:

- Lint/typecheck for touched operations files.
- Targeted Vitest suites for operations data UX and table/list stability.

Docs:

- Queue + checkpoint + summary update.

### Slice 7 - Migrate High-Impact Buyer Surfaces

Deliverables:

- Migrate buyer-facing pages using runtime subscriptions:
  - home,
  - products,
  - cart/checkout support data,
  - orders,
  - profile/wallet notifications.
- Ensure no-flicker refresh and stable visible data on background updates.

Validation:

- Targeted tests for buyer data continuity and page query contracts.

Docs:

- Queue + checkpoint + summary update.

### Slice 8 - Runtime Resilience, Telemetry, and Hardening

Deliverables:

- Add retry with jitter/backoff for connection-closed style errors.
- Add circuit-breaker/cooldown behavior to prevent refresh storms.
- Add telemetry for:
  - load latency,
  - refresh churn,
  - no-op refresh ratio,
  - retry counts,
  - rollback frequency.

Validation:

- Tests for retry/cooldown behavior and non-blocking last-good data retention.

Docs:

- Update repair-system with any newly discovered reliability patterns.

### Slice 9 - Final Verification and Documentation Closure

Deliverables:

- Complete all queue items in runtime feature section.
- Close architecture/docs synchronization.

Validation (full gate):

- `npm run lint`
- `npx tsc --noEmit`
- targeted and high-risk/full Vitest runs for touched areas
- `npm run audit:routes`
- `npm run audit:sidebar-routes`

Docs (mandatory):

- `.ai-system/planning/task-queue.md`
- `.ai-system/checkpoints/session-log.md`
- `.ai-system/summaries/dev-history.md`
- `.ai-system/memory/project-decisions.md` (if new decisions)
- `.ai-system/agents/system-architecture.md` (runtime flow updates)

---

## Definition of Done

- All unchecked items under runtime feature queue are completed or explicitly marked blocked with reason.
- Unified runtime modules exist and are used by migrated slices.
- Optimistic mutation and rollback paths are tested and stable.
- Background refresh does not cause full-page flicker on unchanged payloads.
- Retry/cooldown logic prevents refresh storms and preserves last-good data.
- Quality gates pass.
- .ai-system docs accurately reflect implementation state and decisions.

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
You are continuing MyHarvestHub in a cloud session to implement the Unified In-Memory Data Runtime + Seamless Refresh feature in one continuous execution pass.

Read in this exact order:
1) .ai-system/agents/general-instructions.md
2) .ai-system/planning/task-queue.md
3) .ai-system/planning/project-plan.md
4) .ai-system/agents/system-architecture.md
5) .ai-system/agents/design-system.md
6) .ai-system/agents/repair-system.md
7) .ai-system/project-context.md
8) .ai-system/memory/project-decisions.md
9) .ai-system/planning/cloud-session-temp-plan-2026-04-08-unified-runtime.md

Execution scope:
- Implement ONLY the runtime feature block in .ai-system/planning/task-queue.md:
  "Feature Planning Queue (2026-04-08) - Unified In-Memory Data Runtime + Seamless Refresh"
- Execute all slices in this plan in order without stopping at analysis.
- Keep changes modular, config-driven, and aligned with current architecture.
- Preserve the locked decision: Zustand-first runtime with adapter boundaries for future Redux/RxJS.

Hard requirements:
- Add runtime contracts first, then registry/policies, then store/reconciler, then mutation coordinator, then warm-start prefetch, then page migrations, then resilience/telemetry hardening.
- Keep legacy fetch coexistence safe during migration; do not break existing surfaces mid-slice.
- Use low-interruption UI behavior: keep last-good data visible during background refresh and avoid unnecessary global loaders.
- Add bounded retry/backoff and cooldown logic for transient connection-closed failures.
- Enforce deterministic optimistic rollback/reconcile behavior for failed/successful mutations.

Validation requirements:
- After each major slice, run targeted lint + typecheck + relevant vitest suites for touched files.
- At the end, run full quality gate:
  - npm run lint
  - npx tsc --noEmit
  - targeted/high-risk or full vitest
  - npm run audit:routes
  - npm run audit:sidebar-routes

Documentation requirements after each major slice:
- Update .ai-system/planning/task-queue.md
- Update .ai-system/checkpoints/session-log.md
- Update .ai-system/summaries/dev-history.md
- Update .ai-system/memory/project-decisions.md when decisions are made
- Update .ai-system/agents/system-architecture.md when runtime flow/structure changes
- Log new reliability patterns in .ai-system/agents/repair-system.md

Stop condition:
- Do not stop after planning. Implement, validate, and document all runtime slices in one pass.
- If a blocker occurs, record exact blocker details in queue + session log, then continue with next non-blocked slice.
```
