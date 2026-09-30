/**
 * Service listing wizard model.
 *
 * Every pure decision the 5-step wizard makes lives here so the step components
 * stay presentational and the tests can exercise validation, draft persistence
 * and the publish payload without mounting React:
 *
 *  - step slicing + validation goes through `lib/schemas/service.schemas.ts`
 *    (`validateServiceStep` / `SERVICE_STEP_SCHEMAS`) — this module never
 *    re-implements a rule, it only picks the slice each schema expects;
 *  - `buildServiceDetails` is the single writer of `Product.serviceDetails`,
 *    which means the TC-001 rule (digital services carry no geo payload) is
 *    enforced in exactly one place on the client;
 *  - draft (isActive=false) and publish (isActive=true) payloads are built from
 *    the same data, so a published listing can never drift from its draft.
 */

import type { Product, ServiceDetails, ServiceGeo, WeeklySlot } from '@/lib/types';
import { ServiceCategory, ServiceLocation, ServiceRateType } from '@/lib/constants';
import {
  SERVICE_STEP_SCHEMAS,
  validateServiceStep,
  type ServiceDeliveryMode,
} from '@/lib/schemas/service.schemas';
import {
  SERVICE_LIMITS,
  SERVICE_TIER_KEYS,
  type ServiceTierKey,
} from '@/lib/config/serviceFulfillment';
import {
  SERVICE_LISTING_DRAFT_VERSION,
  clearLocalDraft,
  loadVersionedLocalDraft,
  saveVersionedLocalDraft,
  serviceListingDraftKey,
} from '@/lib/utils/localDraft';

// ─── Steps ──────────────────────────────────────────────────────────────────

export const STEP_BASICS = 0;
export const STEP_PACKAGES = 1;
export const STEP_LOCATION = 2;
export const STEP_MEDIA = 3;
export const STEP_REQUIREMENTS = 4;

/** Chip labels — index matches the `SERVICE_STEP_SCHEMAS` order. */
export const SERVICE_STEP_LABELS = [
  'Basics',
  'Packages',
  'Location',
  'Media',
  'Requirements',
] as const;

/**
 * Schema steps that apply for a delivery mode. Digital services are rendered
 * and shipped without any geo payload (PRD TC-001), so the location step does
 * not exist for them.
 */
export function activeStepIndices(deliveryMode: ServiceDeliveryMode): number[] {
  return deliveryMode === 'ON_SITE'
    ? [STEP_BASICS, STEP_PACKAGES, STEP_LOCATION, STEP_MEDIA, STEP_REQUIREMENTS]
    : [STEP_BASICS, STEP_PACKAGES, STEP_MEDIA, STEP_REQUIREMENTS];
}

export function stepLabelsFor(deliveryMode: ServiceDeliveryMode): string[] {
  return activeStepIndices(deliveryMode).map((index) => SERVICE_STEP_LABELS[index] ?? '');
}

/** Clamps a stored `draftStep` back onto the active step list. */
export function clampDraftStep(deliveryMode: ServiceDeliveryMode, draftStep: number): number {
  const steps = activeStepIndices(deliveryMode);
  if (steps.includes(draftStep)) return draftStep;
  const lower = steps.filter((step) => step < draftStep);
  return lower.length > 0 ? lower[lower.length - 1]! : steps[0]!;
}

// ─── Wizard values ──────────────────────────────────────────────────────────

export type PackageExtraDraft = { title: string; price: number };

export type PackageDraft = {
  tier: ServiceTierKey;
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  extras: PackageExtraDraft[];
};

export type RequirementFieldDraft = {
  key: string;
  label: string;
  type: 'TEXT' | 'SELECT' | 'FILE';
  options: string[];
  required: boolean;
};

export type SlotDraft = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type GeoDraft = {
  address: string;
  landmark?: string;
  campus?: string;
};

export interface ServiceWizardValues {
  // Step 1 — basics
  name: string;
  category: string;
  serviceCategory: string;
  rateType: string;
  description: string;
  shortDescription: string;
  mainImage: string;
  deliveryMode: ServiceDeliveryMode;
  // Step 2 — packages
  packages: PackageDraft[];
  // Step 3 — location & availability (on-site only)
  location: string;
  geo: GeoDraft;
  availableSlots: SlotDraft[];
  // Step 4 — media
  media: { images: string[]; documents: string[]; video: string | null };
  // Step 5 — requirements
  requirementFields: RequirementFieldDraft[];
}

