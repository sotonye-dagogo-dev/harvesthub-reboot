"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Badge, openActionConfirm, ActionConfirmBuilder } from "@/components/ui";
import { message } from "antd";
import { fetchJson } from "@/lib/utils";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  BLOG_STATUSES,
  BLOG_STATUS_LABELS,
  slugifyBlogTitle,
  estimateReadTime,
  type BlogStatusValue,
} from "@/lib/config/blog";
import { StructuredContentEditor } from "@/components/features/content/StructuredContentEditor";
import {
  buildSectionMetadata,
  createSection,
  htmlToFallbackSection,
  parseSectionsFromMetadata,
  serializeSectionsToHtml,
  stripSectionMetadata,
  type ContentSection,
} from "@/lib/content/structuredSections";
import { Eye, Trash2, RefreshCw, Star } from "lucide-react";

type BlogPostItem = {
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
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  metadata?: Record<string, unknown> | null;
  updatedAt: string;
};

type BlogConfigShape = {
  defaultAuthorName: string;
  suggestedCategories: string[];
  postsPerPage: number;
};

const EMPTY_POST = {
  slug: "",
  title: "",
  excerpt: "",
  coverImage: "",
  authorName: "",
  authorRole: "",
  category: "",
  tags: "",
  status: "DRAFT" as BlogStatusValue,
  featured: false,
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  metadataJson: "{}",
};

