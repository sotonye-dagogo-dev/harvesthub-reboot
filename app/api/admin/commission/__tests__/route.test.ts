import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/admin/commission/route";
import { CATEGORY_COMMISSION_DEFAULTS, VendorCategory } from "@/lib/constants";

const fallbackCategory =
    Object.values(VendorCategory).find((entry) => entry !== VendorCategory.ELECTRONICS) ||
    VendorCategory.ELECTRONICS;

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
        commissionConfig: {
            findMany: vi.fn(),
            upsert: vi.fn(),
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

describe("admin commission settings persistence contract", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
        mockRateLimitByUser.mockResolvedValue({ success: true });
    });

    it("returns merged default plus overridden category rates", async () => {
        mockPrisma.commissionConfig.findMany.mockResolvedValue([
            { category: VendorCategory.ELECTRONICS, rate: 0.12 },
        ]);

        const res = await GET(new NextRequest("http://localhost/api/admin/commission"));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        const electronics = json.commissionConfigs.find(
            (entry: { category: string }) => entry.category === VendorCategory.ELECTRONICS
        );
        const groceries = json.commissionConfigs.find(
            (entry: { category: string }) => entry.category === fallbackCategory
        );
        expect(electronics?.rate).toBe(0.12);
        expect(groceries?.rate).toBe(CATEGORY_COMMISSION_DEFAULTS[fallbackCategory]);
    });

    it("persists only valid category rates and reports updated count", async () => {
        mockPrisma.commissionConfig.upsert.mockImplementation(async ({ create }: any) => create);
        mockPrisma.$transaction.mockImplementation(async (ops: Array<Promise<unknown>>) =>
            Promise.all(ops)
        );

        const res = await PUT(
            new NextRequest("http://localhost/api/admin/commission", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rates: [
                        { category: VendorCategory.ELECTRONICS, rate: 0.15 },
                        { category: "INVALID_CATEGORY", rate: 0.22 },
                        { category: fallbackCategory, rate: 1.2 },
                    ],
                }),
            })
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.updated).toBe(1);
    });
});
