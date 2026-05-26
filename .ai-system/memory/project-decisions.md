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

## Paystack Initialization Uses Client Inline Popup with Webhook Alias Compatibility

**Decision:** Paystack initialization for checkout, wallet deposit, and ad payment surfaces now runs client-side via inline popup (`js.paystack.co`), while backend webhook reconciliation remains canonical and is reachable via both `/api/payments/webhook` and `/api/paystack-webhook`.
**Date:** 2026-04-19
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Server-side Paystack initialization can fail in serverless hosting due to provider IP allowlist controls. Moving initialization to browser-hosted popup avoids those server egress restrictions while preserving existing downstream verification and reconciliation contracts.

**Alternatives Considered:**

- Keep server-side `/api/payments/initialize` as primary Paystack initializer (rejected: still vulnerable to provider IP restrictions).
- Add a new Paystack SDK dependency for popup launch (rejected: unnecessary dependency when official script already supports inline setup).

**Implications:**

- Payment clients must resolve a runtime-safe Paystack public key before launching popup.
- Existing env naming remains supported, including fallback support for `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`.
- Integrators can point Paystack webhooks to either `/api/payments/webhook` or `/api/paystack-webhook`.

## All Outbound Emails Must Flow Through Shared Branded Templates

**Decision:** All application emails now route through shared wrapper helpers in `lib/services/email.ts` and branded React templates under `lib/emails/`, including a generic notification template for fallback notification mail.
**Date:** 2026-05-02
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
The notification fallback still used plain JSX instead of the branded email layout, and some auth senders bypassed wrapper helpers. Centralizing wrapper usage keeps the layout, table styling, footer, and provider logging consistent across wallet, auth, order, vendor, and notification email paths.

**Alternatives Considered:**

- Leave direct route-level `sendEmail` calls in place as long as they used the right component (rejected: harder to audit and easier to bypass the shared contract later).
- Make a separate service per feature area (rejected: duplicates delivery plumbing and weakens consistency guarantees).

**Implications:**

- `lib/services/email.ts` is the canonical entry point for outbound mail delivery and template selection.
- `lib/emails/NotificationEmail.tsx` serves as the branded generic fallback for notification mail, with structured detail-table support when metadata provides it.
- Future email senders should use the shared wrapper helpers instead of building ad hoc React payloads directly.

## CIS Federation Handshake Surface

**Decision:** Add a narrow CIS-facing status route and signed webhook route in each platform repo instead of collapsing local schemas into CIS-owned tables.
**Date:** 2026-05-13
**Made by:** AI assistant (workspace rollout session)

**Reason:** The marketplace needs a low-risk adoption path that lets CIS drive identity sync and readiness checks without forcing a cross-repo schema rewrite in the same batch.

**Alternatives Considered:**

- Expose only documentation (rejected: docs-only does not exercise the integration surface).
- Wire CIS directly into the local user tables right away (rejected: direct schema coupling would require a broader migration pass).

**Implications:**

- CIS integration remains additive and platform-specific.
- Future work can attach a persistence target behind the webhook route when the owning repo is ready for that migration.

## CIS Sync Uses Push Model

**Decision:** CIS posts signed identity events to MyHarvestHub via webhooks.
**Date:** 2026-05-13
**Made by:** AI assistant

**Reason:** Push sync avoids polling overhead and keeps identity propagation near-real time.

**Alternatives Considered:** Pull model (periodic polling). Rejected due to latency and operational overhead.

**Implications:** Webhook verification and idempotency remain critical; reconciliation can be added later.

## CIS Identity Persistence (Additive)

**Decision:** Persist CIS sync data in `CisIdentity` and `CisWebhookEvent` without mutating local users.
**Date:** 2026-05-13
**Made by:** AI assistant

**Reason:** Provides auditability and a future linking surface without schema coupling.

**Alternatives Considered:** Direct user upserts on webhook. Rejected until the payload contract is final and migration scope is approved.

**Implications:** Identity linking can be layered later; current sync remains non-destructive.

## Cart Pricing Persists Effective and Original Amounts for Discount Parity

**Decision:** Cart state stores discount-aware pricing as effective `price` plus optional `originalPrice` and `discountPercent`, and checkout/cart summaries compute product discount from these fields before voucher deduction.
**Date:** 2026-04-19
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Product cards/details already expose discounted pricing semantics, but cart/checkout previously drifted by using undiscounted values only. Persisting structured pricing metadata keeps order totals, UI display, and downstream reconciliation consistent without changing external API contracts.

**Alternatives Considered:**

- Keep only base price in cart and recompute discount ad hoc in each page (rejected: duplicates logic and increases drift risk).
- Replace cart price with discounted amount only and drop original context (rejected: cannot render original-vs-discounted UX parity).

**Implications:**

- All add-to-cart entry points must provide discount-aware fields consistently.
- Cart and checkout should render strike-through original amounts only when `originalPrice > price`.
- Live catalog reconciliation should refresh both effective and original discount metadata.

## Top Banner Uses Navigator-Free Strip; Hero Uses Compact Below-Image Action Panel

**Decision:** Remove all explicit navigator controls from the top banner strip, and render hero carousel navigation/indicators/Know More inside a thin action panel below the hero image instead of overlaying controls on the image.
**Date:** 2026-04-18
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Client feedback identified control overlays as visually distorting banner presentation and increasing perceived page weight. Moving hero controls into a compact external panel preserves action discoverability while reducing image interference.

**Alternatives Considered:**

- Keep existing overlay controls and only reduce opacity/size (rejected: still overlays imagery and did not satisfy removal request for top strip).
- Remove hero controls entirely (rejected: weak discoverability for multi-banner navigation and details access).

**Implications:**

- Top banner remains rotation/link-capable but has no manual controls.
- Hero action affordances are centralized in a compact panel below imagery.
- Banner-focused visual contracts should assert below-image control placement and compact control sizing.

## Cloud Session Work Requires Temp Plan + Scope-Locked One-Pass Command

**Decision:** Any feature delegated to cloud execution must ship with a feature spec, queue block, and dedicated cloud temp plan, and should be kicked off with `.ai-system/commands/cloud-session-single-pass.md`.
**Date:** 2026-04-16
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Cloud sessions were prone to scope drift and partial closure when prompts were ad hoc. A standardized handoff package improves determinism, non-breaking behavior, and documentation closure.

**Alternatives Considered:**

- Continue with freeform prompts only (rejected: inconsistent execution quality and weak handoff reproducibility).
- Use only task queue without temp plan slices (rejected: insufficient sequencing and validation clarity for one-pass execution).

**Implications:**

- New cloud features should include temp-plan slices, locked constraints, and explicit final validation/docs gates.
- Handoff prompts now consistently include scope lock and documentation sync requirements.

## WhatsApp Guard Handoff Must Be Auth-Gated with Durable Safe Continuation

**Decision:** `/contact/whatsapp` now requires authentication and stores a sanitized internal continuation path so users who start unauthenticated can complete signup/verify-email/login and then refire the original guard intent.
**Date:** 2026-04-17
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Client requested seamless and interruption-tolerant chat continuation after auth completion. Persisted safe continuation avoids dead-ends during delayed email verification and prevents unsafe external redirect injection.

**Alternatives Considered:**

- Keep guard page publicly accessible and rely on user manually returning after signup (rejected: poor continuity and conversion risk).
- Pass unsanitized raw `from` query through auth screens only (rejected: open-redirect risk and brittle across interruptions).

**Implications:**

- Auth and signup surfaces should preserve/refire only sanitized internal continuation paths.
- Login consumes pending continuation fallback when explicit `from` is absent.
- Future off-platform handoff flows should follow the same safe-continuation contract.

## Voucher Targeting Uses Config-Driven Scope + PRIVATE Visibility

**Decision:** Voucher applicability is now interpreted via reusable scope fields (categories, vendors, campuses, products) and a visibility mode (`PUBLIC`/`PRIVATE`) that hides private vouchers from buyer dashboard discovery while still allowing checkout code redemption.
**Date:** 2026-04-17
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Client requested more granular campaign targeting and code-only vouchers. A shared scope parser/matcher keeps behavior dynamic and backward compatible without introducing hardcoded campaign branches.

**Alternatives Considered:**

- Add separate bespoke voucher types per campaign scenario (rejected: rigid and hard to maintain).
- Use `isActive` to simulate hidden vouchers (rejected: deactivates checkout usability instead of hiding discovery only).

**Implications:**

- Admin voucher APIs/UI accept and persist scope + visibility configuration.
- Buyer dashboard excludes `PRIVATE` vouchers while `/api/vouchers/validate` enforces targeting scope from checkout context.
- Shared helper (`lib/vouchers/scope.ts`) should be reused for future voucher-related rules to avoid interpretation drift.

## Payment Initialization Amount Must Be App-Supplied Before Provider Checkout

**Decision:** Keep payment initialize flow amount-driven from the application request. Do not defer amount entry to provider-hosted checkout for wallet/ad initialization flows.
**Date:** 2026-04-16
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Provider initialize APIs (including Paystack) expect merchant-supplied amount for transaction creation. Application-side amount also enables server-side validation, expected-amount checks, and deterministic reconciliation.

**Alternatives Considered:**

- Ask user to enter amount only on provider page (rejected: incompatible with initialize API contract and weakens reconciliation controls).
- Hardcode fixed amount options only (rejected: reduces flexibility for wallet/ad use cases).

**Implications:**

- Wallet/ad payment initialize routes continue to require amount in request payload.
- UX should clearly explain that provider checkout confirms payment details for the app-supplied amount.
- Provider initialization failures (for example IP restriction) should be mapped to user-safe and operator-actionable diagnostics.

## Chat-With-Vendor Messages Must Be Origin-Aware and URL-Anchored

**Decision:** WhatsApp chat handoff payloads must include origin-aware meaningful text and canonical source URL context (`product` or `vendor`) before redirecting through the guard flow.
**Date:** 2026-04-16
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Generic chat payloads reduce conversion quality and increase vendor clarification overhead. Product- and vendor-originated chats require distinct context to preserve user intent and trust.

**Alternatives Considered:**

- Keep minimal payload with only phone/vendor name (rejected: weak context and poorer vendor response quality).
- Put full freeform text logic only on the client component level (rejected: harder to normalize consistently across entry points).

**Implications:**

- Product-origin chats should include product name + canonical product URL in starter text.
- Vendor-origin chats should include vendor/store context + canonical vendor URL in starter text.
- Guard route should normalize and preserve safe fallback behavior when context fields are missing.

## Dynamic Entity Pages Require Metadata Parity with Safe Fallbacks

**Decision:** Dynamic entity pages (starting with product and vendor detail pages) must provide consistent metadata coverage for `title`, `description`, `image`, and canonical `url`, including Open Graph/Twitter parity and safe fallback hierarchy.
**Date:** 2026-04-16
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Inconsistent metadata weakens link previews, discoverability, and sharing quality. Dynamic pages frequently have partial data and require deterministic fallback ordering.

**Alternatives Considered:**

- Keep title/description-only metadata on dynamic pages (rejected: incomplete preview parity).
- Hardcode generic metadata for all dynamic pages (rejected: loses entity-specific relevance).

