import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/components/features/NotificationInbox", () => ({
  NotificationInbox: () => <div data-testid="notification-inbox">inbox</div>,
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

import NotificationsPage from "@/app/notifications/page";

describe("Notifications inbox route layout", () => {
  it("uses dashboard shell for admin users", () => {
    useAuthMock.mockReturnValue({
      user: { role: "ADMIN" },
      isLoading: false,
    });

    render(<NotificationsPage />);
    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar-type", "admin");
    expect(screen.getByTestId("notification-inbox")).toBeInTheDocument();
  });

  it("keeps buyer users outside dashboard shell", () => {
    useAuthMock.mockReturnValue({
      user: { role: "BUYER" },
      isLoading: false,
    });

    render(<NotificationsPage />);
    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-inbox")).toBeInTheDocument();
  });
});
