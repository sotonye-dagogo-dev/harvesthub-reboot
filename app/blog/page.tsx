import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBlogConfig, listBlogPosts } from "@/lib/data/blog";
import { buildDynamicEntityMetadata, resolveCanonicalBaseUrl } from "@/lib/seo/dynamicMetadata";
import { BlogCard } from "@/components/features/blog/BlogCard";
import { getSafeImageUrl } from "@/lib/utils/images";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await resolveCanonicalBaseUrl();
  const config = await getBlogConfig();

  return buildDynamicEntityMetadata({
    baseUrl,
    path: "/blog",
    title: config.seoTitle || config.title,
    description: config.seoDescription || config.description,
    fallbackTitle: "Blog | MyHarvestHub",
    fallbackDescription: "Stories, tips, and updates from MyHarvestHub.",
  });
}

export default async function BlogIndexPage() {
  const [config, result, baseUrl] = await Promise.all([
    getBlogConfig(),
    listBlogPosts({ status: "PUBLISHED" }),
    resolveCanonicalBaseUrl(),
  ]);

  const posts = result.posts;
  const featuredPost = config.showFeaturedPost
    ? posts.find((post) => post.featured) ?? posts[0] ?? null
    : null;
  const remaining = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : posts;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    description: config.description,
    url: `${baseUrl}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  const featuredImage = getSafeImageUrl(featuredPost?.coverImage ?? null);

  return (
    <div className="container mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-ds-text-primary">{config.title}</h1>
        <p className="mt-3 text-lg text-ds-text-secondary">{config.description}</p>
      </div>

      {/* Featured post */}
      {featuredPost ? (
        <Link
          href={`/blog/${featuredPost.slug}`}
          className="group mt-10 block overflow-hidden rounded-ds-lg border border-ds-border-base bg-ds-surface-base"
        >
          <div className="grid lg:grid-cols-2">
            <div className="relative aspect-[16/9] bg-ds-surface-sunken lg:aspect-auto">
              {featuredImage ? (
                <Image
                  src={featuredImage}
                  alt={featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ds-text-tertiary">
                  MyHarvestHub
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-8">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ds-text-brand">
                Featured Article
              </span>
              <h2 className="text-2xl font-bold text-ds-text-primary transition-colors group-hover:text-ds-text-brand">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt ? (
                <p className="text-ds-text-secondary">{featuredPost.excerpt}</p>
              ) : null}
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-ds-text-brand">
                Read article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      {/* Post grid */}
      {remaining.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : featuredPost ? null : (
        <div className="mt-16 text-center">
          <p className="text-ds-text-secondary">No blog posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
