import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "@/app/components/HomeContent";
import {
  PRODUCT_DISCOVERY_CATEGORIES,
  parseProductDiscoveryQueryState,
} from "@/lib/config/productDiscovery";

vi.mock("@/lib/hooks/useGuestGuard", () => ({
  useGuestGuard: () => ({
    requireAuth: () => true,
    isGuest: false,
  }),
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => ({
    message: {},
    notify: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe("home category click-through contract", () => {
  it("emits canonical category query links consumable by products discovery parser", () => {
    const firstCategory = PRODUCT_DISCOVERY_CATEGORIES[0];
    expect(firstCategory).toBeDefined();

    render(<HomeContent banners={[]} products={[]} vendors={[]} />);

    const category = firstCategory!;
    const categoryLink = screen.getByRole("link", {
      name: new RegExp(category.label, "i"),
    });

    expect(categoryLink).toHaveAttribute("href", `/products?category=${category.slug}`);

    const href = categoryLink.getAttribute("href");
    expect(href).toBeTruthy();

    const url = new URL(href!, "http://localhost");
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const parsedState = parseProductDiscoveryQueryState(query);
    expect(parsedState.categories).toEqual([category.value]);
  });
});
