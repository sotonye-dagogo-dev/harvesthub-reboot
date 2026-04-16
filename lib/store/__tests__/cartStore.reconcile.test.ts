import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "@/lib/store/cartStore";

const CART_STORAGE_KEY = "harvesthub-cart";

describe("cartStore reconcileWithCatalog", () => {
  beforeEach(() => {
    useCart.setState({ items: [], totalItems: 0, totalPrice: 0 });
    window.localStorage.removeItem(CART_STORAGE_KEY);
  });

  it("removes unavailable items and clamps stale quantities to live stock", () => {
    useCart.setState({
      items: [
        {
          productId: "active-product",
          name: "Old Name",
          price: 1000,
          image: "/old.jpg",
          vendorId: "vendor-1",
          vendorName: "Old Vendor",
          quantity: 5,
          stock: 5,
        },
        {
          productId: "inactive-product",
          name: "Inactive Product",
          price: 500,
          image: "/inactive.jpg",
          vendorId: "vendor-2",
          vendorName: "Vendor 2",
          quantity: 1,
          stock: 3,
        },
        {
          productId: "missing-product",
          name: "Missing Product",
          price: 200,
          image: "/missing.jpg",
          vendorId: "vendor-3",
          vendorName: "Vendor 3",
          quantity: 2,
          stock: 2,
        },
      ],
      totalItems: 8,
      totalPrice: 6200,
    });

    const summary = useCart.getState().reconcileWithCatalog([
      {
        id: "active-product",
        isActive: true,
        name: "Fresh Name",
        price: 1200,
        stock: 2,
        vendorId: "vendor-live",
        vendor: { storeName: "Live Vendor" },
        images: ["/fresh.jpg"],
      },
      {
        id: "inactive-product",
        isActive: false,
      },
    ]);

    expect(summary).toEqual({ removedCount: 2, adjustedCount: 1 });
    expect(useCart.getState().items).toEqual([
      expect.objectContaining({
        productId: "active-product",
        name: "Fresh Name",
        price: 1200,
        image: "/fresh.jpg",
        vendorId: "vendor-live",
        vendorName: "Live Vendor",
        quantity: 2,
        stock: 2,
      }),
    ]);
    expect(useCart.getState().totalItems).toBe(2);
    expect(useCart.getState().totalPrice).toBe(2400);
  });

  it("is a no-op when catalog payload is empty", () => {
    useCart.setState({
      items: [
        {
          productId: "product-1",
          name: "Product 1",
          price: 100,
          image: "/image.jpg",
          vendorId: "vendor-1",
          vendorName: "Vendor 1",
          quantity: 1,
          stock: 3,
        },
      ],
      totalItems: 1,
      totalPrice: 100,
    });

    const summary = useCart.getState().reconcileWithCatalog([]);

    expect(summary).toEqual({ removedCount: 0, adjustedCount: 0 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().totalItems).toBe(1);
    expect(useCart.getState().totalPrice).toBe(100);
  });
});
