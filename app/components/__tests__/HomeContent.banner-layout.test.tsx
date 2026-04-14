import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "@/app/components/HomeContent";

vi.mock("@/components/features", () => ({
  BannerCarousel: () => <div data-testid="hero-carousel" />,
  ProductCard: () => <div data-testid="product-card" />,
  CategoryNav: () => <div data-testid="category-nav" />,
  VendorCard: () => <div data-testid="vendor-card" />,
}));

vi.mock("@/lib/store/cartStore", () => ({
  useCart: () => ({
    addItem: vi.fn(),
  }),
}));

vi.mock("@/lib/store/favoritesStore", () => ({
  useFavorites: () => ({
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}));

vi.mock("@/lib/hooks/useGuestGuard", () => ({
  useGuestGuard: () => ({
    requireAuth: () => true,
  }),
}));

vi.mock("@/lib/utils/format", () => ({
  formatVendorCategory: (value: string) => value,
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => ({
    success: vi.fn(),
  }),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: () => ({
    data: null,
    isRefreshing: false,
    error: null,
  }),
}));

function buildBanner(id: string, position: "HERO" | "SIDEBAR") {
  const now = new Date();
  return {
    id,
    title: `${position} banner ${id}`,
    subtitle: null,
    description: null,
    imageUrl: "/banner.jpg",
    linkUrl: null,
    actions: null,
    position,
    theme: "BUSINESS",
    accentColor: null,
    details: null,
    knowMoreLabel: null,
    isActive: true,
    startDate: now,
    endDate: null,
    displayOrder: 0,
    targetAudience: null,
    clickCount: 0,
    impressionCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: "admin-user",
  } as any;
}

describe("HomeContent banner layout contract", () => {
  it("uses compact square sidebar tiles and denser grid when hero banners are present", () => {
    const banners = [
      buildBanner("hero-1", "HERO"),
      buildBanner("side-1", "SIDEBAR"),
      buildBanner("side-2", "SIDEBAR"),
      buildBanner("side-3", "SIDEBAR"),
      buildBanner("side-4", "SIDEBAR"),
      buildBanner("side-5", "SIDEBAR"),
    ];

    render(<HomeContent banners={banners} products={[]} vendors={[]} />);

    const grid = screen.getByTestId("sidebar-banner-grid");
    expect(grid.className).toContain("lg:grid-cols-2");

    const tiles = screen.getAllByTestId("sidebar-banner-tile");
    expect(tiles.length).toBe(5);
    tiles.forEach((tile) => {
      expect(tile.innerHTML).toContain("aspect-square");
    });
  });
});
