import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import OrderDetailPage from "@/app/orders/[id]/page";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order-1" }),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/components/ui", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OrderDetailPage eligibility and grouped action visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { role: "BUYER" } });
  });

  it("shows buyer cancel action only for eligible statuses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        order: {
          id: "order-1",
          orderNumber: "MHH-001",
          status: "PROCESSING",
          paymentStatus: "PAID",
          deliveryMethod: "DELIVERY",
          total: 1000,
          createdAt: new Date().toISOString(),
          statusHistory: [],
          items: [],
          transactions: [],
        },
      })
    );

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel order/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /request refund/i })).toBeInTheDocument();
  });

  it("shows grouped bulk action buttons when grouped orders are present", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url.includes("/api/orders/order-1")) {
        return Promise.resolve(
          jsonResponse({
            order: {
              id: "order-1",
              orderNumber: "MHH-001",
              orderGroupId: "GRP-1",
              status: "DELIVERED",
              paymentStatus: "PAID",
              deliveryMethod: "DELIVERY",
              total: 1000,
              createdAt: new Date().toISOString(),
              statusHistory: [
                {
                  status: "PAYMENT_RECORDED",
                  timestamp: new Date().toISOString(),
                  note: "created",
                },
              ],
              items: [],
              transactions: [],
            },
          })
        );
      }

      if (url.includes("/api/orders") && url.includes("groupId=")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            orders: [
              {
                id: "order-1",
                orderNumber: "MHH-001",
                status: "DELIVERED",
                paymentStatus: "PAID",
                total: 1000,
              },
              {
                id: "order-2",
                orderNumber: "MHH-002",
                status: "PROCESSING",
                paymentStatus: "PAID",
                total: 1200,
              },
            ],
          })
        );
      }

      return Promise.resolve(
        jsonResponse({
          success: true,
          orders: [
            {
              id: "order-1",
              orderNumber: "MHH-001",
              status: "DELIVERED",
              paymentStatus: "PAID",
              total: 1000,
            },
            {
              id: "order-2",
              orderNumber: "MHH-002",
              status: "PROCESSING",
              paymentStatus: "PAID",
              total: 1200,
            },
          ],
        })
      );
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/group id: grp-1/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /bulk cancel eligible/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /bulk refund request/i })).toBeInTheDocument();
    });
  });
});
