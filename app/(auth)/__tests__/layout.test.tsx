import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthLayout from "@/app/(auth)/layout";

vi.mock("@/components/layout", () => ({
  Footer: () => <div data-testid="auth-footer" />,
}));

describe("AuthLayout", () => {
  it("renders footer and does not render nested operations header", () => {
    render(
      <AuthLayout>
        <div>Auth Child</div>
      </AuthLayout>
    );

    expect(screen.getByTestId("auth-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-header")).not.toBeInTheDocument();
  });
});
