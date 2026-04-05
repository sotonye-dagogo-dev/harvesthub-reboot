import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { middleware } from "@/middleware";

vi.mock("@/lib/rbac/policies", () => ({
  getRoutePolicy: () => ({ public: true }),
}));

vi.mock("@/lib/utils/jwt", () => ({
  verifyAccessToken: vi.fn(),
}));

function makeRequest(pathname: string) {
  const url = new URL(`https://example.com${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url.toString()),
    },
    url: url.toString(),
    cookies: {
      get: () => undefined,
    },
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("middleware legacy orders redirects", () => {
  it("redirects /admin/orders to /operations/orders", async () => {
    const res = await middleware(makeRequest("/admin/orders"));
    expect(res?.headers.get("location")).toContain("/operations/orders");
  });

  it("redirects /vendor/orders to /operations/orders", async () => {
    const res = await middleware(makeRequest("/vendor/orders"));
    expect(res?.headers.get("location")).toContain("/operations/orders");
  });
});
