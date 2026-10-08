/**
 * Option lists — the single registry of every admin-editable select/option set.
 *
 * Tiers
 *  - DISPLAY  : the value set is fixed by code or a Prisma enum. Admins may
 *               relabel, reorder and hide entries, but can never inject a
 *               value the application does not already understand.
 *  - FREEFORM : admins may add and remove options (e.g. service attributes,
 *               milestones, subcategories).
 *
 * Fallbacks live in code so a missing DB row, a DB outage or an unknown key
 * can never crash a form — see `lib/services/optionLists.ts`.
 */

import {
  CAMPUS_LOCATIONS,
  CATEGORY_SUBCATEGORIES,
  DELIVERY_ZONES,
  LISTING_TYPES,
  PICKUP_SERVICES,
  POSITION_OPTIONS,
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  SERVICE_LOCATIONS,
  SERVICE_MILESTONES,
  SERVICE_RATE_TYPES,
  DEFAULT_SERVICE_ATTRIBUTES,
  VENDOR_CATEGORIES,
} from '@/lib/constants';
import {
  SERVICE_REQUIREMENT_FIELD_TYPES,
  SERVICE_TIER_KEYS,
} from '@/lib/config/serviceFulfillment';

export type OptionListTier = 'DISPLAY' | 'FREEFORM';

export interface OptionRow {
  value: string;
  label: string;
  description?: string;
  /** Optional grouping (e.g. subcategory parent, attribute group). */
  group?: string;
  /** Rendered as disabled/hidden in pickers; still resolvable for legacy data. */
  hidden?: boolean;
}

export interface OptionListDefinition {
  key: OptionListKey;
  tier: OptionListTier;
  /** Admin editor heading. */
  label: string;
  description?: string;
  /** Code fallback — never empty unless the list is intentionally optional. */
  fallback: readonly OptionRow[];
  /**
   * For DISPLAY lists: the complete legal value set (code/Prisma enum keys).
   * Server-side validation always uses this — admins can hide a value, never
   * add one.
   */
  allowedValues?: readonly string[];
  /** Upper bound for FREEFORM lists (admin PUT rejects anything larger). */
  maxOptions?: number;
}

export const OPTION_LIST_KEYS = [
  'campus',
  'positions',
  'pickupServices',
  'deliveryZones',
  'listingTypes',
  'vendorCategories',
  'productCategories',
  'productSubcategories',
  'serviceCategories',
  'serviceLocations',
  'serviceRateTypes',
  'serviceTiers',
  'requirementFieldTypes',
  'serviceAttributes',
  'serviceMilestones',
] as const;

export type OptionListKey = (typeof OPTION_LIST_KEYS)[number];

export function isOptionListKey(value: unknown): value is OptionListKey {
  return typeof value === 'string' && (OPTION_LIST_KEYS as readonly string[]).includes(value);
}

function rows(source: readonly { value: string; label: string; description?: string }[]): OptionRow[] {
  return source.map((entry) => ({
    value: String(entry.value),
    label: String(entry.label),
    ...(entry.description ? { description: entry.description } : {}),
  }));
}

const SUBCATEGORY_ROWS: OptionRow[] = Object.entries(CATEGORY_SUBCATEGORIES).flatMap(
  ([parent, list]) =>
    list.map((entry) => ({
      value: entry.value,
      label: entry.label,
      group: PRODUCT_CATEGORIES.find((category) => category.value === parent)?.label ?? parent,
    })),
);

const SERVICE_ATTRIBUTE_ROWS: OptionRow[] = DEFAULT_SERVICE_ATTRIBUTES.map((entry) => ({
  value: entry.key,
  label: entry.label,
  group: entry.group,
  description: entry.type,
}));

const SERVICE_TIER_ROWS: OptionRow[] = [
  { value: 'BASIC', label: 'Basic', description: 'Entry-level package' },
  { value: 'STANDARD', label: 'Standard', description: 'Mid-tier package' },
  { value: 'PREMIUM', label: 'Premium', description: 'Top-tier package' },
];

const REQUIREMENT_TYPE_ROWS: OptionRow[] = [
  { value: 'TEXT', label: 'Short text' },
  { value: 'SELECT', label: 'Single choice' },
  { value: 'FILE', label: 'File upload' },
];

