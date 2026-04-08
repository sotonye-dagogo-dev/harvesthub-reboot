import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

const homeContentSpy = vi.fn();

vi.mock("@/app/components/HomeContent", () => ({
  HomeContent: (props: any) => {
    homeContentSpy(props);
    return <div data-testid="home-content-rendered" />;
  },
}));

vi.mock("@/lib/data/dataFetchers", () => ({
  getHeroBanners: vi.fn(),
  getProducts: vi.fn(),
  getVendors: vi.fn(),
}));

import { getHeroBanners, getProducts, getVendors } from "@/lib/data/dataFetchers";

describe("Home page banner composition contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses hero banner feed and passes result to HomeContent", async () => {
    const heroBanners = [{ id: "hero-1", title: "Hero Banner" }];
    const products = [{ id: "product-1", name: "Rice" }];
    const vendors = [{ id: "vendor-1", storeName: "Harvest Store" }];

    vi.mocked(getHeroBanners).mockResolvedValue(heroBanners as any);
    vi.mocked(getProducts).mockResolvedValue(products as any);
    vi.mocked(getVendors).mockResolvedValue(vendors as any);

    const page = await HomePage();
    render(page);

    expect(getHeroBanners).toHaveBeenCalledTimes(1);
    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(getVendors).toHaveBeenCalledTimes(1);

    expect(homeContentSpy).toHaveBeenCalledWith({
      banners: heroBanners,
      products,
      vendors,
    });
    expect(screen.getByTestId("home-content-rendered")).toBeInTheDocument();
  });
});
