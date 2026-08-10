import { prisma } from '@/lib/db/prisma';
import {
  getCachedBlogConfig,
  getCachedBlogPostBySlug,
  getCachedBlogPostList,
  invalidateBlogCache,
  setCachedBlogConfig,
  setCachedBlogPostBySlug,
  setCachedBlogPostList,
} from '@/lib/cache/blogCache';
import {
  BLOG_DEFAULTS,
  resolveBlogConfig,
  type BlogConfigShape,
  type BlogStatusValue,
} from '@/lib/config/blog';

export type BlogPostItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  authorName: string;
  authorRole: string | null;
  category: string | null;
  tags: string[];
  status: BlogStatusValue;
  featured: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  metadata?: Record<string, unknown> | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogListResult = {
  posts: BlogPostItem[];
  total: number;
};

function computeListFilterHash(input: { status?: BlogStatusValue; limit?: number; offset?: number; featuredOnly?: boolean }): string {
  return JSON.stringify({
    status: input.status ?? 'all',
    limit: input.limit ?? 0,
    offset: input.offset ?? 0,
    featuredOnly: input.featuredOnly ?? false,
  });
}

/**
 * List blog posts. When `status` is omitted the caller is responsible for
 * filtering (admin surfaces). Public endpoints always pass `PUBLISHED`.
 */
export async function listBlogPosts(input?: {
  status?: BlogStatusValue;
  limit?: number;
  offset?: number;
  featuredOnly?: boolean;
}): Promise<BlogListResult> {
  const { status, limit, offset = 0, featuredOnly = false } = input ?? {};
  const filterHash = computeListFilterHash(input ?? {});

  try {
    const cached = await getCachedBlogPostList(filterHash);
    if (cached && Array.isArray(cached) && cached.length >= 0) {
      return {
        posts: cached as BlogPostItem[],
        total: cached.length,
      };
    }
  } catch (error) {
    console.error('[listBlogPosts] cache read failed:', error);
  }

  let posts: BlogPostItem[] = [];
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (featuredOnly) where.featured = true;

    posts = (await (prisma as any).blogPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit && limit > 0 ? limit : undefined,
      skip: offset,
    })) as BlogPostItem[];
  } catch (error) {
    console.error('[listBlogPosts] Prisma query error:', error);
    return { posts: [], total: 0 };
  }

  await setCachedBlogPostList(filterHash, posts as unknown as Record<string, unknown>[]).catch(
    (error) => console.error('[listBlogPosts] cache write failed:', error)
  );

  return { posts, total: posts.length };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostItem | null> {
  try {
    const cached = await getCachedBlogPostBySlug(slug);
    if (cached) {
      return cached as BlogPostItem;
    }
  } catch (error) {
    console.error('[getBlogPostBySlug] cache read failed:', error);
  }

  let post: BlogPostItem | null = null;
  try {
    post = (await (prisma as any).blogPost.findUnique({ where: { slug } })) as BlogPostItem | null;
  } catch (error) {
    console.error('[getBlogPostBySlug] Prisma query error:', error);
    return null;
  }

  if (post) {
    await setCachedBlogPostBySlug(slug, post as unknown as Record<string, unknown>).catch(
      (error) => console.error('[getBlogPostBySlug] cache write failed:', error)
    );
  }

  return post;
}

export async function getBlogConfig(): Promise<BlogConfigShape> {
  try {
    const cached = await getCachedBlogConfig();
    if (cached) {
      return resolveBlogConfig(cached as Partial<BlogConfigShape>);
    }
  } catch (error) {
    console.error('[getBlogConfig] cache read failed:', error);
  }

  let runtime: Partial<BlogConfigShape> | null = null;
  try {
    const row = await (prisma as any).blogConfig.findFirst({ where: { key: 'default' } });
    if (row) {
      runtime = row as Partial<BlogConfigShape>;
    }
  } catch (error) {
    console.error('[getBlogConfig] Prisma query error:', error);
    runtime = null;
  }

  const resolved = resolveBlogConfig(runtime);
  await setCachedBlogConfig(resolved as unknown as Record<string, unknown>).catch((error) =>
    console.error('[getBlogConfig] cache write failed:', error)
  );

  return resolved;
}

export async function upsertBlogPost(data: {
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  authorName: string;
  authorRole?: string | null;
  category?: string | null;
  tags?: string[];
  status?: BlogStatusValue;
  featured?: boolean;
  publishedAt?: Date | string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const now = new Date();
  const status = data.status ?? 'DRAFT';
  const publishedAt =
    data.publishedAt === null || data.publishedAt === undefined
      ? status === 'PUBLISHED'
        ? now
        : null
      : typeof data.publishedAt === 'string'
        ? new Date(data.publishedAt)
        : data.publishedAt;

  const saved = await (prisma as any).blogPost.upsert({
    where: { slug: data.slug },
    create: {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      body: data.body,
      coverImage: data.coverImage ?? null,
      authorName: data.authorName,
      authorRole: data.authorRole ?? null,
      category: data.category ?? null,
      tags: data.tags ?? [],
      status,
      featured: data.featured ?? false,
      publishedAt,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords ?? null,
      metadata: data.metadata ?? {},
    },
    update: {
      title: data.title,
      excerpt: data.excerpt ?? null,
      body: data.body,
      coverImage: data.coverImage ?? null,
      authorName: data.authorName,
      authorRole: data.authorRole ?? null,
      category: data.category ?? null,
      tags: data.tags ?? [],
      status,
      featured: data.featured ?? false,
      publishedAt,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords ?? null,
      metadata: data.metadata ?? {},
    },
  });

  await invalidateBlogCache();
  return saved as BlogPostItem;
}

export async function deleteBlogPost(slug: string) {
  const existing = await (prisma as any).blogPost.findUnique({ where: { slug } });
  if (!existing) return null;

  await (prisma as any).blogPost.delete({ where: { slug } });
  await invalidateBlogCache();
  return existing as BlogPostItem;
}

export async function updateBlogPostViews(slug: string): Promise<void> {
  try {
    await (prisma as any).blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
    await invalidateBlogCache();
  } catch (error) {
    console.error('[updateBlogPostViews] failed:', error);
  }
}

export async function upsertBlogConfig(data: Partial<BlogConfigShape>): Promise<BlogConfigShape> {
  const merged = resolveBlogConfig({ ...BLOG_DEFAULTS, ...data });

  await (prisma as any).blogConfig.upsert({
    where: { key: 'default' },
    create: { key: 'default', ...merged },
    update: { ...merged },
  });

  await invalidateBlogCache();
  return merged;
}
