export type PaymentInitializeErrorCode =
  | "PAYMENT_PROVIDER_IP_NOT_ALLOWED"
  | "PAYMENT_PROVIDER_AUTH_INVALID"
  | "PAYMENT_PROVIDER_UNAVAILABLE"
  | "PAYMENT_INITIALIZE_FAILED";

export interface PaymentInitializeErrorMapping {
  code: PaymentInitializeErrorCode;
  message: string;
  operatorAction: string;
}

function normalizeErrorMessage(message: string): string {
  return message.trim().toLowerCase();
}

export function mapPaymentInitializeError(message: string): PaymentInitializeErrorMapping {
  const normalized = normalizeErrorMessage(message);

  if (normalized.includes("ip address is not allowed")) {
    return {
      code: "PAYMENT_PROVIDER_IP_NOT_ALLOWED",
      message:
        "Payment initialization is temporarily restricted. Please try again shortly or use bank transfer.",
      operatorAction:
        "Update Paystack API IP allowlist: for Vercel/serverless use static egress or disable API IP restriction, then confirm keys/mode in /operations/settings.",
    };
  }

  if (normalized.includes("invalid key") || normalized.includes("unauthorized")) {
    return {
      code: "PAYMENT_PROVIDER_AUTH_INVALID",
      message:
        "Payment setup is temporarily unavailable. Please try again later or use bank transfer.",
      operatorAction:
        "Verify Paystack secret/public keys and mode alignment in /operations/settings.",
    };
  }

  if (
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("unavailable") ||
    normalized.includes("ssl") ||
    normalized.includes("tls") ||
    normalized.includes("fetch failed")
  ) {
    return {
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      message:
        "Payment provider is temporarily unavailable. Please retry shortly or use bank transfer.",
      operatorAction:
        "Check provider status and environment network egress, then retry initialization from checkout/wallet.",
    };
  }

  return {
    code: "PAYMENT_INITIALIZE_FAILED",
    message: "Unable to initialize payment right now. Please retry or use bank transfer.",
    operatorAction:
      "Review payment initialize logs and Paystack gateway panel in /operations/settings.",
  };
}