**Implications:**

- Metadata builders should source entity name, description, image/logo, and canonical URL with fallbacks.
- Open Graph and Twitter metadata should remain aligned for consistent social rendering.
- Missing entity fields must degrade gracefully without blank or malformed metadata output.

## Ad/Banner Mutations Use Request-Key Idempotency with Payload-Fingerprint Fallback

**Decision:** Banner create/update and ad-application submission routes now enforce short-window idempotent mutation guards using client request keys when provided, with payload fingerprint fallback and replay-safe response payloads.
**Date:** 2026-04-16
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Duplicate writes were possible during rapid submit/retry flows and when `/api/ad-applications` and `/api/ads/apply` were both used. A shared idempotency contract prevents duplicate persistence while keeping responses deterministic for replayed requests.

**Alternatives Considered:**

- Database-level unique constraints over broad payload fields (rejected: high migration complexity and false-positive risk for legitimate repeat submissions).
- Client-only submit lock without API dedupe (rejected: cannot protect retries, offline replay, or multi-tab duplicates).

**Implications:**

- Client mutation forms should send `x-idempotency-key` and keep submit-lock while requests are in-flight.
- API routes keep Redis-first idempotency guard with local-memory fallback.
- Replayed requests return replay-safe payload or duplicate-processing acknowledgement, without additional writes.

## Payment Initialize Failures Must Map to Stable App Error Codes with Operator Path

**Decision:** `/api/payments/initialize` now maps provider failure strings (including Paystack IP whitelist restrictions) into stable app-level codes and user-safe messages, while returning operator diagnostics pointing to `/operations/settings`.
**Date:** 2026-04-16
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Raw provider errors were user-hostile and not actionable for operators. Mapped taxonomy enables predictable frontend behavior and clearer operations remediation paths.

**Alternatives Considered:**

- Surface provider raw error directly to users (rejected: leaks provider internals and produces confusing copy).
- Keep generic single error message only (rejected: weak diagnostics and slower operations triage).

**Implications:**

- Frontends can rely on explicit `code` values from initialize errors.
- Operations can use diagnostics guidance and Paystack panel to resolve upstream setup issues.
- Amount-supplied-by-app initialize contract remains unchanged.

## Withdrawal Settlement Hold Window Is Admin-Configurable Lifecycle Policy

**Decision:** Persist withdrawal pending-settlement hold duration as `withdrawalSettlementHoldHours` in `CommerceLifecycleConfig` and manage it from operations settings (`GET/PUT /api/admin/commerce-config`) instead of hardcoding a fixed window.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Settlement timing policy is operational and may change by environment, release phase, or business controls. Hardcoded windows require code changes and redeploys for policy updates, increasing drift and operational friction.

**Alternatives Considered:**

- Keep hardcoded 72-hour window in withdrawal route (rejected: not configurable and slower policy iteration).
- Store window in environment variable only (rejected: not admin-visible/editable and less auditable in app UI).

**Implications:**

- Operations settings now exposes a persisted "Withdrawal Settlement Hold Window" control.
- Withdrawal guard path reads runtime policy from `CommerceLifecycleConfig` rather than static constant-only behavior.
- Config updates are bounded (`1..720`) via admin API and service-level clamping.
- Database migration is required before policy updates can be saved in environments.

## Checkout, Deposit, and Withdraw Actions Are Enabled for Authenticated Users with Contextual Withdrawal Guardrails

**Decision:** Enable checkout placement, wallet deposits, and wallet withdrawal requests for all authenticated users, while applying withdrawal restrictions only when payout/settlement context indicates active unresolved holds (not by role alone).
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Blanket role-based gating created contradictory user experience and blocked legitimate authenticated flows. Withdrawal safety requirements are domain-contextual (for example unresolved payout holds), so restrictions should follow transaction state rather than static role type.

**Alternatives Considered:**

- Keep buyer-only checkout and vendor-only withdrawals (rejected: directly conflicts with requested authenticated-access policy and caused UX inconsistency).
- Remove all withdrawal restrictions entirely (rejected: ignores payout reconciliation safety requirements).

**Implications:**

- `POST /api/orders` no longer returns role-block response for authenticated non-buyer roles.
- Checkout UI no longer disables placement based on admin role.
- Wallet withdrawal UI/API no longer use vendor-only role hard blocks.
- `POST /api/wallet/withdraw` now enforces contextual `WITHDRAWAL_PENDING_SETTLEMENT` restrictions when recent pending payout holds exist.
- Supersedes prior same-day decisions that enforced buyer-only checkout and vendor-only/admin wallet mutation hard-block contracts.

## Paystack Webhook Reconciliation Must Be Replay-Safe and Verify-Backed

**Decision:** Treat `/api/payments/webhook` as an idempotent reconciliation endpoint that only mutates transaction/order state after signature validation, replay-key acquisition, and provider-side reference re-verification.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Webhook delivery can be retried or replayed. Relying on webhook payload-only updates risks duplicate side effects and state drift versus provider truth.

**Alternatives Considered:**

- Trust webhook payload and always update records without provider re-verify (rejected: replay and stale-state risk).
- Use only in-memory replay guard (rejected: process-local and less resilient across restarts/scale-out nodes).

**Implications:**

- Webhook route now uses Redis-backed idempotency acquisition with local fallback safety.
- Replayed callback events return acknowledgement without reapplying mutations.
- Order status history includes webhook reconciliation audit metadata for traceability.

## Paystack Verification Must Match Expected Amount and Currency Before Fulfillment

**Decision:** For Paystack-backed card payments, the backend must only deliver value (order creation or wallet credit) after verify returns `SUCCESS` and the verified amount/currency exactly match expected values (`NGN` and subunit-equivalent amount).
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Paystack recommends verifying both transaction status and amount before fulfillment. Status-only verification can still permit underpayment or currency mismatch fulfillment paths.

**Alternatives Considered:**

- Verify status only and trust client-entered amount (rejected: underpayment/mismatch risk).
- Perform loose float comparison without subunit normalization (rejected: decimal precision drift risk).

**Implications:**

- `POST /api/orders` now enforces `PAYMENT_AMOUNT_MISMATCH` and `PAYMENT_CURRENCY_MISMATCH` guards before persisting paid orders.
- `POST /api/wallet/deposit` now enforces the same parity guards before wallet credits.
- Checkout error mapping includes explicit user-safe guidance for mismatch outcomes.

## [Superseded] Checkout and Wallet Role Policy Uses Hard-Block Contract for Admin Accounts

**Decision:** Enforce a hard-block policy where checkout order creation is buyer-only and admin wallet mutations remain read-only, with explicit user-facing UX guidance and API error codes.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Admin-facing operational surfaces and buyer commerce flows should not overlap in production behavior; mixed semantics caused contradictory wallet/checkout outcomes and support confusion.

**Alternatives Considered:**

- Allow admin checkout/wallet mutation under implicit QA assumptions (rejected: high risk of role-policy drift and accidental production misuse).
- Keep UI-only block without API enforcement (rejected: security/contract bypass risk).

**Implications:**

- `POST /api/orders` now returns `CHECKOUT_ROLE_BLOCKED` for non-buyer roles.
- `POST /api/wallet/deposit` now returns `WALLET_ROLE_BLOCKED` for admin role.
- `/checkout` and `/wallet` show explicit role-policy guidance and disable conflicting actions.

## [Superseded] Checkout Remains Buyer-Only; Wallet Deposits Are Role-Agnostic

**Decision:** Keep checkout order placement buyer-only, but allow wallet deposits for authenticated roles (including admin) while retaining vendor-only withdrawals.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Operational/admin users require valid wallet top-up behavior for testing/reconciliation flows, and previous UI/API hard-blocks created confusing inconsistency with payment controls. Wallet restrictions should reflect action semantics: deposits are safe role-agnostic funding actions, withdrawals remain vendor settlement-specific.

**Alternatives Considered:**

- Keep admin wallet deposit hard-block (rejected: caused confusing UX and blocked legitimate operational/testing flows).
- Allow all roles to withdraw (rejected: conflicts with current vendor settlement model).

**Implications:**

- `POST /api/wallet/deposit` no longer role-blocks admin deposits.
- Wallet page enables deposit for authenticated roles when gateway is ready and keeps withdrawal vendor-only.
- Checkout still blocks non-buyer order creation via `CHECKOUT_ROLE_BLOCKED`.
- Supersedes the admin wallet-read-only portion of the previous role-policy decision.

## Payment Verification Must Be Reference-Driven, Not Suffix-Inferred

**Decision:** Remove synthetic success-reference shortcuts and require explicit provider reference verification in checkout/wallet payment completion flows.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Synthetic verification references could mark payments as successful without authoritative provider confirmation, creating truthfulness and reconciliation risks.

**Alternatives Considered:**

- Keep synthetic fallback for convenience in all environments (rejected: undermines payment integrity contract).
- Rely only on client-side verification pre-check without server re-verification (rejected: tamper/prior-state risk).

**Implications:**

- Checkout/wallet now follow initialize -> user completes provider step -> verify -> mutation.
- Server-side routes re-verify references before writing paid states.
- Order status history now records verification timeline metadata (`paymentVerifiedAt`, provider status fields).

## Banner Placement Validation Is Upload-Time Warn-Only

**Decision:** Validate uploaded ad/banner image dimensions against selected placement ratio (`TOP`, `HERO`, `SIDEBAR`) at upload-time and present non-blocking warnings instead of hard-rejecting uploads.
**Date:** 2026-04-15
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Users need immediate fit guidance to avoid runtime clipping/letterboxing, but creative approval and operational flexibility require allowing uploads that are close enough or intentionally off-ratio.

**Alternatives Considered:**

- Hard-block mismatched ratio uploads (rejected: too rigid for campaign realities and would increase operator friction).
- Keep guidance as static text only (rejected: insufficient real-time feedback, easy to ignore).

**Implications:**

- `ImageUpload` and sponsor/banner forms must consume upload metadata (`width`/`height`) and run shared ratio checks.
- Warning copy should align with `AD_BANNER_DIMENSIONS` guidance to avoid conflicting instructions.
- Approval/moderation workflows remain the final enforcement gate.

## Header Search Must Use One Shared Suggestion/History Contract

**Decision:** Replace the static navbar search input with one shared responsive search experience that supports debounced live suggestions and local recent-search history, and avoid maintaining separate divergent search implementations.
**Date:** 2026-04-15
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
Current header search is non-functional and existing search UX is split across `SearchBar` and `AdvancedSearchBar`, increasing drift risk and inconsistent behavior across routes/devices.

**Alternatives Considered:**

- Keep static header input and rely on products-page-only search (rejected: fails user navigation expectations).
- Build a third independent header-only search implementation (rejected: duplicates logic and increases maintenance risk).

**Implications:**

- Header should compose a shared search module with keyboard + accessibility behavior and responsive dropdown rules.
- Search suggestions should come from existing product search APIs and route to canonical product discovery query contracts.
- Recent history persistence should use a versioned localStorage key with safe parse fallback.

## Recent Search Persistence Requires Storage Capability Guards

