import { env } from '@/lib/config/env';

export const featureFlags = {
  usePrisma: env.usePrisma,
  enableMockBackend: env.enableMockBackend,
  enableEmail: env.enableEmail,
  enablePushNotifications: env.enablePushNotifications,
  enableRedisCache: env.enableRedisCache,
} as const;
