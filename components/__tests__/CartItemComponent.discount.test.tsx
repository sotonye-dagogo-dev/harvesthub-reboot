import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartItemComponent } from "@/components/features/CartItemComponent";
import { formatCurrency } from "@/lib/utils";

describe("CartItemComponent discount pricing", () => {
  const baseProps = {
    id: "cart-item-1",
    name: "Premium Rice",
    price: 8000,
    originalPrice: 10000,
    discountPercent: 20,
    quantity: 2,
    image: "/rice.jpg",
    vendorName: "Harvest Vendor",
    stock: 10,
    onUpdateQuantity: () => undefined,
    onRemove: () => undefined,
  };

  it("renders discounted price with original amount and percent stacked below it", () => {
    render(<CartItemComponent {...baseProps} />);

    expect(screen.getByText(formatCurrency(8000))).toBeInTheDocument();
    expect(
      screen.getByText(formatCurrency(10000), { selector: "span.line-through" })
    ).toBeInTheDocument();
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });
});
