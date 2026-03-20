import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  USE_PRISMA: z.string().optional(),
  ENABLE_MOCK_BACKEND: z.string().optional(),
  ENABLE_EMAIL: z.string().optional(),
  ENABLE_PUSH_NOTIFICATIONS: z.string().optional(),
  ENABLE_REDIS_CACHE: z.string().optional(),
  REDIS_PREFIX: z.string().optional(),
  CLOUDINARY_ROOT_FOLDER: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_EMAIL_FROM: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  EMAIL_RETRY_ATTEMPTS: z.string().optional(),
  EMAIL_RETRY_BASE_DELAY_MS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

const raw = parsed.data;

/**
 * Naming convention:
 * ENV vars remain UPPER_SNAKE_CASE in process.env while exported config values
 * are normalized to camelCase for TypeScript ergonomics.
 */
function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue <= 0) return fallback;
  return parsedValue;
}

export const env = {
  nodeEnv: raw.NODE_ENV,
  usePrisma: toBoolean(raw.USE_PRISMA, raw.NODE_ENV === 'production'),
  enableMockBackend: toBoolean(raw.ENABLE_MOCK_BACKEND, raw.NODE_ENV !== 'production'),
  enableEmail: toBoolean(raw.ENABLE_EMAIL, true),
  enablePushNotifications: toBoolean(raw.ENABLE_PUSH_NOTIFICATIONS, true),
  enableRedisCache: toBoolean(raw.ENABLE_REDIS_CACHE, true),
  redisPrefix: raw.REDIS_PREFIX || 'harvesthub:',
  cloudinaryRootFolder: raw.CLOUDINARY_ROOT_FOLDER || 'myharvesthub',
  upstashUrl: raw.UPSTASH_REDIS_REST_URL,
  upstashToken: raw.UPSTASH_REDIS_REST_TOKEN,
  resendApiKey: raw.RESEND_API_KEY,
  emailFrom: raw.NEXT_PUBLIC_EMAIL_FROM || 'noreply@myharvesthub.ng',
  vapidPublicKey: raw.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivateKey: raw.VAPID_PRIVATE_KEY,
  vapidSubject: raw.VAPID_SUBJECT,
  emailRetryAttempts: toPositiveInt(raw.EMAIL_RETRY_ATTEMPTS, 3),
  emailRetryBaseDelayMs: toPositiveInt(raw.EMAIL_RETRY_BASE_DELAY_MS, 500),
} as const;

export type EnvConfig = typeof env;