export const DEFAULT_PACKAGE_DRAFT: PackageDraft = {
  tier: 'BASIC',
  title: '',
  description: '',
  price: 5000,
  deliveryDays: 3,
  revisions: 1,
  extras: [],
};

export function createPackageDraft(tier: ServiceTierKey): PackageDraft {
  return { ...DEFAULT_PACKAGE_DRAFT, tier, extras: [] };
}

/**
 * A listing either publishes with 1 tier (Basic) or all 3 — switching the mode
 * preserves what has already been typed into the Basic column.
 */
export function packagesForTierCount(
  current: PackageDraft[],
  tierCount: 1 | 3,
): PackageDraft[] {
  const basic = current.find((entry) => entry.tier === 'BASIC');
  const base = basic ?? createPackageDraft('BASIC');
  if (tierCount === 1) return [{ ...base, tier: 'BASIC', extras: [...base.extras] }];

  const existing = new Map(current.map((entry) => [entry.tier, entry]));
  return SERVICE_TIER_KEYS.map(
    (tier) => existing.get(tier) ?? (tier === 'BASIC' ? base : createPackageDraft(tier)),
  );
}

export function createDefaultWizardValues(): ServiceWizardValues {
  return {
    name: '',
    category: 'SERVICES',
    serviceCategory: '',
    rateType: '',
    description: '',
    shortDescription: '',
    mainImage: '',
    deliveryMode: 'DIGITAL',
    packages: [createPackageDraft('BASIC')],
    location: '',
    geo: { address: '' },
    availableSlots: [],
    media: { images: [], documents: [], video: null },
    requirementFields: [],
  };
}

/** Seeds wizard values from an existing listing (draft or published). */
export function valuesFromProduct(product: Product): ServiceWizardValues {
  const details = product.serviceDetails ?? null;
  const defaults = createDefaultWizardValues();
  const gallery = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

  return {
    ...defaults,
    name: product.name ?? '',
    category: product.category ?? 'SERVICES',
    serviceCategory: details?.serviceCategory ?? '',
    rateType: details?.rateType ?? '',
    description: details?.description ?? product.description ?? '',
    shortDescription: details?.shortDescription ?? '',
    mainImage: product.mainImage ?? '',
    deliveryMode:
      details?.deliveryMode ?? (details?.geo ? 'ON_SITE' : 'DIGITAL'),
    packages:
      details?.packages && details.packages.length > 0
        ? details.packages.map((entry) => ({
            tier: entry.tier,
            title: entry.title ?? '',
            description: entry.description ?? '',
            price: entry.price ?? 0,
            deliveryDays: entry.deliveryDays ?? SERVICE_LIMITS.deliveryDaysMin,
            revisions:
              typeof entry.revisions === 'number'
                ? entry.revisions
                : SERVICE_LIMITS.revisionsMin,
            extras: (entry.extras ?? []).map((extra) => ({
              title: extra.title ?? '',
              price: extra.price ?? 0,
            })),
          }))
        : defaults.packages,
    location: details?.location ?? '',
    geo: {
      address: details?.geo?.address ?? '',
      ...(details?.geo?.landmark ? { landmark: details.geo.landmark } : {}),
      ...(details?.geo?.campus ? { campus: details.geo.campus } : {}),
    },
    availableSlots: (details?.availableSlots ?? []).map((slot, index) => ({
      id: slot.id || `slot-${index}`,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable !== false,
    })),
    media: {
      images:
        details?.media?.images && details.media.images.length > 0
          ? details.media.images
          : gallery,
      documents: details?.media?.documents ?? [],
      video: details?.media?.video ?? null,
    },
    requirementFields: (details?.requirementFields ?? []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options ?? [],
      required: field.required !== false,
    })),
  };
}

// ─── Gallery (cover + extras) ───────────────────────────────────────────────

/**
 * The service gallery is the cover image plus the media-step extras, capped at
 * `SERVICE_LIMITS.maxImages`. Both the media step and the saved payload read
 * this, so a listing can never ship more images than the schema allows.
 */
