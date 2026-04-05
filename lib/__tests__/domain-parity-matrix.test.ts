import { describe, expect, it } from "vitest";
import { buildNav } from "@/lib/navigation";
import { UserRole } from "@/lib/constants";
import { getRoutePolicy } from "@/lib/rbac/policies";

describe("role/domain parity matrix", () => {
  it("enforces orders scope split", () => {
    expect(getRoutePolicy("/orders")?.roles).toEqual([UserRole.BUYER]);
    expect(getRoutePolicy("/operations/orders")?.roles).toEqual([UserRole.VENDOR, UserRole.ADMIN]);
  });

  it("keeps products split discoverable", () => {
    expect(getRoutePolicy("/products")?.public).toBe(true);
    expect(getRoutePolicy("/operations/products")?.roles).toEqual([
      UserRole.VENDOR,
      UserRole.ADMIN,
    ]);
  });

  it("keeps vendors domains split by public/admin access", () => {
    expect(getRoutePolicy("/vendors")?.public).toBe(true);
    expect(getRoutePolicy("/operations/vendors")?.roles).toEqual([UserRole.ADMIN]);
  });

  it("keeps wallet, notifications, and profile route access role-safe", () => {
    expect(getRoutePolicy("/wallet")?.roles).toEqual([
      UserRole.BUYER,
      UserRole.VENDOR,
      UserRole.ADMIN,
    ]);
    expect(getRoutePolicy("/notifications")?.roles).toEqual([
      UserRole.BUYER,
      UserRole.VENDOR,
      UserRole.ADMIN,
    ]);
    expect(getRoutePolicy("/profile")?.roles).toEqual([
      UserRole.BUYER,
      UserRole.VENDOR,
      UserRole.ADMIN,
    ]);
  });

  it("keeps ads and bug-report domains split by public/admin scopes", () => {
    expect(getRoutePolicy("/advertise")?.public).toBe(true);
    expect(getRoutePolicy("/ad-application")?.public).toBe(true);
    expect(getRoutePolicy("/bug-report")?.public).toBe(true);
    expect(getRoutePolicy("/operations/ads")?.roles).toEqual([UserRole.ADMIN]);
    expect(getRoutePolicy("/operations/bug-reports")?.roles).toEqual([UserRole.ADMIN]);
  });

  it("keeps role discoverability aligned to policy boundaries", () => {
    const buyerNav = buildNav(UserRole.BUYER).map((item) => item.path);
    const vendorNav = buildNav(UserRole.VENDOR).map((item) => item.path);
    const adminNav = buildNav(UserRole.ADMIN).map((item) => item.path);

    expect(buyerNav).toContain("/orders");
    expect(buyerNav).not.toContain("/operations/orders");
    expect(vendorNav).toContain("/operations/orders");
    expect(vendorNav).not.toContain("/orders");
    expect(adminNav).toContain("/operations/orders");
    expect(adminNav).not.toContain("/orders");
    expect(vendorNav).toContain("/operations/products");
    expect(adminNav).toContain("/operations/ads");
    expect(adminNav).toContain("/operations/bug-reports");
  });
});
