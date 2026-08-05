import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { getSafeImageUrl } from "@/lib/utils/images";
import { estimateReadTime, BLOG_ROUTES } from "@/lib/config/blog";

export type BlogCardPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  category: string | null;
  publishedAt: Date | string | null;
  body?: string;
  featured?: boolean;
};

export function BlogCard({ post }: { post: BlogCardPost }) {
  const image = getSafeImageUrl(post.coverImage);
  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
  const readTime = estimateReadTime(post.body ?? "");

  return (
    <Link
      href={BLOG_ROUTES.slug(post.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-ds-lg border border-ds-border-base bg-ds-surface-base transition-shadow hover:shadow-ds-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-ds-surface-sunken">
        {image ? (
          <Image
            src={image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ds-text-tertiary">
            <span className="text-sm">MyHarvestHub</span>
          </div>
        )}
        {post.featured ? (
          <span className="absolute left-3 top-3 rounded-ds-full bg-ds-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {post.category ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-ds-text-brand">
            {post.category}
          </span>
        ) : null}
        <h2 className="line-clamp-2 text-lg font-semibold text-ds-text-primary transition-colors group-hover:text-ds-text-brand">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="line-clamp-3 text-sm text-ds-text-secondary">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-ds-text-tertiary">
          {post.authorName ? (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.authorName}
            </span>
          ) : null}
          {publishedAt ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(publishedAt, "MMM d, yyyy")}
            </span>
          ) : null}
          {post.body ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readTime} min read
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
