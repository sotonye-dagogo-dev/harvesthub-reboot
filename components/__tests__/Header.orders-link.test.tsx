import { describe, expect, it } from "vitest";
import { resolveOrdersLink } from "@/components/layout/Header";

describe("Header orders link resolution", () => {
  it("routes to /orders", () => {
    expect(resolveOrdersLink()).toBe("/orders");
  });
});
