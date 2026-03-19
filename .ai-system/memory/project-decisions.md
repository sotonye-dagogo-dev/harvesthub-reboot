# Project Decisions

> **Overview:** Log of significant architectural, technical, and product decisions made during development. Agents consult this before proposing changes to avoid contradicting prior reasoning. Each entry records what was decided, why, and what the alternatives were.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Developer / AI agent / team]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

## Centralized RBAC & Config-Driven Architecture

**Decision:** Introduce a centralized, declarative RBAC policy registry and a typed configuration layer to replace hardcoded route lists and scattered `process.env` usage.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Current route protection is brittle (hardcoded arrays in `middleware.ts`) and configuration is scattered across env vars and constants. A single source of truth improves auditability, reduces drift, and enables deny-by-default security.

**Alternatives Considered:** Continuing with the existing middleware array approach (quick, but risky and hard to maintain) or using file-system scanning to infer protection (complex for Next.js and not explicitly declarative).

**Implications:**

- Require refactor of `middleware.ts`, route layouts, and some API handlers to consume the new policy registry.
- Provide a safe pattern for future routing changes and feature flags.
- Enable better automation (tests, reporting) against access policies.

## Adapter Pattern for Data Layer

**Decision:** Define a shared data adapter interface and explicitly require either the mock or Prisma implementation for each domain. If a domain adapter is not implemented, the system should fail fast with a clear error.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Current mix of mock and Prisma adapters in `lib/data/database.ts` is difficult to reason about and can silently fall back to mocks in production. A strict adapter contract prevents partial cutovers and ensures expected behavior.

**Alternatives Considered:** Keeping the existing `USE_PRISMA` toggle with implicit fallback (unsafe) or delaying the full adapter work (slows migration).

**Implications:**

- Additional work to define and implement adapter interfaces per domain (users, products, orders, carts, wallets, vendors, etc.)
- Tests need to validate both mock and Prisma implementations.

## Production Readiness Baseline

**Decision:** Treat the project as production-critical by enforcing robustness in email delivery, notifications, caching, and cloud asset handling before opening the platform to real users.
**Date:** 2026-03-19
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Early-stage MVP systems often fail due to unreliable email/notification delivery and cache inconsistencies, which can harm trust and create hard-to-debug issues. Explicitly planning for these areas reduces regression risk and makes the product more stable.

**Implications:**

- Email paths must be resilient and non-blocking, with retries and clear failure logging.
- In-app notifications should persist and be replayable, with optional push delivery.
- Cached content must have a clear invalidation mechanism.
- Cloud uploads must persist metadata and tolerate partial failures without blocking core flows.
