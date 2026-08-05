import { cacheGet, cacheInvalidate, cacheInvalidatePattern, cacheSet } from '@/lib/cache/redis';
import { blogConfigKey, blogPostKey, blogPostListKey } from '@/lib/cache/keys';

const BLOG_TTL = 300; // 5 minutes

export async function getCachedBlogPostBySlug(slug: string) {
    return cacheGet<Record<string, unknown> | null>(blogPostKey(slug));
}

export async function setCachedBlogPostBySlug(slug: string, data: Record<string, unknown>) {
    await cacheSet(blogPostKey(slug), data, BLOG_TTL);
}

export async function getCachedBlogPostList(filterHash: string) {
    return cacheGet<Record<string, unknown>[] | null>(blogPostListKey(filterHash));
}

export async function setCachedBlogPostList(filterHash: string, data: Record<string, unknown>[]) {
    await cacheSet(blogPostListKey(filterHash), data, BLOG_TTL);
}

export async function getCachedBlogConfig() {
    return cacheGet<Record<string, unknown> | null>(blogConfigKey());
}

export async function setCachedBlogConfig(data: Record<string, unknown>) {
    await cacheSet(blogConfigKey(), data, BLOG_TTL);
}

export async function invalidateBlogCache() {
    await cacheInvalidate(blogConfigKey());
    await cacheInvalidatePattern('cache:blog:*');
}
