import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/orders/route";

const {
  mockGetCurrentUser,
  mockRateLimitByUser,
  mockGetRateLimitResponse,
  mockVerifyPayment,
  mockGetCommerceLifecycleConfig,
  mockDispatchNotification,
  mockPrisma,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockRateLimitByUser: vi.fn(),
  mockGetRateLimitResponse: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockGetCommerceLifecycleConfig: vi.fn(),
  mockDispatchNotification: vi.fn(),
  mockPrisma: {
    buyer: {
      upsert: vi.fn(),
    },
      order: {
        findMany: vi.fn(),
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

vi.mock("@/lib/services/commerceConfig", () => ({
  getCommerceLifecycleConfig: (...args: unknown[]) => mockGetCommerceLifecycleConfig(...args),
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
    mockPrisma.order.findMany.mockResolvedValue([]);
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

  it("allows admin checkout to reach payment verification path", async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: "admin-user-1", role: "ADMIN" });
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
    expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
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

  it("rejects card checkout when verified amount does not match order total", async () => {
    mockVerifyPayment.mockResolvedValue({
      gateway: "PAYSTACK",
      reference: "success-reference",
      status: "SUCCESS",
      amount: 5000,
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

    const res = await POST(buildRequest({ paymentVerificationReference: "success-reference" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("PAYMENT_AMOUNT_MISMATCH");
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

  it("rejects bank transfer proof checkout without a proof of payment upload", async () => {
    mockPrisma.buyer.upsert.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.vendor.findMany.mockResolvedValue([
      { id: "vendor-1", userId: "vendor-user-1", status: "APPROVED" },
    ]);

    const res = await POST(
      buildRequest({
        paymentMethod: "BANK_TRANSFER_PROOF",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("PROOF_OF_PAYMENT_REQUIRED");
  });

  it("rejects bank transfer proof checkout when proof amount is missing", async () => {
    const res = await POST(
      buildRequest({
        paymentMethod: "BANK_TRANSFER_PROOF",
        proofOfTransfer: {
          imageUrl: "https://cdn.example.com/receipt.jpg",
          imagePublicId: "payment-proof/receipt",
        },
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("PROOF_OF_PAYMENT_REQUIRED");
  });

  it("creates order and proof of transfer for bank transfer proof checkout", async () => {
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

    const proofCreate = vi.fn().mockResolvedValue({ id: "proof-1" });
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
      callback({
        order: {
          create: vi.fn().mockResolvedValue({
            id: "order-1",
            orderNumber: "MHH-5678",
            vendorId: "vendor-1",
            total: 6500,
            items: [],
            vendor: { id: "vendor-1", storeName: "Fresh Farm" },
          }),
        },
        proofOfTransfer: {
          create: proofCreate,
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

    const res = await POST(
      buildRequest({
        paymentMethod: "BANK_TRANSFER_PROOF",
        paymentGateway: undefined,
        paymentReference: undefined,
        paymentVerificationReference: undefined,
        proofOfTransfer: {
          imageUrl: "https://cdn.example.com/receipt.jpg",
          imagePublicId: "payment-proof/receipt",
          bankReference: "TXN-REF-123",
          amount: 6500,
        },
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.order?.id).toBe("order-1");
    expect(proofCreate).toHaveBeenCalledTimes(1);
    expect(proofCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          imageUrl: "https://cdn.example.com/receipt.jpg",
          amount: 6500,
          status: "PENDING",
        }),
      })
    );
  });
});
