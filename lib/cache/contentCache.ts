import { cacheGet, cacheInvalidate, cacheInvalidatePattern, cacheSet } from '@/lib/cache/redis';
import { publicContentKey, publicContentListKey } from '@/lib/cache/keys';

const PUBLIC_CONTENT_TTL = 300; // 5 minutes

export async function getCachedPublicContentBySlug(slug: string) {
    return cacheGet<Record<string, unknown> | null>(publicContentKey(slug));
}

export async function setCachedPublicContentBySlug(slug: string, data: Record<string, unknown>) {
    await cacheSet(publicContentKey(slug), data, PUBLIC_CONTENT_TTL);
}

export async function getCachedPublicContentList() {
    return cacheGet<Record<string, unknown>[] | null>(publicContentListKey());
}

export async function setCachedPublicContentList(data: Record<string, unknown>[]) {
    await cacheSet(publicContentListKey(), data, PUBLIC_CONTENT_TTL);
}

export async function invalidatePublicContentCache() {
    await cacheInvalidate(publicContentListKey());
    await cacheInvalidatePattern('cache:public-content:*');
}
