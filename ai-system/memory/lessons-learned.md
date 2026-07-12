# Lessons Learned

> **Overview:** Practical knowledge accumulated during development — things that worked well, things that didn't, and patterns worth repeating. Different from repair-system.md (which tracks errors); this file tracks development process insights and architectural wisdom.

---

## Entry Format

```
## [Lesson Title]

**Context:**
[What situation this came from]

**What We Learned:**
[The insight or pattern discovered]

**Apply When:**
[When future agents/developers should use this knowledge]
```

---

## Lessons

## Route-Migration Documentation Drift Appears Quickly

**Context:**
Operations routes were migrated to `app/(operations)/operations/*`, but multiple docs still referenced legacy `(buyer)/(vendor)/(admin)` groups.

**What We Learned:**
After major route topology changes, stale docs accumulate across context, architecture, repo-map, and dependency graph unless a synchronized doc sweep is performed.

**Apply When:**
Any route-group migration, middleware normalization change, or navigation policy rewrite lands.

## Audit Scripts Must Track UI Data-Shape Changes

**Context:**
Sidebar route audit temporarily failed because parser assumptions no longer matched updated sidebar link structure.

**What We Learned:**
Audit tooling can drift silently when UI config shape evolves. Route audits should be validated whenever navigation source structures change.

**Apply When:**
Refactoring sidebar/header route definitions, link arrays, or navigation config schemas.

## Governed Upload Fields Need End-to-End Language Consistency

**Context:**
Users perceived image URL entry regressions despite upload-first implementation because wording in some fields still implied manual URL input.

**What We Learned:**
Upload governance is not only API validation. Field labels, helper text, hidden metadata names, and fallback copy must all communicate upload-first behavior consistently.

**Apply When:**
Implementing or reviewing forms that include media/screenshot/payment-proof fields.
