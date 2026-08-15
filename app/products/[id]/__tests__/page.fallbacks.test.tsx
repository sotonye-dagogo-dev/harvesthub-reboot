import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("next/headers", () => ({
  headers: () => ({ get: () => null }),
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => ({
    message: {},
    notify: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

import ProductDetailPage from "@/app/products/[id]/page";

describe("ProductDetailPage fallbacks", () => {
  beforeEach(() => {
    prismaMock.product.findUnique.mockReset();
    prismaMock.product.findMany.mockReset();
  });

  it("renders safely when vendor/media/review fields are sparse", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "product-1",
      name: "",
      description: null,
      price: Number.NaN,
      discount: Number.NaN,
      images: null,
      stock: Number.NaN,
      isFeatured: false,
      listingType: null,
      category: null,
      vendorId: "",
      vendor: null,
      reviews: null,
    });

    prismaMock.product.findMany.mockResolvedValue([]);

    const ui = await ProductDetailPage({ params: Promise.resolve({ id: "product-1" }) });
    render(ui);

    expect(screen.getByRole("heading", { level: 1, name: "Product" })).toBeInTheDocument();
    expect(screen.getByText(/Sold by/i).textContent).toContain("Vendor");
    expect(screen.getByText(/Stock:/)).toHaveTextContent("Out of stock");
    expect(screen.getByText("No description available for this product yet.")).toBeInTheDocument();
  });
});
