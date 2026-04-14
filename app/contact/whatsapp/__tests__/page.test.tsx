import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WhatsAppContactGuardPage from "@/app/contact/whatsapp/page";

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("WhatsAppContactGuardPage", () => {
  const mockFetch = vi.fn();
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.spyOn(window, "open").mockImplementation(mockWindowOpen as unknown as typeof window.open);
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

    const continueButton = screen.getByRole("button", { name: /continue to whatsapp/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://wa.me/${normalizePhone("+234 801 234 5678")}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/telemetry/off-platform-contact",
      expect.objectContaining({ method: "POST" })
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
