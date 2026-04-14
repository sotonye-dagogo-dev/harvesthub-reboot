import { describe, expect, it } from "vitest";
import { mapCheckoutErrorMessage } from "@/app/checkout/error-mapping";

describe("checkout error mapping contract", () => {
  it("maps insufficient wallet balance code", () => {
    expect(
      mapCheckoutErrorMessage({ code: "INSUFFICIENT_WALLET_BALANCE", error: "raw" })
    ).toBe("Insufficient wallet balance for this checkout.");
  });

  it("maps wallet unavailable code", () => {
    expect(
      mapCheckoutErrorMessage({ code: "WALLET_NOT_AVAILABLE", error: "raw" })
    ).toBe("Wallet payment is currently unavailable. Choose another payment method.");
  });

  it("maps payment verification provider-not-found contract", () => {
    expect(
      mapCheckoutErrorMessage({
        code: "PAYMENT_VERIFICATION_FAILED",
        verification: { status: "NOT_FOUND" },
      })
    ).toBe("Payment reference was not found by the provider. Please retry payment initialization.");
  });

  it("falls back to generic verification failure message", () => {
    expect(
      mapCheckoutErrorMessage({
        code: "PAYMENT_VERIFICATION_FAILED",
        verification: { status: "FAILED" },
      })
    ).toBe("Payment verification failed. Your order was not placed.");
  });

  it("falls back to payload error when no known code exists", () => {
    expect(mapCheckoutErrorMessage({ error: "Custom error" })).toBe("Custom error");
  });
});