export function galleryImages(values: ServiceWizardValues): string[] {
  const cover = values.mainImage.trim();
  const merged = [cover, ...values.media.images].filter((url) => Boolean(url && url.trim()));
  return Array.from(new Set(merged)).slice(0, SERVICE_LIMITS.maxImages);
}

// ─── Step slices (what each schema validates) ───────────────────────────────

/** The exact object `SERVICE_STEP_SCHEMAS[step]` expects for `values`. */
export function pickStepValues(step: number, values: ServiceWizardValues): unknown {
  switch (step) {
    case STEP_BASICS:
      return {
        name: values.name,
        category: values.category,
        serviceCategory: values.serviceCategory,
        rateType: values.rateType,
        description: values.description,
        shortDescription: values.shortDescription,
        mainImage: values.mainImage,
        deliveryMode: values.deliveryMode,
      };
    case STEP_PACKAGES:
      return { packages: values.packages };
    case STEP_LOCATION:
      return {
        deliveryMode: values.deliveryMode,
        location: values.location || undefined,
        geo: values.geo && values.geo.address ? values.geo : undefined,
        availableSlots: values.availableSlots,
      };
    case STEP_MEDIA:
      return {
        media: {
          images: galleryImages(values),
          documents: values.media.documents,
          video: values.media.video,
        },
      };
    case STEP_REQUIREMENTS:
      return {
        requirementFields: values.requirementFields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          ...(field.type === 'SELECT' && field.options.length > 0
            ? { options: field.options }
            : {}),
          required: field.required,
        })),
      };
    default:
      return values;
  }
}

/**
 * Gate for "Next" / "Publish": first issue message for the active step, or
 * `null` when the step is valid. Step 3 is only reachable for on-site services
 * (see `activeStepIndices`).
 */
export function validateStep(step: number, values: ServiceWizardValues): string | null {
  return validateServiceStep(step, pickStepValues(step, values));
}

/** Validates every step that applies to the current delivery mode, in order. */
export function validateAllSteps(
  values: ServiceWizardValues,
): { step: number; message: string } | null {
  for (const step of activeStepIndices(values.deliveryMode)) {
    const message = validateStep(step, values);
    if (message) return { step, message };
  }
  return null;
}

/**
 * Field-level errors for the current step, derived from the same schema
 * (`SERVICE_STEP_SCHEMAS`) so nothing is validated twice — used purely to place
 * the messages under their fields. Issues without a path are returned under
 * `null` so the caller can show them in the step-level notice.
 */
export function stepFieldErrors(
  step: number,
  values: ServiceWizardValues,
): { name: (string | number)[]; errors: string[] }[] {
  const schema = SERVICE_STEP_SCHEMAS[step];
  if (!schema) return [];
  const result = schema.safeParse(pickStepValues(step, values));
  if (result.success) return [];

  const grouped = new Map<string, { name: (string | number)[]; errors: string[] }>();
  for (const issue of result.error.issues) {
    if (issue.path.length === 0) continue;
    const key = issue.path.join('.');
    const existing = grouped.get(key);
    if (existing) existing.errors.push(issue.message);
    else grouped.set(key, { name: [...issue.path], errors: [issue.message] });
  }
  return Array.from(grouped.values());
}

// ─── `serviceDetails` writer ────────────────────────────────────────────────

/**
 * Narrows a free-form wizard string onto a Prisma-enum union. Values outside
 * the enum are dropped rather than written into the payload — the step schema
 * (`z.nativeEnum`) is what rejects them, this only keeps the object literal
 * assignable to `ServiceDetails`.
 */
function asEnumValue<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export interface BuildDetailsOptions {
  /** Wizard progress to persist on a draft (publishing omits it). */
  draftStep?: number;
}

/**
 * Builds the `Product.serviceDetails` payload.
 *
 * TC-001 lives here: a geo payload is only emitted for `ON_SITE` services that
 * have an address, and the `deliveryMode` is normalised to `DIGITAL` until that
 * address exists — the server rejects digital payloads carrying geo data, so
 * this keeps partial on-site drafts saveable at every step.
 */
