"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Badge, openActionConfirm, ActionConfirmBuilder } from "@/components/ui";
import { fetchJson } from "@/lib/utils";
import { StructuredContentEditor } from "@/components/features/content/StructuredContentEditor";
import {
  buildSectionMetadata,
  createSection,
  htmlToFallbackSection,
  parseSectionsFromMetadata,
  serializeSectionsToHtml,
  type ContentSection,
} from "@/lib/content/structuredSections";
import { Eye, FileText } from "lucide-react";

type PublicContentItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
};

const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type PagePreset = {
  slug: string;
  label: string;
  suggestedTitle: string;
  helper: string;
};

const pagePresets: PagePreset[] = [
  {
    slug: "about",
    label: "About",
    suggestedTitle: "About MyHarvestHub",
    helper: "Public company story, mission, and trust signals.",
  },
  {
    slug: "privacy",
    label: "Privacy Policy",
    suggestedTitle: "Privacy Policy",
    helper: "Data/privacy policy page used by legal links.",
  },
  {
    slug: "terms",
    label: "Terms & Conditions",
    suggestedTitle: "Terms & Conditions",
    helper: "Platform usage and legal terms.",
  },
  {
    slug: "contact",
    label: "Contact",
    suggestedTitle: "Contact Us",
    helper: "Support channels and contact details.",
  },
  {
    slug: "cookies",
    label: "Cookie Policy",
    suggestedTitle: "Cookie Policy",
    helper: "Cookie usage details and user choices.",
  },
  {
    slug: "faqs",
    label: "FAQs",
    suggestedTitle: "Frequently Asked Questions",
    helper: "Support-focused frequently asked questions.",
  },
  {
    slug: "advertise",
    label: "Advertise & Sponsorship",
    suggestedTitle: "Advertise & Sponsor With MyHarvestHub",
    helper: "Landing-page narrative shown on the public advertise page.",
  },
];

export function PublicContentAdminPanel() {
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<PublicContentItem["status"]>("PUBLISHED");
  const [sections, setSections] = useState<ContentSection[]>([createSection("TEXT")]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatedBody = useMemo(() => serializeSectionsToHtml(sections), [sections]);

  const selectedPreset = useMemo(() => pagePresets.find((preset) => preset.slug === slug), [slug]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<
        PublicContentItem[] | { success: boolean; data: PublicContentItem[] }
      >("/api/admin/public-content");

      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray((data as { data?: PublicContentItem[] }).data)) {
        setItems((data as { data: PublicContentItem[] }).data);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load public content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!slug || !title || sections.length === 0 || !generatedBody.trim()) {
      setError("Slug, title, and at least one non-empty section are required");
      return;
    }

    try {
      setSaving(true);
      await fetchJson("/api/admin/public-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          body: generatedBody,
          status,
          metadata: buildSectionMetadata(sections),
        }),
      });

      setSlug("");
      setTitle("");
      setSections([createSection("TEXT")]);
      setStatus("PUBLISHED");
      setEditingId(null);
      setSelectedItemId(null);
      await fetchContent();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save public content");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: PublicContentItem) => {
    setSlug(item.slug);
    setTitle(item.title);
    setStatus(item.status);
    setEditingId(item.id);
    setSelectedItemId(item.id);

    const parsedSections = parseSectionsFromMetadata(item.metadata);
    if (parsedSections.length > 0) {
      setSections(parsedSections);
      return;
    }

    setSections([htmlToFallbackSection(item.body, item.title)]);
  };

  const onDelete = async (item: PublicContentItem) => {
    await fetchJson(`/api/admin/public-content?slug=${encodeURIComponent(item.slug)}`, {
      method: "DELETE",
    });
    await fetchContent();

    if (selectedItemId === item.id) {
      setSelectedItemId(null);
      setEditingId(null);
    }
  };

  const requestDelete = (item: PublicContentItem) => {
    openActionConfirm(
      new ActionConfirmBuilder()
        .title("Delete content")
        .message(`Delete content "${item.title}"?`)
        .confirmText("Delete")
        .danger()
        .build(),
      () => onDelete(item)
    );
  };

  const clearEditor = () => {
    setSlug("");
    setTitle("");
    setStatus("PUBLISHED");
    setSections([createSection("TEXT")]);
    setEditingId(null);
    setSelectedItemId(null);
    setError(null);
  };

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [items]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ds-text-primary">Public Content Editor</h2>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Build pages using guided sections, preview before publishing, and keep upload/media
          workflows consistent.
        </p>
      </div>

      {error && <div className="rounded bg-rose-50 p-3 text-rose-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-ds-lg border border-ds-border-base p-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Page/Section
              </label>
              <select
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                value={slug}
                aria-label="Page section"
                title="Page section"
                onChange={(event) => {
                  const nextSlug = event.target.value;
                  setSlug(nextSlug);
                  const preset = pagePresets.find((item) => item.slug === nextSlug);
                  if (preset && !title) {
                    setTitle(preset.suggestedTitle);
                  }
                }}
                required
              >
                <option value="">Select page</option>
                {pagePresets.map((preset) => (
                  <option key={preset.slug} value={preset.slug}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ds-text-tertiary">
                {selectedPreset?.helper || "Choose where this content will be rendered."}
              </p>
            </div>

            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Status
              </label>
              <select
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm"
                value={status}
                aria-label="Publication status"
                title="Publication status"
                onChange={(event) => setStatus(event.target.value as PublicContentItem["status"])}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <StructuredContentEditor
            sections={sections}
            onSectionsChange={setSections}
            allowedTypes={["TEXT", "HERO", "CALLOUT"]}
            mediaFolderType="banner"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Content" : "Create Content"}
            </Button>
            <Button type="button" variant="secondary" onClick={clearEditor}>
              Reset Editor
            </Button>
          </div>
        </form>

        <div className="space-y-4 rounded-ds-lg border border-ds-border-base p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ds-text-primary">Live Preview</p>
              <p className="text-xs text-ds-text-tertiary">
                Mirrors generated HTML used by frontend fallback rendering.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-ds-full bg-ds-surface-sunken px-2 py-1 text-xs text-ds-text-secondary">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </span>
          </div>

          <div className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-base p-3">
            <h3 className="mb-2 text-lg font-semibold text-ds-text-primary">
              {title || "Untitled page"}
            </h3>
            <div
              className="prose prose-sm max-w-none text-ds-text-primary dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: generatedBody || "<p>No preview content yet.</p>",
              }}
            />
          </div>

          <div className="rounded-ds-md border border-ds-border-subtle bg-ds-surface-sunken p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-tertiary">
              Fallback Contract
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-ds-text-secondary">
              <li>Generated HTML body is always stored alongside structured metadata.</li>
              <li>Metadata includes section model + editor version for future migrations.</li>
              <li>Published pages can safely fall back to stored HTML if parser changes.</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">Current Content</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Slug</th>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Updated</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={selectedItemId === item.id ? "bg-ds-surface-sunken" : ""}
                  >
                    <td className="border p-2">{item.slug}</td>
                    <td className="border p-2">{item.title}</td>
                    <td className="border p-2">
                      <Badge>{item.status}</Badge>
                    </td>
                    <td className="border p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                    <td className="border p-2 space-x-2">
                      <Button onClick={() => onEdit(item)} size="sm">
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedItemId(item.id);
                          onEdit(item);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Load
                      </Button>
                      <Button onClick={() => requestDelete(item)} variant="danger" size="sm">
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border p-2">
                      No content items found.
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
