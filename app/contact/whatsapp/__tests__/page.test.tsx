import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WhatsAppContactGuardPage from "@/app/contact/whatsapp/page";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("WhatsAppContactGuardPage", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it("shows disclaimer and safe external handoff link", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        vendorName: "Fresh Farm",
        phone: "+234 801 234 5678",
        returnTo: "/vendors/vendor-1",
      })
    );

    render(<WhatsAppContactGuardPage />);

    expect(screen.getByText("Before you continue to WhatsApp")).toBeInTheDocument();
    expect(screen.getByText(/leave MyHarvestHub/i)).toBeInTheDocument();
    expect(screen.getByText(/complete payment only inside the platform checkout flow/i)).toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /continue to whatsapp/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /redirecting/i })).toBeDisabled();
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/telemetry/off-platform-contact",
      expect.objectContaining({ method: "POST", keepalive: true })
    );
  });

  it("blocks handoff when phone number is invalid", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        vendorName: "Fresh Farm",
        phone: "abc",
      })
    );

    render(<WhatsAppContactGuardPage />);

    expect(screen.queryByRole("button", { name: /continue to whatsapp/i })).not.toBeInTheDocument();
    expect(
      screen.getByText("This vendor’s WhatsApp number is currently unavailable.")
    ).toBeInTheDocument();
  });

  it("guards against protocol-relative return path injection", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        vendorName: "Fresh Farm",
        phone: "+2348012345678",
        returnTo: "//evil.example/path",
      })
    );

    render(<WhatsAppContactGuardPage />);

    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute("href", "/vendors");
  });
});
