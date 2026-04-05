import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import OperationsLayout from "@/app/(operations)/operations/layout";

vi.mock("@/components/layout/RoleDashboardShell", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="operations-shell">{children}</div>
  ),
}));

describe("OperationsLayout", () => {
  it("uses operations shell route-group chrome", async () => {
    const ui = await OperationsLayout({ children: <div>Ops Child</div> });
    render(ui);

    expect(screen.getByTestId("operations-shell")).toBeInTheDocument();
    expect(screen.getByText("Ops Child")).toBeInTheDocument();
  });
});
