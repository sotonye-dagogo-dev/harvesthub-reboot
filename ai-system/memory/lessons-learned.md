# Lessons Learned

> **last-updated-by:** update-ai-system.md (2026-08-04)
> **last-updated-at:** 2026-08-04T16:30:00Z
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

## Marketing Landing Pages Belong in Front of Auth-Gated/Submission Routes

**Context:**
The sponsors/ads feature had `/advertise` and `/ad-application` as raw submission forms, forcing interested parties to fill out procurement forms before understanding placements, pricing, or policies.

**What We Learned:**
A config-driven landing page (`advertisingConfig` in `lib/config/siteContent.ts`) with an admin-editable narrative block (via the `PublicContent` `advertise` preset) cleanly separates marketing from intake. Moving the full form to `/advertise/apply` while keeping `/ad-application` as quick-apply preserves conversion paths without duplicating form logic. Public entry (footer) points to the landing page while operations routes (`/operations/banners`, `/operations/ads`) stay untouched, so marketing and management concerns do not couple.

**Apply When:**
Building public-facing features that sit in front of submission/procurement flows, or adding landing surfaces for domains with existing operations-management pages.
