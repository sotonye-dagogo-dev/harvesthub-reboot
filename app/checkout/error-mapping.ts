export type CheckoutErrorPayload = {
  code?: string;
  error?: string;
  verification?: { status?: string };
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
    return "Payment verification failed. Your order was not placed.";
  }

  return error.error || "Failed to place order";
}
