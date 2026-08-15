import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { SmartResourceState } from "@/lib/hooks/useSmartResource";
import type { AuthUser } from "@/lib/contexts/AuthContext";
import { UserRole } from "@/lib/constants";

const useAuthMock = vi.fn();
const useSmartResourceMock = vi.fn();

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: () => useSmartResourceMock(),
}));

vi.mock("@/components/ui/RoleAwareFeatureRenderer", () => ({
  RoleAwareFeatureRenderer: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/features/OrderCard", () => ({
  OrderCard: ({ orderNumber }: { orderNumber: string }) => <div>{orderNumber}</div>,
}));

vi.mock("@/components/layout", () => ({
  ClientDashboardShell: ({
    sidebarType,
    children,
  }: {
    sidebarType: "admin" | "vendor";
    children: ReactNode;
  }) => (
    <div data-testid="dashboard-shell" data-sidebar={sidebarType}>
      {children}
    </div>
  ),
}));

import OrdersPage from "@/app/orders/page";

function makeResourceState(overrides?: Partial<SmartResourceState<any>>): SmartResourceState<any> {
  return {
    data: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdatedAt: null,
    refresh: vi.fn(async () => undefined),
    mutate: vi.fn(),
    ...overrides,
  };
}

function makeUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "user-1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    phoneNumber: "08000000000",
    role: UserRole.ADMIN,
    emailVerified: true,
    isActive: true,
    ...overrides,
  } as AuthUser;
}

describe("OrdersPage client runtime behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login prompt when user is missing", () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    useSmartResourceMock.mockReturnValue(makeResourceState());

    render(<OrdersPage />);

    expect(screen.getByText(/please log in to view orders/i)).toBeInTheDocument();
  });

  it("wraps admin orders in dashboard shell and renders order cards", () => {
    useAuthMock.mockReturnValue({ user: makeUser({ role: UserRole.ADMIN }), isLoading: false });
    useSmartResourceMock.mockReturnValue(
      makeResourceState({
        data: {
          orders: [
            {
              id: "order-1",
              orderNumber: "ORD-1001",
              status: "PENDING",
              total: 1200,
              deliveryMethod: "DELIVERY",
              deliveryAddress: { address: "Campus Avenue" },
              createdAt: new Date().toISOString(),
              items: [],
            },
          ],
          pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
        },
      })
    );

    render(<OrdersPage />);

    expect(screen.getByTestId("dashboard-shell")).toHaveAttribute("data-sidebar", "admin");
    expect(screen.getByText("ORD-1001")).toBeInTheDocument();
  });
});
