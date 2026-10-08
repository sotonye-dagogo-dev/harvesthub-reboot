import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/products/route";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";

const { mockGetCurrentUser, mockPrisma, mockProductDb, mockVendorDb, mockCacheGet, mockCacheSet } =
  vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockPrisma: {
      vendor: { findUnique: vi.fn(), update: vi.fn() },
      product: { findUnique: vi.fn(), update: vi.fn() },
    },
    mockProductDb: { create: vi.fn(), findAll: vi.fn(), count: vi.fn() },
    mockVendorDb: { findByUserId: vi.fn(), findById: vi.fn() },
    mockCacheGet: vi.fn(),
    mockCacheSet: vi.fn(),
  }));

vi.mock("@/lib/utils/auth", () => ({ getCurrentUser: () => mockGetCurrentUser() }));
vi.mock("@/lib/middleware/rate-limit", () => ({
  rateLimitByIP: vi.fn(async () => ({ success: true })),
  rateLimitByUser: vi.fn(async () => ({ success: true })),
  getRateLimitResponse: vi.fn(() => new Response("rate limited", { status: 429 })),
}));
vi.mock("@/lib/cache/redis", () => ({
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
  cacheInvalidatePattern: vi.fn(async () => undefined),
  cacheInvalidate: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/data/prismaAdapter", () => ({
  default: { productDb: mockProductDb, vendorDb: mockVendorDb },
}));

const serviceDetails = {
  deliveryMode: "DIGITAL",
  description: "A professional logo for your brand.",
  packages: [
    {
      tier: "BASIC",
      title: "Logo design",
      description: "Three concepts",
      price: 15000,
      deliveryDays: 3,
      revisions: 2,
      extras: [],
    },
  ],
  requirementFields: [],
  media: { images: ["https://res.cloudinary.com/demo/image/upload/logo.png"], documents: [], video: null },
};

const baseBody = {
  name: "Professional logo design",
  description: "I will design a professional logo for your brand.",
  category: "CREATIVE",
  mainImage: "https://res.cloudinary.com/demo/image/upload/logo.png",
  images: ["https://res.cloudinary.com/demo/image/upload/logo.png"],
};

const postJson = (body: unknown) =>
  new NextRequest("http://localhost/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue({ userId: "vendor-user-1", role: "VENDOR" });
  mockCacheGet.mockResolvedValue(null);
  mockCacheSet.mockResolvedValue(undefined);
  mockVendorDb.findByUserId.mockResolvedValue({ id: "vendor-1" });
  mockVendorDb.findById.mockResolvedValue({ id: "vendor-1" });
  mockPrisma.vendor.findUnique.mockResolvedValue({ totalProducts: 3 });
  mockPrisma.vendor.update.mockResolvedValue({});
  mockProductDb.create.mockImplementation(async (args: unknown) => args);
  mockProductDb.findAll.mockResolvedValue([]);
  mockProductDb.count.mockResolvedValue(0);
});

describe("POST /api/products — service listings", () => {
  it("defaults price from the base package and stock to the service sentinel", async () => {
    const res = await POST(postJson({ ...baseBody, listingType: "SERVICE", serviceDetails }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockProductDb.create).toHaveBeenCalledWith(
      expect.objectContaining({
        listingType: "SERVICE",
        price: 15000,
        stock: SERVICE_UNLIMITED_STOCK,
        serviceDetails: expect.objectContaining({ deliveryMode: "DIGITAL" }),
      }),
    );
  });

  it("honours an explicitly provided price", async () => {
    const res = await POST(postJson({ ...baseBody, listingType: "SERVICE", price: 20000, serviceDetails }));
    expect(res.status).toBe(201);
    expect(mockProductDb.create).toHaveBeenCalledWith(expect.objectContaining({ price: 20000 }));
  });

  it("rejects invalid serviceDetails", async () => {
    const res = await POST(
      postJson({ ...baseBody, listingType: "SERVICE", serviceDetails: { deliveryMode: "DIGITAL", geo: { address: "12 Road" } } }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("SERVICE_DETAILS_INVALID");
    expect(mockProductDb.create).not.toHaveBeenCalled();
  });

  it("rejects a service title over the limit", async () => {
    const res = await POST(
      postJson({ ...baseBody, name: "x".repeat(81), listingType: "SERVICE", serviceDetails }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("SERVICE_TITLE_TOO_LONG");
  });

  it("keeps product behaviour unchanged", async () => {
    const res = await POST(postJson({ ...baseBody, listingType: "PRODUCT", price: 5000, stock: 7 }));
    expect(res.status).toBe(201);
    expect(mockProductDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ listingType: "PRODUCT", price: 5000, stock: 7, serviceDetails: null }),
    );
  });
});

describe("GET /api/products — draft visibility", () => {
  it("defaults to active rows only so drafts never reach a public list", async () => {
    const res = await GET(new NextRequest("http://localhost/api/products"));
    expect(res.status).toBe(200);
    expect(mockProductDb.findAll).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    expect(mockProductDb.count).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });

  it("403s includeInactive for guests", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/products?includeInactive=true"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toBe("INCLUDE_INACTIVE_FORBIDDEN");
    expect(mockProductDb.findAll).not.toHaveBeenCalled();
  });

  it("lets a vendor see their own drafts and scopes the query to them", async () => {
    const res = await GET(new NextRequest("http://localhost/api/products?includeInactive=true&limit=100"));

    expect(res.status).toBe(200);
    expect(mockProductDb.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ vendorId: "vendor-1", isActive: undefined }),
    );
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it("lets an admin see every draft", async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
    const res = await GET(new NextRequest("http://localhost/api/products?includeInactive=true"));

    expect(res.status).toBe(200);
    const filter = (mockProductDb.findAll.mock.calls[0] ?? [])[0] as Record<string, unknown>;
    expect(filter.isActive).toBeUndefined();
    expect(filter.vendorId).toBeFalsy();
  });

  it("stops a vendor from requesting another vendor's drafts", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/products?includeInactive=true&vendorId=someone-else"),
    );
    expect(res.status).toBe(403);
    expect(mockProductDb.findAll).not.toHaveBeenCalled();
  });
});
