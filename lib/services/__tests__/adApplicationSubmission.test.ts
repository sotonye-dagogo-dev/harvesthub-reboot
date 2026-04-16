import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { processAdApplicationSubmission } from "@/lib/services/adApplicationSubmission";

const {
  dbMock,
  verifyPaymentMock,
  acquireIdempotencyGuardMock,
  getIdempotencyReplayResponseMock,
  setIdempotencyReplayResponseMock,
  buildPayloadFingerprintMock,
} = vi.hoisted(() => ({
  dbMock: {
    adRateConfig: { getActive: vi.fn() },
    adApplications: { create: vi.fn() },
  },
  verifyPaymentMock: vi.fn(),
  acquireIdempotencyGuardMock: vi.fn(),
  getIdempotencyReplayResponseMock: vi.fn(),
  setIdempotencyReplayResponseMock: vi.fn(),
  buildPayloadFingerprintMock: vi.fn(),
}));

vi.mock("@/lib/data/database", () => ({
  db: dbMock,
}));

vi.mock("@/lib/services/payments", () => ({
  verifyPayment: (...args: unknown[]) => verifyPaymentMock(...args),
}));

vi.mock("@/lib/utils/idempotency", () => ({
  acquireIdempotencyGuard: (...args: unknown[]) => acquireIdempotencyGuardMock(...args),
  buildPayloadFingerprint: (...args: unknown[]) => buildPayloadFingerprintMock(...args),
  readIdempotencyKeyHeader: () => null,
  getIdempotencyReplayResponse: (...args: unknown[]) => getIdempotencyReplayResponseMock(...args),
  setIdempotencyReplayResponse: (...args: unknown[]) => setIdempotencyReplayResponseMock(...args),
}));

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/ad-applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "+2348012345678",
    title: "Ad Campaign",
    description: "Campaign description",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/banner.jpg",
    paymentMethod: "CARD",
    amountPaid: 3000,
    paymentGateway: "PAYSTACK",
    paymentReference: "pay-ref-123",
    paymentVerificationReference: "pay-ref-verify-123",
    durationType: "DAILY",
    durationValue: 1,
    ...overrides,
  };
}

describe("ad application submission idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.adRateConfig.getActive.mockResolvedValue({ hourlyRate: 1000, dailyRate: 3000 });
    verifyPaymentMock.mockResolvedValue({
      status: "SUCCESS",
      gateway: "PAYSTACK",
      reference: "pay-ref-verify-123",
      amount: 3000,
      currency: "NGN",
      message: "ok",
    });
    buildPayloadFingerprintMock.mockReturnValue("fingerprint-123");
  });

  it("returns replayed response without writing duplicate ad application", async () => {
    acquireIdempotencyGuardMock.mockResolvedValue({ acquired: false, mode: "redis" });
    getIdempotencyReplayResponseMock.mockResolvedValue({
      status: 201,
      body: { application: { id: "app-1" }, expectedAmount: 3000 },
    });

    const res = await processAdApplicationSubmission(buildRequest(buildPayload()));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.idempotency?.replayed).toBe(true);
    expect(dbMock.adApplications.create).not.toHaveBeenCalled();
  });

  it("creates once and stores replay payload when request acquires guard", async () => {
    acquireIdempotencyGuardMock.mockResolvedValue({ acquired: true, mode: "redis" });
    dbMock.adApplications.create.mockResolvedValue({ id: "app-2" });

    const res = await processAdApplicationSubmission(buildRequest(buildPayload()));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.idempotency?.replayed).toBe(false);
    expect(dbMock.adApplications.create).toHaveBeenCalledTimes(1);
    expect(setIdempotencyReplayResponseMock).toHaveBeenCalledTimes(1);
  });
});
