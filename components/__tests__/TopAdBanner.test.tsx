import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { TopAdBanner } from "@/components/features/TopAdBanner";

vi.mock("@/lib/data/clientDataFetchers", () => ({
  getTopBannersClient: vi.fn(),
}));

import { getTopBannersClient } from "@/lib/data/clientDataFetchers";
import type { Banner } from "@/lib/types";

function buildBanner(overrides: Partial<Banner> = {}): Banner {
  const now = new Date();
  return {
    id: "banner-1",
    title: "Special Offer!",
    subtitle: null,
    description: "50% off all items",
    imageUrl: "/banner.jpg",
    linkUrl: "/products/special",
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

describe("TopAdBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders image-strip banner from top-banner feed", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
    });

    expect(screen.queryByText("Special Offer!")).not.toBeInTheDocument();
  });

  it("renders banner when title is empty if image is present", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner({ title: "   " })]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
    });
  });

  it("does not render when no active top banners are returned", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("requests top banner feed once on mount", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    await waitFor(() => {
      expect(getTopBannersClient).toHaveBeenCalledTimes(1);
    });
  });
});
