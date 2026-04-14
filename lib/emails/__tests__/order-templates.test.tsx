import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderConfirmation } from "@/lib/emails/OrderConfirmation";
import { OrderStatusUpdate } from "@/lib/emails/OrderStatusUpdate";

describe("order email template completeness", () => {
  it("renders grouped metadata and structured totals in confirmation template", () => {
    render(
      <OrderConfirmation
        firstName="Ada"
        buyerEmail="ada@example.com"
        orderNumber="MHH-1001"
        orderGroupId="GRP-1001"
        items={[{ name: "Fresh Yam", quantity: 2, price: 3500 }]}
        subtotal={7000}
        deliveryFee={1500}
        total={8500}
        deliveryMethod="DELIVERY"
        deliveryAddress="12 Market Street"
        vendorName="Fresh Farm"
      />
    );

    expect(screen.getByText(/order number/i)).toBeInTheDocument();
    expect(screen.getByText(/grouped checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/grp-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/buyer email/i)).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/^Vendor$/)).toBeInTheDocument();
    expect(screen.getAllByText(/fresh farm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery fee/i)).toBeInTheDocument();
    expect(screen.getByText(/^Total$/)).toBeInTheDocument();
  });

  it("renders grouped and payment metadata rows in status update template", () => {
    render(
      <OrderStatusUpdate
        firstName="Ada"
        orderNumber="MHH-1002"
        orderGroupId="GRP-1002"
        status="OUT_FOR_DELIVERY"
        vendorName="Harvest Home"
        total={9200}
        paymentStatus="PAID"
        note="Rider is en route"
      />
    );

    expect(screen.getByText(/grouped checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/grp-1002/i)).toBeInTheDocument();
    expect(screen.getByText(/order total/i)).toBeInTheDocument();
    expect(screen.getByText(/payment status/i)).toBeInTheDocument();
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    expect(screen.getByText(/note from vendor/i)).toBeInTheDocument();
  });
});