**Decision:** Keep recent-search persistence in browser storage, but gate every storage read/write behind runtime capability checks (`getItem`, `setItem`, `removeItem`) to avoid crashes in non-standard browser/test environments.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
SearchBar is shared across header and other surfaces; direct storage calls caused runtime test failures where localStorage shim behavior was incomplete.

**Alternatives Considered:**

- Remove recent-search persistence entirely (rejected: degrades UX requirement).
- Keep direct localStorage access and patch only tests (rejected: fragile in constrained runtimes and non-browser contexts).

**Implications:**

- Shared UI components using browser storage must use capability-checked wrappers.
- Tests that assert persistence should install explicit localStorage mocks.

---

## Decisions

## Order List Item Metrics Must Be API-Derived Canonical Fields

**Decision:** Expose `itemCount` and `totalQuantity` directly from `GET /api/orders` and require list consumers (`/orders`, `/operations/orders`, notifications metadata) to consume these canonical fields instead of deriving counts from optional `order.items` relation payloads.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Order list consumers were computing item counts from `order.items?.length`, but list responses did not include `items` by default, producing false `0` counts in production surfaces.

**Alternatives Considered:**

- Include full order items relation in all list responses and keep client-side counting (rejected: larger payloads and repeated derivation logic across consumers).
- Patch only one UI surface with ad hoc fallback logic (rejected: does not fix cross-surface contract drift and is regression-prone).

**Implications:**

- Order list payload now carries explicit count metrics suitable for UI and message metadata reuse.
- Consumer pages should treat `order.items` as optional detail-only data, not list-contract required data.
- Regression tests should assert count-field presence in orders list routes.

## Operations Payment/Threshold Controls Are Persisted and Admin-Editable

**Decision:** Promote payment enablement, minimum order amount, and maximum booking advance days from read-only runtime defaults to persisted, admin-editable configuration fields in `CommerceLifecycleConfig`.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Admin users require live operational control over payment handling and order policy thresholds. Read-only controls created a governance mismatch and blocked expected operations behavior.

**Alternatives Considered:**

- Keep controls read-only and document env ownership (rejected: failed operator expectations and blocked runtime operations).
- Add a separate standalone settings model (deferred: unnecessary indirection while `CommerceLifecycleConfig` already provides singleton policy storage).

**Implications:**

- `/api/admin/payments/config` now supports persistence via `PUT`.
- `/api/admin/commerce-config` now includes validation/persistence for `minOrderAmount` and `maxBookingAdvanceDays`.
- `/api/orders` enforces DB-backed minimum order amount and DB-backed payment enablement policy.
- Supersedes the prior decision that these controls must remain read-only due missing persistence contracts.

## Remember Me Must Survive Access-Token Refresh

**Decision:** Persist remember-me preference in cookie state and apply that preference when re-issuing access cookies during both implicit auth refresh (`lib/utils/auth.ts`) and explicit `/api/auth/refresh` flows.
**Date:** 2026-04-15
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Remember Me should govern session durability across token refresh boundaries, not only at initial login. Without preference propagation, refresh paths can degrade expected persistence behavior.

**Alternatives Considered:**

- Keep remember state only in client localStorage (rejected: server refresh routes cannot reliably honor it).
- Always issue fixed-duration access cookies on refresh (rejected: breaks session-vs-remembered semantics).

**Implications:**

- Added remember-me cookie marker and refresh-aware access-cookie issuance.
- Logout/clear-auth flows now clear remember preference cookie as part of auth teardown.

## Wallet Balance Reconciliation Uses Explicit Sync Events + Forced Refresh

**Decision:** Use an explicit client-side wallet sync event contract (`myharvesthub:wallet-sync`) plus forced wallet refresh on mount/event receipt to keep wallet cards deterministic after deposit/withdraw and order lifecycle mutations.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Wallet state can be affected by mutations initiated in different feature surfaces (wallet page, order detail lifecycle actions). Cache-only refresh intervals can temporarily display stale balances immediately after successful mutations.

**Alternatives Considered:**

- Depend only on periodic polling/stale-time windows (rejected: non-deterministic post-action UX).
- Disable caching entirely for wallet resource (rejected: unnecessary performance regression).

**Implications:**

- `app/wallet/page.tsx` now forces `refresh(true)` on mount and on wallet sync events.
- Order detail and wallet mutation flows emit wallet sync events after successful mutations.
- Regression tests now assert wallet refresh behavior on sync events.

## Runtime Defaults in Operations Settings Are Read-Only Without Persistence Contracts

**Decision:** Any operations settings control without a persisted API contract must be presented as read-only runtime metadata rather than editable UI (applied to minimum order amount and maximum booking advance controls).
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Editable controls that do not persist create false-success semantics and policy drift. Read-only labeling makes ownership explicit while preserving operator visibility into runtime defaults.

**Alternatives Considered:**

- Keep controls editable and defer persistence wiring (rejected: reintroduces UI-only no-op behavior).
- Remove controls entirely from settings page (rejected: loses useful operational context).

**Implications:**

- Settings persistence audit map now separates persisted editable controls from runtime-read-only controls.
- Future settings additions must either include persistence endpoints/models or be explicitly read-only.

## Grouped Bulk Order Actions Must Return Partial-Applicability Reports

**Decision:** Implement grouped lifecycle actions (`CANCEL`, `REFUND_REQUEST`) as per-order eligibility evaluation with partial-application results (`applied`, `skipped`, reasons) instead of fail-all behavior when any order in group is ineligible.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Grouped checkouts commonly contain mixed lifecycle states. Fail-all semantics would block valid actions for eligible sibling orders and create confusing UX. Partial reports keep behavior safe, auditable, and user-informative.

**Alternatives Considered:**

- Fail entire grouped action if any order is ineligible (rejected: creates avoidable friction and poor operator recovery flow).
- Apply silently to eligible orders without skipped details (rejected: weak transparency and support/debuggability).

**Implications:**

- Grouped bulk API responses now carry explicit `applied`/`skipped` arrays and count summaries.
- UI should always surface mixed-status outcomes instead of assuming all-or-nothing success.
- Future grouped actions should follow the same partial-applicability contract.

## App Router Page Modules Must Not Export Helper Utilities

**Decision:** Keep reusable helper functions out of `app/**/page.tsx` modules and place them in sibling utility modules (for example `app/checkout/error-mapping.ts`).
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Next.js App Router page modules have strict export contracts; extra named exports can break type/build checks. Extracting helpers avoids framework contract violations while preserving testability.

**Alternatives Considered:**

- Continue exporting helper directly from page module (rejected: violates App Router export contract and fails typecheck).
- Inline helper logic inside component only (rejected: harder to test and reuse).

**Implications:**

- Shared checkout error mapping now lives in dedicated module and is unit-tested independently.
- Future reusable logic in route/page files should be extracted early to avoid export-surface regressions.

## Operations Settings Saves Must Be Section-Coordinated and Persist-Backed

**Decision:** Treat operations settings save as a coordinated multi-endpoint persistence flow (commission defaults + commerce lifecycle), with explicit partial-save visibility, rather than allowing UI controls that do not persist.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Commission controls existed in settings UX but were not persisted, creating silent no-op behavior. Coordinated save orchestration prevents false-success UX and keeps admin policy controls trustworthy.

**Alternatives Considered:**

- Keep current UI and persist only lifecycle settings (rejected: leaves commission section misleading).
- Split save buttons by panel with no unified feedback (rejected: increases operator confusion and weakens overall save contract).

**Implications:**

- Settings page now loads/saves category commission defaults through `/api/admin/commission`.
- Save action coordinates commission + commerce lifecycle persistence and reports partial failures clearly.
- Future settings controls should not be rendered editable unless backed by persistence contract.

## Notification Preferences Must Orchestrate Browser Push State

**Decision:** Treat notification preference changes as both persistence and device orchestration events: enabling push must request/sync browser subscription, disabling push must unsubscribe locally and clean backend subscription state, and new unread inbox events must surface proactive in-app toast signals plus nav badge counts.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Preference-only saves created drift between stored settings and actual browser/device push state, and inbox-only updates reduced user-perceived notification visibility. Tight orchestration aligns persisted intent with real delivery capability and improves discoverability through immediate UX cues.

**Alternatives Considered:**

- Keep push toggle as backend-only preference bit and rely on background sync (rejected: drift persists and user receives misleading success state).
- Show unread state only on inbox page/sidebar (rejected: low discoverability for active sessions).

**Implications:**

- `NotificationContext` now emits toast notifications for newly detected unread events after hydration.
- Navigation surfaces (`Header`, dashboard `Sidebar`) now display unread badges for notifications.
- `NotificationPreferences` save flow now calls push subscribe/unsubscribe orchestration and communicates permission/setup failures clearly.

## Banner Placement Ratios Are Runtime-Preview Contracts

**Decision:** Lock banner placement sizing as a shared visual contract: compact `TOP` strip (about half prior height), reduced `HERO` viewport (~1/6 shorter), and dense square `SIDEBAR` tiles with preview parity across operations/advertise surfaces.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Banner surfaces previously occupied too much vertical space and sidebar ads were not dense enough to show multiple campaigns at once. Standardized runtime + preview ratio contracts reduce clipping risk, improve above-the-fold balance, and prevent operator preview drift.

**Alternatives Considered:**

- Keep prior banner dimensions and only trim spacing (rejected: insufficient visual change, sidebar still too dominant).
- Introduce DB-configurable ratio controls immediately (rejected: unnecessary complexity for a fixed design pass and would require additional governance/UI validation scope).

**Implications:**

- `TopAdBanner`, `BannerCarousel`, and home sidebar rail now enforce updated ratio classes.
- `BannerPlacementPreview` mirrors the same sizing rules for admin/operator confidence.
- Visual contract tests now assert top strip, hero viewport, and sidebar tile ratio expectations.

## Commerce Lifecycle Timing Is Admin-Managed and Persisted

**Decision:** Persist auto-confirm/refund timing and lifecycle enablement in a dedicated singleton model (`CommerceLifecycleConfig`) managed by admin settings APIs/UI instead of hardcoding SLA windows.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Hardcoded lifecycle windows (for example 48-hour auto-confirm) force code changes for operational policy updates and reduce incident response flexibility. Persisted bounded config allows operations to tune policy safely without redeploying.

**Alternatives Considered:**

- Keep hardcoded constants in route handlers (rejected: no runtime adjustability, slower ops response).
- Store timing in environment variables only (rejected: requires deploy/restart and lacks in-app admin governance).

**Implications:**

- `POST /api/orders/auto-confirm` now reads `autoConfirmEnabled`/`autoConfirmHours` from persisted config.
- `POST /api/orders/[id]/refund/request` enforces `refundWindowHours` from persisted config.
- Prisma migration `20260414100529_add_commerce_lifecycle_config` is now part of lifecycle policy infrastructure.

## Checkout Supports Multi-Vendor Split Orders with Single Payment Integrity

