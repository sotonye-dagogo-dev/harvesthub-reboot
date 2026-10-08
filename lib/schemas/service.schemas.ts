/**
 * Service listing validation.
 *
 * `Product.serviceDetails` is a `Json?` column: these schemas are the single
 * source of truth for its shape. They run on the server (product create/update)
 * and in the listing wizard (per-step validation), so both sides agree.
 *
 * Legacy booking-oriented rows (rate/rateType/duration only) stay parseable —
 * every field except the wizard's publish requirements is optional.
 */

import { z } from 'zod';
import { Campus, ServiceCategory, ServiceLocation, ServiceRateType } from '@/lib/constants';
import {
  SERVICE_LIMITS,
  SERVICE_REQUIREMENT_FIELD_TYPES,
  SERVICE_TIER_KEYS,
} from '@/lib/config/serviceFulfillment';

const money = z
  .number({ invalid_type_error: 'Price must be a number' })
  .finite('Price must be a finite number')
  .min(0, 'Price cannot be negative')
  .max(10_000_000, 'Price is too large');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// ─── Packages ─────────────────────────────────────────────────────────────────

export const servicePackageExtraSchema = z.object({
  title: z.string().trim().min(1, 'Extra name is required').max(SERVICE_LIMITS.extraTitleMax),
  price: money,
});
export type ServicePackageExtraInput = z.infer<typeof servicePackageExtraSchema>;

export const servicePackageSchema = z.object({
  tier: z.enum(SERVICE_TIER_KEYS, {
    errorMap: () => ({ message: 'Package tier must be Basic, Standard or Premium' }),
  }),
  title: z.string().trim().min(1, 'Package title is required').max(SERVICE_LIMITS.packageTitleMax),
  description: z.string().trim().max(SERVICE_LIMITS.packageDescriptionMax).optional().default(''),
  price: money.min(1, 'Package price must be at least ₦1'),
  deliveryDays: z
    .number({ invalid_type_error: 'Delivery time must be a number' })
    .int('Delivery time must be whole days')
    .min(SERVICE_LIMITS.deliveryDaysMin, `Delivery must be at least ${SERVICE_LIMITS.deliveryDaysMin} day`)
    .max(SERVICE_LIMITS.deliveryDaysMax, `Delivery cannot exceed ${SERVICE_LIMITS.deliveryDaysMax} days`),
  revisions: z
    .number({ invalid_type_error: 'Revisions must be a number' })
    .int('Revisions must be a whole number')
    .min(SERVICE_LIMITS.revisionsMin, 'Revisions cannot be negative')
    .max(SERVICE_LIMITS.revisionsMax, `Revisions cannot exceed ${SERVICE_LIMITS.revisionsMax}`),
  extras: z.array(servicePackageExtraSchema).max(SERVICE_LIMITS.extrasMax).optional().default([]),
});
export type ServicePackageInput = z.infer<typeof servicePackageSchema>;

export const servicePackagesSchema = z
  .array(servicePackageSchema)
  .min(1, 'Add at least one package')
  .max(3, 'A service can have at most 3 packages')
  .superRefine((packages, ctx) => {
    const tiers = packages.map((entry) => entry.tier);
    if (new Set(tiers).size !== tiers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each package must use a different tier',
      });
    }
    if (packages.length === 3) {
      const required = [...SERVICE_TIER_KEYS].sort();
      const actual = [...tiers].sort();
      if (required.join('|') !== actual.join('|')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Three packages must be Basic, Standard and Premium',
        });
      }
    }
  });

// ─── Requirement fields (what the buyer must supply) ─────────────────────────

