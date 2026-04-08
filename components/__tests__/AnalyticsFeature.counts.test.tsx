import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnalyticsFeature } from "@/components/features/AnalyticsFeature";

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/data/clientDataFetchers", () => ({
  getProductsClient: vi.fn(),
  getVendorsClient: vi.fn(),
  getOrdersClient: vi.fn(),
  getUserCountsClient: vi.fn(),
}));

import { useAuth } from "@/lib/contexts/AuthContext";
import {
  getProductsClient,
  getVendorsClient,
  getOrdersClient,
  getUserCountsClient,
} from "@/lib/data/clientDataFetchers";

describe("AnalyticsFeature count contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-1", role: "ADMIN" },
      isLoading: false,
    } as any);

    vi.mocked(getProductsClient).mockResolvedValue([] as any[]);
    vi.mocked(getVendorsClient).mockResolvedValue([] as any[]);
    vi.mocked(getOrdersClient).mockResolvedValue([] as any[]);
  });

  it("renders Total Users using API-derived count values", async () => {
    vi.mocked(getUserCountsClient).mockResolvedValue({
      totalUsers: 42,
      buyers: 30,
      vendors: 12,
    });

    render(<AnalyticsFeature />);

    expect(await screen.findByText("Total Users")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("keeps analytics visible when one dataset fails (partial success)", async () => {
    vi.mocked(getProductsClient).mockRejectedValue(new Error("products unavailable"));
    vi.mocked(getUserCountsClient).mockResolvedValue({
      totalUsers: 7,
      buyers: 5,
      vendors: 2,
    });

    render(<AnalyticsFeature />);

    expect(await screen.findByText("Analytics")).toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });
});