**Decision:** Allow checkout to submit grouped `vendorOrders[]`, then split into one order per vendor inside one transaction while preserving unified payment verification and wallet debit integrity.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Blocking multi-vendor checkout created UX friction and pushed users to brittle manual sequencing. Split-order creation with atomic transaction semantics supports realistic marketplace carts while preventing payment/order mismatch.

**Alternatives Considered:**

- Keep single-vendor-only checkout hard block (rejected: poor marketplace UX and explicit user request conflict).
- Create one order containing multi-vendor lines (rejected: conflicts with existing schema/vendor ownership contracts and payout/refund lifecycles).

**Implications:**

- Checkout now sends `vendorOrders[]`; API creates per-vendor orders linked by shared checkout group metadata.
- Wallet payments validate balance against grouped total and debit once with per-order payment transaction audit records.
- Notifications fan out per vendor while buyer receives grouped checkout confirmation.

## Delivered Orders Now Use Settlement Hold Then Release (Confirmation-Gated)

**Decision:** Change delivered-order payout behavior from immediate wallet credit to a two-step lifecycle: create a `PAYOUT` hold (`PENDING`) at `DELIVERED`, then release funds only on buyer confirmation or 48-hour auto-confirm.
**Date:** 2026-04-14
**Made by:** AI implementation session (GitHub Copilot)

**Reason:**
Immediate credit on delivered-status change prevented true confirmation-window safeguards and made refund compensation paths harder to model cleanly. Hold-then-release supports deterministic payout control, aligns with the planned auto-confirm SLA, and improves lifecycle auditability.

**Alternatives Considered:**

- Keep immediate credit at `DELIVERED` and only annotate timeline events (rejected: weak control over settlement window and refund timing semantics).
- Add full new settlement tables before behavioral change (deferred: higher migration scope; staged behavior change implemented first).

**Implications:**

- `PATCH /api/orders/[id]/status` now creates payout hold records rather than immediate wallet balance mutations.
- Settlement release is executed by `POST /api/orders/[id]/confirm-delivery` or `POST /api/orders/auto-confirm`.
- Final schema/migration closure must still evaluate whether dedicated lifecycle fields/entities are needed beyond JSON history + transaction metadata.

## Commerce Assurance Is Governed As Phase A Delivered + Phase B Continuation

**Decision:** Treat the merged 2026-04-13 cloud output as Phase A completion (deterministic status transitions, delivered payout idempotency, banner preview parity, WhatsApp guard) and formally re-open Phase B for the remaining original lifecycle scope (buyer confirmation/auto-confirm, settlement, payout orchestration lifecycle, refund lifecycle, and migration-backed persistence if needed).
**Date:** 2026-04-14
**Made by:** AI reconciliation session (GitHub Copilot)

**Reason:**
Integrity audit against stash + merged history confirmed a scope mismatch: original plan covered full commerce lifecycle orchestration, while merged implementation delivered a narrower hardening subset. Documentation must represent both truths simultaneously to avoid release/compliance ambiguity.

**Alternatives Considered:**

- Mark full commerce assurance wave complete based on merged subset only (rejected: scope drift, inaccurate release communication).
- Roll back merged Phase A changes and re-run cloud session from scratch (rejected: unnecessary churn; Phase A improvements are valid and should be retained).

**Implications:**

- Planning/queue artifacts must retain Phase A as completed and Phase B as explicit remaining work.
- Final closure for Phase B must include a mandatory schema/migration report even if outcome is "No migration required."
- Client-facing communication should distinguish currently shipped cash/order behavior from pending lifecycle automation.

## Hero Banner Viewport Is Image-First; Detail Copy Lives Behind "Know More"

**Decision:** Render hero carousel slides without direct title/description text overlays in the viewport and preserve copy/details access through the existing `Know More` modal flow.
**Date:** 2026-04-13
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The UI adjustment request prioritized a Konga-like ad composition with stronger media focus. Keeping textual detail in modal prevents visual clutter while retaining campaign context and extended metadata when users explicitly request it.

**Alternatives Considered:**

- Keep desktop overlay/action-panel text and only hide mobile text (rejected: inconsistent cross-device contract).
- Remove detail copy entirely (rejected: loses campaign context and metadata discoverability).

**Implications:**

- Hero carousel viewport remains image-first across breakpoints.
- Banner operators should continue supplying descriptive fields because modal content still uses them.
- Preview/runtime contracts should emphasize media-first rendering for hero visuals.

## Products Discovery State Must Rehydrate From URL Query Changes

**Decision:** Products page local filter/search/sort state must synchronize with URL query params (`useSearchParams` + canonical parser) so category tag clicks and shared links immediately apply filtering behavior.
**Date:** 2026-04-13
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Category tags were updating URL params but not always updating local state in the client component, causing mismatch where filtering appeared inactive until sidebar interaction. Query-driven rehydration restores single-source-of-truth behavior and predictable tag click-through UX.

**Alternatives Considered:**

- Convert category tags to local-only state buttons (rejected: loses URL shareability/bookmarkability).
- Force full page reload on each category click (rejected: heavier UX and unnecessary churn).

**Implications:**

- URL query becomes authoritative for products discovery initialization and on-route updates.
- Future filter controls should maintain parser/serializer contract parity to avoid drift.
- Tests should validate both URL generation and URL-to-state hydration behavior.

## Order Status Lifecycle and Delivered Payouts Must Be Deterministic and Idempotent

**Decision:** Enforce canonical enum-safe order status transitions in `PATCH /api/orders/[id]/status`, treat same-status requests as idempotent no-ops, and automate delivered-order vendor payouts only once using deterministic payout references plus existing-transaction checks.
**Date:** 2026-04-13
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The previous lifecycle map included non-schema statuses (`SHIPPED`, `COMPLETED`) and could not guarantee predictable replay behavior. Commerce assurance requires reliable transition gating and payout safety so retries or duplicate calls never create duplicate wallet credits.

**Alternatives Considered:**

- Keep permissive string-based transitions and rely on caller discipline (rejected: transition drift and retry duplication risk).
- Introduce a new payout-tracking schema/table first (rejected: unnecessary migration scope for this pass).

**Implications:**

- Order status changes now align strictly with persisted `OrderStatus` enum values.
- Delivered payout automation now credits vendor wallet once per order with replay-safe behavior.
- Future lifecycle extensions should preserve enum contracts and idempotent replay semantics.

## Vendor WhatsApp Contact Must Use Guard-First External Handoff

**Decision:** Route vendor WhatsApp contact through an internal guard page (`/contact/whatsapp`) that displays a safety disclaimer before the user can continue to external WhatsApp.
**Date:** 2026-04-13
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Direct external handoff from vendor profile bypassed an explicit user-safety checkpoint. The commerce assurance requirement mandates a guard-first redirect for external messaging channels.

**Alternatives Considered:**

- Keep direct `wa.me` links with inline warning text only (rejected: no enforced pre-handoff checkpoint).
- Use browser confirm modal on click (rejected: inconsistent UX and weaker accessibility/discoverability compared to dedicated guard page).

**Implications:**

- Vendor contact flow now includes explicit safety messaging before leaving MyHarvestHub.
- Any future external messaging handoffs should reuse a guard-first pattern rather than direct links.

## Payment Availability Is Runtime-Gated By Active Paystack Keys

**Decision:** Drive checkout/wallet payment-enabled UX and order payment-gating logic from active-mode Paystack key readiness (`env.paystackPublicKey` + `env.paystackSecretKey`) via shared runtime config, instead of static `PLATFORM_DEFAULTS.PAYMENTS_ENABLED`.
**Date:** 2026-04-11
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations settings already communicate that payment processing is controlled by live/test Paystack configuration. Static constants kept wallet/checkout in "coming soon" mode even when admin had enabled test-mode integration, creating product-behavior drift and blocking QA.

**Alternatives Considered:**

- Keep static constant + editable UI switch (rejected: not persisted and still drifts from real env-driven gateway readiness).
- Add DB-backed payment toggle model immediately (rejected: higher scope than needed for this bug-fix slice).

**Implications:**

- Frontend and order API now share one source of truth for whether gateway-assisted payment paths are active.
- Admin settings "Enable Payment Processing" switch is now read-only status derived from runtime config.
- If active-mode Paystack keys are removed, payment paths safely fall back to pending/pay-later behavior.

## Paystack Configuration Uses Mode-Switched Key Sets with Admin Read-Only Clarity Panel

**Decision:** Use `PAYSTACK_MODE` (`test`/`live`) to select mode-specific key sets (`PAYSTACK_TEST_*`, `PAYSTACK_LIVE_*`) and expose a sanitized admin-only configuration/status panel in operations settings instead of editable runtime credential toggles.
**Date:** 2026-04-11
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The team needs both test and live credentials ready while reducing accidental live-money processing. A clear, read-only admin panel improves operational awareness (mode, callback/webhook targets, key readiness, webhook flag/IP whitelist) without exposing secrets or pretending env-backed settings are editable in UI.

**Alternatives Considered:**

- Keep single generic `PAYSTACK_PUBLIC_KEY`/`PAYSTACK_SECRET_KEY` only (rejected: ambiguous environment switching and higher cutover risk).
- Add mutable dashboard-like credential form in app UI (rejected: conflicts with env/secret-store governance and increases secret leakage risk).

**Implications:**

- Deployments must set both test/live keys and explicit `PAYSTACK_MODE` for predictable behavior.
- Admins get clear test-mode guidance that no real money moves in sandbox mode.
- Webhook signature verification now depends on active mode keying (`PAYSTACK_WEBHOOK_SECRET` override or active mode secret key).

## Destructive Action Confirmation Uses a Provider-Registered Presenter Bridge

**Decision:** Route all `openActionConfirm` calls through a provider-registered presenter bridge (`App.useApp().modal.confirm`) with fallback to static `Modal.confirm`, so destructive confirmation dialogs render consistently across route groups.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Destructive actions in some surfaces (including operations product delete) could miss showing confirmation reliably when relying on static modal pathways only. Centralizing presenter wiring improves consistency and preserves single-source confirmation semantics.

**Alternatives Considered:**

- Keep static `Modal.confirm` only (rejected: context/render reliability drift across page shells).
- Replace each action with local `Popconfirm` wrappers (rejected: repeated per-action duplication and weaker global governance).

**Implications:**

- New destructive actions should continue using `openActionConfirm` presets and inherit shared behavior.
- Provider bootstrap must keep confirmation presenter registration active.

## SMS Channel Is Explicitly Disabled Until Delivery Support Ships

**Decision:** Keep SMS notification controls visible but disabled with clear "coming soon" messaging in UI and enforce `smsNotifications=false` in preferences API until SMS infrastructure is available.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
User-facing SMS toggle implied functionality that is not operational yet. Disabling both UX toggle and backend persistence path avoids false affordance and inconsistent expectations.

**Alternatives Considered:**

- Hide SMS setting completely (rejected: loses roadmap visibility for users/admins).
- Leave toggle editable and ignore server-side (rejected: misleading and erodes trust).

**Implications:**

- Preference payloads must report SMS as disabled regardless of persisted historical value.
- Re-enable only when channel delivery path and test coverage are ready.

## Operations Product Vendor Filter Must Preserve Explicit "All" Selection