export const OPTION_LIST_DEFINITIONS: Record<OptionListKey, OptionListDefinition> = {
  campus: {
    key: 'campus',
    tier: 'DISPLAY',
    label: 'Campuses',
    description: 'Campus locations shown across signup, profile and filters.',
    fallback: rows(CAMPUS_LOCATIONS),
    allowedValues: CAMPUS_LOCATIONS.map((entry) => String(entry.value)),
  },
  positions: {
    key: 'positions',
    tier: 'DISPLAY',
    label: 'Church positions',
    fallback: rows(POSITION_OPTIONS),
    allowedValues: POSITION_OPTIONS.map((entry) => String(entry.value)),
  },
  pickupServices: {
    key: 'pickupServices',
    tier: 'DISPLAY',
    label: 'Pickup services',
    fallback: rows(PICKUP_SERVICES),
    allowedValues: PICKUP_SERVICES.map((entry) => String(entry.value)),
  },
  deliveryZones: {
    key: 'deliveryZones',
    tier: 'DISPLAY',
    label: 'Delivery zones',
    fallback: DELIVERY_ZONES.map((zone) => ({
      value: String(zone.zone),
      label: zone.name,
      description: zone.description,
    })),
    allowedValues: DELIVERY_ZONES.map((zone) => String(zone.zone)),
  },
  listingTypes: {
    key: 'listingTypes',
    tier: 'DISPLAY',
    label: 'Listing types',
    fallback: rows(LISTING_TYPES),
    allowedValues: LISTING_TYPES.map((entry) => String(entry.value)),
  },
  vendorCategories: {
    key: 'vendorCategories',
    tier: 'DISPLAY',
    label: 'Vendor categories',
    fallback: rows(VENDOR_CATEGORIES),
    allowedValues: VENDOR_CATEGORIES.map((entry) => String(entry.value)),
  },
  productCategories: {
    key: 'productCategories',
    tier: 'DISPLAY',
    label: 'Product categories',
    fallback: rows(PRODUCT_CATEGORIES),
    allowedValues: PRODUCT_CATEGORIES.map((entry) => String(entry.value)),
  },
  productSubcategories: {
    key: 'productSubcategories',
    tier: 'FREEFORM',
    label: 'Product subcategories',
    description: 'Grouped by their parent category.',
    fallback: SUBCATEGORY_ROWS,
    maxOptions: 500,
  },
  serviceCategories: {
    key: 'serviceCategories',
    tier: 'DISPLAY',
    label: 'Service categories',
    fallback: rows(SERVICE_CATEGORIES),
    allowedValues: SERVICE_CATEGORIES.map((entry) => String(entry.value)),
  },
  serviceLocations: {
    key: 'serviceLocations',
    tier: 'DISPLAY',
    label: 'Service locations',
    fallback: rows(SERVICE_LOCATIONS),
    allowedValues: SERVICE_LOCATIONS.map((entry) => String(entry.value)),
  },
  serviceRateTypes: {
    key: 'serviceRateTypes',
    tier: 'DISPLAY',
    label: 'Service rate types',
    fallback: rows(SERVICE_RATE_TYPES),
    allowedValues: SERVICE_RATE_TYPES.map((entry) => String(entry.value)),
  },
  serviceTiers: {
    key: 'serviceTiers',
    tier: 'DISPLAY',
    label: 'Service package tiers',
    fallback: SERVICE_TIER_ROWS,
    allowedValues: SERVICE_TIER_KEYS,
  },
  requirementFieldTypes: {
    key: 'requirementFieldTypes',
    tier: 'DISPLAY',
    label: 'Requirement field types',
    fallback: REQUIREMENT_TYPE_ROWS,
    allowedValues: SERVICE_REQUIREMENT_FIELD_TYPES,
  },
  serviceAttributes: {
    key: 'serviceAttributes',
    tier: 'FREEFORM',
    label: 'Service attributes',
    description: 'Buyer-facing requirement attributes. Options carry their group.',
    fallback: SERVICE_ATTRIBUTE_ROWS,
    maxOptions: 60,
  },
  serviceMilestones: {
    key: 'serviceMilestones',
    tier: 'FREEFORM',
    label: 'Service order milestones',
    description: 'Order-room timeline steps, in order.',
    fallback: rows(SERVICE_MILESTONES),
    maxOptions: 12,
  },
};

export const OPTION_LIST_FALLBACKS: Record<OptionListKey, readonly OptionRow[]> =
  Object.fromEntries(
    OPTION_LIST_KEYS.map((key) => [key, OPTION_LIST_DEFINITIONS[key].fallback]),
  ) as Record<OptionListKey, readonly OptionRow[]>;

/**
 * Rows a picker should offer. Hidden rows stay resolvable for legacy data but
 * are never offered to a new selection.
 */
export function visibleOptions(options: readonly OptionRow[]): OptionRow[] {
  return options.filter((row) => !row.hidden);
}

/** Shape check for a DB-stored option payload. */export function parseOptionRows(raw: unknown): OptionRow[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed: OptionRow[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.value !== 'string' || candidate.value.length === 0) return null;
    if (typeof candidate.label !== 'string') return null;
    const row: OptionRow = { value: candidate.value, label: candidate.label };
    if (typeof candidate.description === 'string' && candidate.description) {
      row.description = candidate.description;
    }
    if (typeof candidate.group === 'string' && candidate.group) row.group = candidate.group;
    if (typeof candidate.hidden === 'boolean') row.hidden = candidate.hidden;
    parsed.push(row);
  }
  return parsed;
}

/**
 * Resolve a human label for a stored value.
 *
 * `label ?? value ?? ""` — never throws, never returns "undefined".
 */
export function resolveOptionLabel(
  key: OptionListKey,
  value: string | null | undefined,
  options?: readonly OptionRow[],
): string {
  if (value === null || value === undefined || value === '') return '';
  const source = options ?? OPTION_LIST_FALLBACKS[key];
  return source.find((row) => row.value === value)?.label ?? value;
}
