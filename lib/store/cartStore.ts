import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import type { ServicePackage } from "@/lib/types";

type CartStorageLike = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

const createMemoryCartStorage = (): CartStorageLike => {
  const store = new Map<string, string>();
  return {
    getItem: (name) => (store.has(name) ? store.get(name)! : null),
    setItem: (name, value) => {
      store.set(name, String(value));
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
};

/**
 * A usable storage for cart persistence.
 *
 * Some runtimes expose a `localStorage` global whose *methods are missing*
 * (e.g. Node >= 22 without a valid `--localstorage-file`, or browsers with
 * storage disabled). Reading that as a working store would crash every cart
 * write, so fall back to an in-memory store — installed as the global so
 * hydration reads and `vi.resetModules()` re-imports keep seeing the same
 * data — instead. Real browsers keep their own localStorage untouched.
 */
const resolveCartStorage = (): CartStorageLike => {
  try {
    const existing = globalThis.localStorage as CartStorageLike | undefined;
    if (
      existing &&
      typeof existing.getItem === "function" &&
      typeof existing.setItem === "function"
    ) {
      return existing;
    }
  } catch {
    // Storage access itself can throw (blocked cookies) — fall through.
  }

  const fallback = createMemoryCartStorage();
  const install = (target: unknown) => {
    if (!target || typeof target !== "object") return;
    try {
      Object.defineProperty(target, "localStorage", {
        value: fallback,
        configurable: true,
        writable: true,
      });
    } catch {
      // Non-configurable global — this module instance still keeps `fallback`.
    }
  };
  install(globalThis);
  install(typeof window !== "undefined" ? window : null);
  return fallback;
};

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    image: string;
    vendorId: string;
    vendorName: string;
    quantity: number;
    stock: number;
    /** @deprecated use selectedVariants */
    variant?: string;
    /** Config-driven variants, e.g. { size: "M", color: "Red" } */
    selectedVariants?: Record<string, string> | null;
    isService?: boolean;
    /**
     * Purchased service package snapshot (services only). The line `price` is
     * `servicePackageTotal(selectedPackage)`. Absent on carts persisted before
     * the services feature — those keep checking out against `price`.
     */
    selectedPackage?: ServicePackage | null;
    /**
     * Listing price captured before a package override, so clearing the
     * package restores the base listing price. Services only.
     */
    basePrice?: number;
    /** `DIGITAL` / `ON_SITE` for service lines — drives checkout address rules. */
    serviceDeliveryMode?: "DIGITAL" | "ON_SITE" | null;
}

interface CartCatalogProduct {
    id: string;
    name?: string | null;
    price?: number | null;
    discount?: number | null;
    stock?: number | null;
    isActive?: boolean | null;
    listingType?: string | null;
    vendorId?: string | null;
    vendor?: {
        storeName?: string | null;
    } | null;
    images?: string[] | null;
    mainImage?: string | null;
    /** Raw `Product.serviceDetails` JSON when the payload carries it. */
    serviceDetails?: unknown;
}

const isServiceItem = (
    item: { stock: number; isService?: boolean; selectedPackage?: ServicePackage | null }
) => item.isService || Boolean(item.selectedPackage) || item.stock >= SERVICE_UNLIMITED_STOCK;

const isServiceListing = (listingType?: string | null) => listingType === "SERVICE";

/** Delivery mode from a raw `serviceDetails` payload; null when unknown. */
const readDeliveryMode = (raw: unknown): "DIGITAL" | "ON_SITE" | null => {
    if (!raw || typeof raw !== "object") return null;
    const mode = (raw as { deliveryMode?: unknown }).deliveryMode;
    return mode === "DIGITAL" || mode === "ON_SITE" ? mode : null;
};

/** Flat delivery fee charged per product-bearing vendor on a delivery order. */
export const DELIVERY_FEE_PER_VENDOR = 1500;

/**
 * Price a cart line for a chosen service package: tier price + selected extras.
 * Returns `null` when the package carries no usable price (caller falls back to
 * the listing price).
 */
export const servicePackageTotal = (
    pkg: ServicePackage | null | undefined
): number | null => {
    if (!pkg || !Number.isFinite(pkg.price)) return null;
    const extrasTotal = Array.isArray(pkg.extras)
        ? pkg.extras.reduce(
              (sum, extra) => sum + (Number.isFinite(extra?.price) ? extra.price : 0),
              0
          )
        : 0;
    return Math.max(pkg.price + extrasTotal, 0);
};

export const normalizeDiscountPercent = (discount: number | null | undefined): number => {
    const parsed = Number(discount ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 0;
    }
    return Math.min(parsed, 100);
};

export const resolveDiscountedPrice = (price: number, discountPercent: number): number =>
    Math.max(price - (price * discountPercent) / 100, 0);

export const buildCartPricing = (price: number, discount: number | null | undefined) => {
    const discountPercent = normalizeDiscountPercent(discount);
    const effectivePrice = resolveDiscountedPrice(price, discountPercent);

    return {
        price: effectivePrice,
        originalPrice: discountPercent > 0 ? price : undefined,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
    };
};

export const getCartPricingBreakdown = (
    items: Array<Pick<CartItem, "price" | "originalPrice" | "quantity">>
) => {
    const effectiveTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const originalTotal = items.reduce(
        (sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity,
        0
    );
    const productDiscountTotal = Math.max(0, originalTotal - effectiveTotal);

    return {
        effectiveTotal,
        originalTotal,
        productDiscountTotal,
    };
};

const recalculateTotals = (items: CartItem[]) => ({
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
});

export type CheckoutDeliveryMethod = "PICKUP" | "DELIVERY";

export interface CheckoutCartLine {
    vendorId: string;
    isService?: boolean;
    serviceDeliveryMode?: "DIGITAL" | "ON_SITE" | null;
}

export interface CheckoutDeliveryRules {
    hasServiceItems: boolean;
    /** Every line is a service (the documented `serviceKind` single-status rule). */
    serviceOnly: boolean;
    hasOnSiteService: boolean;
    hasDigitalService: boolean;
    /** Checkout must collect a delivery address (on-site service or product delivery). */
    requiresDeliveryAddress: boolean;
    /** Value sent as `deliveryMethod` (service-only carts send `PICKUP` + null pickup details). */
    deliveryMethod: CheckoutDeliveryMethod;
    /** `pickupDetails` to send (null when nothing is picked up). */
    pickupDetails: null | { pickupService: string };
    /** Flat per-vendor delivery fee; 0 for service-only carts and pickup. */
    deliveryFee: number;
    /** Vendors charged delivery (vendors with at least one product line). */
    deliveryVendorCount: number;
}

/**
 * Single source of the checkout service-vs-product branch decisions:
 * delivery fee, address requirement and the `deliveryMethod`/`pickupDetails`
 * wire values. Service-only carts never ship, so they never carry a delivery
 * fee or a church pickup slot; an on-site service still needs the address.
 */
export function resolveCheckoutDeliveryRules(
    items: CheckoutCartLine[],
    deliveryMethod: CheckoutDeliveryMethod,
    pickupService?: string
): CheckoutDeliveryRules {
    const lines = Array.isArray(items) ? items : [];
    const hasServiceItems = lines.some((line) => Boolean(line.isService));
    const serviceOnly = lines.length > 0 && lines.every((line) => Boolean(line.isService));
    const serviceLines = lines.filter((line) => line.isService);
    const hasOnSiteService = serviceLines.some((line) => line.serviceDeliveryMode === "ON_SITE");
    const hasDigitalService = lines.some(
        (line) => !line.isService || line.serviceDeliveryMode !== "ON_SITE"
    );

    const deliveryVendorIds = new Set(
        lines.filter((line) => !line.isService).map((line) => line.vendorId).filter(Boolean)
    );
    const deliveryVendorCount = serviceOnly ? 0 : deliveryVendorIds.size;

    // Service-only carts never ship and never pick up: they carry no delivery
    // fee and no church pickup slot. The wire value stays PICKUP (with
    // `pickupDetails: null`) because `DeliveryMethod` has no DIGITAL member —
    // the T5 service-only fee/address rules key off `items.every(SERVICE)`,
    // not off this value. This keeps the server-side fee at 0 today too.
    const wireDeliveryMethod: CheckoutDeliveryMethod = serviceOnly ? "PICKUP" : deliveryMethod;
    const deliveryFee =
        !serviceOnly && deliveryMethod === "DELIVERY"
            ? DELIVERY_FEE_PER_VENDOR * deliveryVendorCount
            : 0;
    // On-site services always need the address; product delivery needs it too.
    // Service-only digital carts (and empty carts) never do.
    const requiresDeliveryAddress =
        lines.length > 0 &&
        (hasOnSiteService || (!serviceOnly && deliveryMethod === "DELIVERY"));

    return {
        hasServiceItems,
        serviceOnly,
        hasOnSiteService,
        hasDigitalService,
        requiresDeliveryAddress,
        deliveryMethod: wireDeliveryMethod,
        pickupDetails:
            serviceOnly || wireDeliveryMethod !== "PICKUP" || !pickupService
                ? null
                : { pickupService },
        deliveryFee,
        deliveryVendorCount,
    };
}

function canonicalVariantKey(v: Record<string, string> | null | undefined): string {
    if (!v || Object.keys(v).length === 0) return "";
    return Object.keys(v)
        .sort()
        .map((k) => `${k}=${v[k]}`)
        .join("|");
}

function isSameCartLine(a: CartItem, b: Pick<CartItem, "productId" | "selectedVariants" | "variant">): boolean {
    if (a.productId !== b.productId) return false;
    const aKey = canonicalVariantKey(a.selectedVariants) || a.variant || "";
    const bKey = canonicalVariantKey(b.selectedVariants) || (b as CartItem).variant || "";
    return aKey === bKey;
}

interface CartStore {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    updateQuantity: (productId: string, quantity: number, selectedVariants?: Record<string, string> | null) => void;
    updateVariants: (productId: string, prevVariants: Record<string, string> | null, nextVariants: Record<string, string> | null) => boolean;
    removeItem: (productId: string, selectedVariants?: Record<string, string> | null) => void;
    clearCart: () => void;
    getItem: (productId: string, selectedVariants?: Record<string, string> | null) => CartItem | undefined;
    /**
     * Set (or, with `null`, clear) the service package on a service line.
     * Reprices the line (tier price + chosen extras, quantity forced to 1) or
     * restores `basePrice` when cleared. No-op for product lines.
     */
    setSelectedPackage: (
        productId: string,
        selectedPackage: ServicePackage | null,
        selectedVariants?: Record<string, string> | null
    ) => void;
    clearSelectedPackage: (productId: string, selectedVariants?: Record<string, string> | null) => void;
    reconcileWithCatalog: (catalog: CartCatalogProduct[]) => {
        removedCount: number;
        adjustedCount: number;
    };
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,

            addItem: (item) => {
                // Normalize variant: keep both variant string and selectedVariants map for backwards compat
                const normalizedSelected = (item as CartItem).selectedVariants ?? (item.variant ? { value: item.variant } : null);
                const compareTarget = { productId: item.productId, selectedVariants: normalizedSelected, variant: item.variant };
                const existingItem = get().items.find((i) => isSameCartLine(i, compareTarget));
                const service = isServiceItem(item);
                const selectedPackage = item.selectedPackage ?? null;
                const basePrice = item.basePrice ?? item.price;
                const packagePrice =
                    service && selectedPackage ? servicePackageTotal(selectedPackage) : null;
                const nextPrice = packagePrice !== null ? packagePrice : item.price;

                if (existingItem) {
                    if (service) {
                        // Re-adding a service replaces its package on the existing
                        // line (services are always quantity 1, never merged).
                        set((state) => {
                            const newItems = state.items.map((i) => {
                                if (!isSameCartLine(i, compareTarget)) return i;
                                const lineBase = i.basePrice ?? i.price;
                                const linePackagePrice = selectedPackage
                                    ? servicePackageTotal(selectedPackage)
                                    : null;
                                return {
                                    ...i,
                                    isService: true,
                                    quantity: 1,
                                    basePrice: lineBase,
                                    selectedPackage: selectedPackage ?? undefined,
                                    price: linePackagePrice !== null ? linePackagePrice : lineBase,
                                    serviceDeliveryMode:
                                        item.serviceDeliveryMode ?? i.serviceDeliveryMode ?? null,
                                };
                            });
                            const { totalItems, totalPrice } = recalculateTotals(newItems);

                            return { items: newItems, totalItems, totalPrice };
                        });
                        return;
                    }

                    const newQuantity = existingItem.quantity + (item.quantity || 1);
                    const limitedQuantity = Math.min(newQuantity, item.stock);

                    set((state) => {
                        const newItems = state.items.map((i) =>
                            isSameCartLine(i, compareTarget) ? { ...i, quantity: limitedQuantity } : i
                        );
                        const { totalItems, totalPrice } = recalculateTotals(newItems);

                        return { items: newItems, totalItems, totalPrice };
                    });
                } else {
                    const newItem: CartItem = {
                        ...item,
                        selectedVariants: normalizedSelected ?? null,
                        quantity: service ? 1 : Math.min(item.quantity || 1, item.stock),
                        isService: service,
                        price: nextPrice,
                        selectedPackage: selectedPackage ?? undefined,
                        serviceDeliveryMode: service
                            ? (item.serviceDeliveryMode ?? null)
                            : undefined,
                        ...(service ? { basePrice } : {}),
                    };

                    set((state) => {
                        const newItems = [...state.items, newItem];
                        const { totalItems, totalPrice } = recalculateTotals(newItems);

                        return { items: newItems, totalItems, totalPrice };
                    });
                }
            },

            updateQuantity: (productId, quantity, selectedVariants) => {
                set((state) => {
                    const target = { productId, selectedVariants: selectedVariants ?? null, variant: undefined };
                    const hasVariantFilter = selectedVariants !== undefined;
                    const newItems = state.items.map((item) => {
                        const matches = hasVariantFilter
                            ? isSameCartLine(item, target)
                            : item.productId === productId;
                        if (!matches) return item;
                        // Services always stay at quantity 1
                        if (isServiceItem(item)) return item;
                        return { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) };
                    });
                    const { totalItems, totalPrice } = recalculateTotals(newItems);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            updateVariants: (productId, prevVariants, nextVariants) => {
                const prevKey = canonicalVariantKey(prevVariants);
                const nextKey = canonicalVariantKey(nextVariants);
                if (prevKey === nextKey) return false;
                let merged = false;
                let success = false;
                set((state) => {
                    const idx = state.items.findIndex((i) =>
                        isSameCartLine(i, { productId, selectedVariants: prevVariants ?? null, variant: undefined })
                    );
                    if (idx === -1) return state;
                    const existingLine = state.items.find((i) =>
                        isSameCartLine(i, { productId, selectedVariants: nextVariants ?? null, variant: undefined })
                    );
                    let newItems: CartItem[];
                    if (existingLine) {
                        // Merge quantities (capped by stock)
                        const current = state.items[idx]!;
                        const mergedQty = Math.min(existingLine.quantity + current.quantity, current.stock);
                        newItems = state.items.filter((_, j) => j !== idx).map((i) =>
                            isSameCartLine(i, { productId, selectedVariants: nextVariants ?? null, variant: undefined })
                                ? { ...i, quantity: mergedQty, selectedVariants: nextVariants ?? null, variant: nextVariants ? Object.values(nextVariants)[0] : undefined }
                                : i
                        );
                        merged = true;
                    } else {
                        newItems = state.items.map((i, j) =>
                            j === idx ? { ...i, selectedVariants: nextVariants ?? null, variant: nextVariants ? Object.values(nextVariants)[0] : undefined } : i
                        );
                    }
                    const { totalItems, totalPrice } = recalculateTotals(newItems);
                    success = true;
                    return { items: newItems, totalItems, totalPrice };
                });
                return success;
            },

            removeItem: (productId, selectedVariants) => {
                set((state) => {
                    const hasVariantFilter = selectedVariants !== undefined;
                    const target = { productId, selectedVariants: selectedVariants ?? null, variant: undefined };
                    const newItems = state.items.filter((item) => {
                        if (hasVariantFilter) return !isSameCartLine(item, target);
                        return item.productId !== productId;
                    });
                    const { totalItems, totalPrice } = recalculateTotals(newItems);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, totalPrice: 0 });
            },

            getItem: (productId, selectedVariants) => {
                if (selectedVariants !== undefined) {
                    return get().items.find((item) =>
                        isSameCartLine(item, { productId, selectedVariants: selectedVariants ?? null, variant: undefined })
                    );
                }
                return get().items.find((item) => item.productId === productId);
            },

            setSelectedPackage: (productId, selectedPackage, selectedVariants) => {
                set((state) => {
                    const hasVariantFilter = selectedVariants !== undefined;
                    const target = { productId, selectedVariants: selectedVariants ?? null, variant: undefined };
                    let changed = false;
                    const newItems = state.items.map((item) => {
                        const matches = hasVariantFilter
                            ? isSameCartLine(item, target)
                            : item.productId === productId;
                        if (!matches || !isServiceItem(item)) return item;
                        const base = item.basePrice ?? item.price;
                        const packageTotal = selectedPackage
                            ? servicePackageTotal(selectedPackage)
                            : null;
                        const nextPrice = packageTotal !== null ? packageTotal : base;
                        const nextSelected = selectedPackage ?? undefined;
                        if (
                            item.price === nextPrice &&
                            (item.selectedPackage ?? undefined) === nextSelected &&
                            item.basePrice === base &&
                            item.quantity === 1
                        ) {
                            return item;
                        }
                        changed = true;
                        return {
                            ...item,
                            quantity: 1,
                            basePrice: base,
                            selectedPackage: nextSelected,
                            price: nextPrice,
                        };
                    });
                    if (!changed) return state;
                    const { totalItems, totalPrice } = recalculateTotals(newItems);
                    return { items: newItems, totalItems, totalPrice };
                });
            },

            clearSelectedPackage: (productId, selectedVariants) => {
                get().setSelectedPackage(productId, null, selectedVariants);
            },

            reconcileWithCatalog: (catalog) => {
                if (!Array.isArray(catalog) || catalog.length === 0) {
                    return { removedCount: 0, adjustedCount: 0 };
                }

                const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
                const currentItems = get().items;
                const nextItems: CartItem[] = [];
                let removedCount = 0;
                let adjustedCount = 0;

                for (const item of currentItems) {
                    const live = catalogById.get(item.productId);
                    if (!live || live.isActive === false) {
                        removedCount += 1;
                        continue;
                    }

                    const service = isServiceListing(live.listingType);
                    const stock = service
                        ? SERVICE_UNLIMITED_STOCK
                        : Math.max(0, Number.isFinite(live.stock) ? Number(live.stock) : 0);

                    if (!service && stock < 1) {
                        removedCount += 1;
                        continue;
                    }

                    const nextQuantity = service ? 1 : Math.min(Math.max(1, item.quantity), stock);
                    if (!service && nextQuantity < 1) {
                        removedCount += 1;
                        continue;
                    }

                    const normalizedName = typeof live.name === "string" && live.name.trim().length > 0
                        ? live.name
                        : item.name;
                    const liveBasePrice = Number.isFinite(live.price) ? Number(live.price) : item.price;
                    const livePackageTotal =
                        service && item.selectedPackage
                            ? servicePackageTotal(item.selectedPackage)
                            : null;
                    const listingDiscountPercent = normalizeDiscountPercent(live.discount);
                    const normalizedDiscountPercent =
                        livePackageTotal !== null ? 0 : listingDiscountPercent;
                    // A selected package keeps its own price: catalog
                    // price/discount changes never clobber the tier total.
                    const normalizedPrice =
                        livePackageTotal !== null ? livePackageTotal : resolveDiscountedPrice(liveBasePrice, normalizedDiscountPercent);
                    const normalizedOriginalPrice =
                        livePackageTotal !== null
                            ? undefined
                            : normalizedDiscountPercent > 0
                              ? liveBasePrice
                              : undefined;
                    const normalizedBasePrice = liveBasePrice;
                    const normalizedDeliveryMode = service
                        ? (readDeliveryMode(live.serviceDetails) ?? item.serviceDeliveryMode ?? null)
                        : undefined;
                    const normalizedSelectedPackage = service
                        ? (item.selectedPackage ?? undefined)
                        : undefined;
                    const normalizedImage =
                        (Array.isArray(live.images) && typeof live.images[0] === "string" && live.images[0]) ||
                        (typeof live.mainImage === "string" && live.mainImage) ||
                        item.image;
                    const normalizedVendorId =
                        typeof live.vendorId === "string" && live.vendorId.trim().length > 0
                            ? live.vendorId
                            : item.vendorId;
                    const normalizedVendorName =
                        typeof live.vendor?.storeName === "string" && live.vendor.storeName.trim().length > 0
                            ? live.vendor.storeName
                            : item.vendorName;

                    const nextItem: CartItem = {
                        ...item,
                        name: normalizedName,
                        price: normalizedPrice,
                        originalPrice: normalizedOriginalPrice,
                        discountPercent: normalizedDiscountPercent > 0 ? normalizedDiscountPercent : undefined,
                        image: normalizedImage,
                        vendorId: normalizedVendorId,
                        vendorName: normalizedVendorName,
                        quantity: nextQuantity,
                        stock,
                        isService: service,
                        selectedPackage: normalizedSelectedPackage,
                        basePrice: service ? normalizedBasePrice : undefined,
                        serviceDeliveryMode: normalizedDeliveryMode,
                    };

                    if (
                        nextItem.name !== item.name ||
                        nextItem.price !== item.price ||
                        nextItem.originalPrice !== item.originalPrice ||
                        nextItem.discountPercent !== item.discountPercent ||
                        nextItem.image !== item.image ||
                        nextItem.vendorId !== item.vendorId ||
                        nextItem.vendorName !== item.vendorName ||
                        nextItem.quantity !== item.quantity ||
                        nextItem.stock !== item.stock ||
                        nextItem.isService !== item.isService ||
                        nextItem.selectedPackage !== item.selectedPackage ||
                        nextItem.basePrice !== item.basePrice ||
                        nextItem.serviceDeliveryMode !== item.serviceDeliveryMode
                    ) {
                        adjustedCount += 1;
                    }

                    nextItems.push(nextItem);
                }

                if (removedCount > 0 || adjustedCount > 0) {
                    const { totalItems, totalPrice } = recalculateTotals(nextItems);
                    set({ items: nextItems, totalItems, totalPrice });
                }

                return { removedCount, adjustedCount };
            },
        }),
        {
            name: "harvesthub-cart",
            storage: createJSONStorage(() => resolveCartStorage()),
        }
    )
);
