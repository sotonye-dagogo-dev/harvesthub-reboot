import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  canBuyerRevise,
  nextRevisionCount,
  ServiceRevisionPanel,
} from "@/components/features/services/ServiceRevisionPanel";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => toastMock,
}));

describe("revision counter", () => {
  it("decrements by one and never goes negative", () => {
    expect(nextRevisionCount(3)).toBe(2);
    expect(nextRevisionCount(1)).toBe(0);
    expect(nextRevisionCount(0)).toBe(0);
  });

  it("keeps untracked (null) revisions untracked", () => {
    expect(nextRevisionCount(null)).toBeNull();
    expect(nextRevisionCount(undefined)).toBeNull();
  });

  it("only offers a revision to the buyer in IN_REVIEW with credits left", () => {
    expect(canBuyerRevise("BUYER", "IN_REVIEW", 1)).toBe(true);
    expect(canBuyerRevise("BUYER", "IN_REVIEW", 0)).toBe(false);
    expect(canBuyerRevise("BUYER", "IN_REVIEW", null)).toBe(false);
    expect(canBuyerRevise("BUYER", "IN_PROGRESS", 2)).toBe(false);
    expect(canBuyerRevise("VENDOR", "IN_REVIEW", 2)).toBe(false);
  });
});

describe("ServiceRevisionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decrements the visible counter when the buyer requests a revision", async () => {
    render(
      <ServiceRevisionPanel
        orderId="order-1"
        role="BUYER"
        status="IN_REVIEW"
        paymentStatus="PAID"
        revisionsRemaining={2}
      />,
    );

    expect(screen.getByText("2 revisions remaining")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /request revision/i }));

    expect(await screen.findByText("1 revision remaining")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/orders/order-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          note: "Buyer requested a revision from the order room.",
        }),
      }),
    );
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("offers the approve CTA to the buyer in IN_REVIEW on a paid order", () => {
    render(
      <ServiceRevisionPanel
        orderId="order-1"
        role="BUYER"
        status="IN_REVIEW"
        paymentStatus="PAID"
        revisionsRemaining={1}
      />,
    );
    expect(
      screen.getByRole("button", { name: /accept delivery & release/i }),
    ).toBeInTheDocument();
  });

  it("hides the revision UI from the seller and when revisions are untracked", () => {
    const { container: sellerView } = render(
      <ServiceRevisionPanel orderId="order-1" role="VENDOR" status="IN_REVIEW" revisionsRemaining={2} />,
    );
    expect(sellerView).toBeEmptyDOMElement();

    render(
      <ServiceRevisionPanel
        orderId="order-1"
        role="BUYER"
        status="IN_REVIEW"
        paymentStatus="PAID"
        revisionsRemaining={null}
      />,
    );
    expect(screen.queryByRole("button", { name: /request revision/i })).not.toBeInTheDocument();
    expect(screen.getByText(/revisions are not tracked/i)).toBeInTheDocument();
  });

  it("disables the revision CTA once credits are exhausted", () => {
    render(
      <ServiceRevisionPanel
        orderId="order-1"
        role="BUYER"
        status="IN_REVIEW"
        paymentStatus="PAID"
        revisionsRemaining={0}
      />,
    );
    expect(screen.getByRole("button", { name: /request revision/i })).toBeDisabled();
    expect(screen.getByText(/no revisions remaining/i)).toBeInTheDocument();
  });
});