export function buildServiceDetails(
  values: ServiceWizardValues,
  options: BuildDetailsOptions = {},
): ServiceDetails {
  const trimmedAddress = values.geo.address?.trim() ?? '';
  const onSite = values.deliveryMode === 'ON_SITE' && trimmedAddress.length > 0;

  const geo: ServiceGeo | undefined = onSite
    ? {
        address: trimmedAddress,
        ...(values.geo.landmark?.trim() ? { landmark: values.geo.landmark.trim() } : {}),
        ...(values.geo.campus ? { campus: values.geo.campus } : {}),
      }
    : undefined;

  const packages =
    values.packages.length > 0
      ? values.packages.map((entry) => ({
          tier: entry.tier,
          title: entry.title.trim(),
          description: entry.description.trim(),
          price: entry.price,
          deliveryDays: entry.deliveryDays,
          revisions: entry.revisions,
          extras: entry.extras.map((extra) => ({
            title: extra.title.trim(),
            price: extra.price,
          })),
        }))
      : undefined;

  const serviceCategory = asEnumValue(values.serviceCategory, Object.values(ServiceCategory));
  const rateType = asEnumValue(values.rateType, Object.values(ServiceRateType));
  const location = asEnumValue(values.location, Object.values(ServiceLocation));

  return {
    ...(options.draftStep !== undefined ? { draftStep: options.draftStep } : {}),
    deliveryMode: onSite ? 'ON_SITE' : 'DIGITAL',
    ...(values.shortDescription.trim()
      ? { shortDescription: values.shortDescription.trim() }
      : {}),
    description: values.description.trim(),
    ...(serviceCategory ? { serviceCategory } : {}),
    ...(rateType ? { rateType } : {}),
    ...(location ? { location } : {}),
    ...(packages ? { packages } : {}),
    requirementFields: values.requirementFields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      ...(field.type === 'SELECT' && field.options.length > 0
        ? { options: field.options }
        : {}),
      required: field.required,
    })),
    media: {
      images: galleryImages(values),
      documents: values.media.documents.slice(0, SERVICE_LIMITS.maxPdfs),
      video: values.media.video,
    },
    ...(geo ? { geo } : {}),
    ...(values.availableSlots.length > 0 ? { availableSlots: values.availableSlots } : {}),
  };
}

// ─── HTTP payloads ──────────────────────────────────────────────────────────

/**
 * `POST /api/products` rejects a service create without a price, and drafts
 * have no packages yet — hold the price at ₦1 until publish derives the real
 * base-package price.
 */
export const DRAFT_PLACEHOLDER_PRICE = 1;

export interface ServiceProductPayload {
  name: string;
  description: string;
  category: string;
  mainImage: string;
  images: string[];
  listingType: 'SERVICE';
  serviceDetails: ServiceDetails;
  /** `false` while the listing is a draft; omitted when editing a live listing. */
  isActive?: boolean;
  /** Only sent on create (the server otherwise derives the base package price). */
  price?: number;
  vendorId?: string;
}

function baseFields(values: ServiceWizardValues): Omit<
  ServiceProductPayload,
  'serviceDetails' | 'isActive' | 'price' | 'vendorId'
> {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category,
    mainImage: values.mainImage.trim(),
    images: galleryImages(values),
    listingType: 'SERVICE',
  };
}

/**
 * Server-side draft advance (`isActive=false`, `serviceDetails.draftStep = n`).
 *
 * `wasActive` keeps an already-published listing live while its owner edits it
 * (the server still runs `assertPublishableServiceDetails` on those saves);
 * anything still being authored stays a private draft.
 */
export function buildDraftPayload(
  values: ServiceWizardValues,
  options: { draftStep: number; wasActive: boolean; vendorId?: string },
): ServiceProductPayload {
  const details = buildServiceDetails(values, { draftStep: options.draftStep });
  return {
    ...baseFields(values),
    serviceDetails: details,
    ...(options.wasActive ? {} : { isActive: false }),
    ...(options.vendorId ? { vendorId: options.vendorId } : {}),
  };
}

/**
 * Create-draft payload. `isActive: false` is always sent; when the server drops
 * it (the products POST route currently ignores `isActive`) the wizard follows
 * the create with a PUT that pins the draft offline — see `ServiceListingWizard`.
 */
