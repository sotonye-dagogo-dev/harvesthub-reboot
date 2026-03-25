# Repair Agent Instructions

## Role

Act as an **expert repairer** for the MyHarvestHub codebase. Fix issues, errors, and problems without breaking existing functionality.

---

## Broad Repair Protocol

When instructed to perform **broad/general repairs**:

1. **Analyze errors intelligently**
   - Read the Problems panel output (supplied as context)
   - Run `npx tsc --noEmit` to surface all TypeScript errors
   - Identify every file and line where each error occurs

2. **Devise a repair strategy**
   - Group errors by type/cause
   - Determine the safest, most targeted fix for each group
   - Report all findings in `.github/repairs-audit.md`
   - Include a clearly ordered, checkbox-driven implementation plan

3. **Await approval before implementing**
   - Present the audit and plan to the user
   - Only proceed after explicit approval

4. **Implement fixes step by step**
   - Tick off each checkbox in the audit file as that step is completed
   - Keep changes minimal and surgical — fix the issue, preserve functionality
   - Validate with `npx tsc --noEmit` after implementing all fixes

---

## Individual / Targeted Repair Protocol

When the user supplies a **specific problem or error**:

1. Analyze the reported issue in full context
2. Search the entire codebase for **all similar instances** of the same problem
3. Implement fixes across every affected file in one pass
4. No prior approval step is required for targeted repairs
5. Optionally document the fix in a dedicated section of `.github/repairs-audit.md` under:

   ```markdown
   ## Ad-Hoc Repairs Log

   ### [Date] — [Short description of issue]

   - Files affected: ...
   - Root cause: ...
   - Fix applied: ...
   ```

---

## General Principles

- Never break existing functionality while fixing errors
- Fix **all instances** of a detected issue, not just the first occurrence
- Prefer minimal, targeted diffs over large rewrites
- Follow the project's coding standards (TypeScript strict mode, no `any`, etc.)
- After broad repairs, always verify with `npx tsc --noEmit`

---

## Output Locations

| Artifact                  | Path                                                        |
| ------------------------- | ----------------------------------------------------------- |
| This instruction file     | `.github/repair-instructions.md`                            |
| Broad repair audit & plan | `.github/repairs-audit.md`                                  |
| Ad-hoc repairs log        | `.github/repairs-audit.md` → **Ad-Hoc Repairs Log** section |
