import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/payments/initialize/route";

const {
  getCurrentUserMock,
  rateLimitByIPMock,
  rateLimitByUserMock,
  initializePaymentMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  rateLimitByIPMock: vi.fn(),
  rateLimitByUserMock: vi.fn(),
  initializePaymentMock: vi.fn(),
}));

vi.mock("@/lib/utils/auth", () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

vi.mock("@/lib/middleware/rate-limit", () => ({
  rateLimitByIP: (...args: unknown[]) => rateLimitByIPMock(...args),
  rateLimitByUser: (...args: unknown[]) => rateLimitByUserMock(...args),
  getRateLimitResponse: () => new Response(JSON.stringify({ success: false }), { status: 429 }),
}));

vi.mock("@/lib/services/payments", () => ({
  initializePayment: (...args: unknown[]) => initializePaymentMock(...args),
}));

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payments/initialize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(null);
    rateLimitByIPMock.mockResolvedValue({ success: true });
    rateLimitByUserMock.mockResolvedValue({ success: true });
  });

  it("maps Paystack IP restriction errors to explicit app code and diagnostics", async () => {
    initializePaymentMock.mockRejectedValue(
      new Error("Your IP address is not allowed to make this call")
    );

    const res = await POST(
      buildRequest({
        gateway: "PAYSTACK",
        amount: 1000,
        email: "buyer@example.com",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.code).toBe("PAYMENT_PROVIDER_IP_NOT_ALLOWED");
    expect(json.diagnostics?.operatorPath).toBe("/operations/settings");
  });

  it("returns success note that keeps amount contract explicit", async () => {
    initializePaymentMock.mockResolvedValue({
      gateway: "PAYSTACK",
      status: "INITIALIZED",
      reference: "ref-1",
      verificationReference: "ref-1",
      authorizationUrl: "https://checkout.paystack.com/ref-1",
      accessCode: "access",
      message: "ok",
      amount: 1000,
      currency: "NGN",
    });

    const res = await POST(
      buildRequest({
        gateway: "PAYSTACK",
        amount: 1000,
        email: "buyer@example.com",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.note).toContain("Amount was supplied by the app request payload");
  });
});
