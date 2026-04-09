import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/components/features/NotificationPreferences", () => ({
  NotificationPreferences: () => <div data-testid="notification-preferences">preferences</div>,
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

import NotificationSettingsPage from "@/app/notifications/settings/page";

describe("Notification settings route layout", () => {
  it("uses dashboard shell for vendor users", () => {
    useAuthMock.mockReturnValue({
      user: { role: "VENDOR" },
      isLoading: false,
    });

    render(<NotificationSettingsPage />);
    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar-type", "vendor");
    expect(screen.getByTestId("notification-preferences")).toBeInTheDocument();
  });

  it("keeps buyer users outside dashboard shell", () => {
    useAuthMock.mockReturnValue({
      user: { role: "BUYER" },
      isLoading: false,
    });

    render(<NotificationSettingsPage />);
    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-preferences")).toBeInTheDocument();
  });
});
