import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VendorCard } from "@/components/features/VendorCard";

describe("VendorCard", () => {
  const baseProps = {
    id: "vendor-1",
    name: "Fresh Hub",
    category: "Grocery",
    campus: "LEKKI",
  };

  it("shows verified badge when vendor is verified", () => {
    render(<VendorCard {...baseProps} isVerified />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("shows unverified badge when vendor is not verified", () => {
    render(<VendorCard {...baseProps} isVerified={false} />);
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });
});
