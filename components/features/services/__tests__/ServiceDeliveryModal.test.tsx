import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  canSellerDeliver,
  ServiceDeliveryModal,
} from "@/components/features/services/ServiceDeliveryModal";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => toastMock,
}));

describe("canSellerDeliver", () => {
  it("only lets the seller deliver from IN_PROGRESS", () => {
    expect(canSellerDeliver("VENDOR", "IN_PROGRESS")).toBe(true);
  });

  it("rejects buyers, admins and non-IN_PROGRESS statuses", () => {
    expect(canSellerDeliver("BUYER", "IN_PROGRESS")).toBe(false);
    expect(canSellerDeliver("ADMIN", "IN_PROGRESS")).toBe(false);
    expect(canSellerDeliver("VENDOR", "IN_REVIEW")).toBe(false);
    expect(canSellerDeliver("VENDOR", "PENDING")).toBe(false);
    expect(canSellerDeliver(null, "IN_PROGRESS")).toBe(false);
  });
});

describe("ServiceDeliveryModal", () => {
  it("shows the delivery CTA to the seller", () => {
    render(<ServiceDeliveryModal orderId="order-1" role="VENDOR" status="IN_PROGRESS" />);
    expect(screen.getByRole("button", { name: /submit delivery/i })).toBeInTheDocument();
  });

  it("hides the delivery CTA from the buyer and from other statuses", () => {
    const { container: buyerView } = render(
      <ServiceDeliveryModal orderId="order-1" role="BUYER" status="IN_PROGRESS" />,
    );
    expect(buyerView).toBeEmptyDOMElement();

    const { container: sellerIdleView } = render(
      <ServiceDeliveryModal orderId="order-1" role="VENDOR" status="IN_REVIEW" />,
    );
    expect(sellerIdleView).toBeEmptyDOMElement();
  });
});
