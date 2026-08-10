import { describe, expect, it } from 'vitest';
import {
  BLOG_DEFAULTS,
  BLOG_ROUTES,
  BLOG_STATUSES,
  BLOG_STATUS_LABELS,
  estimateReadTime,
  resolveBlogConfig,
  slugifyBlogTitle,
} from '@/lib/config/blog';

describe('blog config module', () => {
  it('exposes statuses and labels that match the Prisma enum', () => {
    expect(BLOG_STATUSES).toEqual(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
    expect(BLOG_STATUS_LABELS.PUBLISHED).toBe('Published');
  });

  it('provides stable route helpers', () => {
    expect(BLOG_ROUTES.index).toBe('/blog');
    expect(BLOG_ROUTES.slug('hello-world')).toBe('/blog/hello-world');
  });

  it('resolves defaults when no runtime config exists', () => {
    const config = resolveBlogConfig(null);
    expect(config).toEqual(BLOG_DEFAULTS);
    expect(config.postsPerPage).toBe(9);
  });

  it('overlays admin-editable runtime values onto defaults', () => {
    const config = resolveBlogConfig({
      title: 'Harvest Hub News',
      postsPerPage: 12,
      showAuthor: false,
    });
    expect(config.title).toBe('Harvest Hub News');
    expect(config.postsPerPage).toBe(12);
    expect(config.showAuthor).toBe(false);
    // Unset fields fall back to defaults
    expect(config.seoTitle).toBe(BLOG_DEFAULTS.seoTitle);
  });

  it('clamps invalid runtime numbers and sanitizes categories', () => {
    const config = resolveBlogConfig({
      postsPerPage: 500,
      suggestedCategories: ['Vendor Tips', '   ', '', 42 as unknown as string],
    });
    expect(config.postsPerPage).toBe(60);
    expect(config.suggestedCategories).toEqual(['Vendor Tips']);
  });

  it('estimates reading time from HTML bodies', () => {
    expect(estimateReadTime('<p>Hello world</p>', 2)).toBe(1);
    expect(estimateReadTime('', 10)).toBe(1);
  });

  it('slugifies titles safely', () => {
    expect(slugifyBlogTitle('Welcome to MyHarvestHub!')).toBe('welcome-to-myharvesthub');
    expect(slugifyBlogTitle('Tips & Tricks For 2026')).toBe('tips-and-tricks-for-2026');
    expect(slugifyBlogTitle('  Multiple    Spaces  Here  ')).toBe('multiple-spaces-here');
  });
});
