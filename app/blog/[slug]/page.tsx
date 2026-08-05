import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, User, ArrowLeft, Tag } from "lucide-react";
import { getBlogConfig, getBlogPostBySlug } from "@/lib/data/blog";
import { buildDynamicEntityMetadata, resolveCanonicalBaseUrl } from "@/lib/seo/dynamicMetadata";
import { getSafeImageUrl } from "@/lib/utils/images";
import { estimateReadTime, BLOG_ROUTES } from "@/lib/config/blog";
import { BlogShareButtons } from "@/components/features/blog/BlogShareButtons";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = await resolveCanonicalBaseUrl();
  const path = BLOG_ROUTES.slug(slug);
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "PUBLISHED") {
    return buildDynamicEntityMetadata({
      baseUrl,
      path,
      title: "Article Not Found | MyHarvestHub",
      description: "This article is no longer available on MyHarvestHub.",
      fallbackTitle: "Article Not Found | MyHarvestHub",
      fallbackDescription: "Read the latest stories and updates on the MyHarvestHub blog.",
    });
  }

  return buildDynamicEntityMetadata({
    baseUrl,
    path,
    title: post.seoTitle || `${post.title} | MyHarvestHub Blog`,
    description: post.seoDescription || post.excerpt || post.title,
    imageUrl: post.coverImage,
    fallbackTitle: `${post.title} | MyHarvestHub Blog`,
    fallbackDescription: post.excerpt || post.title,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, config, baseUrl] = await Promise.all([
    getBlogPostBySlug(slug),
    getBlogConfig(),
    resolveCanonicalBaseUrl(),
  ]);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const url = `${baseUrl}${BLOG_ROUTES.slug(post.slug)}`;
  const coverImage = getSafeImageUrl(post.coverImage ?? null);
  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
  const readTime = estimateReadTime(post.body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.seoDescription || undefined,
    image: coverImage
      ? [coverImage.startsWith("/") ? `${baseUrl}${coverImage}` : coverImage]
      : undefined,
    url,
    datePublished: publishedAt ? publishedAt.toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "MyHarvestHub",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/myharvesthublogo.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.seoKeywords || post.tags?.join(", ") || undefined,
    articleSection: post.category || undefined,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl">
        <Link
          href={BLOG_ROUTES.index}
          className="inline-flex items-center gap-2 text-sm font-medium text-ds-text-secondary transition-colors hover:text-ds-text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            {post.category ? (
              <span className="rounded-ds-full bg-ds-brand-subtle px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ds-palette-purple-700">
                {post.category}
              </span>
            ) : null}
            {publishedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-ds-text-tertiary">
                <Calendar className="h-3.5 w-3.5" />
                {format(publishedAt, "MMMM d, yyyy")}
              </span>
            ) : null}
            {config.showReadTime ? (
              <span className="inline-flex items-center gap-1 text-xs text-ds-text-tertiary">
                <Clock className="h-3.5 w-3.5" />
                {readTime} min read
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-4xl font-bold text-ds-text-primary">{post.title}</h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-ds-border-base pb-4">
            {config.showAuthor ? (
              <span className="inline-flex items-center gap-2 text-sm text-ds-text-secondary">
                <span className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-ds-text-brand">
                  <User className="h-4 w-4" />
                </span>
                {post.authorName}
                {post.authorRole ? (
                  <span className="text-xs text-ds-text-tertiary">· {post.authorRole}</span>
                ) : null}
              </span>
            ) : null}
            {config.showShareButtons ? <BlogShareButtons url={url} title={post.title} /> : null}
          </div>
        </header>

        {coverImage ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-ds-lg bg-ds-surface-sunken">
            <Image
              src={coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div
          className="prose prose-lg mt-8 max-w-none text-ds-text-primary dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {post.tags && post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-ds-border-base pt-6">
            <Tag className="h-4 w-4 text-ds-text-tertiary" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-ds-full border border-ds-border-base px-3 py-1 text-xs text-ds-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-ds-border-base pt-6">
          <Link
            href={BLOG_ROUTES.index}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ds-text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            More articles
          </Link>
          {config.showShareButtons ? <BlogShareButtons url={url} title={post.title} /> : null}
        </div>
      </article>
    </div>
  );
}
