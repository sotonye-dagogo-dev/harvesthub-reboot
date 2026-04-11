import { env } from "@/lib/config/env";

type PaymentProcessingConfigInput = {
  paystackPublicKey?: string | null;
  paystackSecretKey?: string | null;
};

function hasConfiguredKey(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolvePaymentProcessingEnabled(config: PaymentProcessingConfigInput): boolean {
  return hasConfiguredKey(config.paystackPublicKey) && hasConfiguredKey(config.paystackSecretKey);
}

export function isPaymentProcessingEnabled(): boolean {
  return resolvePaymentProcessingEnabled({
    paystackPublicKey: env.paystackPublicKey,
    paystackSecretKey: env.paystackSecretKey,
  });
}

export function getPaymentProcessingRuntimeConfig() {
  return {
    gateway: "PAYSTACK" as const,
    mode: env.paystackMode,
    paymentsEnabled: isPaymentProcessingEnabled(),
  };
}