export function buildCreateDraftPayload(
  values: ServiceWizardValues,
  options: { draftStep: number; vendorId?: string },
): ServiceProductPayload {
  const base = baseServicePriceFor(values);
  return {
    ...buildDraftPayload(values, { draftStep: options.draftStep, wasActive: false }),
    vendorId: options.vendorId,
    price: base ?? DRAFT_PLACEHOLDER_PRICE,
  };
}

/** Base (first) package price — what a published service is listed at. */
export function baseServicePriceFor(values: ServiceWizardValues): number | null {
  const first = values.packages[0];
  return first && Number.isFinite(first.price) && first.price > 0 ? first.price : null;
}

/**
 * Publish payload: `isActive=true`, no `draftStep`. Price and stock are omitted
 * on purpose — `PUT/POST /api/products` derives the base package price and
 * `SERVICE_UNLIMITED_STOCK`, and enforces `assertPublishableServiceDetails`.
 */
export function buildPublishPayload(
  values: ServiceWizardValues,
  options: { vendorId?: string; creating: boolean },
): ServiceProductPayload {
  return {
    ...baseFields(values),
    serviceDetails: buildServiceDetails(values),
    isActive: true,
    ...(options.creating && options.vendorId ? { vendorId: options.vendorId } : {}),
  };
}

// ─── Local (instant recovery) draft ─────────────────────────────────────────

export interface ServiceListingLocalDraft {
  productId: string | null;
  /** Schema step index the vendor was on. */
  step: number;
  values: ServiceWizardValues;
}

export function serviceListingDraftScope(userScope: string, productId?: string | null): string {
  return `${userScope || 'anonymous'}:${productId || 'new'}`;
}

export function saveServiceListingLocalDraft(
  scope: string,
  draft: ServiceListingLocalDraft,
): void {
  saveVersionedLocalDraft(serviceListingDraftKey(scope), draft, SERVICE_LISTING_DRAFT_VERSION);
}

export function loadServiceListingLocalDraft(
  scope: string,
): ServiceListingLocalDraft | null {
  const draft = loadVersionedLocalDraft<ServiceListingLocalDraft>(
    serviceListingDraftKey(scope),
    SERVICE_LISTING_DRAFT_VERSION,
  );
  if (!draft || typeof draft !== 'object') return null;
  if (!draft.values || typeof draft.values !== 'object') return null;
  if (typeof draft.step !== 'number') return null;
  return draft;
}

export function clearServiceListingLocalDraft(scope: string): void {
  clearLocalDraft(serviceListingDraftKey(scope));
}

/**
 * Merges restore sources, newest wins: local instant draft → server draft (the
 * listing row itself) → defaults. A local draft written for a different
 * product id is ignored.
 */
export function restoreWizardState(options: {
  scope: string;
  product?: Product | null;
}): { step: number; values: ServiceWizardValues } {
  const { scope, product } = options;
  const base = product ? valuesFromProduct(product) : createDefaultWizardValues();
  const serverStep = product?.serviceDetails?.draftStep;

  const local = loadServiceListingLocalDraft(scope);
  if (local && (local.productId ?? null) === (product?.id ?? null)) {
    const values = { ...base, ...local.values };
    return { step: clampDraftStep(values.deliveryMode, local.step), values };
  }

  return { step: clampDraftStep(base.deliveryMode, serverStep ?? 0), values: base };
}

// ─── Publish issue routing ──────────────────────────────────────────────────

/** Which step to jump to when `assertPublishableServiceDetails` complains. */
export function stepForPublishIssue(message: string): number {
  const normalized = message.toLowerCase();
  if (normalized.includes('image')) return STEP_MEDIA;
  if (normalized.includes('package')) return STEP_PACKAGES;
  if (normalized.includes('description')) return STEP_BASICS;
  return STEP_BASICS;
}

// ─── Requirements helper ────────────────────────────────────────────────────

/** UPPER_SNAKE_CASE field key derived from a label (matches the schema rule). */
export function requirementKeyFromLabel(label: string, taken: readonly string[]): string {
  const base =
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || 'FIELD';
  const prefixed = /^[A-Z]/.test(base) ? base : `FIELD_${base}`;

  let candidate = prefixed;
  let suffix = 2;
  while (taken.includes(candidate)) {
    candidate = `${prefixed.slice(0, 32)}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export type { ServiceDeliveryMode, WeeklySlot };
