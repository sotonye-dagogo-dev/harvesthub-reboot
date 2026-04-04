import { env } from '@/lib/config/env';

export const featureFlags = {
  enableEmail: env.enableEmail,
  enablePushNotifications: env.enablePushNotifications,
  enableRedisCache: env.enableRedisCache,
  enablePaystackWebhooks: env.paystackWebhooksEnabled,
  enableBankTransferFallback: env.paymentFallbackBankTransfer,
} as const;
