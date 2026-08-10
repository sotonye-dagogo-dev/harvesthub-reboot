"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { BlogCard, type BlogCardPost } from "@/components/features/blog/BlogCard";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { BLOG_DEFAULTS, BLOG_ROUTES } from "@/lib/config/blog";

type BlogApiPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  category: string | null;
  featured: boolean;
  publishedAt: string | null;
};

export function HomeBlogSection() {
  const fetchPosts = useCallback(async (): Promise<BlogCardPost[]> => {
    const res = await fetch("/api/blog?limit=3");
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) return [];
    const raw = Array.isArray(data.data) ? (data.data as BlogApiPost[]) : [];
    return raw.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      authorName: post.authorName,
      category: post.category,
      publishedAt: post.publishedAt,
      featured: post.featured,
    }));
  }, []);

  const { data, isLoading } = useSmartResource(fetchPosts, {
    key: "home-blog-posts",
    staleTimeMs: 60_000,
    refreshIntervalMs: 0,
  });
  const posts = data ?? [];

  if (!isLoading && posts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ds-text-primary">Latest from the Blog</h2>
          <p className="mt-1 text-sm text-ds-text-secondary">{BLOG_DEFAULTS.heroSubtitle}</p>
        </div>
        <Link
          href={BLOG_ROUTES.index}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ds-text-brand hover:text-ds-palette-purple-700"
        >
          View all posts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken"
              />
            ))
          : posts.map((post) => <BlogCard key={post.slug} post={post} />)}
      </div>
    </section>
  );
}
