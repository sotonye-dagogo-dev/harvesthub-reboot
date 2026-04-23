import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    title: "Spring Market Deals",
    subtitle: "Limited time",
    description: "Fresh weekly offers",
    imageUrl: "/banner.jpg",
    linkUrl: "/products",
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
    createdAt: now,
    updatedAt: now,
    createdBy: "admin-user",
    ...overrides,
  };
}

describe("TopAdBanner contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a top banner strip even when title text is not displayed", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
    });
    expect(screen.queryByText("Spring Market Deals")).not.toBeInTheDocument();
  });

  it("uses compact top-strip height contract after ratio rebalance", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    const strip = await screen.findByTestId("top-ad-strip");
    expect(strip.className).toContain("min-h-[28px]");
    expect(strip.className).toContain("max-h-[44px]");
  });

  it("renders top banner when title is empty/whitespace", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ title: "   " }),
      buildBanner({ id: "banner-2", title: "<span> </span>" }),
    ]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
    });
  });

  it("requests top-only banner feed", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    await waitFor(() => {
      expect(getTopBannersClient).toHaveBeenCalledTimes(1);
    });
  });

  it("does not render manual navigator controls for multi-banner top strip", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner(),
      buildBanner({ id: "banner-2", displayOrder: 1 }),
    ]);

    render(<TopAdBanner />);

    await screen.findByTestId("top-ad-strip");
    expect(screen.queryByRole("button", { name: /previous ad/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next ad/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /go to ad/i })).not.toBeInTheDocument();
  });

  it("does not link top strip to operations ads management path", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner({ linkUrl: "/operations/ads" })]);

    render(<TopAdBanner />);

    await screen.findByTestId("top-ad-strip");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
