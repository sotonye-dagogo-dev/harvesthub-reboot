import { describe, expect, it } from "vitest";
import { resolvePaymentProcessingEnabled } from "@/lib/config/payments";

describe("resolvePaymentProcessingEnabled", () => {
  it("returns true when both Paystack keys are configured", () => {
    expect(
      resolvePaymentProcessingEnabled({
        paystackPublicKey: "pk_test_123",
        paystackSecretKey: "sk_test_456",
      })
    ).toBe(true);
  });

  it("returns false when either key is missing", () => {
    expect(
      resolvePaymentProcessingEnabled({
        paystackPublicKey: "pk_test_123",
        paystackSecretKey: "",
      })
    ).toBe(false);
    expect(
      resolvePaymentProcessingEnabled({
        paystackPublicKey: "",
        paystackSecretKey: "sk_test_456",
      })
    ).toBe(false);
  });
});
