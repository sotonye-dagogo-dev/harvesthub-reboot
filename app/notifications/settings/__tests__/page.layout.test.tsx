import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const { useAuthMock, useNotificationsMock, useToastMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useNotificationsMock: vi.fn(),
  useToastMock: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: useNotificationsMock,
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: useToastMock,
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

vi.mock("@/components/ui", () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));

vi.mock("antd", () => ({
  Card: ({ title, children }: { title?: ReactNode; children: ReactNode }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
  Switch: ({ checked, onChange }: { checked?: boolean; onChange?: (value: boolean) => void }) => (
    <button
      type="button"
      data-testid="mock-switch"
      aria-pressed={Boolean(checked)}
      onClick={() => onChange?.(!checked)}
    >
      toggle
    </button>
  ),
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import NotificationSettingsPage from "@/app/notifications/settings/page";

const fetchMock = vi.fn();

describe("NotificationSettingsPage layout contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    useNotificationsMock.mockReturnValue({
      enablePushNotifications: vi.fn().mockResolvedValue(false),
      getBrowserPushPermission: vi.fn().mockReturnValue("default"),
    });

    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses dashboard shell for vendor users", async () => {
    useAuthMock.mockReturnValue({
      user: { role: "VENDOR" },
      isLoading: false,
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notification Settings")).toBeInTheDocument();
    });

    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar-type", "vendor");
  });

  it("keeps buyer users outside dashboard shell", async () => {
    useAuthMock.mockReturnValue({
      user: { role: "BUYER" },
      isLoading: false,
    });

    render(<NotificationSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notification Settings")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
  });
});
