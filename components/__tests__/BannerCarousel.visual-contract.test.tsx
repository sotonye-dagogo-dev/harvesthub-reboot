import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BannerCarousel } from "@/components/features/BannerCarousel";

describe("BannerCarousel visual contract", () => {
  it("keeps hero slide viewport image-first and uses View More CTA instead of direct title copy", () => {
    render(
      <BannerCarousel
        autoPlay={false}
        banners={[
          {
            id: "hero-1",
            title: "Mega Electronics Promo",
            image: "/hero-banner.jpg",
            description: "Big discounts on selected electronics.",
          },
        ]}
      />
    );

    expect(screen.getByRole("button", { name: /know more about mega electronics promo/i })).toBeInTheDocument();
    expect(screen.queryByText("Mega Electronics Promo")).not.toBeInTheDocument();
  });

  it("applies reduced hero viewport heights across breakpoints", () => {
    render(
      <BannerCarousel
        autoPlay={false}
        banners={[
          {
            id: "hero-compact",
            title: "Compact Hero",
            image: "/hero-banner.jpg",
          },
        ]}
      />
    );

    const viewport = screen.getByTestId("hero-banner-viewport");
    expect(viewport.className).toContain("h-[184px]");
    expect(viewport.className).toContain("sm:h-[216px]");
    expect(viewport.className).toContain("md:h-[268px]");
    expect(viewport.className).toContain("lg:h-[300px]");
    expect(viewport.className).toContain("xl:h-[332px]");
  });

  it("renders larger modal image preview contract for know-more details", () => {
    render(
      <BannerCarousel
        autoPlay={false}
        banners={[
          {
            id: "hero-modal",
            title: "Modal Size Contract",
            image: "/hero-banner.jpg",
            description: "Preview details",
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /know more about modal size contract/i }));

    const modalImage = screen.getByTestId("hero-modal-image");
    expect(modalImage.className).toContain("h-56");
    expect(modalImage.className).toContain("sm:h-64");
  });
});
