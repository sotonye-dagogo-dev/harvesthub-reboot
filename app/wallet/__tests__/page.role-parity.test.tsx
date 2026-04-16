import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import WalletPage from "@/app/wallet/page";
import { UserRole } from "@/lib/constants";
import { WALLET_SYNC_EVENT } from "@/lib/utils/walletSync";

const { useAuthMock, useSmartResourceMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useSmartResourceMock: vi.fn(),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: (...args: unknown[]) => useSmartResourceMock(...args),
}));

vi.mock("@/lib/data-runtime/mutationCoordinator", () => ({
  runOptimisticMutation: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  ClientDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SimplePagination: () => <div>pagination</div>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  SectionLoader: () => <div>loading</div>,
}));

function buildWalletResource() {
  return {
    data: {
      wallet: {
        id: "wallet-1",
        userId: "user-1",
        balance: 12000,
        availableBalance: 9000,
        pendingWithdrawals: 3000,
      },
      transactions: [],
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(async () => undefined),
  };
}

function buildPaymentResource() {
  return {
    data: { paymentsEnabled: true, gatewayReady: true },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(async () => undefined),
  };
}

describe("WalletPage role parity and balance invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin deposit and withdrawal actions", () => {
    useAuthMock.mockReturnValue({ user: { id: "admin-1", role: UserRole.ADMIN } });
    useSmartResourceMock
      .mockReturnValueOnce(buildWalletResource())
      .mockReturnValueOnce(buildPaymentResource());

    render(<WalletPage />);

    const depositButton = screen.getByRole("button", { name: /deposit/i });
    const withdrawButton = screen.getByRole("button", { name: /withdraw/i });

    expect(depositButton).toBeEnabled();
    expect(withdrawButton).toBeEnabled();
    expect(screen.getAllByText(/available/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("wallet-action-row").className).toContain("sm:grid-cols-2");
  });

  it("keeps withdraw action enabled for buyers", () => {
    useAuthMock.mockReturnValue({ user: { id: "buyer-1", role: UserRole.BUYER } });
    useSmartResourceMock
      .mockReturnValueOnce(buildWalletResource())
      .mockReturnValueOnce(buildPaymentResource());

    render(<WalletPage />);

    const depositButton = screen.getByRole("button", { name: /deposit/i });
    const withdrawButton = screen.getByRole("button", { name: /withdraw/i });

    expect(depositButton).toBeEnabled();
    expect(withdrawButton).toBeEnabled();
  });

  it("reconciles wallet card on wallet sync events", async () => {
    const refreshSpy = vi.fn(async () => undefined);
    useAuthMock.mockReturnValue({ user: { id: "vendor-1", role: UserRole.VENDOR } });
    useSmartResourceMock
      .mockReturnValueOnce({ ...buildWalletResource(), refresh: refreshSpy })
      .mockReturnValueOnce(buildPaymentResource());

    render(<WalletPage />);

    await waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(
      new CustomEvent(WALLET_SYNC_EVENT, {
        detail: {
          reason: "order-cancel",
          timestamp: Date.now(),
        },
      })
    );

    await waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledTimes(2);
    });
  });
});
