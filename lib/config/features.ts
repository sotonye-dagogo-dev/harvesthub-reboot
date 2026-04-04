import { env } from '@/lib/config/env';

export const featureFlags = {
  enableEmail: env.enableEmail,
  enablePushNotifications: env.enablePushNotifications,
  enableRedisCache: env.enableRedisCache,
} as const;