**Decision:** In operations product management, preserve explicit `All vendors` selection and stop bootstrap logic from auto-forcing admin filter to the first vendor.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Admin filter selection reverted shortly after user interaction due to effect logic that reset filter state during vendor-options bootstrap, causing selector and list instability.

**Alternatives Considered:**

- Keep first-vendor auto-default behavior on every options refresh (rejected: overrides user intent and causes UI flicker/revert).
- Persist first-vendor default only in local draft state (rejected: still hides explicit all-vendor scope by default).

**Implications:**

- Selector state now reflects user intent and remains stable across refresh cycles.
- Similar filter bootstraps should avoid forced first-item selection unless explicitly required by business rules.

## Notification Assurance Pass Reuses Existing Persistence and Avoids Schema Migration

**Decision:** For the notifications assurance feature pass, keep the existing persisted in-app notification model (`notification` + `notificationPreference`) and avoid Prisma schema migration; add intelligence through config-driven templates/resolvers and frontend routing/composition changes instead.
**Date:** 2026-04-09
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
The repository already has functional notification CRUD, unread tracking, and preference persistence. Current user pain is discoverability (`/notifications` not acting as inbox), toggle truthfulness, and noisy processing UX rather than storage-model gaps. Avoiding schema change reduces risk and aligns with user directive for this pass.

**Alternatives Considered:**

- Introduce a new inbox schema or event-store model immediately (rejected: unnecessary migration scope for current assurance goals).
- Remove persistence and compute inbox purely from transient state (rejected: weak read/unread continuity and inconsistent cross-device experience).

**Implications:**

- Notification improvements should prioritize route accessibility, template resolution, and UI contract correctness.
- Existing dispatch and preference models remain source-of-truth, with clearer editable/enforced semantics in UI.
- Schema migrations are deferred unless a future feature requires new durable fields that cannot be derived from existing metadata.

## Notification Dispatch Uses Template Resolver with Mandatory Critical-Email Override

**Decision:** Resolve notification title/body/link/email subject through a config-driven template resolver in `dispatchNotification`, and bypass coarse optional type gating for mandatory order/payment/delivery email delivery.
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The assurance scope required richer, consistent channel copy without schema changes and stronger preference integrity. Existing flow could suppress mandatory emails when grouped optional toggles were disabled because type-level gating short-circuited all channels.

**Alternatives Considered:**

- Keep hardcoded per-call title/body strings only (rejected: drift and no centralized template governance).
- Keep early type-gate return for all channels (rejected: violates mandatory critical-email guarantee).

**Implications:**

- Notification content is now centrally governed by template config with metadata/context enrichment.
- Critical system emails (order/payment/delivery) remain deliverable even when optional in-app/push grouped toggles are off.
- Existing persistence schema remains unchanged while messaging quality and compliance behavior improve.

## Runtime Processing Feedback Is Global and In-Flight Driven

**Decision:** Surface a universal processing indicator from provider scope by observing runtime store `inFlight` counters, and treat first-load resource states as loading until initial payload exists (to prevent transient false-empty states).
**Date:** 2026-04-09
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Page-local loading text was inconsistent and could briefly show misleading empty/error copy (notably wallet). A global runtime signal improves user trust during silent refresh/mutation windows and aligns feedback with actual in-memory runtime activity.

**Alternatives Considered:**

- Keep per-page ad hoc loading labels only (rejected: inconsistent and easy to drift).
- Add processing toasts only around explicit button mutations (rejected: misses background refresh and bootstrap fetch activity).

**Implications:**

- Runtime store/state transitions must maintain accurate `inFlight` semantics for both load and mutation paths.
- Initial empty screens should gate on runtime bootstrap/loading state before rendering no-data messaging.
- Provider-level feedback reduces need for duplicated per-page processing indicators.

## Unified Runtime Warm-Start Is Route-and-Role Scoped

**Decision:** Runtime prefetch at bootstrap must be scoped by auth role plus route tags, instead of broad eager loading of all resources.
**Date:** 2026-04-08
**Made by:** AI cloud implementation session (GitHub Copilot)

**Reason:**
The unified runtime needs warm data for continuity, but broad prefetch would increase payload/memory pressure and hurt low-bandwidth users. Route+role scoped prefetch keeps first render fast while still preserving last-good in-memory data and background refresh continuity.

**Alternatives Considered:**

- Prefetch everything on boot (rejected: over-fetching and unnecessary memory churn).
- No prefetch, refresh only on-demand (rejected: visible cold-state flicker and repeated loading transitions).

**Implications:**

- Runtime registry entries should carry tags/scope metadata.
- Provider bootstrap must derive tags from pathname and role hints.
- Remaining migrations should preserve this bounded prefetch contract.

## Unified Data Runtime Uses Zustand-First Core with Adapter Boundary

**Decision:** Implement the cross-project in-memory data runtime on top of the existing Zustand foundation first, while enforcing a strict runtime adapter boundary so Redux/RxJS integrations remain possible without domain-level rewrites.
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
The platform already has active Zustand-driven state patterns and a newly established smart-resource foundation. A Zustand-first implementation minimizes migration disruption and delivery risk, while an adapter boundary preserves extensibility for future orchestration layers where stream-heavy workflows may benefit from RxJS or enterprise governance may prefer Redux.

**Alternatives Considered:**

- Immediate Redux migration as primary runtime core (rejected: higher migration overhead and broader short-term refactor risk).
- Immediate RxJS stream-first runtime (rejected: unnecessary complexity for current CRUD-heavy reliability goals).
- Keep page-local fetch patterns only (rejected: continued loading flicker, duplicated logic, and inconsistent cache/mutation behavior).

**Implications:**

- Runtime interfaces (resource registry, reconciler, mutation coordinator) must remain framework-agnostic at the domain boundary.
- New high-traffic surfaces should migrate to runtime subscriptions instead of ad hoc page-local fetch orchestration.
- Architecture docs must define adapter seams and migration guardrails before broad rollout.

## TOP Banner Is Image-Only and Title-Optional

**Decision:** Treat `TOP` banners as image-only strips with no frontend title/text overlay, and allow empty title payloads for `TOP` banner creation while keeping strict image and position validation.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The product requirement is that top banners should not render textual content. Requiring title text in API/form contracts created drift and confusing behavior where operators had to input content that should never be shown.

**Alternatives Considered:**

- Keep top-banner text in payload and hide only in CSS (rejected: contract drift and repeated operator confusion).
- Keep title required for all positions (rejected: conflicts with image-only top-banner UX intent).

**Implications:**

- Banner creation/editing UX must treat `TOP` as visual-only placement.
- `HERO`/`SIDEBAR` still require title content and keep text-forward rendering behavior.

## Operations Vendor Stats Must Use Admin All-Status Paginated Fetch

**Decision:** Replace multi-status parallel vendor fetch calls in operations vendor management with a single paginated fetch path using admin-scoped `includeAllStatuses=true`.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Parallel per-status requests increased rate-limit/error risk and could collapse vendor stats to zero despite existing data.

**Alternatives Considered:**

- Keep one request per status in parallel (rejected: brittle and prone to all-or-nothing failure behavior).
- Keep per-status requests but run sequentially (rejected: still repetitive and slower, with avoidable failure surface).

**Implications:**

- Operations vendor counts now depend on one authoritative paginated feed.
- `/api/vendors` must keep admin-only all-status expansion isolated from public defaults.

## Operations Data Refresh Uses In-Memory Smart Resource Cache

**Decision:** Standardize key operations pages on a shared `useSmartResource` hook that combines in-memory cache reuse, stale-time guarded refresh, interval background refresh, and equality-based state update suppression.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations pages were repeatedly issuing full reload fetches that increased backend pressure and produced disruptive loading flashes. A shared retrieval contract reduces request abuse while keeping data fresh.

**Alternatives Considered:**

- Keep page-specific fetch/useEffect implementations (rejected: duplicated logic and inconsistent loading/refresh behavior).
- Introduce a heavier external query library immediately (rejected: unnecessary migration scope for current reliability objective).

**Implications:**

- Operations pages using this pattern should provide non-blocking refresh indicators and optional manual refresh actions.
- New operations surfaces should prefer `useSmartResource` unless a documented exception exists.

## Vendor Marketing Moderation Is a Separate Operational Entity

**Decision:** Treat operations vendor-content moderation as a marketing-submission domain distinct from product-media management; constrain moderation query semantics and UI labeling accordingly.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Mixed moderation feeds made it unclear whether reviewers were handling campaign assets or product catalog media, causing operational ambiguity and higher mis-review risk.

**Alternatives Considered:**

- Keep one mixed feed and rely on ad hoc reviewer interpretation (rejected: error-prone and unclear responsibility boundaries).
- Split into fully separate tables immediately (rejected for this slice: larger migration than needed for immediate behavior correction).

**Implications:**

- Moderation route copy/navigation should use marketing-review terminology.
- Vendor marketing submissions should always carry explicit target-platform metadata.

## Entity Avatar Rendering Uses Shared Fallback Component

**Decision:** Use shared `EntityAvatar`/`VendorAvatar` for vendor and user image rendering with deterministic fallback icon/initial behavior on missing or failed image loads.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Repeated ad hoc avatar implementations caused inconsistent empty states and broken-image visual artifacts.

**Alternatives Considered:**

- Keep per-page avatar logic with local fallback snippets (rejected: duplication and inconsistency).
- Force placeholder URLs only at data layer (rejected: does not handle runtime image load failures).

**Implications:**

- New vendor/user avatar surfaces should compose through shared avatar component exports.
- UI behavior is now consistent when profile/store image URLs are absent or invalid.

## Shared Client Dashboard Shell for Non-Operations Vendor/Admin Routes

**Decision:** Reuse a single `ClientDashboardShell` wrapper for vendor/admin pages outside the operations route group (notably `/store-settings` and `/notifications/settings`) and keep buyer rendering outside this shell.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Manual per-page shell composition drifted from the canonical dashboard spacing/chrome contract, causing inconsistent sidebar/mobile-bottom-nav spacing behavior between routes.

**Alternatives Considered:**

- Keep per-page manual shell markup in each route (rejected: repeated drift and higher regression risk).
- Force these pages into operations route-group only (rejected: would change existing public/shared route behavior and compatibility expectations).

**Implications:**

- Vendor/admin pages that need dashboard chrome but live outside operations should compose through `ClientDashboardShell`.
- Buyer access paths can still render plain page layout when dashboard chrome is not required.

## Public Vendor Visibility Defaults Include Pending Vendors

**Decision:** Default public vendor list reads (`/api/vendors` and `getVendorsClient`) to include both `APPROVED` and `PENDING` vendors unless an explicit status filter is provided.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Public product/vendor surfaces could lose vendor identity for pending/unverified vendors when client vendor hydration was constrained to `APPROVED` only, leading to fallback labels and incomplete visibility.

**Alternatives Considered:**

- Keep `APPROVED`-only defaults and patch each UI surface locally (rejected: inconsistent behavior and repeated per-surface work).
- Include all statuses including suspended/rejected by default (rejected: exposes non-public moderation states).

**Implications:**

