import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/features/ProductCard";
import { formatCurrency } from "@/lib/utils";

describe("ProductCard discount pricing", () => {
  const baseProps = {
    id: "product-1",
    name: "Premium Rice",
    price: 10000,
    image: "/rice.jpg",
    vendorName: "Harvest Vendor",
    vendorId: "vendor-1",
    stock: 10,
  };

  it("does not render strike-through original price when discount is 0", () => {
    render(<ProductCard {...baseProps} discount={0} />);

    const basePrice = formatCurrency(10000);
    expect(screen.getByText(basePrice)).toBeInTheDocument();
    expect(screen.queryByText("-0%")).not.toBeInTheDocument();

    const struckOutPrice = screen.queryByText(basePrice, { selector: "span.line-through" });
    expect(struckOutPrice).not.toBeInTheDocument();
  });

  it("renders discounted and original prices when discount is greater than zero", () => {
    render(<ProductCard {...baseProps} discount={20} />);

    const discountedPrice = formatCurrency(8000);
    const originalPrice = formatCurrency(10000);

    expect(screen.getByText(discountedPrice)).toBeInTheDocument();
    expect(screen.getByText("-20%")).toBeInTheDocument();
    expect(screen.getByText(originalPrice, { selector: "span.line-through" })).toBeInTheDocument();
  });
});
