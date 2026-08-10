import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BannerCarousel } from "@/components/features/BannerCarousel";
import type { BannerItem } from "@/components/features/BannerCarousel";

const trackBannerImpression = vi.fn();
const trackBannerClick = vi.fn();

vi.mock("@/lib/tracking/bannerTracking", () => ({
  trackBannerImpression: (...args: unknown[]) => trackBannerImpression(...args),
  trackBannerClick: (...args: unknown[]) => trackBannerClick(...args),
}));

function buildBanner(overrides: Partial<BannerItem> = {}): BannerItem {
  return {
    id: "hero-banner-1",
    title: "Mega Electronics Fair",
    image: "/hero/electronics.jpg",
    description: "Biggest savings of the season",
    link: "/events/electronics-fair",
    actions: [
      { label: "Shop now", href: "/events/electronics-fair", variant: "primary" },
    ],
    ...overrides,
  };
}

describe("BannerCarousel tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records an impression for the active hero banner", () => {
    render(<BannerCarousel banners={[buildBanner()]} />);

    expect(trackBannerImpression).toHaveBeenCalledWith("hero-banner-1", "hero");
  });

  it("records an impression for each banner when rotating", () => {
    render(
      <BannerCarousel
        autoPlay={false}
        banners={[buildBanner({ id: "hero-a" }), buildBanner({ id: "hero-b" })]}
      />
    );

    expect(trackBannerImpression).toHaveBeenCalledWith("hero-a", "hero");
  });

  it("tracks a hero click when opening the know-more action modal", () => {
    render(<BannerCarousel autoPlay={false} banners={[buildBanner()]} />);

    fireEvent.click(screen.getByRole("button", { name: /know more about mega electronics fair/i }));

    expect(trackBannerClick).toHaveBeenCalledWith("hero-banner-1", "hero");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("tracks a click-through with conversion from the action modal CTA", () => {
    render(<BannerCarousel autoPlay={false} banners={[buildBanner()]} />);

    fireEvent.click(screen.getByRole("button", { name: /know more about mega electronics fair/i }));
    fireEvent.click(screen.getByRole("link", { name: /shop now/i }));

    expect(trackBannerClick).toHaveBeenCalledWith("hero-banner-1", "hero-modal", {
      conversion: true,
    });
  });

  it("tracks the next banner impression when navigating", () => {
    render(
      <BannerCarousel
        autoPlay={false}
        banners={[buildBanner({ id: "hero-a" }), buildBanner({ id: "hero-b" })]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /next banner/i }));

    expect(trackBannerImpression).toHaveBeenCalledWith("hero-b", "hero");
  });
});