- Public vendor/product cards can resolve vendor identities consistently for unverified vendors.
- Status-sensitive operational views can still request explicit `status` filters.

## Product Discovery Uses URL-Driven Single Source of Truth Config

**Decision:** Category tags, filter tools, and sorting behavior for product discovery will be driven by a single shared config and URL query contract (shared parser/serializer), rather than duplicated local constants and ad hoc in-component mappings.
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
Audit showed drift between category tags and products filtering behavior: links write query params that products state does not consistently consume, sort params are emitted but ignored, and category definitions are duplicated across surfaces.

**Alternatives Considered:**

- Keep local in-component category/filter mappings and patch each bug independently (rejected: recurring drift risk and inconsistent UX).
- Make products discovery entirely local state without URL query contract (rejected: poor shareability/bookmarkability and weak cross-surface consistency).

**Implications:**

- Product discovery controls must parse and serialize through a shared helper layer.
- Category slug/value mappings should live in one config module and be reused by home tags, category navigation, and products filtering.
- Regression tests should validate query-to-results behavior end-to-end, not only isolated UI toggles.

## Product Discovery State Is URL-Synchronized with Deterministic Client Sorting

**Decision:** Products discovery (`/products`) hydrates from URL query params and keeps URL state synchronized as filters/search/sort change, while deterministic sorting is applied in client state using canonical sort keys.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Client-reported issues showed discovery links were not reliably reproducible or shareable. URL synchronization plus canonical sorting provides predictable behavior for click-through navigation, browser reload, and shared links.

**Alternatives Considered:**

- Keep query parsing only on initial page load without URL updates after interactions (rejected: weak shareability and inconsistent back/refresh behavior).
- Move all discovery sorting to API immediately (rejected for this slice: higher refactor scope; deterministic client sorting closes user-facing gap quickly while preserving existing data flow).

**Implications:**

- Discovery controls must update URL params through the shared serializer.
- Sort keys should only come from canonical `productDiscovery` config.
- Follow-up work should expand end-to-end tests for home click-through and filter sidebar mapping persistence.

## Vendor Review Status Updates Are Persistence-First, Email Is Non-Blocking

**Decision:** For admin vendor moderation, status mutation (`APPROVED`/`REJECTED`) is committed first, then review email dispatch is attempted as a non-blocking side effect with explicit response metadata (`emailDispatch`) and structured logging.
**Date:** 2026-04-08
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Vendor approval/rejection state must stay authoritative even when upstream email providers fail transiently. Blocking or rolling back moderation decisions on transport failures would create inconsistent operations state and admin confusion.

**Alternatives Considered:**

- Hard-fail moderation mutation when email send fails (rejected: ties core workflow correctness to external provider availability).
- Silent best-effort email with no response/reporting metadata (rejected: poor observability and unclear operator feedback).

**Implications:**

- UI should surface warning-level feedback when status succeeds but email dispatch fails.
- Retry/remediation can be added later without changing status transition semantics.
- Logs and API responses now provide audit-friendly send outcome markers.

## Banner Visibility Contract + Guided Public-Content Authoring

**Decision:** Enforce strict banner visibility/placement rules (no top-banner render for empty text payloads; avoid top/hero duplicate stacking) and redesign public-content editing around guided non-technical workflows (structured blocks, preview, upload-first media insertion, and fallback-consistent publishing).
**Date:** 2026-04-08
**Made by:** AI planning session (GitHub Copilot) with user directive

**Reason:**
Production-facing regressions showed that banner rendering and placement logic can create confusing homepage output, while current content-editing UX is too technical for non-developer operators and risks publish-time inconsistencies.

**Alternatives Considered:**

- Keep current permissive banner render behavior with best-effort frontend checks (rejected: repeats visibility/placement regressions).
- Keep raw/unstructured content editing interface (rejected: high editorial error rate and poor usability for non-technical admins).

**Implications:**

- Banner DTO normalization and frontend render guards must treat empty/whitespace text consistently.
- Homepage composition must guarantee single-responsibility placement for top and hero banner zones.
- Public-content tooling should default to guided structured editing with preview and upload-managed media contracts.
- Cache invalidation and fallback render semantics must remain aligned between editor publish flow and frontend reads.

## Ad Pricing + Analytics/User-Admin Reliability Fallback Contract

**Decision:** Keep ad application submission non-blocking when admin rate config is missing by applying explicit safe fallback rates, and harden analytics/user-admin pages to prefer partial data/fetch resilience over full-surface failure.
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Client-facing flows were blocked by strict dependency on admin-entered ad rates and brittle count/data retrieval assumptions. Platform reliability requirements favor graceful degradation (fallback values + partial rendering) so public submissions and operations insights remain functional while admin configuration catches up.

**Alternatives Considered:**

- Keep 503 hard-fail on missing ad rates (rejected: blocks legitimate ad submissions and degrades trust).
- Add extensive new charting dependency for analytics visuals (rejected: unnecessary scope/risk for immediate recovery; lightweight DS-native chart blocks are sufficient).

**Implications:**

- Ad APIs and ad-rate endpoint should preserve a safe fallback path for missing admin config.
- Analytics surfaces should continue rendering when some datasets fail and should avoid all-or-nothing fetch behavior.
- User-management list actions must execute real API mutations (not local success-only stubs) to preserve admin CRUD expectations.

## Reusable Config-Driven Confirmations for Destructive/Removal Actions

**Decision:** Standardize destructive/removal-like UI actions on a shared confirmation utility with OOP-backed config builder/presets (`ActionConfirmBuilder` + `ActionConfirmPresets`) and concise copy conventions (short title/message/confirm text).
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations surfaces had mixed confirmation patterns (`Modal.confirm`, `Popconfirm`, custom modal state), leading to uneven UX and missed consistency for high-risk actions. A shared, config-driven confirmation helper improves clarity, reusability, and lowers regression risk while keeping adoption incremental.

**Alternatives Considered:**

- Continue page-level ad hoc confirm implementations (rejected: repeated drift and inconsistent copy/behavior).
- Build a heavy global modal state manager first (rejected: unnecessary scope for immediate production-readiness hardening).

**Implications:**

- New destructive/removal actions should use shared presets/builders unless there is a documented exception.
- Copy for confirm dialogs should stay concise and explicit (action + target).

## Operations Banners Must Use Real API Mutations (No Local-Only Success Paths)

**Decision:** Keep `/operations/banners` on real API-backed create/update/delete/toggle flows and align banner cache invalidation patterns to `cache:banners:*` fan-out keys.
**Date:** 2026-04-06
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Operations audit showed the banners page emitted success toasts without persisting changes, causing false-positive UX and stale admin state. Converging on API-backed mutations with shared invalidation behavior preserves trust and ensures admin actions are end-to-end functional.

**Alternatives Considered:**

- Keep optimistic/local-only updates with delayed persistence (rejected: risk of silent data loss and admin confusion).
- Rebuild page around a different state library first (rejected: unnecessary scope for reliability fix).

**Implications:**

- Any future operations mutation surface should avoid stub success paths and always verify API response before success feedback.
- Banner cache keys should include filter dimensions while invalidation remains broad enough to clear all active/list permutations.

## Explicit Orders Scope Split + Domain Parity Matrix Enforcement

**Decision:** Keep `/orders` as buyer-history only, introduce `/operations/orders` for vendor/admin operations, and enforce a role/domain parity matrix across products, orders, vendors, wallet, notifications, ads, bug reports, and profile/store using route policy + navigation + tests.
**Date:** 2026-04-05
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
Cross-domain audit closure required explicit separation between consumer history flows and operations workflows, especially for orders, to avoid scope leakage and ambiguous discoverability. A parity matrix contract ensures every domain has role-safe, discoverable entry points with consistent policy enforcement.

**Alternatives Considered:**

- Keep `/orders` shared for buyer/vendor/admin (rejected: blurs operations vs history use-cases and weakens policy clarity).
- Introduce role-specific duplicate URL trees again (rejected: conflicts with consolidated operations architecture and increases drift risk).

**Implications:**

- Middleware must preserve legacy compatibility for `/admin/orders` and `/vendor/orders`.
- Route registry, navigation, sidebar, and regression tests must remain synchronized whenever role-scope behavior changes.
- Dead-link/route audits are required whenever route discoverability is modified.

## Exhaustive Audit Priority Contract (2026-04-05)

**Decision:** Execute remaining production-readiness work in strict priority order: (1) operations layout chrome de-duplication, (2) vendor product-management workspace delivery, (3) email-change reverification completion, then (4) dashboard KPI/data wiring and (5) config-driven content migration/polish.
**Date:** 2026-04-05
**Made by:** AI planning session (GitHub Copilot)

**Reason:**
The exhaustive audit surfaced one critical UX regression and multiple high-severity workflow gaps that have cross-surface dependencies. A strict sequence reduces regression risk and prevents low-priority polish from delaying critical-path fixes.

**Alternatives Considered:**

- Run all outstanding items in parallel (rejected: increases merge/test complexity and masks root-cause regressions).
- Continue broad mixed-priority batching (rejected: critical issues can remain open while medium/low tasks consume time).
- Delay operations UX fixes until final polish phase (rejected: vendor/admin usability remains impaired).

**Implications:**

- Cloud sessions should not start with medium/low polish tasks until layout duplication and vendor product workflow are closed.
- Queue/checkpoint docs must track deferred low-priority work explicitly (contact config source, vendor deactivation UX, webhook idempotency hardening).
- Regression gates should run after each high-risk slice instead of only at the end.

## Cloud Adjustment Execution: Signup + Upload Contract Enforcement

**Decision:** Enforce strict buyer/vendor-only signup role selection while keeping church position values (`MEMBER`, `NON_MEMBER`, `WORKER`) available through the `Position` enum; require vendor `businessAddress` and all three verification documents at signup; and enforce Cloudinary-managed URLs for upload-governed fields in bug-report and ad-application APIs.
**Date:** 2026-04-04
**Made by:** AI coding session (GitHub Copilot)

**Reason:**
The cloud adjustment queue required elimination of role drift (`Worker` as signup role), full requiredness parity across UI/client/API for vendor verification fields, and closure of raw image URL paths in governed flows. Implementing these together avoids inconsistent validation outcomes and prevents runtime/DB enum mismatch during vendor registration.

**Alternatives Considered:**

- Keep legacy signup role fallback for `worker` (rejected: conflicts with locked product decision and stage logic).
- Allow optional vendor verification docs or raw screenshot URLs in some flows (rejected: breaks requiredness parity and upload governance).
- Enforce Cloudinary only at UI layer (rejected: API-level enforcement is required for security and consistency).

**Implications:**

- Prisma enum migration is required in environments where `Position` lacks `MEMBER`/`NON_MEMBER`/`WORKER`.
- Signup and settings changes must preserve cross-step draft state for `idType` and uploaded document metadata.
- Any new upload-managed fields should follow the same “upload-first + Cloudinary URL validation” contract.

## Post-Cloud Signup + Upload Governance Correction Contract

