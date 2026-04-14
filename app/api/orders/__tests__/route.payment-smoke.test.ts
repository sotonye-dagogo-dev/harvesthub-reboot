import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/orders/route";

const {
  mockGetCurrentUser,
  mockRateLimitByUser,
  mockGetRateLimitResponse,
  mockVerifyPayment,
  mockIsPaymentProcessingEnabled,
  mockDispatchNotification,
  mockPrisma,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockRateLimitByUser: vi.fn(),
  mockGetRateLimitResponse: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockIsPaymentProcessingEnabled: vi.fn(),
  mockDispatchNotification: vi.fn(),
  mockPrisma: {
    buyer: {
      upsert: vi.fn(),
    },
    vendor: {
      findMany: vi.fn(),
    },
    product: {
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

vi.mock("@/lib/services/payments", () => ({
  verifyPayment: (...args: unknown[]) => mockVerifyPayment(...args),
  getPaymentFallbackTelemetry: () => ({ deprecationDays: 30 }),
}));

vi.mock("@/lib/config/payments", () => ({
  isPaymentProcessingEnabled: () => mockIsPaymentProcessingEnabled(),
}));

vi.mock("@/lib/services/notifications", () => ({
  dispatchNotification: (...args: unknown[]) => mockDispatchNotification(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

function buildRequest(overrides: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentMethod: "CARD",
      deliveryMethod: "DELIVERY",
      paymentGateway: "PAYSTACK",
      paymentReference: "reference-123",
      paymentVerificationReference: "reference-123",
      vendorOrders: [
        {
          vendorId: "vendor-1",
          items: [{ productId: "product-1", quantity: 1 }],
        },
      ],
      ...overrides,
    }),
  });
}

describe("POST /api/orders payment smoke paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: "buyer-user-1", role: "BUYER" });
    mockRateLimitByUser.mockResolvedValue({ success: true });
    mockDispatchNotification.mockResolvedValue(undefined);
    mockIsPaymentProcessingEnabled.mockReturnValue(true);
  });

  it("returns payment verification failure when provider reference is not found", async () => {
    mockVerifyPayment.mockResolvedValue({
      gateway: "PAYSTACK",
      reference: "missing-reference",
      status: "NOT_FOUND",
      amount: 6500,
      currency: "NGN",
      message: "Stub verification did not find this provider reference.",
    });

    const res = await POST(buildRequest({ paymentVerificationReference: "missing-reference" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("PAYMENT_VERIFICATION_FAILED");
    expect(json.verification?.status).toBe("NOT_FOUND");
  });

  it("returns wallet insufficient code for wallet-funded checkout", async () => {
    mockPrisma.buyer.upsert.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.vendor.findMany.mockResolvedValue([
      { id: "vendor-1", userId: "vendor-user-1", status: "APPROVED" },
    ]);
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "product-1",
      name: "Fresh Tomato",
      isActive: true,
      vendorId: "vendor-1",
      stock: 20,
      listingType: "PRODUCT",
      price: 5000,
      mainImage: "https://cdn.example.com/product-1.jpg",
    });

    mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback({
        wallet: {
          findUnique: vi.fn().mockResolvedValue({ id: "wallet-1", balance: 1000, isActive: true }),
        },
      })
    );

    const res = await POST(
      buildRequest({
        paymentMethod: "WALLET",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("INSUFFICIENT_WALLET_BALANCE");
  });

  it("creates order when card verification succeeds", async () => {
    mockVerifyPayment.mockResolvedValue({
      gateway: "PAYSTACK",
      reference: "success-reference",
      status: "SUCCESS",
      amount: 6500,
      currency: "NGN",
      message: "Stub verification marked as successful.",
    });

    mockPrisma.buyer.upsert.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.vendor.findMany.mockResolvedValue([
      { id: "vendor-1", userId: "vendor-user-1", status: "APPROVED" },
    ]);
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "product-1",
      name: "Fresh Tomato",
      isActive: true,
      vendorId: "vendor-1",
      stock: 20,
      listingType: "PRODUCT",
      price: 5000,
      mainImage: "https://cdn.example.com/product-1.jpg",
    });

    mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback({
        order: {
          create: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-1234",
            vendorId: "vendor-1",
            total: 6500,
            items: [],
            vendor: { id: "vendor-1", storeName: "Fresh Farm" },
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({ listingType: "PRODUCT" }),
          update: vi.fn().mockResolvedValue({ id: "product-1" }),
        },
        vendor: {
          update: vi.fn().mockResolvedValue({ id: "vendor-1" }),
        },
      })
    );

    const res = await POST(buildRequest({ paymentVerificationReference: "success-reference" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.order?.id).toBe("order-1");
  });
});
