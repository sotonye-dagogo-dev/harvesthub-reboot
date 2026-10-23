/**
 * Service fulfilment configuration.
 *
 * Every limit, key and timing used by the service listing wizard, the service
 * detail panel and the service order lifecycle lives here so that product code
 * never hard-codes a service-specific number. Windows that admins may tune are
 * read from `CommerceLifecycleConfig` at runtime; the constants below are the
 * code-side defaults (and the fallbacks when the DB row is missing).
 */

// ─── Tiers ────────────────────────────────────────────────────────────────────

/** Package tier keys. A service publishes either 1 tier or all 3. */
export const SERVICE_TIER_KEYS = ['BASIC', 'STANDARD', 'PREMIUM'] as const;
export type ServiceTierKey = (typeof SERVICE_TIER_KEYS)[number];

export function isServiceTierKey(value: unknown): value is ServiceTierKey {
  return typeof value === 'string' && (SERVICE_TIER_KEYS as readonly string[]).includes(value);
}

// ─── Requirement fields ───────────────────────────────────────────────────────

export const SERVICE_REQUIREMENT_FIELD_TYPES = ['TEXT', 'SELECT', 'FILE'] as const;
export type ServiceRequirementFieldType = (typeof SERVICE_REQUIREMENT_FIELD_TYPES)[number];

export function isRequirementFieldType(value: unknown): value is ServiceRequirementFieldType {
  return typeof value === 'string' && (SERVICE_REQUIREMENT_FIELD_TYPES as readonly string[]).includes(value);
}

// ─── Listing limits (wizard validation + server validation) ───────────────────

export const SERVICE_LIMITS = {
  /** Service listing title. */
  titleMax: 80,
  /** Long description shown on the service detail page. */
  descriptionMax: 1200,
  /** Package tier card title. */
  packageTitleMax: 30,
  /** Package tier card description. */
  packageDescriptionMax: 100,
  /** Extras attached to a package. */
  extrasMax: 5,
  extraTitleMax: 40,
  /** Delivery window in days (inclusive). */
  deliveryDaysMin: 1,
  deliveryDaysMax: 90,
  /** Revision count; -1 means unlimited. */
  revisionsMin: 0,
  revisionsMax: 10,
  revisionsUnlimited: -1,
  /** Media attached to the listing. */
  maxImages: 5,
  maxPdfs: 2,
  maxVideos: 1,
  maxImageMb: 5,
  maxPdfMb: 5,
  maxVideoMb: 50,
  /** Client-side only duration check (server has no ffmpeg). */
  maxVideoSeconds: 60,
  /** Requirement fields the buyer must answer before work starts. */
  maxRequirementFields: 10,
  requirementLabelMax: 60,
  requirementOptionMax: 12,
  /** Buyer answers. */
  answerMax: 2000,
} as const;

/** Stock sentinel written to `Product.stock` for published services. */
export { SERVICE_UNLIMITED_STOCK as SERVICE_STOCK_SENTINEL } from '@/lib/constants';

// ─── Timing / transport ───────────────────────────────────────────────────────

/** Code-side defaults for `CommerceLifecycleConfig` service windows. */
export const SERVICE_WINDOW_DEFAULTS = {
  requirementsTimeoutHours: 48,
  autoApproveHours: 72,
  countdownWarningHours: 12,
} as const;

/** Order room polling interval (serverless stack — no WebSocket infra). */
export const ORDER_ROOM_POLL_MS = 10_000;

/** Below this remaining time the countdown renders in the error colour. */
export const SERVICE_COUNTDOWN_WARNING_HOURS = SERVICE_WINDOW_DEFAULTS.countdownWarningHours;

/**
 * Google Maps preview for on-site services. The stack has no Maps key, so this
 * stays false: geo payloads are stored but never rendered as a map.
 */
export const SERVICE_GEO_MAP_ENABLED = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deadline for a service item given its delivery window in days. */
export function serviceDeadlineFrom(start: Date, deliveryDays: number): Date {
  const days = Math.min(Math.max(deliveryDays, SERVICE_LIMITS.deliveryDaysMin), SERVICE_LIMITS.deliveryDaysMax);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Remaining hours between `from` and `deadline` (negative = overdue). */
export function hoursUntil(deadline: Date, from: Date = new Date()): number {
  return (deadline.getTime() - from.getTime()) / (60 * 60 * 1000);
}
