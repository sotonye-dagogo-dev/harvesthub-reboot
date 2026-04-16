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

  it("renders fixed secondary info block for stable layout", () => {
    render(<VendorCard {...baseProps} isVerified description="Fresh farm supplies and grocery items." />);
    expect(screen.getByText("Fresh Hub")).toBeInTheDocument();
    expect(screen.getByText("Grocery")).toBeInTheDocument();
    expect(screen.getByText(/products/i)).toBeInTheDocument();
  });
});
