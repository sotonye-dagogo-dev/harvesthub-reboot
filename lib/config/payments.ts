import { env } from "@/lib/config/env";
import { PLATFORM_DEFAULTS } from "@/lib/constants";

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

export async function getPaymentProcessingRuntimeConfig() {
  let paymentsEnabled: boolean = PLATFORM_DEFAULTS.PAYMENTS_ENABLED;
  let minOrderAmount: number = PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT;
  let maxBookingAdvanceDays: number = PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS;

  try {
    const [{ prisma }, { getCommerceLifecycleConfig }] = await Promise.all([
      import("@/lib/db/prisma"),
      import("@/lib/services/commerceConfig"),
    ]);
    const commerceConfig = await getCommerceLifecycleConfig(prisma);
    paymentsEnabled = commerceConfig.paymentsEnabled;
    minOrderAmount = commerceConfig.minOrderAmount;
    maxBookingAdvanceDays = commerceConfig.maxBookingAdvanceDays;
  } catch {
    // Keep static defaults when DB-backed config cannot be read.
  }

  return {
    gateway: "PAYSTACK" as const,
    mode: env.paystackMode,
    paymentsEnabled,
    minOrderAmount,
    maxBookingAdvanceDays,
  };
}
