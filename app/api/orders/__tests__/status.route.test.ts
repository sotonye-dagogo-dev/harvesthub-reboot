import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { OrderStatus, PaymentStatus, TransactionType } from "@/prisma/generated/client";
import { PATCH } from "@/app/api/orders/[id]/status/route";

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
    order: {
      findUnique: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
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

function buildRequest(status: string, note?: string) {
  return new NextRequest("http://localhost/api/orders/order-1/status", {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/orders/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "admin-user", role: "ADMIN" });
    mockRateLimitByUser.mockResolvedValue({ success: true });
  });

  it("returns 400 for invalid lifecycle transitions", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      id: "order-1",
      vendorId: "vendor-1",
      status: OrderStatus.DELIVERED,
    });
    mockPrisma.vendor.findUnique.mockResolvedValueOnce({ id: "vendor-1" });
    mockPrisma.$transaction.mockImplementationOnce(async (callback: (tx: any) => unknown) => {
      return callback({
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-001",
            vendorId: "vendor-1",
            buyerId: "buyer-1",
            status: OrderStatus.DELIVERED,
            statusHistory: [],
            paymentStatus: PaymentStatus.PAID,
            total: 10000,
            completedAt: null,
          }),
        },
      });
    });

    const res = await PATCH(buildRequest("PROCESSING"), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Cannot transition");
  });

  it("creates payout hold once when transitioning paid order to DELIVERED", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      id: "order-1",
      vendorId: "vendor-1",
      status: OrderStatus.OUT_FOR_DELIVERY,
    });
    mockPrisma.vendor.findUnique.mockResolvedValueOnce({ id: "vendor-1" });

    const txOrderUpdate = vi.fn().mockResolvedValue({
      id: "order-1",
      status: OrderStatus.DELIVERED,
    });
    const txTransactionCreate = vi.fn().mockResolvedValue({ id: "tx-1" });
    const txWalletUpdate = vi.fn().mockResolvedValue({ id: "wallet-1", balance: 1000 });

    mockPrisma.$transaction.mockImplementationOnce(async (callback: (tx: any) => unknown) => {
      return callback({
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-001",
            vendorId: "vendor-1",
            buyerId: "buyer-1",
            status: OrderStatus.OUT_FOR_DELIVERY,
            statusHistory: [],
            paymentStatus: PaymentStatus.PAID,
            total: 15000,
            completedAt: null,
          }),
          update: txOrderUpdate,
        },
        transaction: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: txTransactionCreate,
        },
        vendor: {
          findUnique: vi.fn().mockResolvedValue({
            userId: "vendor-user-1",
            storeName: "Fresh Farm",
          }),
        },
        wallet: {
          upsert: vi.fn().mockResolvedValue({
            id: "wallet-1",
            balance: 1000,
          }),
          update: txWalletUpdate,
        },
      });
    });

    const res = await PATCH(buildRequest("DELIVERED"), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.payout.created).toBe(true);
    expect(json.payout.held).toBe(true);
    expect(txTransactionCreate).toHaveBeenCalledTimes(1);
    expect(txTransactionCreate.mock.calls[0]?.[0]?.data?.type).toBe(TransactionType.PAYOUT);
    expect(txTransactionCreate.mock.calls[0]?.[0]?.data?.status).toBe("PENDING");
    expect(txWalletUpdate).not.toHaveBeenCalled();
  });

  it("returns idempotent response when requested status already applied", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      id: "order-1",
      vendorId: "vendor-1",
      status: OrderStatus.DELIVERED,
    });
    mockPrisma.vendor.findUnique.mockResolvedValueOnce({ id: "vendor-1" });
    mockPrisma.$transaction.mockImplementationOnce(async (callback: (tx: any) => unknown) => {
      return callback({
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-001",
            vendorId: "vendor-1",
            buyerId: "buyer-1",
            status: OrderStatus.DELIVERED,
            statusHistory: [],
            paymentStatus: PaymentStatus.PAID,
            total: 15000,
            completedAt: null,
          }),
        },
      });
    });

    const res = await PATCH(buildRequest("DELIVERED"), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.idempotent).toBe(true);
    expect(json.payout.created).toBe(false);
  });

  it("persists provided transition note into status history entries", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      id: "order-1",
      vendorId: "vendor-1",
      status: OrderStatus.CONFIRMED,
    });
    mockPrisma.vendor.findUnique.mockResolvedValueOnce({ id: "vendor-1" });

    const txOrderUpdate = vi.fn().mockResolvedValue({
      id: "order-1",
      status: OrderStatus.PROCESSING,
    });

    mockPrisma.$transaction.mockImplementationOnce(async (callback: (tx: any) => unknown) => {
      return callback({
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-001",
            vendorId: "vendor-1",
            buyerId: "buyer-1",
            status: OrderStatus.CONFIRMED,
            statusHistory: [],
            paymentStatus: PaymentStatus.PAID,
            total: 15000,
            completedAt: null,
          }),
          update: txOrderUpdate,
        },
      });
    });

    const res = await PATCH(buildRequest("PROCESSING", "Vendor started preparing this order."), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    const statusHistory = txOrderUpdate.mock.calls[0]?.[0]?.data?.statusHistory as Array<{
      note?: string;
    }>;
    expect(Array.isArray(statusHistory)).toBe(true);
    expect(statusHistory[0]?.note).toContain("Vendor started preparing this order");
  });
});