export const serviceRequirementFieldSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'Field key is required')
      .max(40)
      .regex(/^[A-Z][A-Z0-9_]*$/, 'Field key must be UPPER_SNAKE_CASE'),
    label: z.string().trim().min(1, 'Field label is required').max(SERVICE_LIMITS.requirementLabelMax),
    type: z.enum(SERVICE_REQUIREMENT_FIELD_TYPES, {
      errorMap: () => ({ message: 'Field type must be text, choice or file' }),
    }),
    options: z
      .array(z.string().trim().min(1).max(SERVICE_LIMITS.requirementLabelMax))
      .max(SERVICE_LIMITS.requirementOptionMax)
      .optional(),
    required: z.boolean().default(true),
  })
  .superRefine((field, ctx) => {
    if (field.type === 'SELECT' && (!field.options || field.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choice fields need at least one option',
        path: ['options'],
      });
    }
    if (field.type !== 'SELECT' && field.options && field.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only choice fields can have options',
        path: ['options'],
      });
    }
  });
export type ServiceRequirementFieldInput = z.infer<typeof serviceRequirementFieldSchema>;

// ─── Availability ─────────────────────────────────────────────────────────────

export const serviceSlotSchema = z
  .object({
    id: z.string().optional(),
    dayOfWeek: z.number().int('Day must be a whole number').min(0).max(6),
    startTime: z.string().regex(timePattern, 'Start time must look like 09:00'),
    endTime: z.string().regex(timePattern, 'End time must look like 17:00'),
    isAvailable: z.boolean().default(true),
  })
  .superRefine((slot, ctx) => {
    if (slot.endTime <= slot.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endTime'],
      });
    }
  });
export type ServiceSlotInput = z.infer<typeof serviceSlotSchema>;

// ─── Media ────────────────────────────────────────────────────────────────────

export const serviceMediaSchema = z.object({
  images: z
    .array(z.string().url('Image must be a valid URL'))
    .max(SERVICE_LIMITS.maxImages, `Maximum ${SERVICE_LIMITS.maxImages} images`)
    .default([]),
  documents: z
    .array(z.string().url('Document must be a valid URL'))
    .max(SERVICE_LIMITS.maxPdfs, `Maximum ${SERVICE_LIMITS.maxPdfs} documents`)
    .default([]),
  video: z.string().url('Video must be a valid URL').nullable().default(null),
});
export type ServiceMediaInput = z.infer<typeof serviceMediaSchema>;

// ─── Location (on-site services only) ────────────────────────────────────────

export const serviceGeoSchema = z.object({
  address: z.string().trim().min(3, 'Address is required').max(200),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  campus: z.nativeEnum(Campus).optional(),
  landmark: z.string().trim().max(120).optional(),
});
export type ServiceGeoInput = z.infer<typeof serviceGeoSchema>;

export const SERVICE_DELIVERY_MODES = ['DIGITAL', 'ON_SITE'] as const;
export type ServiceDeliveryMode = (typeof SERVICE_DELIVERY_MODES)[number];

// ─── The whole serviceDetails payload ────────────────────────────────────────

export const serviceDetailsSchema = z
  .object({
    /** Wizard progress (0 = basics … 4 = requirements). Publish clears it. */
    draftStep: z.number().int().min(0).max(5).optional(),
    deliveryMode: z.enum(SERVICE_DELIVERY_MODES).default('DIGITAL'),
    shortDescription: z.string().trim().max(160).optional(),
    description: z.string().trim().max(SERVICE_LIMITS.descriptionMax).default(''),

    serviceCategory: z.nativeEnum(ServiceCategory).optional(),
    rateType: z.nativeEnum(ServiceRateType).optional(),
    rate: money.optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    location: z.nativeEnum(ServiceLocation).optional(),
    requiresConsultation: z.boolean().optional(),
    maxBookingsPerDay: z.number().int().positive().nullable().optional(),
    availableSlots: z.array(serviceSlotSchema).max(168).nullable().optional(),

    packages: servicePackagesSchema.optional(),
    requirementFields: z.array(serviceRequirementFieldSchema).max(SERVICE_LIMITS.maxRequirementFields).default([]),
    media: serviceMediaSchema.optional(),
    geo: serviceGeoSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // PRD TC-001: digital services must not carry a geo payload.
    if (data.deliveryMode === 'DIGITAL' && data.geo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Location details are only allowed for on-site services',
        path: ['geo'],
      });
    }
    if (data.deliveryMode === 'ON_SITE' && (!data.geo || !String(data.geo.address).trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'On-site services need an address',
        path: ['geo'],
      });
    }
  });

