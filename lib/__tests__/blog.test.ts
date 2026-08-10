import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockBlogPost = {
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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

const posts = new Map<string, MockBlogPost>();
const configs = new Map<string, Record<string, unknown>>();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    blogPost: {
      findUnique: vi.fn(async ({ where }: { where: { slug: string } }) => {
        return posts.get(where.slug) ?? null;
      }),
      findMany: vi.fn(async ({ where, take, skip }: any) => {
        let all = Array.from(posts.values());
        if (where?.status) {
          all = all.filter((item) => item.status === where.status);
        }
        if (where?.featured) {
          all = all.filter((item) => item.featured === true);
        }
        all = [...all].sort((a, b) => {
          const dateA = a.publishedAt ?? a.createdAt;
          const dateB = b.publishedAt ?? b.createdAt;
          return dateB.getTime() - dateA.getTime();
        });
        if (take) all = all.slice(skip ?? 0, (skip ?? 0) + take);
        else if (skip) all = all.slice(skip);
        return all;
      }),
      upsert: vi.fn(async ({ where, create }: any) => {
        const existing = posts.get(where.slug);
        const now = new Date();
        if (existing) {
          const updated: MockBlogPost = {
            ...existing,
            ...create,
            updatedAt: now,
          };
          posts.set(where.slug, updated);
          return updated;
        }
        const created: MockBlogPost = {
          id: `blog-${posts.size + 1}`,
          ...create,
          viewCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        posts.set(where.slug, created);
        return created;
      }),
      delete: vi.fn(async ({ where }: { where: { slug: string } }) => {
        const existing = posts.get(where.slug) ?? null;
        posts.delete(where.slug);
        return existing;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const existing = posts.get(where.slug);
        if (!existing) throw new Error('not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        posts.set(where.slug, updated);
        return updated;
      }),
    },
    blogConfig: {
      findFirst: vi.fn(async () => configs.get('default') ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        configs.set(where.key, { ...create, ...update });
        return configs.get(where.key);
      }),
    },
  },
}));

vi.mock('@/lib/cache/blogCache', () => ({
  getCachedBlogPostBySlug: vi.fn(async () => null),
  setCachedBlogPostBySlug: vi.fn(async () => undefined),
  getCachedBlogPostList: vi.fn(async () => null),
  setCachedBlogPostList: vi.fn(async () => undefined),
  getCachedBlogConfig: vi.fn(async () => null),
  setCachedBlogConfig: vi.fn(async () => undefined),
  invalidateBlogCache: vi.fn(async () => undefined),
}));

import {
  deleteBlogPost,
  getBlogConfig,
  getBlogPostBySlug,
  listBlogPosts,
  upsertBlogConfig,
  upsertBlogPost,
} from '@/lib/data/blog';
import { BLOG_DEFAULTS } from '@/lib/config/blog';

describe('blog data layer', () => {
  beforeEach(() => {
    posts.clear();
    configs.clear();
    vi.clearAllMocks();
  });

  it('can create and fetch a blog post by slug', async () => {
    const created = await upsertBlogPost({
      slug: 'hello-blog',
      title: 'Hello Blog',
      body: '<p>First post</p>',
      authorName: 'Team',
      status: 'PUBLISHED',
      tags: ['news'],
      seoTitle: 'Hello Blog | MyHarvestHub',
    });

    expect(created).toMatchObject({
      slug: 'hello-blog',
      title: 'Hello Blog',
      status: 'PUBLISHED',
      featured: false,
    });
    expect(created.publishedAt).not.toBeNull();

    const loaded = await getBlogPostBySlug('hello-blog');
    expect(loaded?.body).toBe('<p>First post</p>');
    expect(loaded?.seoTitle).toBe('Hello Blog | MyHarvestHub');
  });

  it('keeps publishedAt null for drafts', async () => {
    await upsertBlogPost({
      slug: 'draft-post',
      title: 'Draft Post',
      body: '<p>Draft</p>',
      authorName: 'Team',
      status: 'DRAFT',
    });

    const loaded = await getBlogPostBySlug('draft-post');
    expect(loaded?.publishedAt).toBeNull();
  });

  it('lists posts filtered by status', async () => {
    await upsertBlogPost({ slug: 'a', title: 'A', body: '<p>A</p>', authorName: 'T', status: 'PUBLISHED' });
    await upsertBlogPost({ slug: 'b', title: 'B', body: '<p>B</p>', authorName: 'T', status: 'DRAFT' });

    const published = await listBlogPosts({ status: 'PUBLISHED' });
    expect(published.posts.map((p) => p.slug)).toEqual(['a']);

    const all = await listBlogPosts();
    expect(all.posts.length).toBe(2);
  });

  it('supports limit/offset pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await upsertBlogPost({
        slug: `post-${i}`,
        title: `Post ${i}`,
        body: '<p>x</p>',
        authorName: 'T',
        status: 'PUBLISHED',
      });
    }

    const page = await listBlogPosts({ status: 'PUBLISHED', limit: 2, offset: 1 });
    expect(page.posts.length).toBe(2);
  });

  it('deletes blog posts', async () => {
    await upsertBlogPost({ slug: 'to-delete', title: 'Delete', body: '<p>x</p>', authorName: 'T' });
    const removed = await deleteBlogPost('to-delete');
    expect(removed?.slug).toBe('to-delete');
    expect(await getBlogPostBySlug('to-delete')).toBeNull();
  });

  it('merges admin-editable blog config over defaults', async () => {
    const saved = await upsertBlogConfig({ title: 'Configured Blog', postsPerPage: 15 });
    expect(saved.title).toBe('Configured Blog');
    expect(saved.postsPerPage).toBe(15);

    const loaded = await getBlogConfig();
    expect(loaded.title).toBe('Configured Blog');
    expect(loaded.showAuthor).toBe(BLOG_DEFAULTS.showAuthor);
  });

  it('falls back to defaults when no config exists', async () => {
    const config = await getBlogConfig();
    expect(config).toEqual(BLOG_DEFAULTS);
  });
});
