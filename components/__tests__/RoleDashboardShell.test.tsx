import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserRole } from "@/lib/constants";

const { requireAnyRoleMock } = vi.hoisted(() => ({
  requireAnyRoleMock: vi.fn(),
}));

vi.mock("@/lib/utils/auth", () => ({
  requireAnyRole: requireAnyRoleMock,
}));

vi.mock("@/components/layout", () => ({
  Header: () => <div data-testid="shell-header">Header</div>,
  Sidebar: ({ type }: { type: "vendor" | "admin" }) => (
    <div data-testid="shell-sidebar">{type}</div>
  ),
}));

import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

describe("RoleDashboardShell", () => {
  beforeEach(() => {
    requireAnyRoleMock.mockReset();
  });

  it("does not render a nested header in operations shell", async () => {
    requireAnyRoleMock.mockResolvedValue({ role: UserRole.VENDOR });

    const ui = await RoleDashboardShell({
      section: "operations",
      children: <div>Operations Content</div>,
    });

    render(ui);

    expect(screen.queryByTestId("shell-header")).not.toBeInTheDocument();
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