export type ServiceDetailsInput = z.infer<typeof serviceDetailsSchema>;

/**
 * Publish gate: a service cannot go live without at least one package and a
 * description, because checkout prices from the base package.
 */
export function assertPublishableServiceDetails(raw: unknown): string[] {
  const parsed = serviceDetailsSchema.safeParse(raw ?? {});
  if (!parsed.success) return parsed.error.issues.map((issue) => issue.message);

  const details = parsed.data;
  const issues: string[] = [];
  if (!details.packages || details.packages.length === 0) {
    issues.push('Add at least one package before publishing');
  }
  if (!details.description || details.description.trim().length < 10) {
    issues.push('Description must be at least 10 characters');
  }
  if (details.media && details.media.images.length === 0) {
    issues.push('Add at least one image');
  }
  return issues;
}

/** Price a published service is listed at (base package). */
export function baseServicePrice(details: unknown): number | null {
  const parsed = serviceDetailsSchema.safeParse(details ?? {});
  if (!parsed.success) return null;
  const packages = parsed.data.packages;
  if (!packages || packages.length === 0) return null;
  return packages[0]?.price ?? null;
}

// ─── Wizard step slices ──────────────────────────────────────────────────────

export const serviceBasicsStepSchema = z.object({
  name: z.string().trim().min(3, 'Title must be at least 3 characters').max(SERVICE_LIMITS.titleMax),
  serviceCategory: z.nativeEnum(ServiceCategory, {
    errorMap: () => ({ message: 'Please select a service category' }),
  }),
  rateType: z.nativeEnum(ServiceRateType, {
    errorMap: () => ({ message: 'Please select a pricing type' }),
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(SERVICE_LIMITS.descriptionMax, `Description cannot exceed ${SERVICE_LIMITS.descriptionMax} characters`),
  shortDescription: z.string().trim().max(160).optional(),
  mainImage: z.string().url('Main image is required').min(1, 'Main image is required'),
  images: z.array(z.string().url()).max(SERVICE_LIMITS.maxImages).optional(),
  deliveryMode: z.enum(SERVICE_DELIVERY_MODES),
  category: z.string().min(1, 'Category is required'),
});

export const servicePackagesStepSchema = z.object({
  packages: servicePackagesSchema,
});

export const serviceLocationStepSchema = z
  .object({
    deliveryMode: z.enum(SERVICE_DELIVERY_MODES),
    location: z.nativeEnum(ServiceLocation).optional(),
    geo: serviceGeoSchema.nullable().optional(),
    availableSlots: z.array(serviceSlotSchema).max(168).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMode === 'DIGITAL' && data.geo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Location details are only allowed for on-site services',
        path: ['geo'],
      });
    }
    if (data.deliveryMode === 'ON_SITE' && !data.geo?.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add the address where you render this service',
        path: ['geo'],
      });
    }
  });

export const serviceMediaStepSchema = z.object({
  media: serviceMediaSchema,
});

export const serviceRequirementsStepSchema = z.object({
  requirementFields: z
    .array(serviceRequirementFieldSchema)
    .max(SERVICE_LIMITS.maxRequirementFields, `Maximum ${SERVICE_LIMITS.maxRequirementFields} fields`),
});

/** Per-step validator used by the wizard. */
export const SERVICE_STEP_SCHEMAS = [
  serviceBasicsStepSchema,
  servicePackagesStepSchema,
  serviceLocationStepSchema,
  serviceMediaStepSchema,
  serviceRequirementsStepSchema,
] as const;

export const SERVICE_STEP_COUNT = SERVICE_STEP_SCHEMAS.length;

/**
 * Run the schema for a wizard step. Returns the first issue message (or null).
 * Step 3 (location) only applies to on-site services, so callers skip it for
 * digital services — see `SERVICE_STEP_SCHEMAS`.
 */
export function validateServiceStep(step: number, values: unknown): string | null {
  const schema = SERVICE_STEP_SCHEMAS[step];
  if (!schema) return 'Unknown step';
  const result = schema.safeParse(values);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Invalid input';
}
