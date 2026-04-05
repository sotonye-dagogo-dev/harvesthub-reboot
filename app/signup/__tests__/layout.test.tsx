import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignupLayout from "@/app/signup/layout";

const mocks = vi.hoisted(() => {
  return {
    pathname: "/signup",
    push: vi.fn(),
    formData: { userType: "buyer" as "buyer" | "vendor" },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mocks.pathname,
}));

vi.mock("@/app/providers", () => ({
  useFormData: () => ({
    formData: mocks.formData,
  }),
}));

vi.mock("@/components/layout", () => ({
  Footer: () => <div data-testid="signup-footer" />, // Minimal stable footer stub for layout rendering tests.
}));

describe("SignupLayout", () => {
  beforeEach(() => {
    mocks.pathname = "/signup";
    mocks.formData = { userType: "buyer" };
    vi.clearAllMocks();
  });

  it("filters vendor-only stages for buyers", () => {
    mocks.pathname = "/signup/account-info";
    mocks.formData = { userType: "buyer" };

    render(
      <SignupLayout>
        <div>Signup Child</div>
      </SignupLayout>
    );

    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    expect(screen.queryByText("Store Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Verify Documents")).not.toBeInTheDocument();
  });

  it("keeps full stage list for vendors", () => {
    mocks.pathname = "/signup/store-info";
    mocks.formData = { userType: "vendor" };

    render(
      <SignupLayout>
        <div>Signup Child</div>
      </SignupLayout>
    );

    expect(screen.getByText("Step 3 of 6")).toBeInTheDocument();
    expect(screen.getAllByText("Store Details").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Verify Documents").length).toBeGreaterThan(0);
  });

  it("navigates back to the previous filtered stage", () => {
    mocks.pathname = "/signup/account-info";
    mocks.formData = { userType: "buyer" };

    render(
      <SignupLayout>
        <div>Signup Child</div>
      </SignupLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(mocks.push).toHaveBeenCalledWith("/signup/user-info");
  });

  it("keeps signup route-group footer without nested header regression", () => {
    render(
      <SignupLayout>
        <div>Signup Child</div>
      </SignupLayout>
    );

    expect(screen.getByTestId("signup-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("shell-header")).not.toBeInTheDocument();
  });
});
