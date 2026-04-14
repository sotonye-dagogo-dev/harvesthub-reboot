import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const { useSmartResourceMock } = vi.hoisted(() => ({
  useSmartResourceMock: vi.fn(),
}));

const { enablePushNotificationsMock, disablePushNotificationsMock, getBrowserPushPermissionMock } =
  vi.hoisted(() => ({
    enablePushNotificationsMock: vi.fn().mockResolvedValue(true),
    disablePushNotificationsMock: vi.fn().mockResolvedValue(true),
    getBrowserPushPermissionMock: vi.fn().mockReturnValue("granted"),
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
      aria-pressed={checked ? "true" : "false"}
      aria-disabled={disabled ? "true" : "false"}
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
  },
}));

import { NotificationPreferences } from "@/components/features/NotificationPreferences";

describe("NotificationPreferences integrity semantics", () => {
  beforeEach(() => {
    enablePushNotificationsMock.mockClear();
    disablePushNotificationsMock.mockClear();
    getBrowserPushPermissionMock.mockClear();
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

  it("renders enforced lock row and keeps locked switch disabled", () => {
    render(<NotificationPreferences />);
    expect(screen.getByText("Enforced Safety Rules")).toBeInTheDocument();
    const lockedSwitches = screen.getAllByTestId("locked-switch");
    expect(lockedSwitches.length).toBeGreaterThanOrEqual(1);
    lockedSwitches.forEach((control) => {
      expect(control).toHaveAttribute("aria-disabled", "true");
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
  });
});
