import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utils/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/data/dataFetchers", () => ({
  getBuyerByUserId: vi.fn(),
  getOrdersByBuyerId: vi.fn(),
  getOrdersByVendorId: vi.fn(),
  getVendorByUserId: vi.fn(),
}));

vi.mock("@/components/ui/RoleAwareFeatureRenderer", () => ({
  RoleAwareFeatureRenderer: ({ children }: { children: any }) => <>{children}</>,
}));

vi.mock("@/components/features/OrderCard", () => ({
  OrderCard: ({ orderNumber }: { orderNumber: string }) => <div>{orderNumber}</div>,
}));

import OrdersPage from "@/app/orders/page";
import { UserRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/utils/auth";
import {
  getBuyerByUserId,
  getOrdersByBuyerId,
  getOrdersByVendorId,
  getVendorByUserId,
} from "@/lib/data/dataFetchers";

describe("OrdersPage admin access", () => {
  it("prefers buyer orders for admin when admin has buyer profile", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: "admin-user-1",
      role: UserRole.ADMIN,
    } as any);
    vi.mocked(getBuyerByUserId).mockResolvedValue({ id: "buyer-1" } as any);
    vi.mocked(getOrdersByBuyerId).mockResolvedValue([
      {
        id: "order-1",
        orderNumber: "ORD-1001",
        status: "PENDING",
        total: 1000,
        items: [],
        deliveryMethod: "DELIVERY",
        createdAt: new Date().toISOString(),
      },
    ] as any);
    vi.mocked(getVendorByUserId).mockResolvedValue({ id: "vendor-1" } as any);

    const page = await OrdersPage();

    expect(getBuyerByUserId).toHaveBeenCalledWith("admin-user-1");
    expect(getOrdersByBuyerId).toHaveBeenCalledWith("buyer-1");
    expect(getVendorByUserId).not.toHaveBeenCalled();
    expect(getOrdersByVendorId).not.toHaveBeenCalled();
    expect(page).toBeTruthy();
  });

  it("falls back to vendor orders for admin without buyer orders", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: "admin-user-2",
      role: UserRole.ADMIN,
    } as any);
    vi.mocked(getBuyerByUserId).mockResolvedValue({ id: "buyer-2" } as any);
    vi.mocked(getOrdersByBuyerId).mockResolvedValue([] as any);
    vi.mocked(getVendorByUserId).mockResolvedValue({ id: "vendor-2" } as any);
    vi.mocked(getOrdersByVendorId).mockResolvedValue([
      {
        id: "order-2",
        orderNumber: "ORD-1002",
        status: "CONFIRMED",
        total: 2500,
        items: [],
        deliveryMethod: "PICKUP",
        createdAt: new Date().toISOString(),
      },
    ] as any);

    const page = await OrdersPage();

    expect(getBuyerByUserId).toHaveBeenCalledWith("admin-user-2");
    expect(getOrdersByBuyerId).toHaveBeenCalledWith("buyer-2");
    expect(getVendorByUserId).toHaveBeenCalledWith("admin-user-2");
    expect(getOrdersByVendorId).toHaveBeenCalledWith("vendor-2");
    expect(page).toBeTruthy();
  });
});
