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
import { getBuyerByUserId, getOrdersByVendorId, getVendorByUserId } from "@/lib/data/dataFetchers";

describe("OrdersPage admin access", () => {
  it("renders admin orders from vendor-scoped query without redirect", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: "admin-user-1",
      role: UserRole.ADMIN,
    } as any);
    vi.mocked(getVendorByUserId).mockResolvedValue({ id: "vendor-1" } as any);
    vi.mocked(getOrdersByVendorId).mockResolvedValue([
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

    const page = await OrdersPage();

    expect(getBuyerByUserId).not.toHaveBeenCalled();
    expect(getVendorByUserId).toHaveBeenCalledWith("admin-user-1");
    expect(getOrdersByVendorId).toHaveBeenCalledWith("vendor-1");
    expect(page).toBeTruthy();
  });
});
