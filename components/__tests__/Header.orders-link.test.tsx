import { describe, expect, it } from "vitest";
import { resolveOrdersLink } from "@/components/layout/Header";

describe("Header orders link resolution", () => {
  it("routes buyers to /orders", () => {
    expect(resolveOrdersLink("BUYER")).toBe("/orders");
  });

  it("routes vendors to /orders", () => {
    expect(resolveOrdersLink("VENDOR")).toBe("/orders");
  });

  it("routes admins to /orders", () => {
    expect(resolveOrdersLink("ADMIN")).toBe("/orders");
  });
});
