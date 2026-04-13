import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
