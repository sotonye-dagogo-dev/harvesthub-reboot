import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireIdempotencyGuard,
  buildPayloadFingerprint,
  readIdempotencyKeyHeader,
} from "@/lib/utils/idempotency";

const { mockCacheAcquireIdempotencyKey, mockCacheGet, mockCacheSet } = vi.hoisted(() => ({
  mockCacheAcquireIdempotencyKey: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
}));

vi.mock("@/lib/cache/redis", () => ({
  cacheAcquireIdempotencyKey: (...args: unknown[]) => mockCacheAcquireIdempotencyKey(...args),
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
}));

describe("idempotency utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds deterministic payload fingerprints", () => {
    const one = buildPayloadFingerprint({ a: 1, b: "two" });
    const two = buildPayloadFingerprint({ b: "two", a: 1 });
    expect(one).toBe(two);
  });

  it("reads idempotency key headers in priority order", () => {
    const headers = new Headers();
    headers.set("x-idempotency-key", " req-123 ");
    expect(readIdempotencyKeyHeader(headers)).toBe("req-123");
  });

  it("falls back to local memory guard when redis idempotency is unavailable", async () => {
    mockCacheAcquireIdempotencyKey.mockResolvedValue("unavailable");

    const first = await acquireIdempotencyGuard({
      scope: "test",
      key: "abc",
      ttlSeconds: 60,
    });
    const second = await acquireIdempotencyGuard({
      scope: "test",
      key: "abc",
      ttlSeconds: 60,
    });

    expect(first).toMatchObject({ acquired: true, mode: "local-memory" });
    expect(second).toMatchObject({ acquired: false, mode: "local-memory" });
  });
});
