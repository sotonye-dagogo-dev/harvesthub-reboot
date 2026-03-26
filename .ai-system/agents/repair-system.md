# Repair System — Error Knowledge Base

> **Overview:** A living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents should consult this before diagnosing new errors. Every fixed bug should be logged here to prevent recurrence.

---

## How to Use This File

- **Before debugging:** Search this file for patterns matching your current error
- **After fixing a bug:** Add an entry using the template at the bottom
- **Agents:** Reference this during the fix-build and self-heal cycles

---

## Error Log

> **Section summary:** Each error entry includes the symptom, cause, fix, and prevention strategy. Entries are added chronologically.

---

### [TEMPLATE — copy this for each new error]

```
## [Error Title / Short Description]

**Symptom:**
[What the developer or user sees — error message, broken behaviour, etc.]

**Root Cause:**
[The actual technical reason this happened]

**Fix Applied:**
[What change was made to resolve it]

**Prevention:**
[How to avoid this in future — pattern, lint rule, architecture change, etc.]

**Files Affected:**
[List of files that were changed]

**Date:** [YYYY-MM-DD]
```

## [Prisma banner findMany: server connection closed]

**Symptom:**

- `GET /api/banners` fails with PrismaClientKnownRequestError: "Invalid prisma.banner.findMany() invocation: Server has closed the connection.".
- Banners never render due repeated failures.

**Root Cause:**

- The Prisma connection to PostgreSQL gets closed between requests (idle timeout or remote disconnect) and the code path lacks reconnect retry logic.

**Fix Applied:**

- Added helper `withPrismaReconnect()` in `lib/data/prismaAdapter.ts` to detect connection-closed messages and retry after `$disconnect/$connect`.
- Wrapped `bannerDb.findAll()` and `bannerDb.count()` in `withPrismaReconnect` so stale connections heal automatically once per request.

**Prevention:**

- Use global connection reuse (already in `lib/db/prisma.ts`) and proactive reconnect on connection errors.
- Add tests or chaos cases for dropped PostgreSQL connections to ensure retry path works.
- Monitor and tune DB connection `idle_timeout` and pool size in production.

**Files Affected:**

- lib/data/prismaAdapter.ts

**Date:** 2026-03-25

## [Prisma adapter reconnect wrapper expanded to all core db adapters]

**Symptom:**

- Same `Server has closed the connection` errors may appear in users, products, orders, carts, buyers, vendors, wallets, etc.

**Root Cause:**

- not all adapters had `withPrismaReconnect` applied, so some endpoints stayed brittle.

**Fix Applied:**

- Applied `withPrismaReconnect` wrapper to these adapter methods:
  - `userDb`, `productDb`, `orderDb`, `bannerDb`, `buyerDb`, `vendorDb`, `cartDb`, `walletDb`, `transactionDb`, `reviewDb`, `addressDb`

**Prevention:**

- Always wrap Prisma operations in reconnect logic for production connections that may be dropped.

**Files Affected:**

- lib/data/prismaAdapter.ts

**Date:** 2026-03-25

---

## Known Error Patterns

> **Section summary:** Recurring error categories seen in this tech stack. Agents should check this section when they match the pattern before investigating further.

### React / Next.js

**Hydration Mismatch**

- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, Date.now()) running during server render
- Fix: Wrap in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
- Prevention: Never access browser APIs outside useEffect in components

**Missing Key Prop**

- Symptom: `Each child in a list should have a unique "key" prop`
- Cause: `.map()` rendering without a stable unique key
- Fix: Add `key={item.id}` — use a stable unique ID, not the array index

---

### Node.js / Backend

**Unhandled Promise Rejection**

- Symptom: Server crashes silently or logs `UnhandledPromiseRejectionWarning`
- Cause: async function missing try/catch, or `.catch()` not attached to promise
- Fix: Wrap async route handlers in try/catch, use an async error middleware
- Prevention: Always use a global async error wrapper for Express routes

**Database Connection Pool Exhausted**

- Symptom: Requests hang indefinitely under load
- Cause: Connection pool limit too low or connections not being released
- Fix: Increase pool size in config, ensure `client.release()` in finally blocks
- Prevention: Always release DB connections in finally, not just success path

---

### Configuration / Environment

**Missing Environment Variable**

- Symptom: `undefined` values in production, features silently broken
- Cause: Variable defined in `.env.local` but not in production environment
- Fix: Add to deployment environment variables and validate on startup
- Prevention: Add a startup validation check that throws if required env vars are missing

---

## Resolved Errors Archive

> **Section summary:** Errors that have been fully resolved and are unlikely to recur. Kept for reference.

## [TSX parser/JSX in .ts service file]

**Symptom:**

- Build or typecheck fails with verbatim message from parser: `Expected '>', got 'firstName'` in `lib/services/email.ts`.
- Additional TypeScript errors follow from JSX syntax in non-TSX file.

**Root Cause:**

- `lib/services/email.ts` contained JSX literal expressions (e.g. `<VerifyEmail .../>`) while file extension was `.ts`; the TypeScript compiler only supports JSX in `.tsx` files.

**Fix Applied:**

- Replaced all `react: <Component ... />` cases with `react: React.createElement(Component, {...})` in `lib/services/email.ts`.
- Adjusted `sendOrderStatusUpdateEmail` status map lookup to avoid implicit `any` indexing by using typed lookup and fallback solid values.

**Prevention:**

- Enforce `*.tsx` for files that use JSX or always use `React.createElement` in `.ts` services.
- Add lint rule or PR check for JSX in `.ts` files.

**Files Affected:**

- lib/services/email.ts

**Date:** 2026-03-25

[Entries move here when the underlying cause has been permanently fixed]
