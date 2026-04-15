import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/wallet/withdraw/route";

const {
    mockGetCurrentUser,
    mockRateLimitByUser,
    mockGetRateLimitResponse,
    mockCacheInvalidate,
    mockGetCommerceLifecycleConfig,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByUser: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockCacheInvalidate: vi.fn(),
    mockGetCommerceLifecycleConfig: vi.fn(),
    mockPrisma: {
        wallet: {
            findUnique: vi.fn(),
        },
        transaction: {
            findFirst: vi.fn(),
            aggregate: vi.fn(),
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

vi.mock("@/lib/cache/redis", () => ({
    cacheInvalidate: (...args: unknown[]) => mockCacheInvalidate(...args),
}));

vi.mock("@/lib/services/commerceConfig", () => ({
    getCommerceLifecycleConfig: (...args: unknown[]) => mockGetCommerceLifecycleConfig(...args),
}));

function buildRequest(body: Record<string, unknown> = {}) {
    return new NextRequest("http://localhost/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            amount: 5000,
            bankName: "First Bank",
            accountNumber: "0123456789",
            accountName: "Harvest Hub User",
            ...body,
        }),
    });
}

describe("POST /api/wallet/withdraw policy and settlement guards", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRateLimitByUser.mockResolvedValue({ success: true });
        mockCacheInvalidate.mockResolvedValue(undefined);
        mockGetCommerceLifecycleConfig.mockResolvedValue({
            autoConfirmEnabled: true,
            autoConfirmHours: 48,
            refundWindowHours: 72,
            withdrawalSettlementHoldHours: 72,
            paymentsEnabled: true,
            minOrderAmount: 500,
            maxBookingAdvanceDays: 60,
        });
    });

    it("allows admin withdrawal request when balance checks pass", async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
        mockPrisma.wallet.findUnique.mockResolvedValue({
            id: "wallet-1",
            balance: 20000,
            isActive: true,
        });
        mockPrisma.transaction.findFirst.mockResolvedValue(null);
        mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
        mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
            callback({
                transaction: {
                    create: vi.fn().mockResolvedValue({
                        id: "txn-1",
                        reference: "WDR-123",
                        amount: 5000,
                        status: "PENDING",
                    }),
                },
            })
        );

        const res = await POST(buildRequest());
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.transaction?.status).toBe("PENDING");
        expect(mockCacheInvalidate).toHaveBeenCalledTimes(1);
    });

    it("blocks withdrawal while a recent pending settlement payout exists", async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: "vendor-1", role: "VENDOR" });
        mockPrisma.wallet.findUnique.mockResolvedValue({
            id: "wallet-1",
            balance: 25000,
            isActive: true,
        });
        mockPrisma.transaction.findFirst.mockResolvedValue({
            reference: "PAYOUT-ORDER-123",
            orderId: "order-1",
            createdAt: new Date("2026-04-15T10:00:00.000Z"),
        });

        const res = await POST(buildRequest({ amount: 3000 }));
        const json = await res.json();

        expect(res.status).toBe(409);
        expect(json.code).toBe("WITHDRAWAL_PENDING_SETTLEMENT");
        expect(json.payoutReference).toBe("PAYOUT-ORDER-123");
        expect(mockPrisma.transaction.aggregate).not.toHaveBeenCalled();
    });
});
