import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPage from "@/app/products/page";

const productsContentSpy = vi.fn();

vi.mock("@/components/features/ProductsContent", () => ({
  default: (props: any) => {
    productsContentSpy(props);
    return <div data-testid="products-content" />;
  },
}));

vi.mock("@/lib/data/dataFetchers", () => ({
  getProducts: vi.fn(),
  getVendors: vi.fn(),
}));

import { getProducts, getVendors } from "@/lib/data/dataFetchers";

describe("products page query hydration contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProducts).mockResolvedValue([] as any[]);
    vi.mocked(getVendors).mockResolvedValue([] as any[]);
  });

  it("passes parsed discovery query state into ProductsContent", async () => {
    const page = await ProductsPage({
      searchParams: Promise.resolve({
        category: "electronics",
        sort: "trending",
        search: "rice",
      }),
    });

    render(page);

    expect(productsContentSpy).toHaveBeenCalledTimes(1);
    const firstCall = productsContentSpy.mock.calls[0]?.[0];
    expect(firstCall).toBeDefined();

    expect(firstCall.initialQueryState.search).toBe("rice");
    expect(firstCall.initialQueryState.sort).toBe("trending");
    expect(firstCall.initialQueryState.categories).toEqual(["ELECTRONICS"]);
    expect(screen.getByTestId("products-content")).toBeInTheDocument();
  });
});
