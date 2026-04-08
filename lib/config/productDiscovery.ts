import { VENDOR_CATEGORIES } from "@/lib/constants";

export type ProductSortKey =
    | "new"
    | "trending"
    | "price-low"
    | "price-high"
    | "name-asc"
    | "name-desc";

export type ProductDiscoveryQueryState = {
    search: string;
    sort: ProductSortKey;
    categories: string[];
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    vendors: string[];
    locations: string[];
};

export const DEFAULT_PRODUCT_SORT: ProductSortKey = "new";

export const PRODUCT_SORT_OPTIONS: Array<{ value: ProductSortKey; label: string }> = [
    { value: "new", label: "Newest" },
    { value: "trending", label: "Trending" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
];

export const PRODUCT_DISCOVERY_CATEGORIES = VENDOR_CATEGORIES.map((category) => ({
    value: category.value,
    label: category.label,
    slug: category.value.toLowerCase().replace(/_/g, "-"),
}));

const CATEGORY_BY_SLUG = new Map(
    PRODUCT_DISCOVERY_CATEGORIES.map((category) => [category.slug, category.value])
);

const CATEGORY_BY_VALUE = new Map<string, string>(
    PRODUCT_DISCOVERY_CATEGORIES.map((category) => [category.value, category.value])
);

function firstValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }
    return value ?? "";
}

function toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
}

function toNumber(value: string | string[] | undefined): number | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return parsed;
}

function normalizeCategoryToken(rawToken: string): string | null {
    const token = rawToken.trim();
    if (!token) return null;

    const bySlug = CATEGORY_BY_SLUG.get(token.toLowerCase());
    if (bySlug) return bySlug;

    const byValue = CATEGORY_BY_VALUE.get(token.toUpperCase());
    if (byValue) return byValue;

    return null;
}

function normalizeSortKey(rawSort: string | string[] | undefined): ProductSortKey {
    const token = firstValue(rawSort).trim().toLowerCase();
    const valid = PRODUCT_SORT_OPTIONS.find((option) => option.value === token);
    return valid?.value || DEFAULT_PRODUCT_SORT;
}

function parseCategoryList(rawCategory: string | string[] | undefined): string[] {
    const tokens = toArray(rawCategory)
        .flatMap((value) => value.split(","))
        .map((entry) => normalizeCategoryToken(entry))
        .filter((value): value is string => Boolean(value));

    return Array.from(new Set(tokens));
}

function parseList(rawValue: string | string[] | undefined): string[] {
    const values = toArray(rawValue)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);

    return Array.from(new Set(values));
}

export function parseProductDiscoveryQueryState(
    searchParams?: Record<string, string | string[] | undefined>
): ProductDiscoveryQueryState {
    const searchRaw = searchParams?.search;
    const search = firstValue(searchRaw).trim();

    const listingTypeRaw = searchParams?.listingType;
    const listingType = firstValue(listingTypeRaw).trim().toUpperCase();

    return {
        search,
        sort: normalizeSortKey(searchParams?.sort),
        categories: parseCategoryList(searchParams?.category),
        listingType: listingType || undefined,
        minPrice: toNumber(searchParams?.minPrice),
        maxPrice: toNumber(searchParams?.maxPrice),
        rating: toNumber(searchParams?.rating),
        vendors: parseList(searchParams?.vendor),
        locations: parseList(searchParams?.location),
    };
}

export function buildProductDiscoveryQueryString(
    state: Partial<ProductDiscoveryQueryState>
): string {
    const params = new URLSearchParams();

    if (state.search) params.set("search", state.search);
    if (state.sort && state.sort !== DEFAULT_PRODUCT_SORT) params.set("sort", state.sort);

    if (state.categories && state.categories.length > 0) {
        const slugs = state.categories
            .map((value) => PRODUCT_DISCOVERY_CATEGORIES.find((category) => category.value === value)?.slug)
            .filter((value): value is string => Boolean(value));
        if (slugs.length > 0) {
            params.set("category", slugs.join(","));
        }
    }

    if (state.listingType) params.set("listingType", state.listingType);
    if (typeof state.minPrice === "number") params.set("minPrice", String(state.minPrice));
    if (typeof state.maxPrice === "number") params.set("maxPrice", String(state.maxPrice));
    if (typeof state.rating === "number") params.set("rating", String(state.rating));
    if (state.vendors && state.vendors.length > 0) params.set("vendor", state.vendors.join(","));
    if (state.locations && state.locations.length > 0) {
        params.set("location", state.locations.join(","));
    }

    return params.toString();
}
