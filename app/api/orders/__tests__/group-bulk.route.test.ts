import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/orders/group/[groupId]/bulk/route";

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
        buyer: {
            findUnique: vi.fn(),
        },
        order: {
            findMany: vi.fn(),
        },
        transaction: {
            findFirst: vi.fn(),
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

function buildRequest(body: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/orders/group/GRP-1/bulk", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    });
}

function groupedStatusHistory(groupId: string) {
    return [
        {
            status: "PAYMENT_RECORDED",
            timestamp: new Date().toISOString(),
            updatedBy: "system",
            orderGroupId: groupId,
        },
    ];
}

describe("POST /api/orders/group/[groupId]/bulk", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: "buyer-user-1", role: "BUYER" });
        mockRateLimitByUser.mockResolvedValue({ success: true });
        mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });
    });

    it("applies grouped cancel only to eligible statuses and reports partial skips", async () => {
        mockPrisma.order.findMany.mockResolvedValue([
            {
                id: "order-1",
                orderNumber: "MHH-001",
                buyerId: "buyer-1",
                paymentMethod: "CARD",
                paymentStatus: "PAID",
                status: "PROCESSING",
                total: 10000,
                statusHistory: groupedStatusHistory("GRP-1"),
            },
            {
                id: "order-2",
                orderNumber: "MHH-002",
                buyerId: "buyer-1",
                paymentMethod: "CARD",
                paymentStatus: "PAID",
                status: "DELIVERED",
                total: 12000,
                statusHistory: groupedStatusHistory("GRP-1"),
            },
        ]);

        mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => {
            return callback({
                order: {
                    update: vi.fn().mockResolvedValue({ id: "order-1" }),
                },
                orderItem: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                product: {
                    update: vi.fn(),
                },
                buyer: {
                    findUnique: vi.fn(),
                },
                wallet: {
                    upsert: vi.fn(),
                    update: vi.fn(),
                },
                transaction: {
                    findFirst: vi.fn(),
                    create: vi.fn(),
                },
            });
        });

        const res = await POST(
            buildRequest({
                action: "CANCEL",
                orderIds: ["order-1", "order-2"],
            }),
            { params: Promise.resolve({ groupId: "GRP-1" }) }
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.applied).toBe(1);
        expect(json.summary.skipped).toBe(1);
        expect(json.skipped[0]?.reason).toContain("not eligible for cancellation");
    });

    it("supports grouped refund requests with mixed-status safety reporting", async () => {
        mockPrisma.order.findMany.mockResolvedValue([
            {
                id: "order-3",
                orderNumber: "MHH-003",
                buyerId: "buyer-1",
                paymentMethod: "CARD",
                paymentStatus: "PAID",
                status: "PROCESSING",
                total: 8000,
                statusHistory: groupedStatusHistory("GRP-1"),
            },
            {
                id: "order-4",
                orderNumber: "MHH-004",
                buyerId: "buyer-1",
                paymentMethod: "CARD",
                paymentStatus: "PENDING",
                status: "PENDING",
                total: 9000,
                statusHistory: groupedStatusHistory("GRP-1"),
            },
        ]);

        mockPrisma.transaction.findFirst.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => {
            return callback({
                buyer: {
                    findUnique: vi.fn().mockResolvedValue({ userId: "buyer-user-1" }),
                },
                wallet: {
                    upsert: vi.fn().mockResolvedValue({ id: "wallet-1", balance: 1000 }),
                },
                transaction: {
                    create: vi.fn().mockResolvedValue({ id: "refund-tx-1" }),
                },
                order: {
                    update: vi.fn().mockResolvedValue({ id: "order-3" }),
                },
            });
        });

        const res = await POST(
            buildRequest({
                action: "REFUND_REQUEST",
                orderIds: ["order-3", "order-4"],
            }),
            { params: Promise.resolve({ groupId: "GRP-1" }) }
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.applied).toBe(1);
        expect(json.summary.skipped).toBe(1);
        expect(json.skipped[0]?.reason).toContain("not eligible for refund request");
    });
});
