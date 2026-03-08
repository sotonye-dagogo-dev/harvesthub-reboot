import { Redis } from '@upstash/redis';

// ============================================================================
// Redis Client (Upstash) — shared DB with prefix namespacing
// ============================================================================

const PREFIX = process.env.REDIS_PREFIX || 'harvesthub:';

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error(
                'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables'
            );
        }

        redis = new Redis({ url, token });
    }
    return redis;
}

/** Build a namespaced key: `harvesthub:{resource}:{id}` */
function key(...parts: string[]): string {
    return `${PREFIX}${parts.join(':')}`;
}

// ============================================================================
// Cache helpers
// ============================================================================

/** Get a cached value, returns null on miss */
export async function cacheGet<T>(resource: string, id: string): Promise<T | null> {
    const r = getRedis();
    const val = await r.get<T>(key(resource, id));
    return val ?? null;
}

/** Set a cached value with TTL in seconds (default 5 min) */
export async function cacheSet<T>(
    resource: string,
    id: string,
    data: T,
    ttlSeconds = 300
): Promise<void> {
    const r = getRedis();
    await r.set(key(resource, id), data, { ex: ttlSeconds });
}

/** Invalidate a single cached key */
export async function cacheInvalidate(resource: string, id: string): Promise<void> {
    const r = getRedis();
    await r.del(key(resource, id));
}

/** Invalidate all keys matching a resource pattern (e.g. all products) */
export async function cacheInvalidatePattern(resource: string): Promise<void> {
    const r = getRedis();
    const pattern = key(resource, '*');
    let cursor = 0;
    do {
        const [nextCursor, keys] = await r.scan(cursor, { match: pattern, count: 100 });
        cursor = Number(nextCursor);
        if (keys.length > 0) {
            await r.del(...keys);
        }
    } while (cursor !== 0);
}

// ============================================================================
// Rate limiting
// ============================================================================

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // Unix timestamp in seconds
}

/**
 * Sliding-window rate limiter.
 * @param identifier - user ID or IP address
 * @param maxRequests - max requests per window
 * @param windowSeconds - window size in seconds (default 60)
 */
export async function rateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds = 60
): Promise<RateLimitResult> {
    const r = getRedis();
    const k = key('rl', identifier);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use a pipeline for efficiency
    const pipe = r.pipeline();
    pipe.zremrangebyscore(k, 0, windowStart);
    pipe.zadd(k, { score: now, member: `${now}:${Math.random().toString(36).slice(2, 8)}` });
    pipe.zcard(k);
    pipe.expire(k, windowSeconds);

    const results = await pipe.exec();
    const count = results[2] as number;

    return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAt: now + windowSeconds,
    };
}

/** Convenience: rate limit by authenticated user ID */
export async function rateLimitByUser(
    userId: string,
    maxRequests = 60,
    windowSeconds = 60
): Promise<RateLimitResult> {
    return rateLimit(`user:${userId}`, maxRequests, windowSeconds);
}

/** Convenience: rate limit by IP address */
export async function rateLimitByIP(
    ip: string,
    maxRequests = 30,
    windowSeconds = 60
): Promise<RateLimitResult> {
    return rateLimit(`ip:${ip}`, maxRequests, windowSeconds);
}

/**
 * Build a NextResponse 429 header set when rate limit is exceeded.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'Retry-After': String(result.resetAt - Math.floor(Date.now() / 1000)),
    };
}