function parseMetadataJson(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function BlogAdminPanel() {
  const [items, setItems] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_POST });
  const [sections, setSections] = useState<ContentSection[]>([createSection("TEXT")]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<BlogConfigShape>({
    defaultAuthorName: "",
    suggestedCategories: [],
    postsPerPage: 9,
  });

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ success: boolean; data: BlogPostItem[] }>("/api/admin/blog");
      if (data.success) {
        setItems(data.data);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await fetchJson<{ success: boolean; data: BlogConfigShape }>(
        "/api/admin/blog/config"
      );
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchAll();
    fetchConfig();
  }, []);

  const generatedBody = useMemo(() => serializeSectionsToHtml(sections), [sections]);
  const readTime = useMemo(() => estimateReadTime(generatedBody), [generatedBody]);

  const setField = (key: keyof typeof EMPTY_POST, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !editingId) {
        next.slug = slugifyBlogTitle(String(value));
      }
      return next;
    });
  };

  const resetEditor = () => {
    setForm({ ...EMPTY_POST, authorName: config.defaultAuthorName });
    setSections([createSection("TEXT")]);
    setEditingId(null);
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const slug = form.slug.trim() || slugifyBlogTitle(form.title);
    const hasSectionContent = sections.some(
      (section) =>
        section.heading.trim() ||
        section.content.trim() ||
        section.attribution.trim() ||
        section.items.some((item) => item.trim())
    );

    if (!slug || !form.title.trim() || !hasSectionContent || !form.authorName.trim()) {
      setError("Slug, title, section content, and author name are required.");
      return;
    }

    try {
      setSaving(true);
      const wasEditing = Boolean(editingId);
      const customMetadata = parseMetadataJson(form.metadataJson);
      const payload = {
        slug,
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        body: generatedBody,
        coverImage: form.coverImage || null,
        authorName: form.authorName.trim(),
        authorRole: form.authorRole.trim() || null,
        category: form.category.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
        featured: form.featured,
        publishedAt: form.publishedAt || null,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        seoKeywords: form.seoKeywords.trim() || null,
        metadata: { ...customMetadata, ...buildSectionMetadata(sections) },
      };

      await fetchJson("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      resetEditor();
      await fetchAll();
      message.success(wasEditing ? "Blog post updated" : "Blog post created");
      emitDataMutated(["blog", "operations-dashboard"]);
    } catch (e: any) {
      const reason = e?.message ?? "Failed to save blog post";
      setError(reason);
      message.error(reason);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: BlogPostItem) => {
    const parsedSections = parseSectionsFromMetadata(item.metadata);
    setSections(parsedSections.length > 0 ? parsedSections : [htmlToFallbackSection(item.body, item.title)]);
    setForm({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt ?? "",
      coverImage: item.coverImage ?? "",
      authorName: item.authorName,
      authorRole: item.authorRole ?? "",
      category: item.category ?? "",
      tags: (item.tags ?? []).join(", "),
      status: item.status,
      featured: item.featured,
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 16) : "",
      seoTitle: item.seoTitle ?? "",
      seoDescription: item.seoDescription ?? "",
      seoKeywords: item.seoKeywords ?? "",
      metadataJson: JSON.stringify(stripSectionMetadata(item.metadata), null, 2),
    });
    setEditingId(item.id);
    setError(null);
  };

  const onDelete = async (item: BlogPostItem) => {
    try {
      await fetchJson(`/api/admin/blog/${encodeURIComponent(item.slug)}`, { method: "DELETE" });
      if (editingId === item.id) {
        resetEditor();
      }
      await fetchAll();
      message.success("Blog post deleted");
      emitDataMutated(["blog", "operations-dashboard"]);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to delete blog post");
    }
  };

  const requestDelete = (item: BlogPostItem) => {
    openActionConfirm(
      new ActionConfirmBuilder()
        .title("Delete blog post")
        .message(`Delete "${item.title}"? This cannot be undone.`)
        .confirmText("Delete")
        .danger()
        .build(),
      () => onDelete(item)
    );
  };

  const invalidateCache = async () => {
    try {
      await fetchJson("/api/admin/blog/invalidate", { method: "POST" });
      await fetchAll();
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to invalidate cache");
    }
  };

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      ),
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ds-text-primary">Blog Posts</h2>
          <p className="mt-1 text-sm text-ds-text-secondary">
            Write, edit, and publish articles with per-post SEO metadata. Public pages render
            published posts at /blog.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={invalidateCache}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh & Clear Cache
        </Button>
      </div>

      {error ? (
        <div className="rounded-ds-md bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <form onSubmit={onSubmit} className="space-y-5 rounded-ds-lg border border-ds-border-base p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Article title"
              required
            />
            <div>
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="auto-generated"
                required
              />
              <p className="mt-1 text-xs text-ds-text-tertiary">
                URL: /blog/{form.slug || slugifyBlogTitle(form.title) || "your-slug"}
              </p>
            </div>
          </div>

          <Input
            label="Excerpt"
            value={form.excerpt}
            onChange={(e) => setField("excerpt", e.target.value)}
            placeholder="Short summary shown on cards and used for SEO"
          />

          <StructuredContentEditor
            sections={sections}
            onSectionsChange={setSections}
            allowedTypes={["TEXT", "HERO", "CALLOUT", "LIST", "QUOTE"]}
            defaultType="TEXT"
            mediaFolderType="banner"
          />
          <p className="mt-1 text-xs text-ds-text-tertiary">
            Build posts from content blocks (no HTML needed). Estimated read time: {readTime} min.
          </p>

          <div className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-base p-3">
            <p className="mb-2 text-sm font-medium text-ds-text-secondary">Cover Image</p>
            <ImageUpload
              folderType="banner"
              valueUrl={form.coverImage || undefined}
              helpText="Upload an image via the managed uploader. Stored as the post cover and OG image."
              onUploaded={(result) => setField("coverImage", result.cacheBustedUrl || result.url)}
            />
            {form.coverImage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setField("coverImage", "")}
              >
                Remove cover image
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Author Name"
              value={form.authorName}
              onChange={(e) => setField("authorName", e.target.value)}
              placeholder="MyHarvestHub Team"
              required
            />
            <Input
              label="Author Role"
              value={form.authorRole}
              onChange={(e) => setField("authorRole", e.target.value)}
              placeholder="Editor"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Category
              </label>
              <input
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                placeholder="e.g. Vendor Tips"
                list="blog-categories"
              />
              <datalist id="blog-categories">
                {config.suggestedCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
              placeholder="comma, separated, tags"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Status
              </label>
              <select
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setField("status", e.target.value as BlogStatusValue)}
                aria-label="Publication status"
              >
                {BLOG_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {BLOG_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Publish Date (optional)
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                value={form.publishedAt}
                onChange={(e) => setField("publishedAt", e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-ds-md border border-ds-border-base p-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setField("featured", e.target.checked)}
              className="h-4 w-4 accent-ds-brand-primary"
            />
            <span className="flex items-center gap-2 text-sm font-medium text-ds-text-primary">
              <Star className="h-4 w-4 text-ds-brand-primary" />
              Feature this post (highlighted first on the blog page)
            </span>
          </label>

          <div className="rounded-ds-md border border-ds-border-subtle p-3">
            <p className="mb-3 text-sm font-semibold text-ds-text-primary">SEO Metadata</p>
            <div className="grid gap-4">
              <Input
                label="SEO Title"
                value={form.seoTitle}
                onChange={(e) => setField("seoTitle", e.target.value)}
                placeholder="Overrides the browser title tag"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  SEO Description
                </label>
                <textarea
                  className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 text-sm"
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => setField("seoDescription", e.target.value)}
                  placeholder="Overrides the meta description"
                />
              </div>
              <Input
                label="SEO Keywords"
                value={form.seoKeywords}
                onChange={(e) => setField("seoKeywords", e.target.value)}
                placeholder="comma, separated, keywords"
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  Metadata (JSON, optional)
                </label>
                <textarea
                  className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 font-mono text-xs"
                  rows={3}
                  value={form.metadataJson}
                  onChange={(e) => setField("metadataJson", e.target.value)}
                  placeholder='{"customField": "value"}'
                />
                <p className="mt-1 text-xs text-ds-text-tertiary">
                  Custom metadata only. The structured content sections are generated automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? "Saving..." : editingId ? "Update Post" : "Create Post"}
            </Button>
            <Button type="button" variant="secondary" onClick={resetEditor}>
              Reset Editor
            </Button>
          </div>
        </form>

        <div className="space-y-4 rounded-ds-lg border border-ds-border-base p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ds-text-primary">Live Preview</p>
              <p className="text-xs text-ds-text-tertiary">Mirrors the public article rendering.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-ds-full bg-ds-surface-sunken px-2 py-1 text-xs text-ds-text-secondary">
              <Eye className="h-3.5 w-3.5" />
              {readTime} min read
            </span>
          </div>

          <div className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-base p-3">
            <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">
              {form.title || "Untitled post"}
            </h3>
            {form.excerpt ? <p className="mb-2 text-sm text-ds-text-secondary">{form.excerpt}</p> : null}
            <div
              className="prose prose-sm max-w-none text-ds-text-primary dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: generatedBody || "<p>No preview content yet.</p>",
              }}
            />
          </div>

          <div className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-sunken p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-tertiary">
              SEO Preview
            </p>
            <p className="mt-2 text-sm font-medium text-ds-text-brand">
              {form.seoTitle || `${form.title || "Untitled post"} | MyHarvestHub Blog`}
            </p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              {form.seoDescription || form.excerpt || "No meta description set."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">All Posts</h3>
        {loading ? (
          <div className="py-6 text-center text-ds-text-secondary">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Featured</th>
                  <th className="border p-2">Updated</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className={editingId === item.id ? "bg-ds-surface-sunken" : ""}>
                    <td className="border p-2">
                      <div className="font-medium text-ds-text-primary">{item.title}</div>
                      <div className="text-xs text-ds-text-tertiary">/blog/{item.slug}</div>
                    </td>
                    <td className="border p-2">
                      <Badge>{item.status}</Badge>
                    </td>
                    <td className="border p-2">{item.category || "—"}</td>
                    <td className="border p-2">{item.featured ? "★" : "—"}</td>
                    <td className="border p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                    <td className="border p-2 space-x-2">
                      <Button onClick={() => onEdit(item)} size="sm">
                        Edit
                      </Button>
                      <Button onClick={() => requestDelete(item)} variant="danger" size="sm">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="border p-2">
                      No blog posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
