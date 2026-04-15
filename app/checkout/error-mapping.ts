export type CheckoutErrorPayload = {
  code?: string;
  error?: string;
  verification?: { status?: string; providerStatus?: string; message?: string };
};

export function mapCheckoutErrorMessage(error: CheckoutErrorPayload): string {
  if (error.code === "INSUFFICIENT_WALLET_BALANCE") {
    return "Insufficient wallet balance for this checkout.";
  }

  if (error.code === "WALLET_NOT_AVAILABLE") {
    return "Wallet payment is currently unavailable. Choose another payment method.";
  }

  if (error.code === "PAYMENT_VERIFICATION_FAILED") {
    if (error.verification?.status === "NOT_FOUND") {
      return "Payment reference was not found by the provider. Please retry payment initialization.";
    }
    if (error.verification?.status === "PENDING") {
      return "Payment is still pending with the provider. Complete payment and retry verification.";
    }
    if (error.verification?.status === "GATEWAY_UNAVAILABLE") {
      return "Payment gateway is unavailable right now. Please use wallet checkout or retry later.";
    }
    if (error.verification?.status === "FAILED") {
      return error.verification?.message || "Payment was declined by the provider. Your order was not placed.";
    }
    return "Payment verification failed. Your order was not placed.";
  }

  if (error.code === "PAYMENT_GATEWAY_UNAVAILABLE") {
    return "Card payment is temporarily unavailable. Please use wallet checkout or retry later.";
  }

  if (error.code === "PAYMENT_AMOUNT_MISMATCH") {
    return "Payment amount could not be verified for this checkout. Please start payment again.";
  }

  if (error.code === "PAYMENT_CURRENCY_MISMATCH") {
    return "Payment currency could not be verified for this checkout. Please start payment again.";
  }

  return error.error || "Failed to place order";
}
