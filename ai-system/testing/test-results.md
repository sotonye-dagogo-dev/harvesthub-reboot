# Test Results

> **Overview:** Latest test run results. Updated by agents after running the self-heal loop or test suite. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-08-20
**Run by:** opencode-agent

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Build | ✅ (next build, exit 0) | 0 | 0 |
| Typecheck | ✅ (npx tsc --noEmit, changed files clean) | 0 | 0 |
| Lint | ✅ (next lint on touched files) | 0 | 0 |
| Vitest (full) | 501 | 0 | 32 |

**Overall Status:** Build + typecheck + lint passing; full vitest suite green (107 files / 501
passed / 32 skipped; 3 skipped test-files are pre-existing/environmental).

## History

| Date       | Passed | Failed | Notes                                          |
| ---------- | ------ | ------ | ---------------------------------------------- |
| 2026-08-20 | 501    | 0      | Checkout must enforce proof-of-payment upload for bank transfer; 3 new tests added |
| 2026-08-15 | 451    | 67     | Forgot-password feedback fix + UI/UX feedback-gap audit (auth email flows, change-email, profile upload, vendor toasts); 7 new tests added |
| 2026-08-13 | 430    | 67     | Upload retention + replace + verification-docs status overlay; fixed pre-existing test-file type errors (tsc clean) |
| 2026-08-13 | 420    | 67     | Signup button/toast feedback + verification-docs upload overlay + no-response guard |
| 2026-03-25 | n/a    | n/a    | Added Prisma reconnect wrapper for banners API |

---

## Active Failures

| Test        | Error           | Status                             | Assigned To |
| ----------- | --------------- | ---------------------------------- | ----------- |
| [test name] | [error message] | [Investigating / Fixed / Wont Fix] | [agent/dev] |

---

## History

| Date   | Passed | Failed | Notes   |
| ------ | ------ | ------ | ------- |
| [date] | [n]    | [n]    | [notes] |
