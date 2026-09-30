import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import { ServiceCategory, ServiceLocation, VendorCategory } from "@/lib/constants";

const { mockPrisma, mockHashPassword, mockSendVerifyEmail, mockRateLimitStrict } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn() },
    wallet: { create: vi.fn() },
    buyer: { create: vi.fn() },
    vendor: { create: vi.fn() },
    userMilestone: { create: vi.fn() },
    commissionConfig: { findUnique: vi.fn() },
    commerceLifecycleConfig: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  mockHashPassword: vi.fn(),
  mockSendVerifyEmail: vi.fn(),
  mockRateLimitStrict: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/utils/password", () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: vi.fn(),
}));
vi.mock("@/lib/services/email", () => ({
  sendVerifyEmail: (...args: unknown[]) => mockSendVerifyEmail(...args),
}));
vi.mock("@/lib/middleware/rate-limit", () => ({
  rateLimitStrict: (...args: unknown[]) => mockRateLimitStrict(...args),
  getRateLimitResponse: vi.fn(() => new Response("rate limited", { status: 429 })),
}));

const makeTx = () => ({
  user: { count: vi.fn().mockResolvedValue(0), create: vi.fn().mockResolvedValue({ id: "u1" }) },
  wallet: { create: vi.fn().mockResolvedValue({}) },
  buyer: { create: vi.fn().mockResolvedValue({}) },
  vendor: { create: vi.fn().mockResolvedValue({ id: "v1" }) },
  userMilestone: { create: vi.fn().mockResolvedValue({}) },
  commissionConfig: { findUnique: vi.fn().mockResolvedValue(null) },
  commerceLifecycleConfig: { findUnique: vi.fn().mockResolvedValue(null) },
});

type Tx = ReturnType<typeof makeTx>;
let mockTx: Tx;

const verificationDocuments = [
  { documentType: "ID", url: "https://res.cloudinary.com/demo/image/upload/id.png" },
  { documentType: "BUSINESS_REGISTRATION", url: "https://res.cloudinary.com/demo/image/upload/reg.pdf" },
  { documentType: "UTILITY_BILL", url: "https://res.cloudinary.com/demo/image/upload/bill.pdf" },
];

const registerBody = (overrides: Record<string, unknown> = {}) => ({
  email: `vendor${Math.random().toString(36).slice(2)}@example.com`,
  password: "Sup3rSecret!",
  firstName: "Ada",
  lastName: "Obi",
  phoneNumber: "08012345678",
  role: "VENDOR",
  agreeToTerms: true,
  storeName: "Ada Studio",
  category: VendorCategory.SERVICES,
  whatsappNumber: "08012345678",
  campus: "IKEJA",
  businessAddress: "12 Example Road",
  verificationDocuments,
  serviceCategory: ServiceCategory.CREATIVE,
  serviceLocation: ServiceLocation.REMOTE,
  ...overrides,
});

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockHashPassword.mockResolvedValue("hashed");
  mockSendVerifyEmail.mockResolvedValue({ success: true });
  mockRateLimitStrict.mockResolvedValue({ success: true });
  mockTx = makeTx();
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx));
});

describe("POST /api/auth/register — service provider fields", () => {
  it("persists serviceCategory and serviceLocation on the vendor row", async () => {
    const res = await POST(post(registerBody()));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockTx.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceCategory: ServiceCategory.CREATIVE,
          serviceLocation: ServiceLocation.REMOTE,
        }),
      }),
    );
  });

  it("rejects a SERVICES vendor that omits service fields", async () => {
    const res = await POST(post(registerBody({ serviceCategory: "", serviceLocation: "" })));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("serviceCategory");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an invalid service category value", async () => {
    const res = await POST(post(registerBody({ serviceCategory: "NOT_A_CATEGORY" })));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid service category");
  });

  it("rejects an invalid service location value", async () => {
    const res = await POST(post(registerBody({ serviceLocation: "NOWHERE" })));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid service location");
  });

  it("leaves service fields null for non-services vendors", async () => {
    const res = await POST(
      post(registerBody({ category: VendorCategory.GROCERY_FOOD, serviceCategory: "", serviceLocation: "" })),
    );

    expect(res.status).toBe(201);
    expect(mockTx.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceCategory: null, serviceLocation: null }),
      }),
    );
  });

  it("keeps buyer registration behaviour unchanged", async () => {
    const res = await POST(
      post({ email: `buyer${Date.now()}@example.com`, password: "Sup3rSecret!", firstName: "Bea", lastName: "Uyi", phoneNumber: "08012345678", role: "BUYER", agreeToTerms: true }),
    );

    expect(res.status).toBe(201);
    expect(mockTx.buyer.create).toHaveBeenCalled();
    expect(mockTx.vendor.create).not.toHaveBeenCalled();
  });
});
