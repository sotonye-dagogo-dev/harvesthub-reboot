# Repair System

> **Overview:** This document captures known issues, common error patterns, and the recommended repair workflow for MyHarvestHub. It is the go-to reference for agents tasked with diagnosing and fixing problems.

---

## Common Failure Modes

- **TypeScript strict errors**: The project runs with `strict` enabled; missing or invalid types are the most common failure source.
- **Next.js App Router mismatches**: Incorrect file locations in `app/` (e.g., `page.tsx` vs `page.ts`) can cause routing failures.
- **API route validation**: Zod schema mismatches or missing required fields often cause 400 errors.
- **Mock data missing relations**: The in-memory mock database requires explicit referential integrity; missing IDs cause runtime errors.

---

## Repair Workflow

1. **Reproduce the issue** locally by running `npm run dev` or `npm run build`.
2. **Gather errors**:
   - Run `npx tsc --noEmit` to surface TypeScript compilation issues.
   - Use `npm run lint` to find linting problems.
   - Inspect browser console/Network tab for runtime errors.
3. **Search for similar patterns** using `grep_search` or `file_search`.
4. **Implement fixes** consistently across affected files.
5. **Validate the fix**:
   - Run `npx tsc --noEmit`.
   - Run `npm run test` (or `npm run test:ui` for interactive verification).

---

## Reporting & Tracking

- Document broad repair work in `.github/repairs-audit.md`.
- For ad-hoc fixes (single issue), add an entry under **Ad-Hoc Repairs Log** there.
- When pushing commits, include clear messages referencing the issue (e.g., `fix: handle null vendor in product card`).
