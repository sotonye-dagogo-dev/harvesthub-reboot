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
  });
});
