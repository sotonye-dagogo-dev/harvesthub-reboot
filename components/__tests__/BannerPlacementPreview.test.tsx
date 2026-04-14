import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BannerPlacementPreview } from "@/components/features/BannerPlacementPreview";

describe("BannerPlacementPreview", () => {
  it("keeps TOP preview image-only to match runtime rendering", () => {
    render(
      <BannerPlacementPreview
        position="TOP"
        imageUrl="/top-banner.jpg"
        title="This title should not render in top strip preview"
      />
    );

    expect(
      screen.getByText("Top placement is image-only at runtime (no title overlay).")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("This title should not render in top strip preview")
    ).not.toBeInTheDocument();

    const desktopTop = screen.getByTestId("banner-preview-top-desktop");
    const mobileTop = screen.getByTestId("banner-preview-top-mobile");
    expect(desktopTop.className).toContain("max-h-[44px]");
    expect(mobileTop.className).toContain("max-h-[36px]");
  });

  it("shows title overlay for HERO preview", () => {
    render(
      <BannerPlacementPreview
        position="HERO"
        imageUrl="/hero-banner.jpg"
        title="Hero title preview"
      />
    );

    expect(screen.getAllByText("Hero title preview").length).toBeGreaterThan(0);
    expect(screen.getByTestId("banner-preview-hero-desktop").className).toContain("aspect-[11/4]");
    expect(screen.getByTestId("banner-preview-hero-mobile").className).toContain("aspect-[2/1]");
  });

  it("keeps sidebar preview square and compact for tiled layouts", () => {
    render(
      <BannerPlacementPreview position="SIDEBAR" imageUrl="/sidebar-banner.jpg" title="Sidebar" />
    );

    const sidebar = screen.getByTestId("banner-preview-sidebar");
    expect(sidebar.className).toContain("aspect-square");
    expect(sidebar.className).toContain("max-h-[180px]");
  });
});
