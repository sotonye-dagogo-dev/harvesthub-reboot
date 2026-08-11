# Lessons Learned

> **last-updated-by:** update-ai-system.md (2026-08-11)
> **last-updated-at:** 2026-08-11T00:00:00Z
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

## Extract Shared Authoring Surfaces Before Adding a Second One

**Context:**
The blog editor previously required raw HTML while the public content editor already had a guided
no-HTML section editor. Rather than building a second inline section editor, the section model and
editor were extracted into `lib/content/structuredSections.ts` +
`components/features/content/StructuredContentEditor.tsx` and both admin panels were refactored onto
them.

**What We Learned:**
When a second surface needs the same authoring capability, extract a pure, configurable model +
controlled component (`allowedTypes`/`showMedia`/`showButtons`) once and configure per surface.
Store content twice per record (escaped HTML `body` for rendering + structured `sections` in
`metadata` for round-trip editing); keep the serializer pure, escape-safe, and server-safe so
read-time/SEO/plain-text consumers can share it. Also verify the editor component's props against
downstream primitives early (e.g. `ImageUpload`'s `FolderType` needed to be exported to type the
shared `mediaFolderType` prop).

**Apply When:**
Adding any new content authoring surface (marketing content, FAQs, vendor content, etc.) or
extending `SectionType`.


## vi.hoisted Fails When the Import Graph Reaches an ESM-Only Module

**Context:**
Writing route unit tests that import a route which transitively pulls in `@/prisma/generated/client` (a `"type": "module"` package) failed with `[vitest] "vi.hoisted" hoisting is not supported when importing from ESM-only module`.

**What We Learned:**
`vi.hoisted` is incompatible with test files whose import graph loads an ESM-only module. Prefer the established pattern used elsewhere in this repo: declare mocks inside `vi.mock(factory)` and import the mocked module (`import { prisma } from '@/lib/db/prisma'`) to get the mock references, then drive them with `vi.mocked(...)`. Also prefer `import type { Prisma }` when `Prisma` is only used for a type assertion — that keeps the ESM-only generated client out of the runtime graph.

**Apply When:**
Writing unit tests for API routes or modules that touch the Prisma generated client or other ESM-only dependencies.

## jsdom Blob Lacks .text() in Vitest

**Context:**
Testing `navigator.sendBeacon` payloads in `lib/tracking/__tests__/bannerTracking.test.ts` failed with `blob.text is not a function` because jsdom's `Blob` implementation does not expose `.text()`.

**What We Learned:**
jsdom's `Blob` is missing modern methods like `.text()`. Stub the global with Node's `Blob` (`import { Blob } from 'node:buffer'`, `vi.stubGlobal('Blob', NodeBlob)`) and remember `.text()` is async — `JSON.parse(await blob.text())`.

**Apply When:**
Testing code that constructs `Blob` objects (e.g. beacon payloads) inside a jsdom Vitest environment.

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

## Bank Transfer Fallback Must Coordinate Three Toggles

**Context:**
Implemented off-platform payment with proof upload as a togglable option. Required coordinating `PAYMENT_FALLBACK_BANK_TRANSFER` (env var), `paymentsEnabled` (DB toggle in `CommerceLifecycleConfig`), and `gatewayReady` (automatic Paystack key check). The option appears only when the env var is true AND either `paymentsEnabled` is false or `gatewayReady` is false.

**What We Learned:**
A three-layer toggle system (env → DB → runtime health) can be hard to debug. All three conditions must be clearly surfaced in both the payment config API and the UI. The checkout page needs auto-switching logic so the user isn't left on a disabled payment method.

**Apply When:**
Adding conditional payment methods that depend on multiple configuration sources.

## Vendor Bank Details Must Be Exposed at Checkout

**Context:**
Vendor bank details were collected during signup and stored in `businessVerification.bankDetails`, but the checkout page did not display them. Customers selecting "Bank Transfer (Upload Proof)" had no way of knowing where to transfer the money.

**What We Learned:**
Any payment-related data collected at registration must be surfaced at the point of payment. When implementing off-platform payment flows, ensure the transfer destination details (bank name, account name, account number) are fetched and displayed for each vendor in the cart during checkout.

**Apply When:**
Implementing or reviewing off-platform payment methods that require the customer to manually transfer funds to the vendor.

## Governed Upload Fields Need End-to-End Language Consistency

**Context:**
Users perceived image URL entry regressions despite upload-first implementation because wording in some fields still implied manual URL input.

**What We Learned:**
Upload governance is not only API validation. Field labels, helper text, hidden metadata names, and fallback copy must all communicate upload-first behavior consistently.

**Apply When:**
Implementing or reviewing forms that include media/screenshot/payment-proof fields.

## Public Marketing Pages Need Config + Admin-Content Fallback Hierarchy

**Context:**
Building the `/advertise` landing page required copy-driven layout (hero, placements, steps, policies, FAQ) that is config-driven (`advertisingConfig`) while also supporting admin-authored narrative through the existing `PublicContent` system.

**What We Learned:**
When a public page must be both informative and admin-editable, keep structural copy in typed config (deterministic layout/tests) and layer admin HTML on top with a clean `PUBLISHED`-check fallback. Route migration (moving the form to `/advertise/apply`) must preserve existing management routes and their nav/sidebar entries.

**Apply When:**
Adding public marketing/landing pages or relocating feature forms while preserving operational route surfaces.

## Prisma CLI Env Selection Differs From Next.js Env Loading

**Context:**
Running `prisma db push` against dev vs prod requires different env files (`.env.local` for dev, `.env` for prod), but `prisma.config.ts` uses `dotenv/config`, which loads `.env` by default and `dotenv` does not override already-set process env vars.

**What We Learned:**
To target the dev DB, preload `DIRECT_URL`/`DATABASE_URL` from `.env.local` into the process environment before invoking `npx prisma` (dotenv will not override them). For prod, run with no env overrides so `.env` is used. `prisma db push --force-reset --accept-data-loss` drops all data and rebuilds from the schema but does not run `prisma/seed.ts`. Also, `prisma db execute` does not print `SELECT`/`NOTICE` output and the `@prisma/adapter-pg` runtime may not reach the same proxy endpoint the Prisma CLI uses — use a `DO $$ ... RAISE EXCEPTION` block for pass/fail DB checks via the CLI.

**Apply When:**
Running schema-sync/reset or data-verification commands against multiple environments in this repo.
