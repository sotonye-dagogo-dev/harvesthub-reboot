import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { advertisingConfig } from "@/lib/config/siteContent";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const getPublicContentBySlugMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/publicContent", () => ({
  getPublicContentBySlug: getPublicContentBySlugMock,
}));

import AdvertiseLandingPage from "@/app/advertise/page";

describe("AdvertiseLandingPage", () => {
  beforeEach(() => {
    getPublicContentBySlugMock.mockReset();
  });

  it("renders hero copy and primary CTA linking to the application page", async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);

    render(await AdvertiseLandingPage());

    expect(screen.getByText(advertisingConfig.hero.eyebrow)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: advertisingConfig.hero.title })).toBeInTheDocument();
    expect(screen.getByText(advertisingConfig.hero.subtitle)).toBeInTheDocument();

    const applyLinks = screen.getAllByRole("link", {
      name: advertisingConfig.cta.primaryLabel,
    });
    expect(applyLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of applyLinks) {
      expect(link).toHaveAttribute("href", advertisingConfig.routes.apply);
    }

    const contactCta = screen.getByRole("link", { name: advertisingConfig.cta.secondaryLabel });
    expect(contactCta).toHaveAttribute("href", "/contact");
  });

  it("renders placement cards with dimensions and aspect ratio", async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);

    render(await AdvertiseLandingPage());

    expect(
      screen.getByRole("heading", { name: advertisingConfig.placementsHeading })
    ).toBeInTheDocument();

    for (const placement of advertisingConfig.placements) {
      expect(screen.getByRole("heading", { name: placement.title })).toBeInTheDocument();
      expect(screen.getByText(placement.dimensions)).toBeInTheDocument();
      expect(screen.getByText(placement.ratio)).toBeInTheDocument();
    }
  });

  it("renders config fallback narrative when no published admin content exists", async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);

    render(await AdvertiseLandingPage());

    expect(
      screen.getByRole("heading", { name: advertisingConfig.narrativeHeading })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/MyHarvestHub is a trusted faith-based marketplace/i)
    ).toBeInTheDocument();
    expect(getPublicContentBySlugMock).toHaveBeenCalledWith("advertise");
  });

  it("renders published admin narrative content instead of the config fallback", async () => {
    getPublicContentBySlugMock.mockResolvedValue({
      id: "pc-advertise",
      slug: "advertise",
      title: "Admin Editable Heading",
      body: "<p>Admin authored narrative about advertising.</p>",
      status: "PUBLISHED",
      createdAt: new Date("2026-08-01"),
      updatedAt: new Date("2026-08-01"),
    });

    render(await AdvertiseLandingPage());

    expect(
      screen.getByRole("heading", { name: "Admin Editable Heading" })
    ).toBeInTheDocument();
    expect(screen.getByText("Admin authored narrative about advertising.")).toBeInTheDocument();
    expect(
      screen.queryByText(/MyHarvestHub is a trusted faith-based marketplace/i)
    ).not.toBeInTheDocument();
  });

  it("renders closing CTA band with apply and quick-application links", async () => {
    getPublicContentBySlugMock.mockResolvedValue(null);

    render(await AdvertiseLandingPage());

    const applyLinks = screen.getAllByRole("link", { name: advertisingConfig.cta.primaryLabel });
    expect(applyLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of applyLinks) {
      expect(link).toHaveAttribute("href", advertisingConfig.routes.apply);
    }

    const quickLink = screen.getByRole("link", { name: "Quick application" });
    expect(quickLink).toHaveAttribute("href", advertisingConfig.routes.simpleApply);
  });
});
