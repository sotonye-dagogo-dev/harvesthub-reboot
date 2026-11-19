import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    conversionCount: 0,
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
      expect(container.querySelector('[data-testid="top-ad-slot"]')).toBeInTheDocument();
    });
    expect(screen.queryByText("Spring Market Deals")).not.toBeInTheDocument();
  });

  it("uses the compact fixed-height top-strip contract", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    const strip = await screen.findByTestId("top-ad-strip");
    expect(strip.className).toContain("h-11");
    expect(strip.className).toContain("sm:h-12");
  });

  it("keeps non-premium sponsored adverts out of the top strip", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner({ isSponsored: true })]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => expect(getTopBannersClient).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="top-ad-slot"]')).not.toBeInTheDocument();
  });

  it("labels premium sponsored adverts and lets visitors hide them", async () => {
    window.sessionStorage.clear();
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ isSponsored: true, premiumTopPlacement: true }),
    ]);

    const { container } = render(<TopAdBanner />);

    expect(await screen.findByText("Sponsored")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /hide this advert/i }));
    await waitFor(() => {
      expect(container.querySelector('[data-testid="top-ad-slot"]')).not.toBeInTheDocument();
    });
  });

  it("renders branded (designed) campaigns from their text without an image", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ displayStyle: "DESIGNED", imageUrl: "", title: "Mega Thanksgiving market", knowMoreLabel: "Shop now" }),
    ]);

    render(<TopAdBanner />);

    expect(await screen.findByText("Mega Thanksgiving market")).toBeInTheDocument();
    expect(screen.getByText("Shop now")).toBeInTheDocument();
    expect(screen.queryByText("Sponsored")).not.toBeInTheDocument();
  });

  it("renders top banner when title is empty/whitespace", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ title: "   " }),
      buildBanner({ id: "banner-2", title: "<span> </span>" }),
    ]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="top-ad-slot"]')).toBeInTheDocument();
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
