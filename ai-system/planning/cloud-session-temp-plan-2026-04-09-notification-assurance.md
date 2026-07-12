# Cloud Session Temporary Execution Plan (2026-04-09)

> Purpose: Execute the notifications assurance feature in one uninterrupted cloud session (all slices) with strict .ai-system compliance, no unnecessary schema migration, and full validation/doc synchronization.

---

## Operation Snapshot

This handoff packages the planning already completed locally:

- Feature spec in `ai-system/planning/project-plan.md`:
  - `Feature Spec - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning (Planned 2026-04-09)`.
- Implementation queue in `ai-system/planning/task-queue.md`:
  - `Feature Planning Queue (2026-04-09) - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning`.
- Decision log in `ai-system/memory/project-decisions.md`:
  - `Notification Assurance Pass Reuses Existing Persistence and Avoids Schema Migration`.
- Planning checkpoint in `ai-system/checkpoints/session-log.md` (Session 43).

Execution target for cloud session: implement all slices in one pass, validate each slice, and fully sync .ai-system artifacts.

---

## Read Order (Mandatory)

1. `ai-system/protocols/entry-protocol.md`
2. `ai-system/planning/task-queue.md`
3. `ai-system/planning/project-plan.md`
4. `ai-system/system-architecture.md`
5. `ai-system/design-system.md`
6. `ai-system/repair-system.md`
7. `ai-system/project-context.md`
8. `ai-system/memory/project-decisions.md`
9. This file

---

## Locked Constraints

- Scope lock: implement only the feature queue section for 2026-04-09 notifications assurance.
- Persistence lock: reuse existing notifications persistence/API contracts; do not introduce Prisma schema migration in this pass unless a blocker proves it unavoidable.
- UX lock: `/notifications` must become inbox timeline; `/notifications/settings` remains preference management.
- Integrity lock: settings controls must not present false affordances (editable vs enforced states must be explicit).
- Runtime lock: replace noisy global processing task-count copy and reduce aggressive refresh churn.
- Compliance lock: after each major slice, update queue + session log + dev history (and decisions/architecture/repair when changed).

---

## Feature Objective

Deliver an accessible, trustworthy notifications experience by:

- exposing a full-page inbox route backed by existing notification services,
- introducing config-driven/context-aware templates for better channel parity,
- fixing preference toggle truthfulness and enforced-channel UI semantics,
- and tuning refresh/runtime notifier behavior to reduce noisy background processing feedback.

---

## Execution Slices (Run In Order, No Planning Stop)

### Slice 0 - Bootstrap, Diff Audit, Baseline

Deliverables:

- Verify required .ai-system files exist and are readable.
- Audit changed files to avoid conflicts.
- Run baseline checks before edits.

Validation:

- `npm run lint`
- `npx tsc --noEmit`

Docs:

- Add cloud kickoff note to session log.

### Slice 1 - Route Contract and Navigation Entry Points

Deliverables:

- Make `/notifications` render inbox timeline.
- Keep `/notifications/settings` as preferences route.
- Ensure buyer/vendor/admin route and shell parity; verify sidebar/header links still resolve correctly.

Validation:

- Targeted route/sidebar tests and audits for notifications paths.

Docs:

- Mark progress in queue + checkpoint.

### Slice 2 - Full-Page Inbox Composition

Deliverables:

- Add `NotificationInbox` feature surface reusing existing API/context actions:
  - read/unread filters,
  - mark-as-read,
  - mark-all-read,
  - delete,
  - CTA navigation.
- Add robust loading/empty/error/retry states.
- Consolidate bell/drawer/context fetch behavior so unread badge and list data stay in sync.

Validation:

- Focused Vitest suites for inbox rendering/actions and unread badge synchronization.

Docs:

- Queue + checkpoint + dev-history updates.

### Slice 3 - Config-Driven Template Resolver

Deliverables:

- Add canonical template config per notification type (title/body/CTA/media hints).
- Add resolver service that enriches payloads with available context (signup date, verification state transitions, ad/content status, order/payment lifecycle).
- Integrate resolver into `dispatchNotification` while keeping existing channel preference and mandatory-system-channel rules.

Validation:

- Unit tests for resolver output and fallback behavior.
- Targeted tests ensuring dispatch still respects preference/mandatory semantics.

Docs:

- Update decisions if new template governance contracts are finalized.

### Slice 4 - Preference Toggle Integrity and Enforced-Channel UX

Deliverables:

