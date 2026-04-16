import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  it("uses mobile horizontal rail and desktop bounded sidebar grid when hero banners are present", () => {
    const banners = [
      buildBanner("hero-1", "HERO"),
      buildBanner("side-1", "SIDEBAR"),
      buildBanner("side-2", "SIDEBAR"),
      buildBanner("side-3", "SIDEBAR"),
      buildBanner("side-4", "SIDEBAR"),
      buildBanner("side-5", "SIDEBAR"),
    ];

    render(<HomeContent banners={banners} products={[]} vendors={[]} />);

    const mobileRail = screen.getByTestId("sidebar-banner-rail-mobile");
    expect(mobileRail.className).toContain("overflow-x-auto");
    expect(mobileRail.className).toContain("gap-1.5");

    const grid = screen.getByTestId("sidebar-banner-grid");
    expect(grid.className).toContain("max-h-[26rem]");
    expect(grid.className).toContain("overflow-y-auto");
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("gap-1.5");

    const mobileTiles = within(mobileRail).getAllByTestId("sidebar-banner-tile");
    expect(mobileTiles.length).toBe(5);

    const desktopTiles = within(grid).getAllByTestId("sidebar-banner-tile");
    expect(desktopTiles.length).toBe(5);

    mobileTiles.forEach((tile) => {
      expect(tile.innerHTML).toContain("aspect-square");
    });
    desktopTiles.forEach((tile) => {
      expect(tile.innerHTML).toContain("aspect-square");
    });
  });
});
