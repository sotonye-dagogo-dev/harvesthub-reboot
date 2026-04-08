import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserRole } from "@/lib/constants";
import type { ReactNode } from "react";

const { requireAnyRoleMock } = vi.hoisted(() => ({
  requireAnyRoleMock: vi.fn(),
}));

vi.mock("@/lib/utils/auth", () => ({
  requireAnyRole: requireAnyRoleMock,
}));

vi.mock("@/components/layout/ClientDashboardShell", () => ({
  ClientDashboardShell: ({
    sidebarType,
    children,
  }: {
    sidebarType: "vendor" | "admin";
    children: ReactNode;
  }) => (
    <div>
      <div data-testid="shell-sidebar">{sidebarType}</div>
      <div>{children}</div>
    </div>
  ),
}));

import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

describe("RoleDashboardShell", () => {
  beforeEach(() => {
    requireAnyRoleMock.mockReset();
  });

  it("renders operations content in dashboard shell", async () => {
    requireAnyRoleMock.mockResolvedValue({ role: UserRole.VENDOR });

    const ui = await RoleDashboardShell({
      section: "operations",
      children: <div>Operations Content</div>,
    });

    render(ui);

    expect(screen.getByTestId("shell-sidebar")).toHaveTextContent("vendor");
    expect(screen.getByText("Operations Content")).toBeInTheDocument();
  });

  it("uses admin sidebar for admin operations users", async () => {
    requireAnyRoleMock.mockResolvedValue({ role: UserRole.ADMIN });

    const ui = await RoleDashboardShell({
      section: "operations",
      children: <div>Admin Operations</div>,
    });

    render(ui);

    expect(screen.getByTestId("shell-sidebar")).toHaveTextContent("admin");
  });
});
