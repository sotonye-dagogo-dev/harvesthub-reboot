export type VoucherVisibility = "PUBLIC" | "PRIVATE";

export interface VoucherScopeConfig {
  categories: string[];
  vendorIds: string[];
  campuses: string[];
  productIds: string[];
  visibility: VoucherVisibility;
}

export interface VoucherScopeContext {
  categories: string[];
  vendorIds: string[];
  campuses: string[];
  productIds: string[];
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(normalized));
}

function normalizeVisibility(value: unknown): VoucherVisibility {
  return typeof value === "string" && value.toUpperCase() === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

export function parseVoucherScope(
  applicableCategories: unknown,
  applicableVendors: unknown
): VoucherScopeConfig {
  const categoriesSource =
    applicableCategories && typeof applicableCategories === "object" && !Array.isArray(applicableCategories)
      ? (applicableCategories as Record<string, unknown>).categories
      : applicableCategories;

  const vendorSource =
    applicableVendors && typeof applicableVendors === "object" && !Array.isArray(applicableVendors)
      ? (applicableVendors as Record<string, unknown>)
      : null;

  const legacyVendorIds = Array.isArray(applicableVendors) ? normalizeStringArray(applicableVendors) : [];
  const vendorIds = vendorSource
    ? normalizeStringArray(vendorSource.vendorIds)
    : legacyVendorIds;

  return {
    categories: normalizeStringArray(categoriesSource),
    vendorIds,
    campuses: normalizeStringArray(vendorSource?.campuses),
    productIds: normalizeStringArray(vendorSource?.productIds),
    visibility: normalizeVisibility(vendorSource?.visibility),
  };
}

export function buildVoucherScopeStorage(scope: VoucherScopeConfig): {
  applicableCategories: string[];
  applicableVendors: {
    vendorIds: string[];
    campuses: string[];
    productIds: string[];
    visibility: VoucherVisibility;
  };
} {
  return {
    applicableCategories: normalizeStringArray(scope.categories),
    applicableVendors: {
      vendorIds: normalizeStringArray(scope.vendorIds),
      campuses: normalizeStringArray(scope.campuses),
      productIds: normalizeStringArray(scope.productIds),
      visibility: normalizeVisibility(scope.visibility),
    },
  };
}

function hasScopeMatch(scopeValues: string[], candidateValues: string[]): boolean {
  if (scopeValues.length === 0) return true;
  if (candidateValues.length === 0) return false;

  const candidateSet = new Set(candidateValues.map((entry) => entry.toUpperCase()));
  return scopeValues.some((entry) => candidateSet.has(entry.toUpperCase()));
}

export function voucherAppliesToContext(
  scope: VoucherScopeConfig,
  context: VoucherScopeContext
): boolean {
  return (
    hasScopeMatch(scope.vendorIds, context.vendorIds) &&
    hasScopeMatch(scope.categories, context.categories) &&
    hasScopeMatch(scope.campuses, context.campuses) &&
    hasScopeMatch(scope.productIds, context.productIds)
  );
}
