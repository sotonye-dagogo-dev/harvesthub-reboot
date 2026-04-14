import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/vendors/me/store-settings/route";
import { UserRole, VENDOR_CATEGORIES, CAMPUS_LOCATIONS } from "@/lib/constants";

const categoryValue = VENDOR_CATEGORIES[0]?.value || "GROCERIES";
const campusValue = CAMPUS_LOCATIONS[0]?.value || "MAIN_CAMPUS";

const {
    mockGetCurrentUser,
    mockRateLimitByUser,
    mockGetRateLimitResponse,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByUser: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockPrisma: {
        vendor: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock("@/lib/utils/auth", () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/middleware/rate-limit", () => ({
    rateLimitByUser: (...args: unknown[]) => mockRateLimitByUser(...args),
    getRateLimitResponse: (...args: unknown[]) => mockGetRateLimitResponse(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
    prisma: mockPrisma,
}));

describe("vendor store settings reload parity", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: "vendor-user-1", role: UserRole.VENDOR });
        mockRateLimitByUser.mockResolvedValue({ success: true });
    });

    it("returns persisted store settings payload for vendor", async () => {
        mockPrisma.vendor.findUnique.mockResolvedValue({
            id: "vendor-1",
            storeName: "Fresh Farm",
            storeDescription: "Organic produce",
            storeLogo: "https://cdn.example.com/logo.png",
            category: categoryValue,
            campus: campusValue,
            isChurchAffiliated: true,
            commissionRate: 0.1,
            whatsappNumber: "08000000000",
            businessVerification: { businessAddress: "12 Market Road" },
            storeSettings: {
                contactPhone: "08011112222",
                allowsPickup: true,
                allowsDelivery: true,
                businessHoursStart: "09:00",
                businessHoursEnd: "18:00",
                processingTime: "1-2 days",
                policies: {
                    returnPolicy: "7-day return",
                    shippingPolicy: "Nationwide",
                },
            },
            user: { email: "vendor@example.com", phoneNumber: "08011112222" },
        });

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.settings.storeName).toBe("Fresh Farm");
        expect(json.settings.businessAddress).toBe("12 Market Road");
        expect(json.settings.returnPolicy).toBe("7-day return");
    });

    it("persists updated settings and returns updated payload", async () => {
        mockPrisma.vendor.findUnique.mockResolvedValue({
            id: "vendor-1",
            userId: "vendor-user-1",
            storeSettings: {
                policies: {},
            },
            businessVerification: {},
        });

        mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => {
            return callback({
                vendor: {
                    update: vi.fn().mockResolvedValue({
                        id: "vendor-1",
                        storeName: "Fresh Farm Updated",
                        storeDescription: "Now with faster delivery",
                        storeLogo: "https://cdn.example.com/new-logo.png",
                        category: categoryValue,
                        campus: campusValue,
                        isChurchAffiliated: true,
                        commissionRate: 0.1,
                        whatsappNumber: "08000000001",
                        businessVerification: { businessAddress: "21 New Market Road" },
                        storeSettings: {
                            allowsPickup: true,
                            allowsDelivery: true,
                            businessHoursStart: "08:00",
                            businessHoursEnd: "17:00",
                            processingTime: "Same day",
                            policies: {
                                returnPolicy: "3-day return",
                                shippingPolicy: "Lagos only",
                            },
                        },
                    }),
                },
                user: {
                    update: vi.fn().mockResolvedValue({ id: "vendor-user-1" }),
                },
            });
        });

        const res = await PUT(
            new NextRequest("http://localhost/api/vendors/me/store-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeName: "Fresh Farm Updated",
                    description: "Now with faster delivery",
                    storeLogo: "https://cdn.example.com/new-logo.png",
                      category: categoryValue,
                      campus: campusValue,
                    phone: "08000000001",
                    whatsapp: "08000000001",
                    allowsPickup: true,
                    allowsDelivery: true,
                    businessHoursStart: "08:00",
                    businessHoursEnd: "17:00",
                    processingTime: "Same day",
                    returnPolicy: "3-day return",
                    shippingPolicy: "Lagos only",
                    businessAddress: "21 New Market Road",
                }),
            })
        );

        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.settings.storeName).toBe("Fresh Farm Updated");
        expect(json.settings.businessAddress).toBe("21 New Market Road");
        expect(json.settings.processingTime).toBe("Same day");
    });
});
