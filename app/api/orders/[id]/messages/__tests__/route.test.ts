import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/orders/[id]/messages/route";

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
    order: { findUnique: vi.fn() },
    buyer: { findUnique: vi.fn() },
    vendor: { findUnique: vi.fn() },
    orderMessage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
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

const context = { params: Promise.resolve({ id: "order-1" }) };

function getRequest(search = "") {
  return new NextRequest(`http://localhost/api/orders/order-1/messages${search}`);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/orders/order-1/messages", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("app/api/orders/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitByUser.mockResolvedValue({ success: true });
    mockGetRateLimitResponse.mockReturnValue(
      NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 }),
    );
    mockGetCurrentUser.mockResolvedValue({ userId: "user-1", role: "BUYER" });
    mockPrisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      buyerId: "buyer-1",
      vendorId: "vendor-1",
    });
  });

  it("rejects a non-participant with NOT_ORDER_PARTICIPANT", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "someone-else" });
    mockPrisma.vendor.findUnique.mockResolvedValue(null);

    const res = await GET(getRequest(), context);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json).toMatchObject({
      success: false,
      code: "NOT_ORDER_PARTICIPANT",
    });
    expect(typeof json.error).toBe("string");
    expect(mockPrisma.orderMessage.findMany).not.toHaveBeenCalled();
  });

  it("lets the buyer read the thread, newest-limited and returned oldest first", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.orderMessage.findMany.mockResolvedValue([
      { id: "msg-2", body: "second", createdAt: new Date("2026-10-02T10:00:00Z") },
      { id: "msg-1", body: "first", createdAt: new Date("2026-10-01T10:00:00Z") },
    ]);

    const res = await GET(getRequest("?limit=2"), context);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.messages.map((entry: { id: string }) => entry.id)).toEqual(["msg-1", "msg-2"]);
    expect(mockPrisma.orderMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2, where: expect.objectContaining({ orderId: "order-1" }) }),
    );
  });

  it("applies the ?after= cursor when it resolves", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.orderMessage.findFirst.mockResolvedValue({
      id: "msg-1",
      createdAt: new Date("2026-10-01T10:00:00Z"),
    });
    mockPrisma.orderMessage.findMany.mockResolvedValue([]);

    const res = await GET(getRequest("?after=msg-1"), context);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.messages).toEqual([]);
    const call = mockPrisma.orderMessage.findMany.mock.calls[0]?.[0] as
      | { where?: { OR?: unknown } }
      | undefined;
    expect(call?.where?.OR).toBeDefined();
  });

  it("rejects an empty message body", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });

    const res = await POST(postRequest({ body: "   " }), context);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toMatchObject({ success: false, code: "MESSAGE_BODY_INVALID" });
    expect(mockPrisma.orderMessage.create).not.toHaveBeenCalled();
  });

  it("rejects attachments that are not Cloudinary-hosted", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });

    const res = await POST(
      postRequest({
        body: "Here is the file",
        attachments: [{ url: "https://evil.example.com/file.png", name: "file.png" }],
      }),
      context,
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toMatchObject({ success: false, code: "ATTACHMENT_NOT_CLOUDINARY" });
    expect(mockPrisma.orderMessage.create).not.toHaveBeenCalled();
  });

  it("creates a message and answers 201 for a valid participant", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });
    mockPrisma.orderMessage.create.mockImplementation(
      async (args: { data: Record<string, unknown> }) => ({
        id: "msg-3",
        ...args.data,
        createdAt: new Date("2026-10-03T10:00:00Z"),
      }),
    );

    const res = await POST(
      postRequest({
        body: "Any update?",
        attachments: [
          {
            url: "https://res.cloudinary.com/demo/image/upload/sample.png",
            name: "sample.png",
            type: "image/png",
          },
        ],
      }),
      context,
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.message).toMatchObject({
      id: "msg-3",
      body: "Any update?",
      attachmentUrl: "https://res.cloudinary.com/demo/image/upload/sample.png",
      attachmentName: "sample.png",
    });
    expect(mockPrisma.orderMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        senderId: "user-1",
        senderRole: "BUYER",
        body: "Any update?",
      }),
    });
  });

  it("rejects a message body over the 2000 character limit", async () => {
    mockPrisma.buyer.findUnique.mockResolvedValue({ id: "buyer-1" });

    const res = await POST(postRequest({ body: "x".repeat(2001) }), context);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("MESSAGE_BODY_INVALID");
  });
});
