import { env } from '@/lib/config/env';

export const featureFlags = {
  enableEmail: env.enableEmail,
  enablePushNotifications: env.enablePushNotifications,
  enableRedisCache: env.enableRedisCache,
  enablePaystackWebhooks: env.paystackWebhooksEnabled,
  enableBankTransferFallback: env.paymentFallbackBankTransfer,
  /** Service marketplace listings (wizard + storefront panel). Default ON. */
  serviceListingEnabled: process.env.SERVICE_LISTING_ENABLED !== 'false',
} as const;


/** Service marketplace kill switch (wizard + storefront panel + nav entry). */
export const serviceListingEnabled: boolean = featureFlags.serviceListingEnabled;
