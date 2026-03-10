import { NextResponse } from 'next/server';
import { redis, prefixKey } from '@/lib/cache/redis';

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  limit?: number;
  /** Window size in seconds */
  window?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  reset: number;
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * Each request is stored as a member with a score equal to its timestamp.
 * Expired entries are pruned on every check, and the current count is
 * compared against the limit.
 */
async function slidingWindowRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!redis) {
    // Graceful degradation: allow the request when Redis is unavailable
    console.warn('[HarvestHub] Redis unavailable — rate limit check skipped.');
    return { success: true, remaining: limit, reset: 0 };
  }

  const key = prefixKey(`ratelimit:${identifier}`);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const resetTimestamp = Math.ceil(now / 1000) + windowSeconds;

  try {
    // Use a pipeline to atomically prune + add + count + set TTL
    const pipeline = redis.pipeline();

    // 1. Remove entries outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 2. Add the current request (unique member via timestamp + random suffix)
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    pipeline.zadd(key, { score: now, member });

    // 3. Count entries in the window
    pipeline.zcard(key);

    // 4. Set key expiry so it auto-cleans after the window elapses
    pipeline.expire(key, windowSeconds + 1);

    const results = await pipeline.exec();

    // zcard result is the third command (index 2)
    const currentCount = results[2] as number;
    const remaining = Math.max(0, limit - currentCount);
    const success = currentCount <= limit;

    // If over limit, remove the entry we just added (it shouldn't count)
    if (!success) {
      await redis.zrem(key, member);
    }

    return { success, remaining, reset: resetTimestamp };
  } catch (error) {
    console.error('[HarvestHub] Rate limit check failed:', error);
    // Fail open: allow the request if Redis errors out
    return { success: true, remaining: limit, reset: 0 };
  }
}

/**
 * Extract client IP from the request.
 * Checks common proxy headers before falling back to a default.
 */
function getClientIP(request: Request): string {
  const headers = new Headers(request.headers);

  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

/**
 * Rate limit by client IP address.
 * Default: 60 requests per 60-second window.
 */
export async function rateLimitByIP(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 60, window: windowSeconds = 60 } = options;
  const ip = getClientIP(request);
  return slidingWindowRateLimit(`ip:${ip}`, limit, windowSeconds);
}

/**
 * Rate limit by authenticated user ID.
 * Default: 120 requests per 60-second window.
 */
export async function rateLimitByUser(
  userId: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 120, window: windowSeconds = 60 } = options;
  return slidingWindowRateLimit(`user:${userId}`, limit, windowSeconds);
}

/**
 * Strict rate limit for sensitive endpoints (login, password reset, etc.).
 * Default: 10 requests per 300-second (5 min) window.
 */
export async function rateLimitStrict(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 10, window: windowSeconds = 300 } = options;
  return slidingWindowRateLimit(`strict:${identifier}`, limit, windowSeconds);
}

/**
 * Build a 429 Too Many Requests response with Retry-After header.
 */
export function getRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(
    1,
    result.reset - Math.ceil(Date.now() / 1000)
  );

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}