**Decision:** Enforce corrected product contract after cloud review: remove `Worker` as signup user role, keep `Member`/`Non-Member` valid as church position values without enum drift, require all three vendor verification documents plus required signup `businessAddress` (always editable post-auth), and standardize image evidence fields on Cloudinary-managed upload flows (deprecate raw URL inputs).
**Date:** 2026-04-04
**Made by:** AI planning session (GitHub Copilot) with explicit user confirmation

**Reason:** Post-cloud audit identified regressions/drift against intended behavior (Worker role exposure, requiredness/label mismatch, persistence issues, and raw screenshot URL paths). A locked corrective contract is required so the next cloud execution does not reintroduce ambiguous assumptions.

**Alternatives Considered:**

- Keep Worker as a selectable signup role (rejected: conflicts with intended product model and backend role scope).
- Keep mixed required/optional verification doc behavior (rejected: misleading UX and validation confusion).
- Keep raw image URL fallback in bug report/media fields (rejected: weak upload governance and inconsistent asset lifecycle).

**Implications:**

- Cloud implementation must prioritize enum/schema parity and run Prisma migration + client generation if schema changes are made.
- Form labels, validation schema, API validation, and DB constraints must remain aligned for requiredness-critical fields.
- Upload flows across bug report and similar forms should converge on a single managed Cloudinary pipeline.

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

## Unified Role-Driven Route Refactor

**Decision:** Migrate from role-prefixed directories (`/buyer`, `/vendor`, `/admin`) to unified feature routes with dynamic config-driven rendering based on user role and permissions.
**Date:** 2026-03-23
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Role-specific pages create duplication and inconsistent behavior. A single route + policy-driven layout simplifies maintenance and improves feature coverage for all user types.

**Implications:**

- Remove/deprecate folder routes: `/buyer`, `/vendor`, `/admin` when safe.
- Create shared route entries: `/orders`, `/wallet`, `/profile`, `/dashboard`, etc.
- Ensure each shared route adapts with `RoleAwareFeatureRenderer` + a central policy registry.
- Use reusable component primitives in `components/features` and `components/ui` with config props to vary presentation (cards, KPIs, tables).

## Typed Runtime Configuration Module

**Decision:** Introduce `lib/config` as the only runtime config entry point, with parsed env values and explicit feature flags consumed by core services.
**Date:** 2026-03-20
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Scattered direct `process.env` access made behavior inconsistent across services and hard to test. A central typed module enables safe defaults, clearer toggles, and predictable behavior in middleware/services.

**Alternatives Considered:** Keep reading env values inline in each module (minimal effort but brittle) or add a heavy external config framework (unnecessary complexity for current scope).

**Implications:**

- Services should import `env`/`featureFlags` instead of raw env access where practical.
- New runtime toggles should be added to `lib/config/env.ts` first.

## Buyer-to-Vendor Self-Serve Conversion

**Decision:** Implement a dedicated buyer conversion route (`/become-vendor`) backed by a self-scoped endpoint (`/api/users/me/convert-to-vendor`) that performs role upgrade + vendor upsert atomically and reissues JWT cookies.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Buyers needed an easy and explicit channel to become vendors without creating a second account. Existing vendor creation APIs assumed role was already `VENDOR`, which blocked self-serve conversion and created user friction.

**Alternatives Considered:** Reusing signup flow for existing users (causes duplicate-account risk) and admin-only vendor creation (high operational overhead and slower onboarding).

**Implications:**

- Role transition now happens in one endpoint with clear validation and idempotent vendor upsert behavior.
- Auth tokens are refreshed immediately to keep middleware authorization and navigation in sync with the new role.
- Store settings loading/saving now prefers self-scoped endpoints over broad list-fetch + client filtering.

## Shared API Response Envelope + Handler Wrapper

**Decision:** Introduce `lib/api/http.ts` as the common API response layer (`apiSuccess`, `apiError`, `withApiHandler`) and migrate route handlers incrementally.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** API routes had inconsistent response shapes and repetitive try/catch patterns, which increased frontend branching and maintenance cost.

**Alternatives Considered:** Continue route-by-route custom `NextResponse.json` handling (faster short term but accumulates drift) or add a third-party framework abstraction (overhead for current size).

**Implications:**

- Route handlers should progressively converge on shared envelope behavior.
- Validation and error observability become easier to standardize.

## Offline Draft + Queue Strategy for Network-Dependent Forms

**Decision:** Add lightweight local draft persistence and offline queue replay utilities (`lib/utils/localDraft.ts`, `lib/utils/offlineQueue.ts`) and apply first to ad applications.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Network interruptions caused data-loss risk and blocked form submissions, especially for media-heavy workflows.

**Alternatives Considered:** Keep only service-worker background sync (less control at form level) or rely on user manual retry (poor UX and high abandonment risk).

**Implications:**

- Forms can preserve user progress and queue submission safely when offline.
- Replay handlers must stay idempotent and validation-safe.

## Guest Upload Channel for Ad Application Media

**Decision:** Allow unauthenticated uploads only for ad and payment-proof folders through `/api/upload`, protected by strict IP rate limiting and optional metadata persistence skip.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Public ad application flow required upload capability but upload endpoint previously required auth, forcing manual URL entry.

**Alternatives Considered:** Require login for all uploads (blocks public ad onboarding) or keep URL-only fields (poor reliability and invalid assets).

**Implications:**

- Public ad workflows can use the same upload pipeline as authenticated users.
- Scope is intentionally restricted to ad/payment-proof media to reduce abuse surface.

## Canonical Operations Route Namespace

**Decision:** Introduce `/operations/*` as the canonical management workspace route surface and redirect legacy `/admin/*` and `/vendor/*` entry paths through middleware.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Management pages were still spread across role-prefixed URL trees, which made route policy, navigation, and migration sequencing brittle. A single operations namespace allows grouped architecture migration without breaking existing bookmarks.

**Alternatives Considered:** Hard cutover by deleting legacy routes immediately (high regression risk) and keeping role-prefixed URLs indefinitely (continues route sprawl and duplication).

**Implications:**

- New navigation and policy definitions should target `/operations/*` paths first.
- Legacy links keep working via redirect compatibility while feature pages are gradually moved to shared implementations.
- Middleware now owns canonical-path normalization for old management URLs.

## Semantic Token Priority for Shared UI Variants

**Decision:** Prefer semantic design-system tokens (surface, border, text) over palette-hardcoded shades for shared component variants, starting with `Button` secondary styling.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Palette-coupled classes in shared primitives increase maintenance overhead and can drift from dark-mode/readability targets when theme palettes evolve.

**Alternatives Considered:** Keep existing palette-specific secondary button classes (quick/no refactor) or redesign the entire button system in one pass (high-risk/large scope).

**Implications:**

- Shared primitives should default to semantic DS tokens where possible.
- Future token/theme updates will require fewer component-level class rewrites.

## API/Adapter-Only Runtime Data Paths (Client/Page Layer)

**Decision:** Remove direct page-level and client-fetcher runtime imports of `mockData` so UI data retrieval uses API/adapter-backed paths only, with explicit empty/null degradation on failures.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Runtime `NEXT_PUBLIC_USE_MOCK_DATA` branches in pages/fetchers can mask backend/adapter failures and create production drift where UI appears healthy while database integrations are broken.

**Alternatives Considered:** Keep mock fallback for development convenience (faster local debugging but high migration ambiguity) or hard-fail the entire page on fetch errors (poor UX resilience).

**Implications:**

- Client/page data paths now surface backend failure via empty-state UX instead of local dataset substitution.
- Remaining migration work should focus on server-fetcher fallbacks (`lib/data/dataFetchers.ts`, `lib/data/publicContent.ts`) to complete Prisma cutover confidence.

## Prisma-Only Server Fetchers + Explicit Infra Mocks in Tests

**Decision:** Remove runtime mock fallback branches from server fetcher modules (`lib/data/dataFetchers.ts`, `lib/data/publicContent.ts`) and require tests to mock Prisma/cache modules explicitly.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Server-side fallback imports can hide real database integration failures, and tests coupled to env-driven fallback mode break once cutover is complete.

**Alternatives Considered:** Keep server fallback paths for local convenience (maintains migration ambiguity) or skip test updates (causes brittle failing suites after cutover).

**Implications:**

- Server fetchers now align with strict Prisma-first runtime behavior.
- Data-layer tests should mock infrastructure dependencies (Prisma/cache) instead of relying on `NEXT_PUBLIC_USE_MOCK_DATA` pathing.

## Strict Prisma-First Adapter/Bootstrap Selection

**Decision:** In runtime adapter selection, pin `lib/data/database.ts` to Prisma-backed adapters and remove dependency on `USE_PRISMA` toggling, while keeping missing-adapter fail-fast behavior.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Environment-based adapter switching can produce inconsistent behavior between environments and obscure integration issues during migration.

**Alternatives Considered:** Keep `USE_PRISMA` runtime switching (convenient but ambiguous) or delete mock scaffolding entirely in one pass (higher-risk while residual references still exist).

**Implications:**

- Runtime domain adapter resolution now follows a single Prisma-first path.
- Adapter-layer tests should mock `prismaAdapter` directly when isolated behavior is needed.
- Remaining mock cleanup should target non-adapter client/runtime references and documentation consistency.

## Eliminate Direct Client Mock Imports in Core UX Flows

**Decision:** Remove direct client-side `mockData` imports from profile/search flows and back them with API responses (`/api/products` suggestions and `/api/users/[id]/addresses`).
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Client-level mock imports introduce hidden runtime divergence and can mask API/data-layer regressions in production-like environments.

**Alternatives Considered:** Keep dev-only fallback imports (quick local convenience but ambiguous behavior) or leave profile addresses static (simpler but stale/incorrect user data).

**Implications:**

- Search suggestions and profile addresses now reflect API-backed state consistently.
- Future resilience work should prefer explicit empty/error UI states over hidden data substitution.

## Slim Prisma Adapter Facade for `lib/data/database.ts`

**Decision:** Replace `lib/data/database.ts` monolithic mock+toggle implementation with a slim Prisma-adapter facade that preserves `db`/`*Db` exports and fail-fast missing-adapter behavior.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** The old file carried large in-memory mock state and dead runtime branches after Prisma-first cutover, increasing maintenance overhead and startup noise.

**Alternatives Considered:** Keep the existing file with `usePrisma=true` pinning only (lower immediate risk but retains dead code bulk) or remove the facade entirely (would force broad route import churn).

**Implications:**

- Runtime no longer instantiates legacy mock datasets from `lib/data/database.ts`.
- Existing route consumers of `db` continue to function without import changes.
- Remaining cleanup should focus on deprecating obsolete env flags and documentation references.

## Remove Compatibility Env Toggles from Runtime Config

**Decision:** Remove `USE_PRISMA` and `ENABLE_MOCK_BACKEND` from the active runtime config surface (`lib/config/env.ts`, `lib/config/features.ts`) and update tests/docs accordingly.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Adapter/runtime behavior is now Prisma-first by design; keeping legacy toggle fields in config encourages drift and false assumptions.

**Alternatives Considered:** Keep toggles as inert/deprecated fields (backward-compatible but confusing) or keep them active (reintroduces branching risk).

**Implications:**

