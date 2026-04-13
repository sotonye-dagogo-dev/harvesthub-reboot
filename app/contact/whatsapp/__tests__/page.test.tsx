import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppContactGuardPage from "@/app/contact/whatsapp/page";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("WhatsAppContactGuardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows disclaimer and safe external handoff link", () => {
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

    const continueLink = screen.getByRole("link", { name: /continue to whatsapp/i });
    expect(continueLink).toHaveAttribute("href", "https://wa.me/2348012345678");
  });

  it("blocks handoff when phone number is invalid", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        vendorName: "Fresh Farm",
        phone: "abc",
      })
    );

    render(<WhatsAppContactGuardPage />);

    expect(screen.queryByRole("link", { name: /continue to whatsapp/i })).not.toBeInTheDocument();
    expect(
      screen.getByText("This vendor’s WhatsApp number is currently unavailable.")
    ).toBeInTheDocument();
  });
});
