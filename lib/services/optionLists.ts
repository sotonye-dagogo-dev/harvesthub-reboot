/**
 * Option list persistence layer.
 *
 * Hard rules (see ai-system/planning/feature-plan-2026-09-29-services-marketplace.md §6):
 *  - `getOptionList()` NEVER throws: DB outage / malformed row / missing row all
 *    fall back to the code fallback.
 *  - An unregistered key returns `null` so the route can answer 404.
 *  - Server-side validation always uses the code/Prisma enum key set — admins can
 *    hide a value, never inject one.
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/prisma/generated/client';
import {
  OPTION_LIST_DEFINITIONS,
  OPTION_LIST_FALLBACKS,
  isOptionListKey,
  parseOptionRows,
  type OptionListDefinition,
  type OptionListKey,
  type OptionListTier,
  type OptionRow,
} from '@/lib/config/optionLists';

export interface OptionListResult {
  key: OptionListKey;
  tier: OptionListTier;
  label: string;
  /** Every row, including `hidden` ones — use `visibleOptions()` for pickers. */
  options: OptionRow[];
  /** True when there was no usable DB row (missing, empty or DB error). */
  fallback: boolean;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
}

export class OptionListValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OptionListValidationError';
  }
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: OptionListResult; expires: number }>();

export function clearOptionListCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}

function mergeOptions(definition: OptionListDefinition, stored: OptionRow[]): OptionRow[] {
  const allowed = definition.allowedValues;
  const overrides = new Map<string, OptionRow>();

  for (const row of stored) {
    if (allowed && !allowed.includes(row.value)) continue; // never inject a value
    overrides.set(row.value, row);
  }

  if (definition.tier === 'FREEFORM') {
    // Admin owns the set: DB rows are authoritative.
    return stored.filter((row) => !allowed || allowed.includes(row.value));
  }

  // DISPLAY: DB controls order/labels/hide; missing enum values are re-appended
  // so an incomplete row can never silently drop a legal value.
  const merged: OptionRow[] = [];
  for (const row of stored) {
    if (allowed && !allowed.includes(row.value)) continue;
    const base = definition.fallback.find((entry) => entry.value === row.value);
    merged.push({ ...(base ?? {}), ...row });
  }
  for (const base of definition.fallback) {
    if (overrides.has(base.value)) continue;
    merged.push({ ...base });
  }
  return merged;
}

/**
 * Resolve an option list. Returns `null` only for an unregistered key.
 */
export async function getOptionList(
  key: string,
  options?: { bypassCache?: boolean },
): Promise<OptionListResult | null> {
  if (!isOptionListKey(key)) return null;
  const definition = OPTION_LIST_DEFINITIONS[key];

  if (!options?.bypassCache) {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
  }

  let stored: OptionRow[] | null = null;
  let isActive = true;
  let updatedAt: string | undefined;
  let updatedBy: string | null | undefined;

  try {
    const row = await prisma.optionList.findUnique({ where: { key } });
    if (row) {
      stored = parseOptionRows(row.options);
      isActive = row.isActive;
      updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : undefined;
      updatedBy = row.updatedBy;
    }
  } catch {
    stored = null; // DB outage → code fallback, never throws
  }

  const usable: OptionRow[] | null = stored && stored.length > 0 ? stored : null;
  const result: OptionListResult = {
    key,
    tier: definition.tier,
    label: definition.label,
    options: usable ? mergeOptions(definition, usable) : [...definition.fallback],
    fallback: usable === null,
    isActive,
    updatedAt,
    updatedBy,
  };

  cache.set(key, { value: result, expires: Date.now() + CACHE_TTL_MS });
  return result;
}

/** Same as `getOptionList` but always returns a list for known keys. */
export async function getOptionListOrFallback(key: OptionListKey): Promise<OptionRow[]> {
  const result = await getOptionList(key);
  return result?.options ?? [...OPTION_LIST_FALLBACKS[key]];
}

/**
 * Validate a candidate payload against the definition. Throws
 * `OptionListValidationError` with a machine-readable code.
 */
export function validateOptionListPayload(
  key: string,
  raw: unknown,
): { options: OptionRow[] } {
  if (!isOptionListKey(key)) {
    throw new OptionListValidationError('OPTION_LIST_NOT_FOUND', `Unknown option list "${key}".`);
  }
  const definition = OPTION_LIST_DEFINITIONS[key];

  const parsed = parseOptionRows(raw);
  if (parsed === null) {
    throw new OptionListValidationError(
      'OPTION_LIST_INVALID_OPTIONS',
      'Options must be an array of { value, label } objects.',
    );
  }

  const maxOptions = definition.maxOptions ?? 200;
  if (parsed.length > maxOptions) {
    throw new OptionListValidationError(
      'OPTION_LIST_TOO_MANY',
      `"${definition.label}" accepts at most ${maxOptions} options.`,
    );
  }

  const seen = new Set<string>();
  for (const row of parsed) {
    if (row.value.length > 64 || row.label.length > 80) {
      throw new OptionListValidationError(
        'OPTION_LIST_INVALID_OPTIONS',
        'Option values must be ≤64 characters and labels ≤80 characters.',
      );
    }
    if (seen.has(row.value)) {
      throw new OptionListValidationError(
        'OPTION_LIST_DUPLICATE_VALUE',
        `Duplicate option value "${row.value}".`,
      );
    }
    seen.add(row.value);

    if (definition.allowedValues && !definition.allowedValues.includes(row.value)) {
      throw new OptionListValidationError(
        'OPTION_LIST_VALUE_NOT_ALLOWED',
        `"${row.value}" is not a legal value for "${definition.label}".`,
      );
    }
  }

  return { options: parsed };
}

/**
 * Persist an option list. Returns the stored result with the cache invalidated.
 */
export async function upsertOptionList(
  key: string,
  rawOptions: unknown,
  updatedBy: string | null,
): Promise<OptionListResult> {
  const { options } = validateOptionListPayload(key, rawOptions);
  const definition = OPTION_LIST_DEFINITIONS[key as OptionListKey];

  const input = {
    tier: definition.tier,
    options: options as unknown as Prisma.InputJsonValue,
    updatedBy,
  };

  try {
    await prisma.optionList.upsert({
      where: { key },
      update: { ...input, isActive: true },
      create: { key, ...input, isActive: true },
    });
  } catch (error) {
    throw new OptionListValidationError(
      'OPTION_LIST_WRITE_FAILED',
      error instanceof Error ? error.message : 'Failed to persist option list.',
    );
  }

  clearOptionListCache(key);
  const fresh = await getOptionList(key, { bypassCache: true });
  if (!fresh) throw new OptionListValidationError('OPTION_LIST_NOT_FOUND', `Unknown option list "${key}".`);
  return fresh;
}
