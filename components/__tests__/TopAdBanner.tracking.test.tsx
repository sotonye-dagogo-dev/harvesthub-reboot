import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TopAdBanner } from "@/components/features/TopAdBanner";
import type { Banner } from "@/lib/types";

vi.mock("@/lib/data/clientDataFetchers", () => ({
  getTopBannersClient: vi.fn(),
}));

const trackBannerImpression = vi.fn();
const trackBannerClick = vi.fn();

vi.mock("@/lib/tracking/bannerTracking", () => ({
  trackBannerImpression: (...args: unknown[]) => trackBannerImpression(...args),
  trackBannerClick: (...args: unknown[]) => trackBannerClick(...args),
}));

import { getTopBannersClient } from "@/lib/data/clientDataFetchers";

function buildBanner(overrides: Partial<Banner> = {}): Banner {
  const now = new Date();
  return {
    id: "banner-1",
    title: "Special Offer",
    subtitle: null,
    description: "Limited time",
    imageUrl: "/banner.jpg",
    linkUrl: "/products/sale",
    actions: null,
    position: "TOP",
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
    conversionCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: "admin-user",
    ...overrides,
  };
}

describe("TopAdBanner tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);
  });

  it("records an impression for the displayed banner", async () => {
    render(<TopAdBanner />);

    await waitFor(() => {
      expect(trackBannerImpression).toHaveBeenCalledWith("banner-1", "top");
    });
  });

  it("records an impression per banner as the strip rotates", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ id: "banner-a", displayOrder: 0 }),
      buildBanner({ id: "banner-b", displayOrder: 1 }),
    ]);

    render(<TopAdBanner />);

    await waitFor(() => {
      expect(trackBannerImpression).toHaveBeenCalledWith("banner-a", "top");
    });
  });

  it("records a click-through with conversion when the linked strip is clicked", async () => {
    render(<TopAdBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("top-ad-strip")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("top-ad-strip"));
    expect(trackBannerClick).toHaveBeenCalledWith("banner-1", "top", {
      conversion: true,
    });
  });

  it("does not track an impression when no banner is available", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([]);
    render(<TopAdBanner />);

    expect(trackBannerImpression).not.toHaveBeenCalled();
  });
});