/**
 * Blog configuration — the single source of truth that drives BOTH the
 * viewer-end (public blog pages) and the upload-end (admin editor) with
 * consistent defaults, labels, statuses, and SEO conventions.
 *
 * Static defaults live here; runtime overrides are stored in the `BlogConfig`
 * row (admin-editable) and are merged over these defaults in `lib/data/blog.ts`.
 */

export type BlogStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const BLOG_STATUSES: BlogStatusValue[] = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const BLOG_STATUS_LABELS: Record<BlogStatusValue, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export type BlogConfigShape = {
  title: string;
  description: string;
  heroHeading: string;
  heroSubtitle: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  postsPerPage: number;
  showAuthor: boolean;
  showReadTime: boolean;
  showShareButtons: boolean;
  showFeaturedPost: boolean;
  defaultAuthorName: string;
  defaultCoverImage: string;
  suggestedCategories: string[];
};

/** Default blog config applied when no admin-managed BlogConfig row exists. */
export const BLOG_DEFAULTS: BlogConfigShape = {
  title: "The HarvestHub Blog",
  description:
    "News, tips, and stories from MyHarvestHub — the faith-based marketplace connecting buyers and vendors across Christian communities.",
  heroHeading: "Stories, tips & updates from the HarvestHub community",
  heroSubtitle:
    "Guides for vendors and buyers, platform news, and stories that celebrate community commerce.",
  seoTitle: "Blog | MyHarvestHub",
  seoDescription:
    "Read the latest stories, vendor tips, buyer guides, and platform news from MyHarvestHub — the faith-based e-marketplace.",
  seoKeywords: "myharvesthub blog, vendor tips, buyer guide, marketplace news, faith-based e-commerce",
  postsPerPage: 9,
  showAuthor: true,
  showReadTime: true,
  showShareButtons: true,
  showFeaturedPost: true,
  defaultAuthorName: "MyHarvestHub Team",
  defaultCoverImage: "/placeholder-product.jpg",
  suggestedCategories: [
    "Vendor Tips",
    "Buyer Guide",
    "Platform News",
    "Community Stories",
    "Faith & Business",
  ],
};

/** Public entry path prefix for the blog. Viewer pages derive URLs from this. */
export const BLOG_ROUTES = {
  index: "/blog",
  slug: (slug: string) => `/blog/${slug}`,
} as const;

/**
 * Resolve the effective blog config, overlaying runtime (admin-editable) values
 * on top of the static defaults. Accepts the persisted BlogConfig row (or null).
 */
export function resolveBlogConfig(
  runtime: Partial<BlogConfigShape> | null | undefined
): BlogConfigShape {
  if (!runtime || typeof runtime !== "object") {
    return { ...BLOG_DEFAULTS };
  }

  return {
    title: typeof runtime.title === "string" && runtime.title.trim() ? runtime.title : BLOG_DEFAULTS.title,
    description:
      typeof runtime.description === "string" && runtime.description.trim()
        ? runtime.description
        : BLOG_DEFAULTS.description,
    heroHeading:
      typeof runtime.heroHeading === "string" && runtime.heroHeading.trim()
        ? runtime.heroHeading
        : BLOG_DEFAULTS.heroHeading,
    heroSubtitle:
      typeof runtime.heroSubtitle === "string" && runtime.heroSubtitle.trim()
        ? runtime.heroSubtitle
        : BLOG_DEFAULTS.heroSubtitle,
    seoTitle:
      typeof runtime.seoTitle === "string" && runtime.seoTitle.trim()
        ? runtime.seoTitle
        : BLOG_DEFAULTS.seoTitle,
    seoDescription:
      typeof runtime.seoDescription === "string" && runtime.seoDescription.trim()
        ? runtime.seoDescription
        : BLOG_DEFAULTS.seoDescription,
    seoKeywords:
      typeof runtime.seoKeywords === "string" && runtime.seoKeywords.trim()
        ? runtime.seoKeywords
        : BLOG_DEFAULTS.seoKeywords,
    postsPerPage:
      typeof runtime.postsPerPage === "number" &&
      Number.isFinite(runtime.postsPerPage) &&
      runtime.postsPerPage > 0
        ? Math.min(Math.floor(runtime.postsPerPage), 60)
        : BLOG_DEFAULTS.postsPerPage,
    showAuthor: typeof runtime.showAuthor === "boolean" ? runtime.showAuthor : BLOG_DEFAULTS.showAuthor,
    showReadTime:
      typeof runtime.showReadTime === "boolean" ? runtime.showReadTime : BLOG_DEFAULTS.showReadTime,
    showShareButtons:
      typeof runtime.showShareButtons === "boolean"
        ? runtime.showShareButtons
        : BLOG_DEFAULTS.showShareButtons,
    showFeaturedPost:
      typeof runtime.showFeaturedPost === "boolean"
        ? runtime.showFeaturedPost
        : BLOG_DEFAULTS.showFeaturedPost,
    defaultAuthorName:
      typeof runtime.defaultAuthorName === "string" && runtime.defaultAuthorName.trim()
        ? runtime.defaultAuthorName
        : BLOG_DEFAULTS.defaultAuthorName,
    defaultCoverImage:
      typeof runtime.defaultCoverImage === "string" && runtime.defaultCoverImage.trim()
        ? runtime.defaultCoverImage
        : BLOG_DEFAULTS.defaultCoverImage,
    suggestedCategories: Array.isArray(runtime.suggestedCategories)
      ? runtime.suggestedCategories.filter((c) => typeof c === "string" && c.trim().length > 0)
      : [...BLOG_DEFAULTS.suggestedCategories],
  };
}

/**
 * Approximate reading time in minutes from a body of text (strips HTML tags).
 * Used by both viewer pages (read-time badge) and the admin editor (live preview).
 */
export function estimateReadTime(body: string, wordsPerMinute = 220): number {
  if (!body) return 1;
  const text = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.length > 0 ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Slugify helper shared by the upload end so drafts always have a URL-safe slug
 * and duplicate slugs are detected before hitting the unique constraint.
 */
export function slugifyBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
