/**
 * OrderCard Component Tests
 * Tests the OrderCard component with enum types
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderCard } from "@/components/features/OrderCard";
import { OrderStatus, DeliveryMethod } from "@/lib/constants";

describe("OrderCard Component", () => {
  const mockOrderProps = {
    id: "order-1",
    orderNumber: "ORD-001",
    status: OrderStatus.PENDING,
    total: 5000,
    itemCount: 3,
    deliveryMethod: DeliveryMethod.DELIVERY,
    createdAt: new Date("2026-02-01").toISOString(),
  };

  describe("Rendering", () => {
    it("should render order number correctly", () => {
      render(<OrderCard {...mockOrderProps} />);

      expect(screen.getByText(/ORD-001/i)).toBeInTheDocument();
    });

    it("should render order total correctly", () => {
      render(<OrderCard {...mockOrderProps} />);

      expect(screen.getByText(/₦5,000\.00/i)).toBeInTheDocument();
    });

    it("should render item count correctly", () => {
      render(<OrderCard {...mockOrderProps} />);

      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });

    it("should render singular item text for one item", () => {
      render(<OrderCard {...mockOrderProps} itemCount={1} />);

      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });
  });

  describe("Order Status Display", () => {
    it("should display PENDING status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.PENDING} />);

      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    it("should display CONFIRMED status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.CONFIRMED} />);

      expect(screen.getByText(/Confirmed/i)).toBeInTheDocument();
    });

    it("should display PROCESSING status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.PROCESSING} />);

      expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    });

    it("should display READY status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.READY} />);

      expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    });

    it("should display COMPLETED status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.COMPLETED} />);

      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    });

    it("should display CANCELLED status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.CANCELLED} />);

      expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
    });

    it("should display REFUNDED status", () => {
      render(<OrderCard {...mockOrderProps} status={OrderStatus.REFUNDED} />);

      expect(screen.getByText(/Refunded/i)).toBeInTheDocument();
    });
  });

  describe("Delivery Method Display", () => {
    it("should display pickup information", () => {
      render(<OrderCard {...mockOrderProps} deliveryMethod={DeliveryMethod.PICKUP} />);

      expect(screen.getByText(/Pickup/i)).toBeInTheDocument();
    });

    it("should display delivery information", () => {
      render(<OrderCard {...mockOrderProps} deliveryMethod={DeliveryMethod.DELIVERY} />);

      expect(screen.getByText(/Delivery/i)).toBeInTheDocument();
    });

    it("should display custom delivery info when provided", () => {
      render(<OrderCard {...mockOrderProps} deliveryInfo="Lagos, VI" />);

      expect(screen.getByText(/Lagos, VI/i)).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format creation date correctly", () => {
      render(<OrderCard {...mockOrderProps} />);

      expect(screen.getByText(/Feb 1, 2026/i)).toBeInTheDocument();
    });

    it("should display estimated date when provided", () => {
      const propsWithEstimate = {
        ...mockOrderProps,
        estimatedDate: new Date("2026-02-05").toISOString(),
      };

      render(<OrderCard {...propsWithEstimate} />);

      expect(screen.getByText(/Estimated.*Feb 5, 2026/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render as a clickable link", () => {
      const { container } = render(<OrderCard {...mockOrderProps} />);

      const link = container.querySelector("a");
      expect(link).toBeInTheDocument();
      expect(link?.href).toContain("/orders/order-1");
    });

    it("should be keyboard accessible", () => {
      const { container } = render(<OrderCard {...mockOrderProps} />);

      const link = container.querySelector("a");
      expect(link).toHaveAttribute("href");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large order totals", () => {
      render(<OrderCard {...mockOrderProps} total={1000000} />);

      expect(screen.getByText(/₦1,000,000\.00/i)).toBeInTheDocument();
    });

    it("should handle zero items gracefully", () => {
      render(<OrderCard {...mockOrderProps} itemCount={0} />);

      expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    });

    it("should handle custom className", () => {
      const { container } = render(<OrderCard {...mockOrderProps} className="custom-class" />);

      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });
});
