import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const { useSmartResourceMock } = vi.hoisted(() => ({
  useSmartResourceMock: vi.fn(),
}));

const {
  enablePushNotificationsMock,
  disablePushNotificationsMock,
  getBrowserPushPermissionMock,
  checkPushHealthMock,
} = vi.hoisted(() => ({
  enablePushNotificationsMock: vi.fn().mockResolvedValue(true),
  disablePushNotificationsMock: vi.fn().mockResolvedValue(true),
  getBrowserPushPermissionMock: vi.fn().mockReturnValue("granted"),
  checkPushHealthMock: vi.fn().mockResolvedValue({
    supported: true,
    permission: "granted",
    serviceWorkerReady: true,
    hasSubscription: true,
    endpoint: "https://push.example.com/endpoint",
    backendSynced: true,
    backendSubscriptionCount: 1,
    message: "Push subscription is healthy and synchronized with backend records.",
  }),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: useSmartResourceMock,
}));

vi.mock("@/components/ui", () => ({
  SectionLoader: () => <div data-testid="section-loader">loading</div>,
}));

vi.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    enablePushNotifications: enablePushNotificationsMock,
    disablePushNotifications: disablePushNotificationsMock,
    getBrowserPushPermission: getBrowserPushPermissionMock,
    checkPushHealth: checkPushHealthMock,
  }),
}));

vi.mock("antd", () => ({
  Card: ({ title, children }: { title?: ReactNode; children: ReactNode }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
  Switch: ({
    checked,
    disabled,
    onChange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (value: boolean) => void;
  }) => (
    <button
      type="button"
      data-testid={disabled ? "locked-switch" : "editable-switch"}
      data-pressed={checked ? "true" : "false"}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange?.(!checked);
      }}
    >
      switch
    </button>
  ),
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}));

import { NotificationPreferences } from "@/components/features/NotificationPreferences";

describe("NotificationPreferences integrity semantics", () => {
  beforeEach(() => {
    enablePushNotificationsMock.mockClear();
    disablePushNotificationsMock.mockClear();
    getBrowserPushPermissionMock.mockClear();
    checkPushHealthMock.mockClear();
    useSmartResourceMock.mockReturnValue({
      data: {
        success: true,
        note: "Critical system email notifications remain mandatory and cannot be disabled.",
        editable: {
          orderUpdates: true,
          vendorMessages: true,
          promotions: false,
          pushNotifications: true,
          smsNotifications: false,
        },
      },
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          editable: {
            orderUpdates: false,
            vendorMessages: true,
            promotions: false,
            pushNotifications: true,
            smsNotifications: false,
          },
        }),
      })
    );
  });

  it("renders enforced lock row and keeps locked switch disabled", async () => {
    render(<NotificationPreferences />);
    await waitFor(() => {
      expect(checkPushHealthMock).toHaveBeenCalled();
    });
    expect(screen.getByText("Enforced Safety Rules")).toBeInTheDocument();
    const lockedSwitches = screen.getAllByTestId("locked-switch");
    expect(lockedSwitches.length).toBeGreaterThanOrEqual(1);
    lockedSwitches.forEach((control) => {
      expect(control).toBeDisabled();
    });
    expect(screen.getByText(/SMS notifications are coming soon/i)).toBeInTheDocument();
  });

  it("saves editable preferences payload only", async () => {
    render(<NotificationPreferences />);
    const [firstEditableSwitch] = screen.getAllByTestId("editable-switch");
    if (!firstEditableSwitch) {
      throw new Error("Expected at least one editable switch");
    }
    fireEvent.click(firstEditableSwitch);
    fireEvent.click(screen.getByText("Save Preferences"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"editable"'),
      });
    });

    expect(enablePushNotificationsMock).toHaveBeenCalledTimes(1);
    expect(checkPushHealthMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("runs push unsubscribe flow when push toggle is disabled", async () => {
    render(<NotificationPreferences />);
    const switches = screen.getAllByTestId("editable-switch");
    const pushSwitch = switches[3];
    if (!pushSwitch) {
      throw new Error("Expected push notification switch");
    }

    fireEvent.click(pushSwitch);
    fireEvent.click(screen.getByText("Save Preferences"));

    await waitFor(() => {
      expect(disablePushNotificationsMock).toHaveBeenCalledTimes(1);
    });

    expect(checkPushHealthMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("offers push setup repair action when health check reports default permission", async () => {
    checkPushHealthMock
      .mockResolvedValueOnce({
        supported: true,
        permission: "default",
        serviceWorkerReady: true,
        hasSubscription: false,
        endpoint: null,
        backendSynced: false,
        backendSubscriptionCount: 0,
        message: "Push permission has not been granted yet.",
      })
      .mockResolvedValue({
        supported: true,
        permission: "granted",
        serviceWorkerReady: true,
        hasSubscription: true,
        endpoint: "https://push.example.com/endpoint",
        backendSynced: true,
        backendSubscriptionCount: 1,
        message: "Push subscription is healthy and synchronized with backend records.",
      });

    render(<NotificationPreferences />);

    const repairButton = await screen.findByText("Fix Push Setup");
    fireEvent.click(repairButton);

    await waitFor(() => {
      expect(enablePushNotificationsMock).toHaveBeenCalledTimes(1);
    });
    expect(checkPushHealthMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