- Align UI toggles to real backend persistence semantics.
- Explicitly separate editable controls from enforced controls.
- Add lock/tooltip/info treatment for non-editable mandatory channels.
- Ensure save/reset UX copy matches actual behavior.

Validation:

- Focused tests for editable vs enforced behavior.
- API contract tests for mapping stability.

Docs:

- Queue + checkpoint + dev-history.
- Add repair note if a hidden mismatch pattern is discovered.

### Slice 5 - Refresh Cadence and Runtime Activity Notifier Tuning

Deliverables:

- Reduce aggressive polling defaults for notifications and related runtime resources.
- Favor manual refresh and long idle windows (5-10 min) for non-critical background updates.
- Replace `Processing... <task count>` with threshold-based human copy tiers.
- Suppress short/background-only churn while preserving feedback for user-triggered long-running operations.

Validation:

- Tests for notifier copy thresholds/suppression behavior.
- Manual smoke checks across notifications, orders, checkout/payment flows.

Docs:

- Update architecture flow notes for runtime activity + refresh policy.

### Slice 6 - Final Quality Gate and Documentation Closure

Deliverables:

- Complete all queue items in the notification assurance section or mark blockers precisely.
- Ensure touched flows are validated and documented.

Validation (required):

- `npm run lint`
- `npx tsc --noEmit`
- Focused Vitest suites for notifications/runtime slices (plus any changed route tests)
- `npm run audit:dead-links`
- `npm run audit:sidebar-routes`

Docs (required):

- `ai-system/planning/task-queue.md`
- `ai-system/checkpoints/session-log.md`
- `ai-system/summaries/dev-history.md`
- `ai-system/memory/project-decisions.md` (if new decisions)
- `ai-system/system-architecture.md` (if flow/module updates)
- `ai-system/repair-system.md` (if new bug pattern discovered)

---

## Definition of Done

- Notifications assurance queue section is complete (or blocked with exact reasons).
- `/notifications` is inbox-first and `/notifications/settings` is settings-only.
- Inbox interactions are stable and unread state is synchronized across bell/drawer/page.
- Template resolver is active and config-driven for richer context messaging.
- Settings UI no longer misleads users about non-editable enforced channels.
- Runtime processing signal is calmer and refresh churn is reduced.
- Validation gates pass.
- .ai-system artifacts accurately reflect implemented state.

---

## Cloud Kickoff Prompt (Copy/Paste)

```text
You are continuing MyHarvestHub in a cloud session to implement the notifications assurance feature in one uninterrupted pass.

Read in this exact order:
1) ai-system/protocols/entry-protocol.md
2) ai-system/planning/task-queue.md
3) ai-system/planning/project-plan.md
4) ai-system/system-architecture.md
5) ai-system/design-system.md
6) ai-system/repair-system.md
7) ai-system/project-context.md
8) ai-system/memory/project-decisions.md
9) ai-system/planning/cloud-session-temp-plan-2026-04-09-notification-assurance.md

Execution scope (strict):
- Implement ONLY this queue block from ai-system/planning/task-queue.md:
  "Feature Planning Queue (2026-04-09) - Notification Inbox Accessibility + Preference Integrity + Runtime Signal Tuning"
- Execute all slices in the temp plan in order.
- Do not stop at analysis; implement, validate, and document in one pass.

Locked constraints:
- Reuse existing notifications persistence/API model in this pass.
- Avoid Prisma schema migration unless absolutely unavoidable and explicitly justified in docs.
- Make /notifications inbox-first and keep /notifications/settings for preferences.
- Remove false-toggle UX by clearly separating editable vs enforced controls.
- Reduce refresh churn and replace noisy global processing task-count copy with threshold-based human messaging.

Validation gate after each major slice:
- targeted lint and typecheck for touched scope
- targeted vitest suites for changed behavior

Final gate required:
- npm run lint
- npx tsc --noEmit
- focused vitest suites for notifications/runtime touches
- npm run audit:dead-links
- npm run audit:sidebar-routes

Documentation updates required after each major slice:
- ai-system/planning/task-queue.md
- ai-system/checkpoints/session-log.md
- ai-system/summaries/dev-history.md
- ai-system/memory/project-decisions.md when decisions are made
- ai-system/system-architecture.md when structure/flow changes
- ai-system/repair-system.md when new bug/fix patterns are discovered

Stop condition:
- Finish all queue items in the notifications assurance section, or mark exact blockers and continue with remaining non-blocked slices.
```
