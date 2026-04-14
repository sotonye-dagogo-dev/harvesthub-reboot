import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";

const pathnameState = vi.hoisted(() => ({ value: "/operations/dashboard" }));
const notificationState = vi.hoisted(() => ({ unreadCount: 0 }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: notificationState.unreadCount,
  }),
}));

describe("Sidebar orders scope visibility", () => {
  beforeEach(() => {
    pathnameState.value = "/operations/dashboard";
    notificationState.unreadCount = 0;
  });

  it("shows operations orders for vendor sidebar", () => {
    render(<Sidebar type="vendor" />);
    expect(screen.getAllByRole("link", { name: /orders/i }).length).toBeGreaterThan(0);
  });

  it("shows operations orders for admin sidebar", () => {
    render(<Sidebar type="admin" />);
    expect(screen.getAllByRole("link", { name: /orders/i }).length).toBeGreaterThan(0);
  });

  it("highlights active orders link in mobile nav with brand text class", () => {
    pathnameState.value = "/operations/orders";
    render(<Sidebar type="admin" />);
    const ordersLinks = screen.getAllByRole("link", { name: /orders/i });
    expect(ordersLinks.some((link) => link.className.includes("text-ds-text-brand"))).toBe(true);
  });

  it("renders mobile labels with wrapping classes to prevent overlap", () => {
    render(<Sidebar type="admin" />);
    const ordersLabels = screen.getAllByText("Orders");
    expect(ordersLabels.some((node) => node.className.includes("break-words"))).toBe(true);
  });

  it("shows unread badge on notifications links when count exists", () => {
    notificationState.unreadCount = 7;
    render(<Sidebar type="admin" />);
    const badge = screen.getAllByText("7");
    expect(badge.length).toBeGreaterThan(0);
  });
});
