/**
 * Product Variation Configuration — config-driven, admin-editable, non-blocking.
 *
 * Goals:
 * - Scalable to any category (not just T-shirts): variation definitions are
 *   typed and mapped per ProductCategory with fallback to global defaults.
 * - Admin-editable: `fetchVariationConfig()` tries to load admin-overridden
 *   JSON from `/api/admin/variation-config` (or DB) with graceful fallback to
 *   DEFAULT_VARIATION_CONFIG — never throws, never blocks render.
 * - Non-blocking everywhere: consumers must handle loading/error as optional
 *   enhancement, not a gate.
 */

import { ProductCategory, VendorCategory } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VariationValue = {
  value: string; // e.g. "M", "XL", "Red"
  label: string; // display label, defaults to value
  /** Optional price delta for this specific value */
  priceAdjustment?: number;
};

export type VariationDefinition = {
  /** Machine key, e.g. "size", "color" */
  key: string;
  /** Human label, e.g. "Size" */
  label: string;
  /** Input type — select is default; color/text kept for extensibility */
  type: "select" | "color" | "text";
  /** Whether customer must pick before add-to-cart */
  required: boolean;
  /** Allowed values for this variation */
  values: VariationValue[];
  /** Hint for sorting / display */
  placeholder?: string;
};

export type CategoryVariationConfig = {
  /** ProductCategory values that share this config; empty means global fallback */
  categories: string[];
  /** VendorCategory values hint (optional, for vendor-level presets) */
  vendorCategories?: string[];
  variations: VariationDefinition[];
};

export type ProductVariationConfig = {
  version: number;
  updatedAt?: string;
  updatedBy?: string | null;
  categories: CategoryVariationConfig[];
};

// ---------------------------------------------------------------------------
// Default presets (used when DB/admin override unavailable)
// ---------------------------------------------------------------------------

const SIZE_VALUES: VariationValue[] = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "XXXL", label: "XXXL" },
];

const COLOR_VALUES: VariationValue[] = [
  { value: "Black", label: "Black" },
  { value: "White", label: "White" },
  { value: "Red", label: "Red" },
  { value: "Blue", label: "Blue" },
  { value: "Green", label: "Green" },
  { value: "Yellow", label: "Yellow" },
  { value: "Grey", label: "Grey" },
  { value: "Brown", label: "Brown" },
];

export const DEFAULT_FASHION_VARIATIONS: VariationDefinition[] = [
  {
    key: "size",
    label: "Size",
    type: "select",
    required: true,
    values: [
      { value: "M", label: "Medium (M)" },
      { value: "L", label: "Large (L)" },
      { value: "XL", label: "Extra Large (XL)" },
      { value: "XXL", label: "XXL" },
    ],
    placeholder: "Select size",
  },
  {
    key: "color",
    label: "Color",
    type: "color",
    required: false,
    values: COLOR_VALUES,
    placeholder: "Select color",
  },
];

export const DEFAULT_VARIATION_CONFIG: ProductVariationConfig = {
  version: 1,
  categories: [
    {
      categories: [ProductCategory.MENS_FASHION, ProductCategory.WOMENS_FASHION],
      vendorCategories: [VendorCategory.FASHION],
      variations: DEFAULT_FASHION_VARIATIONS,
    },
    // Global fallback for any product that opts into variations
    {
      categories: [],
      variations: [
        {
          key: "size",
          label: "Size",
          type: "select",
          required: false,
          values: SIZE_VALUES,
          placeholder: "Select size",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers — all non-blocking, pure, no I/O
// ---------------------------------------------------------------------------

export function getVariationsForCategory(
  category: string | null | undefined,
  config: ProductVariationConfig = DEFAULT_VARIATION_CONFIG
): VariationDefinition[] {
  if (!category) {
    const fallback = config.categories.find((c) => c.categories.length === 0);
    return fallback?.variations ?? [];
  }
  const direct = config.categories.find((c) => c.categories.includes(category));
  if (direct) return direct.variations;
  const fallback = config.categories.find((c) => c.categories.length === 0);
  return fallback?.variations ?? [];
}

export function isVariationRequiredForCategory(
  category: string | null | undefined,
  config: ProductVariationConfig = DEFAULT_VARIATION_CONFIG
): boolean {
  return getVariationsForCategory(category, config).some((v) => v.required);
}

export function validateSelectedVariants(
  category: string | null | undefined,
  selected: Record<string, string> | null | undefined,
  config: ProductVariationConfig = DEFAULT_VARIATION_CONFIG
): { valid: boolean; missing: string[]; invalid: string[] } {
  const defs = getVariationsForCategory(category, config);
  if (defs.length === 0) return { valid: true, missing: [], invalid: [] };
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const def of defs) {
    const chosen = selected?.[def.key];
    if (def.required && (!chosen || !chosen.trim())) {
      missing.push(def.key);
      continue;
    }
    if (chosen) {
      const allowed = def.values.map((v) => v.value);
      if (!allowed.includes(chosen)) invalid.push(def.key);
    }
  }
  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid };
}

export function formatSelectedVariants(
  selected: Record<string, string> | null | undefined
): string {
  if (!selected || Object.keys(selected).length === 0) return "";
  return Object.entries(selected)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

/**
 * Non-blocking fetch for admin-overridden config. Returns default if fetch fails,
 * times out, or response is malformed. Never throws.
 */
export async function fetchVariationConfigNonBlocking(): Promise<ProductVariationConfig> {
  if (typeof fetch === "undefined") return DEFAULT_VARIATION_CONFIG;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("/api/config/variation-config", {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return DEFAULT_VARIATION_CONFIG;
    const data = (await res.json().catch(() => null)) as {
      config?: ProductVariationConfig;
      success?: boolean;
    } | null;
    if (data?.config && Array.isArray(data.config.categories)) {
      return data.config;
    }
    return DEFAULT_VARIATION_CONFIG;
  } catch {
    return DEFAULT_VARIATION_CONFIG;
  }
}