- Runtime configuration no longer exposes mock/prisma selection flags.
- Deployments should rely on database connectivity/config only (e.g., `DATABASE_URL`, `DIRECT_URL`) for data-layer readiness.
- Tests and operational docs must no longer reference these toggle vars as required behavior controls.

## Gateway-Agnostic Payment Stub Contract

**Decision:** Introduce a single payment service contract (`initializePayment`, `verifyPayment`) that supports `PAYSTACK` and `FLUTTERWAVE`, exposed via `/api/payments/initialize` and `/api/payments/verify`.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Checkout and wallet flows needed backend integration seams before enabling real provider calls. A shared contract avoids duplicating gateway logic across routes/components.

**Alternatives Considered:** Build provider-specific routes first (faster initially but duplicates validation/auth logic) or defer all backend work until full integration (blocks incremental wiring/testing).

**Implications:**

- Frontend flows can begin wiring against stable API contracts immediately.
- Future real integrations should replace internals of `lib/services/payments.ts` while preserving API route interfaces where possible.

## Route Checkout/Wallet Through Unified Payment Contract

**Decision:** Wire checkout card flow and wallet deposit flow through `/api/payments/initialize` and `/api/payments/verify` before downstream domain actions.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Using a shared payment contract in live client flows validates API seams early and avoids future frontend rework when real gateway APIs are enabled.

**Alternatives Considered:** Keep UI-only placeholders until full gateway integration (delays validation of backend contracts) or wire gateway-specific logic directly in pages (duplicates behavior and raises migration risk).

**Implications:**

- Checkout and wallet UI now exercise backend payment endpoints in normal flow.
- Remaining work should enforce verified status in order and wallet persistence layers instead of treating stub success as informational.

## Public Ad Intake Uses Dedicated Unauthenticated Route

**Decision:** Use `/ad-application` as the canonical public ad-intake path and keep it explicitly public in RBAC route policy.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Public advertisers should not be forced into auth-gated flows, and footer/navigation links needed a single stable target for campaign submissions.

**Alternatives Considered:** Reuse `/advertise` as a mixed-mode route (creates auth ambiguity and UI coupling) or require login for ad submission (higher onboarding friction and lower conversion).

**Implications:**

- Footer and policy references should point to `/ad-application` as canonical entry.
- Public submit endpoints must enforce validation and rate-limiting to offset unauthenticated access.

## Vendor Analytics Must Be Store-Scoped

**Decision:** In vendor-facing analytics views, compute KPI cards from current-vendor orders/products only; platform-wide aggregates are reserved for admin contexts.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Vendor users were exposed to non-scoped platform totals, which can mislead business decisions and leak aggregate operational context.

**Alternatives Considered:** Keep shared aggregates for all roles (inaccurate for vendor dashboards) or split into separate analytics pages immediately (larger refactor than needed for current queue scope).

**Implications:**

- Shared analytics components need role-aware data scoping before rendering KPI summaries.
- Future analytics expansions should maintain explicit role-scoping boundaries in both API and UI layers.

## Server-Side Payment Verification as Mutation Gate

**Decision:** Enforce payment verification on server mutation boundaries by requiring gateway/reference metadata and verifying status inside `/api/orders` (card payments) and `/api/wallet/deposit` before persisting order/wallet state.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Client-side verification checks alone are insufficient as a source of truth; backend mutation endpoints must validate payment status to prevent unverified card orders or wallet credits.

**Alternatives Considered:** Keep verification only in client flow (faster but bypassable) or postpone enforcement until full provider integration (leaves a verification gap in current behavior).

**Implications:**

- Card order creation now rejects missing/unverified payment references when payment features are enabled.
- Wallet deposit crediting now rejects missing/unverified payment references before balance mutation.
- Order and transaction records now carry verification metadata useful for audit/reconciliation and future webhook-based settlement flows.

## Unified Notification Fan-Out Service

**Decision:** Introduce a centralized notification dispatcher (`lib/services/notifications.ts`) that fans out per event to in-app persistence, Resend-backed email, and web-push delivery, gated by notification preference flags.
**Date:** 2026-04-01
**Made by:** AI coding session (GitHub Copilot)

**Reason:** Notification delivery logic was fragmented across routes and mostly limited to direct in-app inserts, with no consistent way to honor user channel preferences or trigger push/email alongside in-app updates.

**Alternatives Considered:** Keep per-route ad-hoc notification writes (simple but inconsistent and hard to extend) or defer channel unification until later (prolongs behavioral drift and missed delivery paths).

**Implications:**

- Order and wallet payment flows now emit notifications via a single preference-aware service.
- Browser push subscriptions registered by clients can be reused across all future notification events without duplicating route-specific push code.
- Channel expansion (e.g., SMS) can be added in one service boundary instead of editing many API routes.

## Cloud Session Execution Contract for Interrupted Refactor Work

**Decision:** Use a dedicated temporary handoff plan file plus queue-driven execution contract for cloud sessions when local sessions are interrupted (`.ai-system/planning/cloud-session-temp-plan-2026-04-04.md`).
**Date:** 2026-04-04
**Made by:** AI planning session (GitHub Copilot)

**Reason:** Repeated local power/connectivity interruptions created context-loss risk and incomplete task sequencing. A strict handoff contract keeps implementation deterministic across model capability levels.

**Alternatives Considered:** Rely only on conversational summary handoff (fast but fragile) or restart planning from scratch in cloud session (wastes time and risks divergence from queued priorities).

**Implications:**

- Cloud session must begin by reading `.ai-system` docs and the temporary handoff plan before coding.
- Work execution is required to follow queued order with validation gates and checkpoint updates after each workstream.
- Architecture, decisions, queue status, and dev-history updates are part of delivery, not optional post-work cleanup.

## Email-Change Reverification Reuses Verify-Email Pipeline

**Decision:** Implement email-change confirmation as a tokenized reverification path using the existing `/verify-email` client + `/api/auth/verify-email` API, with a token prefix (`email-change:`) that encodes the pending email and triggers email mutation on successful verification.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Reusing the existing verification pipeline reduces risk and avoids duplicating token lifecycle logic while still supporting secure email mutation and explicit post-change re-authentication.

**Alternatives Considered:** Separate dedicated verify-email-change endpoint (more code surface and duplicated verification concerns) or immediate email update without reverification (higher account takeover risk).

**Implications:**

- Email changes now require a successful verification link click before the canonical email is updated.
- Auth cookies are cleared after email mutation to force a fresh login with new identity credentials.
- Profile security UX must communicate that email change is pending until verification completes.

## Notification Preferences API Compatibility Contract

**Decision:** Keep `/api/notifications/preferences` as the backend source of truth, but normalize it to accept/return the field shape consumed by current notification settings UIs while preserving mandatory critical email delivery behavior in service fan-out.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Existing UI pages use a richer preference shape than persisted DB columns; normalizing at API boundary prevents breaking clients and allows gradual UI convergence.

**Alternatives Considered:** Rewrite all settings UIs immediately to DB shape (higher regression risk for current sprint) or leave mismatch unresolved (settings appear saved but do not control behavior correctly).

**Implications:**

- Settings pages can reliably load/save preferences without contract drift.
- Critical system notifications (order/payment/delivery) continue to send email even when optional channels are disabled.
- Future schema expansions should preserve API-level normalization to avoid UI breakage.

## Bug-Report API Normalization for User/Admin Flows

**Decision:** Normalize bug-report API payloads to map UI-facing fields (`subject/details/priority/adminNotes`) to persisted Prisma fields (`title/description/severity/metadata`) at route boundaries.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** User submission and admin triage pages were built against a UI-first contract that diverged from DB naming, causing CRUD reliability issues.

**Alternatives Considered:** Refactor all frontend bug-report screens to DB field names (larger UI churn) or keep mixed mappings per page (fragile and error-prone).

**Implications:**

- Bug-report lifecycle now remains stable across submit/list/detail/status/notes flows.
- Admin operations pages receive consistent normalized records regardless of DB internals.
- Additional bug metadata can be introduced in JSON without breaking UI contracts.

## Config-Driven Footer and Help Surfaces

**Decision:** Centralize footer/help navigation and descriptive content in `lib/config/siteContent.ts` and consume it in layout/page components instead of hardcoded strings/links.
**Date:** 2026-04-04
**Made by:** AI cloud continuation session

**Reason:** Hardcoded content and route references made navigation hard to audit and increased dead-link risk during route migrations.

**Alternatives Considered:** Leave content hardcoded in each component (continued drift) or move immediately to fully DB-driven runtime content for every section (higher implementation cost in this slice).

**Implications:**

- Public navigation/help content is now easier to audit and update in one place.
- `/help/[slug]` route-safe subpages can be driven by config slugs and optionally enriched by public-content entries.
- Next step can migrate this config source to admin-managed persisted content with minimal component churn.

## Role/Domain Conceptual-View Parity Contract

**Decision:** Enforce explicit role-scoped conceptual views for multi-context domains (products, orders, vendors, wallet, notifications, ads, bug reports, profile/store) via discoverable routes/navigation and scope-safe API behavior, with a parity matrix tracked in the execution queue.
**Date:** 2026-04-05
**Made by:** AI planning/handoff session (GitHub Copilot)

**Reason:** Some domains evolved with mixed access patterns (for example products now have explicit public vs operations views, while orders still rely mostly on one shared route). This creates discoverability drift, implicit scope assumptions, and risk of role-context confusion during future refactors.

**Alternatives Considered:** Keep role filtering purely at API/data layer with shared routes (fewer pages but lower UX clarity), or fork fully separate per-role page trees (clear separation but higher duplication and maintenance burden).

**Implications:**

- Cloud execution must validate and close role/domain parity gaps using a matrix-driven checklist rather than ad-hoc page edits.
- Orders must have explicit scope semantics (buyer-history vs vendor/admin operations) with compatible redirects for legacy role-prefixed paths.
- Navigation, route policy, middleware redirects, and API scope checks must be updated together and regression-tested as one unit.

## Cross-Platform Account Detection via Pre-Signup Email Check

**Decision:** When a user enters their email on the signup form, check the CIS backend's `GET /api/v1/users/check-email/:email` endpoint to detect existing accounts on other platforms. If matches are found, display a prompt offering "Sign In Instead" or "Continue with Signup".
**Date:** 2026-05-26
**Made by:** AI implementation session

**Reason:**
Users could silently create duplicate, unlinked identities across platforms because signup only checked local email uniqueness. CIS already tracks platform-user mappings but had no pre-signup query surface.

**Alternatives Considered:**
- Only check on form submission (rejected: slower feedback, would need to abort submission which is poor UX)
- Always allow signup and link accounts post-hoc via webhook reconciliation (rejected: creates orphan identities that need later cleanup)
- Embed the check in the register API route (rejected: ties CIS availability to registration success/failure and creates coupling)

**Implications:**
- Check fires on email blur with 800ms debounce in UserInfo component
- CrossPlatformAccountPrompt component displays inline in the signup form
- Signup submission is blocked while cross-platform prompt is visible
- When CIS is not configured, check silently returns null and signup proceeds normally
- The "Sign In Instead" button navigates to /login
