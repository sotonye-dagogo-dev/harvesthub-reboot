import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";

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
    variant?: string;
    isService?: boolean;
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
}

const isServiceItem = (item: { stock: number; isService?: boolean }) =>
    item.isService || item.stock >= SERVICE_UNLIMITED_STOCK;

const isServiceListing = (listingType?: string | null) => listingType === "SERVICE";

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

interface CartStore {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    getItem: (productId: string) => CartItem | undefined;
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
                const existingItem = get().items.find((i) => i.productId === item.productId);
                const service = isServiceItem(item);

                if (existingItem) {
                    // Services are capped at quantity 1
                    if (service) return;

                    const newQuantity = existingItem.quantity + (item.quantity || 1);
                    const limitedQuantity = Math.min(newQuantity, item.stock);

                    set((state) => {
                        const newItems = state.items.map((i) =>
                            i.productId === item.productId
                                ? { ...i, quantity: limitedQuantity }
                                : i
                        );
                        const { totalItems, totalPrice } = recalculateTotals(newItems);

                        return { items: newItems, totalItems, totalPrice };
                    });
                } else {
                    const newItem: CartItem = {
                        ...item,
                        quantity: service ? 1 : Math.min(item.quantity || 1, item.stock),
                        isService: service,
                    };

                    set((state) => {
                        const newItems = [...state.items, newItem];
                        const { totalItems, totalPrice } = recalculateTotals(newItems);

                        return { items: newItems, totalItems, totalPrice };
                    });
                }
            },

            updateQuantity: (productId, quantity) => {
                set((state) => {
                    const newItems = state.items.map((item) => {
                        if (item.productId !== productId) return item;
                        // Services always stay at quantity 1
                        if (isServiceItem(item)) return item;
                        return { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) };
                    });
                    const { totalItems, totalPrice } = recalculateTotals(newItems);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            removeItem: (productId) => {
                set((state) => {
                    const newItems = state.items.filter((item) => item.productId !== productId);
                    const { totalItems, totalPrice } = recalculateTotals(newItems);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, totalPrice: 0 });
            },

            getItem: (productId) => {
                return get().items.find((item) => item.productId === productId);
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
                    const normalizedBasePrice = Number.isFinite(live.price) ? Number(live.price) : item.price;
                    const normalizedDiscountPercent = normalizeDiscountPercent(live.discount);
                    const normalizedPrice = resolveDiscountedPrice(normalizedBasePrice, normalizedDiscountPercent);
                    const normalizedOriginalPrice = normalizedDiscountPercent > 0 ? normalizedBasePrice : undefined;
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
                        nextItem.isService !== item.isService
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
        }
    )
);
