import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/components/features/StoreSettingsPage", () => ({
  default: () => <div data-testid="store-settings-feature">Store Settings Feature</div>,
}));

vi.mock("@/components/ui", () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

vi.mock("@/components/layout", () => ({
  ClientDashboardShell: ({
    sidebarType,
    children,
  }: {
    sidebarType: "vendor" | "admin";
    children: ReactNode;
  }) => (
    <div data-testid="dashboard-shell" data-sidebar-type={sidebarType}>
      {children}
    </div>
  ),
}));

import StoreSettingsPage from "@/app/store-settings/page";

describe("StoreSettingsPage layout contract", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("renders vendor view inside dashboard shell", () => {
    useAuthMock.mockReturnValue({
      user: { role: "VENDOR" },
      isLoading: false,
    });

    render(<StoreSettingsPage />);

    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar-type", "vendor");
    expect(screen.getByTestId("store-settings-feature")).toBeInTheDocument();
  });

  it("renders admin view inside dashboard shell", () => {
    useAuthMock.mockReturnValue({
      user: { role: "ADMIN" },
      isLoading: false,
    });

    render(<StoreSettingsPage />);

    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar-type", "admin");
    expect(screen.getByTestId("store-settings-feature")).toBeInTheDocument();
  });

  it("keeps buyer access outside dashboard shell", () => {
    useAuthMock.mockReturnValue({
      user: { role: "BUYER" },
      isLoading: false,
    });

    render(<StoreSettingsPage />);

    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });
});
