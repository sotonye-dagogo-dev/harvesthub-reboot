import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";

const pathnameState = vi.hoisted(() => ({ value: "/operations/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

describe("Sidebar orders scope visibility", () => {
  it("shows operations orders for vendor sidebar", () => {
    render(<Sidebar type="vendor" />);
    expect(screen.getAllByRole("link", { name: /orders/i }).length).toBeGreaterThan(0);
  });

  it("shows operations orders for admin sidebar", () => {
    render(<Sidebar type="admin" />);
    expect(screen.getAllByRole("link", { name: /orders/i }).length).toBeGreaterThan(0);
  });

  it("renders mobile labels with wrapping classes to prevent overlap", () => {
    render(<Sidebar type="admin" />);
    const ordersLabels = screen.getAllByText("Orders");
    expect(ordersLabels.some((node) => node.className.includes("break-words"))).toBe(true);
  });
});
