import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { App } from "antd";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

const fetchMock = vi.fn();

function renderPage() {
  return render(
    <App>
      <ForgotPasswordPage />
    </App>
  );
}

async function submitEmail(email = "someone@example.com") {
  fireEvent.change(screen.getByPlaceholderText("your.email@example.com"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
}

describe("ForgotPasswordPage feedback", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows the 'link sent' success view only when the API reports success", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    renderPage();
    await submitEmail();

    await waitFor(() => {
      expect(screen.getByText("Check Your Email")).toBeInTheDocument();
    });
    expect(screen.getByText(/We've sent password reset instructions/)).toBeInTheDocument();
  });

  it("shows a meaningful 'no account found' message instead of the success view for an unknown email", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: "No account found with that email address.",
          code: "USER_NOT_FOUND",
        }),
        { status: 404 }
      )
    );
    renderPage();
    await submitEmail();

    await waitFor(() => {
      expect(
        screen.getByText("No account found with that email address")
      ).toBeInTheDocument();
    });
    // Must NOT pretend a link was sent
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
    expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
  });

  it("shows a delivery-failed warning when the reset email could not be sent", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error:
            "We couldn't send the reset email right now. Please try again in a few minutes.",
          code: "EMAIL_DELIVERY_FAILED",
        }),
        { status: 502 }
      )
    );
    renderPage();
    await submitEmail();

    await waitFor(() => {
      expect(screen.getByText("We couldn't send the reset email")).toBeInTheDocument();
    });
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
  });
});