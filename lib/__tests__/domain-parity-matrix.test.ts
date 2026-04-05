import { describe, expect, it } from "vitest";
import { buildNav } from "@/lib/navigation";
import { UserRole } from "@/lib/constants";
import { getRoutePolicy } from "@/lib/rbac/policies";
import { routeConfig } from "@/lib/rbac/routeConfig";

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
    const walletRoles = routeConfig.find((route) => route.path === "/wallet")?.roles;
    const notificationsRoles = routeConfig.find((route) => route.path === "/notifications")?.roles;
    const profileRoles = routeConfig.find((route) => route.path === "/profile")?.roles;

    expect(getRoutePolicy("/wallet")?.roles).toEqual(walletRoles);
    expect(getRoutePolicy("/notifications")?.roles).toEqual(notificationsRoles);
    expect(getRoutePolicy("/profile")?.roles).toEqual(profileRoles);
  });

  it("keeps ads and bug-report domains split by public/admin scopes", () => {
    expect(getRoutePolicy("/advertise")?.public).toBe(true);
    expect(getRoutePolicy("/ad-application")?.public).toBe(true);
    expect(getRoutePolicy("/bug-report")?.public).toBe(true);
    expect(getRoutePolicy("/operations/ads")?.roles).toEqual(
      routeConfig.find((route) => route.path === "/operations/ads")?.roles
    );
    expect(getRoutePolicy("/operations/bug-reports")?.roles).toEqual(
      routeConfig.find((route) => route.path === "/operations/bug-reports")?.roles
    );
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
