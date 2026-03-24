import { Redis } from '@upstash/redis';
import { env, featureFlags } from '@/lib/config';

export const REDIS_KEY_PREFIX = env.redisPrefix;

export function prefixKey(key: string): string {
  return `${REDIS_KEY_PREFIX}${key}`;
}

function createRedisClient(): Redis | null {
  if (!featureFlags.enableRedisCache) {
    return null;
  }

  const url = env.upstashUrl;
  const token = env.upstashToken;

  if (!url || !token) {
    console.warn(
      '[MyHarvestHub] Redis env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) are missing. ' +
        'Caching and rate limiting will be disabled.'
    );
    return null;
  }

  return new Redis({ url, token });
}

export const redis: Redis | null = createRedisClient();

/**
 * Get a cached value by key (auto-prefixed).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const data = await redis.get<T>(prefixKey(key));
    return data ?? null;
  } catch (error) {
    console.error(`[MyHarvestHub] Redis cacheGet error for key "${key}":`, error);
    return null;
  }
}

/**
 * Set a cached value by key (auto-prefixed) with optional TTL in seconds.
 */
export async function cacheSet(
  key: string,
  data: unknown,
  ttlSeconds?: number
): Promise<void> {
  if (!redis) return;

  try {
    const prefixed = prefixKey(key);
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await redis.set(prefixed, data, { ex: ttlSeconds });
    } else {
      await redis.set(prefixed, data);
    }
  } catch (error) {
    console.error(`[MyHarvestHub] Redis cacheSet error for key "${key}":`, error);
  }
}

/**
 * Delete a cached value by key (auto-prefixed).
 */
export async function cacheInvalidate(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(prefixKey(key));
  } catch (error) {
    console.error(`[MyHarvestHub] Redis cacheInvalidate error for key "${key}":`, error);
  }
}

/**
 * Delete all keys matching a pattern (auto-prefixed).
 * Uses SCAN to avoid blocking the server.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const prefixedPattern = prefixKey(pattern);
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: prefixedPattern,
        count: 1000,
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        for (const key of keys) {
          pipeline.del(key);
        }
        await pipeline.exec();
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error(
      `[MyHarvestHub] Redis cacheInvalidatePattern error for pattern "${pattern}":`,
      error
    );
  }
}
