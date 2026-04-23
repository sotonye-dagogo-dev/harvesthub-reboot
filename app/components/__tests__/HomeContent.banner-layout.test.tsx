import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HomeContent } from "@/app/components/HomeContent";
import { AD_RAIL_CONFIG } from "@/lib/config/adRail";

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
    expect(mobileRail.className).toContain(AD_RAIL_CONFIG.mobile.gapClass);

    const grid = screen.getByTestId("sidebar-banner-grid");
    const expectedDesktopMaxHeightClasses = AD_RAIL_CONFIG.desktop.maxHeightClass.split(" ");
    expectedDesktopMaxHeightClasses.forEach((heightClass) => {
      expect(grid.className).toContain(heightClass);
    });
    expect(grid.className).toContain("overflow-y-auto");
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain(AD_RAIL_CONFIG.desktop.gapClass);

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

  it("opens modal details and exposes CTA link from banner linkUrl", () => {
    const banners = [
      buildBanner("hero-1", "HERO"),
      {
        ...buildBanner("side-linked", "SIDEBAR"),
        title: "Sidebar Promo",
        description: "Learn more in modal",
        linkUrl: "/operations/dashboard",
      },
    ];

    render(<HomeContent banners={banners} products={[]} vendors={[]} />);

    const [sidebarButton] = screen.getAllByRole("button", {
      name: /know more about sidebar promo/i,
    });
    expect(sidebarButton).toBeDefined();
    fireEvent.click(sidebarButton as HTMLElement);

    expect(screen.getByRole("dialog", { name: /sidebar promo – details/i })).toBeInTheDocument();
    expect(screen.getByText("Sidebar Promo")).toBeInTheDocument();
    const ctaLink = screen.getByRole("link", { name: /open promotion/i });
    expect(ctaLink).toHaveAttribute("href", "/operations/dashboard");
  });
});
