import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/orders/route";

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
    vendor: {
      findUnique: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
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

describe("GET /api/orders grouped retrieval contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "buyer-user-1", role: "BUYER" });
    mockRateLimitByUser.mockResolvedValue({ success: true });
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });
  });

  it("derives orderGroupId and grouped summary from status history", async () => {
    const statusHistory = [
      {
        status: "PAYMENT_RECORDED",
        timestamp: new Date().toISOString(),
        updatedBy: "system",
        orderGroupId: "GRP-2001",
      },
    ];

    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "order-1",
        orderNumber: "MHH-2001",
        status: "PENDING",
        paymentStatus: "PAID",
        total: 5000,
        statusHistory,
        _count: { items: 2 },
        items: [{ quantity: 1 }, { quantity: 4 }],
      },
      {
        id: "order-2",
        orderNumber: "MHH-2002",
        status: "PENDING",
        paymentStatus: "PAID",
        total: 3000,
        statusHistory,
        _count: { items: 1 },
        items: [{ quantity: 2 }],
      },
    ]);

    const res = await GET(
      new NextRequest("http://localhost/api/orders?groupId=GRP-2001&limit=50")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.orders)).toBe(true);
    expect(json.orders.length).toBe(2);
    expect(json.orders[0]?.orderGroupId).toBe("GRP-2001");
    expect(json.orders[0]?.itemCount).toBe(2);
    expect(json.orders[0]?.totalQuantity).toBe(5);
    expect(json.groupedSummary["GRP-2001"].orderCount).toBe(2);
    expect(json.groupedSummary["GRP-2001"].total).toBe(8000);
  });
});
