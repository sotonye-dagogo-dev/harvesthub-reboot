import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider, useNotifications } from "@/lib/contexts/NotificationContext";

const { toastInfoMock } = vi.hoisted(() => ({
  toastInfoMock: vi.fn(),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastWarningMock = vi.fn();
const toastApi = {
  info: (...args: unknown[]) => toastInfoMock(...args),
  success: toastSuccessMock,
  error: toastErrorMock,
  warning: toastWarningMock,
};

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => toastApi,
}));

function Probe() {
  const { unreadCount } = useNotifications();
  return <div data-testid="unread-count">{unreadCount}</div>;
}

function successNotificationsResponse(
  notifications: Array<Record<string, unknown>>,
  unreadCount: number
) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      notifications,
      unreadCount,
    }),
  } as Response;
}

describe("NotificationContext unread sync timing", () => {
  beforeEach(() => {
    toastInfoMock.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
    toastWarningMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("updates unread count and shows new-unread signal after passive refresh for order events", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(successNotificationsResponse([], 0)))
      .mockResolvedValueOnce(
        successNotificationsResponse(
          [
            {
              id: "notif-1",
              title: "Existing notification",
              message: "Already loaded",
              type: "ORDER_CONFIRMED",
              isRead: false,
            },
          ],
          1
        )
      )
      .mockResolvedValueOnce(
        successNotificationsResponse(
          [
            {
              id: "notif-2",
              title: "Order confirmed",
              message: "Your order MHH-100 was confirmed",
              type: "ORDER_CONFIRMED",
              isRead: false,
            },
            {
              id: "notif-1",
              title: "Existing notification",
              message: "Already loaded",
              type: "ORDER_CONFIRMED",
              isRead: false,
            },
          ],
          2
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent(window, new Event("online"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("unread-count")).toHaveTextContent("2");
    });

    expect(toastInfoMock).toHaveBeenCalledTimes(1);
    expect(toastInfoMock).toHaveBeenCalledWith("You have a new notification", "Order confirmed");
  });

  it("throttles focus/visibility refresh bursts and still forces refresh on reconnect", async () => {
    let now = 1_762_000_000_000;
    const dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => now);

    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(successNotificationsResponse([], 0)))
      .mockResolvedValueOnce(successNotificationsResponse([], 0))
      .mockResolvedValueOnce(successNotificationsResponse([], 0))
      .mockResolvedValueOnce(successNotificationsResponse([], 0));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    now += 16_000;
    fireEvent.focus(window);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    fireEvent(document, new Event("visibilitychange"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    now += 1;
    fireEvent(window, new Event("online"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    dateNowSpy.mockRestore();
  });
});
