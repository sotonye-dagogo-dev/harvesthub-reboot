import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGuestGuard } from "../useGuestGuard";

const { currentUserRef, notifyMock, pushMock } = vi.hoisted(() => ({
  currentUserRef: { value: null as null | { userId: string; role: string } },
  notifyMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: currentUserRef.value }),
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function GuardHarness() {
  const { requireAuth } = useGuestGuard();

  return (
    <button type="button" onClick={() => requireAuth("add items to your cart")}>
      Trigger
    </button>
  );
}

describe("useGuestGuard", () => {
  beforeEach(() => {
    currentUserRef.value = null;
    notifyMock.mockReset();
    pushMock.mockReset();
  });

  it("shows a toast with login and signup actions for guests", async () => {
    const user = userEvent.setup();
    render(<GuardHarness />);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(notifyMock).toHaveBeenCalledTimes(1);
    const payload = notifyMock.mock.calls[0]![0]!;
    expect(payload.type).toBe("info");
    expect(payload.message).toBe("Sign in required");
    expect(payload.description).toContain("add items to your cart");
    expect(payload.btn.type).toBe("div");
    expect(payload.btn.props.children[0].props.children).toBe("Log in");
    expect(payload.btn.props.children[1].props.children).toBe("Sign up");
  });

  it("allows authenticated users to continue without notifying", async () => {
    currentUserRef.value = { userId: "user-1", role: "BUYER" };
    const user = userEvent.setup();
    render(<GuardHarness />);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(notifyMock).not.toHaveBeenCalled();
  });
});
