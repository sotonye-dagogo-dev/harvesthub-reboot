/**
 * TopAdBanner Component Tests
 * Tests the dismissible top ad banner component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TopAdBanner } from "@/components/features/TopAdBanner";

// Mock fetch
global.fetch = vi.fn();

describe("TopAdBanner Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockBanner = {
    id: "banner-1",
    title: "Special Offer!",
    imageUrl: "/banner.jpg",
    linkUrl: "/products/special",
    description: "50% off all items",
    position: "TOP",
    isActive: true,
  };

  describe("Rendering", () => {
    it("should render banner when data is fetched", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        expect(screen.getByText("Special Offer!")).toBeInTheDocument();
      });
    });

    it("should not render when no banner is available", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: null }),
      });

      const { container } = render(<TopAdBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it("should render close button", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe("Dismiss Functionality", () => {
    it("should hide banner when close button is clicked", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      const { container } = render(<TopAdBanner />);

      await waitFor(() => {
        expect(screen.getByText("Special Offer!")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it("should save dismissed state to localStorage", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        expect(screen.getByText("Special Offer!")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        const dismissedBanners = JSON.parse(localStorage.getItem("dismissedTopBanners") || "[]");
        expect(dismissedBanners).toContain("banner-1");
      });
    });

    it("should not render banner if it was previously dismissed", async () => {
      localStorage.setItem("dismissedTopBanners", JSON.stringify(["banner-1"]));

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      const { container } = render(<TopAdBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe("API Integration", () => {
    it("should fetch banner from API on mount", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/banners?position=TOP&active=true");
      });
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const { container } = render(<TopAdBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe("Banner Link", () => {
    it("should render banner as link when linkUrl is provided", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/products/special");
      });
    });

    it("should render banner without link when linkUrl is not provided", async () => {
      const bannerWithoutLink = { ...mockBanner, linkUrl: null };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: bannerWithoutLink }),
      });

      const { container } = render(<TopAdBanner />);

      await waitFor(() => {
        const link = container.querySelector("a");
        expect(link).toBeNull();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banner: mockBanner }),
      });

      render(<TopAdBanner />);

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close/i });
        expect(closeButton).toHaveAttribute("aria-label");
      });
    });
  });
});
