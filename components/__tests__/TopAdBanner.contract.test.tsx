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

  it("renders a top banner when text content is present", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    expect(await screen.findByText("Spring Market Deals")).toBeInTheDocument();
  });

  it("does not render top banner when title text is empty/whitespace", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([
      buildBanner({ title: "   " }),
      buildBanner({ id: "banner-2", title: "<span> </span>" }),
    ]);

    const { container } = render(<TopAdBanner />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("requests top-only banner feed", async () => {
    vi.mocked(getTopBannersClient).mockResolvedValue([buildBanner()]);

    render(<TopAdBanner />);

    await waitFor(() => {
      expect(getTopBannersClient).toHaveBeenCalledTimes(1);
    });
  });
});
