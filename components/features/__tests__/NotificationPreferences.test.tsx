import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const { useSmartResourceMock } = vi.hoisted(() => ({
  useSmartResourceMock: vi.fn(),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: useSmartResourceMock,
}));

vi.mock("@/components/ui", () => ({
  SectionLoader: () => <div data-testid="section-loader">loading</div>,
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
      aria-pressed={Boolean(checked)}
      aria-disabled={Boolean(disabled)}
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
    expect(screen.getByTestId("locked-switch")).toHaveAttribute("aria-disabled", "true");
  });

  it("saves editable preferences payload only", async () => {
    render(<NotificationPreferences />);
    fireEvent.click(screen.getAllByTestId("editable-switch")[0]);
    fireEvent.click(screen.getByText("Save Preferences"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"editable"'),
      });
    });
  });
});
