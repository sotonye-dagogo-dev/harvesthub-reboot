import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCart, servicePackageTotal } from "@/lib/store/cartStore";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import type { ServicePackage } from "@/lib/types";

const CART_STORAGE_KEY = "harvesthub-cart";

const makePackage = (
    overrides: Partial<ServicePackage> = {},
    extras: ServicePackage["extras"] = []
): ServicePackage => ({
    tier: "STANDARD",
    title: "Standard",
    description: "Standard tier",
    price: 4000,
    deliveryDays: 3,
    revisions: 1,
    extras,
    ...overrides,
});

const serviceBaseItem = (overrides: Record<string, unknown> = {}) => ({
    productId: "service-1",
    name: "Logo Design",
    price: 3500,
    image: "/service.jpg",
    vendorId: "vendor-1",
    vendorName: "Vendor One",
    quantity: 1,
    stock: SERVICE_UNLIMITED_STOCK,
    listingType: "SERVICE" as const,
    serviceDeliveryMode: "DIGITAL" as const,
    ...overrides,
});

describe("cartStore selectedPackage", () => {
    beforeEach(() => {
        useCart.setState({ items: [], totalItems: 0, totalPrice: 0 });
        window.localStorage.removeItem(CART_STORAGE_KEY);
    });

    it("prices a service line from the chosen package (tier + extras)", () => {
        const pkg = makePackage({ price: 4000 }, [{ title: "Source file", price: 500 }]);

        useCart.getState().addItem(serviceBaseItem({ price: 3500, selectedPackage: pkg }));

        const line = useCart.getState().items[0];
        expect(line).toEqual(
            expect.objectContaining({
                productId: "service-1",
                isService: true,
                quantity: 1,
                price: 4500,
                basePrice: 3500,
                selectedPackage: pkg,
                serviceDeliveryMode: "DIGITAL",
            })
        );
        expect(useCart.getState().totalPrice).toBe(4500);
        expect(useCart.getState().totalItems).toBe(1);
    });

    it("keeps the listing price when no package is chosen", () => {
        useCart.getState().addItem(serviceBaseItem({ price: 3500 }));

        const line = useCart.getState().items[0];
        expect(line).toEqual(
            expect.objectContaining({ price: 3500, basePrice: 3500, selectedPackage: undefined })
        );
    });

    it("replaces the package on re-add instead of duplicating the line", () => {
        useCart.getState().addItem(
            serviceBaseItem({ selectedPackage: makePackage({ price: 4000 }) })
        );
        useCart.getState().addItem(
            serviceBaseItem({ selectedPackage: makePackage({ tier: "PREMIUM", title: "Premium", price: 9000 }) })
        );

        const items = useCart.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0]).toEqual(
            expect.objectContaining({ price: 9000, basePrice: 3500, quantity: 1 })
        );
        expect(items[0]?.selectedPackage?.tier).toBe("PREMIUM");
        expect(useCart.getState().totalPrice).toBe(9000);
    });

    it("setSelectedPackage reprices the line and clear restores the base listing price", () => {
        useCart.getState().addItem(serviceBaseItem({ price: 3500 }));

        useCart.getState().setSelectedPackage("service-1", makePackage({ price: 4000 }));
        expect(useCart.getState().items[0]).toEqual(
            expect.objectContaining({ price: 4000, basePrice: 3500, quantity: 1 })
        );
        expect(useCart.getState().totalPrice).toBe(4000);

        useCart.getState().setSelectedPackage(
            "service-1",
            makePackage({ tier: "BASIC", title: "Basic", price: 1500 }, [{ title: "Rush", price: 500 }])
        );
        expect(useCart.getState().items[0]?.price).toBe(2000);

        useCart.getState().clearSelectedPackage("service-1");
        expect(useCart.getState().items[0]).toEqual(
            expect.objectContaining({ price: 3500, selectedPackage: undefined, basePrice: 3500 })
        );
        expect(useCart.getState().totalPrice).toBe(3500);
    });

    it("setSelectedPackage is a no-op for product lines", () => {
        useCart.getState().addItem({
            productId: "product-1",
            name: "Rice",
            price: 1000,
            image: "/rice.jpg",
            vendorId: "vendor-2",
            vendorName: "Vendor Two",
            quantity: 2,
            stock: 5,
        });

        useCart.getState().setSelectedPackage("product-1", makePackage({ price: 4000 }));

        expect(useCart.getState().items[0]).toEqual(
            expect.objectContaining({ price: 1000, quantity: 2, selectedPackage: undefined })
        );
    });

    it("keeps service quantity pinned at 1 even when updateQuantity asks for more", () => {
        useCart.getState().addItem(
            serviceBaseItem({ selectedPackage: makePackage({ price: 4000 }) })
        );

        useCart.getState().updateQuantity("service-1", 5);

        expect(useCart.getState().items[0]?.quantity).toBe(1);
        expect(useCart.getState().totalPrice).toBe(4000);
    });

    it("reconcile keeps the package price when the listing price/discount changes", () => {
        useCart.getState().addItem(
            serviceBaseItem({ price: 3500, selectedPackage: makePackage({ price: 4000 }) })
        );

        const summary = useCart.getState().reconcileWithCatalog([
            {
                id: "service-1",
                isActive: true,
                listingType: "SERVICE",
                price: 4500,
                discount: 50,
                stock: SERVICE_UNLIMITED_STOCK,
                serviceDetails: { deliveryMode: "DIGITAL" },
            },
        ]);

        expect(summary.removedCount).toBe(0);
        const line = useCart.getState().items[0];
        expect(line).toEqual(
            expect.objectContaining({
                price: 4000,
                basePrice: 4500,
                isService: true,
                serviceDeliveryMode: "DIGITAL",
            })
        );
        expect(line?.discountPercent).toBeUndefined();
        expect(line?.originalPrice).toBeUndefined();
    });

    it("reconcile clears the package when the listing flips to a product", () => {
        useCart.getState().addItem(
            serviceBaseItem({ price: 3500, selectedPackage: makePackage({ price: 4000 }) })
        );

        useCart.getState().reconcileWithCatalog([
            {
                id: "service-1",
                isActive: true,
                listingType: "PRODUCT",
                price: 3500,
                stock: 4,
            },
        ]);

        expect(useCart.getState().items[0]).toEqual(
            expect.objectContaining({
                isService: false,
                price: 3500,
                selectedPackage: undefined,
                basePrice: undefined,
                serviceDeliveryMode: undefined,
                quantity: 1,
            })
        );
    });

    it("servicePackageTotal sums tier price and extras and falls back to null", () => {
        expect(servicePackageTotal(makePackage({ price: 4000 }, [{ title: "A", price: 100 }]))).toBe(4100);
        expect(servicePackageTotal(makePackage({ price: 4000 }))).toBe(4000);
        expect(servicePackageTotal(null)).toBeNull();
        expect(servicePackageTotal(undefined)).toBeNull();
    });

    it("hydrates a legacy persisted cart without service fields and still supports packages", async () => {
        vi.resetModules();
        window.localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify({
                state: {
                    items: [
                        {
                            productId: "service-legacy",
                            name: "Legacy Service",
                            price: 5000,
                            image: "/legacy.jpg",
                            vendorId: "vendor-legacy",
                            vendorName: "Legacy Vendor",
                            quantity: 1,
                            stock: SERVICE_UNLIMITED_STOCK,
                            isService: true,
                        },
                    ],
                    totalItems: 1,
                    totalPrice: 5000,
                },
            })
        );

        const mod = await import("@/lib/store/cartStore");
        const legacyLine = mod.useCart.getState().items[0];
        expect(legacyLine).toEqual(
            expect.objectContaining({
                price: 5000,
                quantity: 1,
                isService: true,
            })
        );
        expect(legacyLine?.selectedPackage).toBeUndefined();
        expect(legacyLine?.basePrice).toBeUndefined();

        mod.useCart.getState().setSelectedPackage(
            "service-legacy",
            makePackage({ price: 4000 })
        );
        expect(mod.useCart.getState().items[0]).toEqual(
            expect.objectContaining({ price: 4000, basePrice: 5000 })
        );

        mod.useCart.getState().clearSelectedPackage("service-legacy");
        expect(mod.useCart.getState().items[0]).toEqual(
            expect.objectContaining({ price: 5000, selectedPackage: undefined })
        );
        expect(mod.useCart.getState().totalPrice).toBe(5000);

        window.localStorage.removeItem(CART_STORAGE_KEY);
    });
});
