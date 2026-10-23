import { describe, expect, it } from "vitest";
import {
    resolveCheckoutDeliveryRules,
    DELIVERY_FEE_PER_VENDOR,
    type CheckoutCartLine,
} from "@/lib/store/cartStore";

const service = (overrides: Partial<CheckoutCartLine> = {}): CheckoutCartLine => ({
    vendorId: "vendor-service",
    isService: true,
    serviceDeliveryMode: "DIGITAL",
    ...overrides,
});

const product = (vendorId = "vendor-product"): CheckoutCartLine => ({
    vendorId,
    isService: false,
});

describe("resolveCheckoutDeliveryRules", () => {
    it("product-only pickup: no fee, no address, pickup details preserved", () => {
        const rules = resolveCheckoutDeliveryRules([product(), product("v2")], "PICKUP", "SUNDAY_FIRST");

        expect(rules).toEqual({
            hasServiceItems: false,
            serviceOnly: false,
            hasOnSiteService: false,
            hasDigitalService: true,
            requiresDeliveryAddress: false,
            deliveryMethod: "PICKUP",
            pickupDetails: { pickupService: "SUNDAY_FIRST" },
            deliveryFee: 0,
            deliveryVendorCount: 2,
        });
    });

    it("product-only delivery: flat fee per product-bearing vendor", () => {
        const rules = resolveCheckoutDeliveryRules([product(), product("v2")], "DELIVERY", "SUNDAY_FIRST");

        expect(rules.deliveryFee).toBe(DELIVERY_FEE_PER_VENDOR * 2);
        expect(rules.requiresDeliveryAddress).toBe(true);
        expect(rules.deliveryMethod).toBe("DELIVERY");
        expect(rules.pickupDetails).toBeNull();
        expect(rules.deliveryVendorCount).toBe(2);
    });

    it("service-only digital cart: zero fee, no pickup slot, no address", () => {
        const rules = resolveCheckoutDeliveryRules([service()], "DELIVERY", "SUNDAY_FIRST");

        expect(rules).toEqual({
            hasServiceItems: true,
            serviceOnly: true,
            hasOnSiteService: false,
            hasDigitalService: true,
            requiresDeliveryAddress: false,
            deliveryMethod: "PICKUP",
            pickupDetails: null,
            deliveryFee: 0,
            deliveryVendorCount: 0,
        });
    });

    it("service-only on-site cart: address required even with zero fee", () => {
        const rules = resolveCheckoutDeliveryRules(
            [service({ serviceDeliveryMode: "ON_SITE" })],
            "PICKUP",
            "SUNDAY_FIRST"
        );

        expect(rules.serviceOnly).toBe(true);
        expect(rules.hasOnSiteService).toBe(true);
        expect(rules.requiresDeliveryAddress).toBe(true);
        expect(rules.deliveryFee).toBe(0);
        expect(rules.deliveryMethod).toBe("PICKUP");
        expect(rules.pickupDetails).toBeNull();
    });

    it("mixed cart delivery: fee counts only product-bearing vendors", () => {
        const rules = resolveCheckoutDeliveryRules(
            [product(), service({ serviceDeliveryMode: "ON_SITE" })],
            "DELIVERY",
            "SUNDAY_FIRST"
        );

        expect(rules.serviceOnly).toBe(false);
        expect(rules.hasServiceItems).toBe(true);
        expect(rules.deliveryFee).toBe(DELIVERY_FEE_PER_VENDOR * 1);
        expect(rules.requiresDeliveryAddress).toBe(true);
        expect(rules.deliveryMethod).toBe("DELIVERY");
        expect(rules.pickupDetails).toBeNull();
    });

    it("mixed cart pickup: keeps user pickup choice and charges no fee", () => {
        const rules = resolveCheckoutDeliveryRules(
            [product(), service()],
            "PICKUP",
            "FIRST_COME"
        );

        expect(rules.deliveryFee).toBe(0);
        expect(rules.deliveryMethod).toBe("PICKUP");
        expect(rules.pickupDetails).toEqual({ pickupService: "FIRST_COME" });
        expect(rules.requiresDeliveryAddress).toBe(false);
        expect(rules.deliveryVendorCount).toBe(1);
    });

    it("empty cart behaves like no fee and no address", () => {
        const rules = resolveCheckoutDeliveryRules([], "DELIVERY", undefined);

        expect(rules.deliveryFee).toBe(0);
        expect(rules.serviceOnly).toBe(false);
        expect(rules.requiresDeliveryAddress).toBe(false);
        expect(rules.pickupDetails).toBeNull();
    });

    it("mixed cart with on-site service requires address even when picking up", () => {
        const rules = resolveCheckoutDeliveryRules(
            [product(), service({ serviceDeliveryMode: "ON_SITE" })],
            "PICKUP",
            "SUNDAY_FIRST"
        );

        expect(rules.requiresDeliveryAddress).toBe(true);
        expect(rules.deliveryFee).toBe(0);
        expect(rules.pickupDetails).toEqual({ pickupService: "SUNDAY_FIRST" });
    });
});
