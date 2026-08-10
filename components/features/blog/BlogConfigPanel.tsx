"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, openActionConfirm, ActionConfirmBuilder } from "@/components/ui";
import { fetchJson } from "@/lib/utils";
import { BLOG_DEFAULTS, type BlogConfigShape } from "@/lib/config/blog";

const CONFIG_FIELDS: Array<{
  key: keyof BlogConfigShape;
  label: string;
  type: "text" | "textarea" | "number" | "toggle";
  helper?: string;
}> = [
  { key: "title", label: "Blog Title", type: "text", helper: "Shown at the top of the public blog page." },
  {
    key: "description",
    label: "Blog Description",
    type: "textarea",
    helper: "Short intro shown under the title and used as a fallback for SEO.",
  },
  {
    key: "heroHeading",
    label: "Hero Heading",
    type: "text",
    helper: "Optional large heading for the blog hero section.",
  },
  {
    key: "heroSubtitle",
    label: "Hero Subtitle",
    type: "textarea",
    helper: "Optional supporting copy for the hero section.",
  },
  { key: "seoTitle", label: "SEO Title (index)", type: "text", helper: "Overrides the <title> tag for /blog." },
  {
    key: "seoDescription",
    label: "SEO Description (index)",
    type: "textarea",
    helper: "Overrides the meta description for /blog.",
  },
  { key: "seoKeywords", label: "SEO Keywords (index)", type: "text", helper: "Comma-separated keywords for /blog." },
  {
    key: "postsPerPage",
    label: "Posts Per Page",
    type: "number",
    helper: "Maximum posts shown on the blog listing (1–60).",
  },
  { key: "defaultAuthorName", label: "Default Author", type: "text", helper: "Pre-filled author for new posts." },
  {
    key: "defaultCoverImage",
    label: "Default Cover Image URL",
    type: "text",
    helper: "Pre-filled cover image used when no image is uploaded.",
  },
  {
    key: "suggestedCategories",
    label: "Suggested Categories",
    type: "text",
    helper: "Comma-separated categories offered in the post editor.",
  },
  { key: "showAuthor", label: "Show Author", type: "toggle" },
  { key: "showReadTime", label: "Show Reading Time", type: "toggle" },
  { key: "showShareButtons", label: "Show Share Buttons", type: "toggle" },
  { key: "showFeaturedPost", label: "Show Featured Post", type: "toggle" },
];

export function BlogConfigPanel() {
  const [config, setConfig] = useState<BlogConfigShape>({ ...BLOG_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ success: boolean; data: BlogConfigShape }>(
        "/api/admin/blog/config"
      );
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load blog settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateField = (key: keyof BlogConfigShape, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...config };
      payload.postsPerPage = Math.max(1, Math.min(60, Number(payload.postsPerPage) || 9));
      payload.suggestedCategories =
        typeof payload.suggestedCategories === "string"
          ? (payload.suggestedCategories as string)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : payload.suggestedCategories;

      const data = await fetchJson<{ success: boolean; data: BlogConfigShape }>(
        "/api/admin/blog/config",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (data.success) {
        setConfig(data.data);
        setMessage("Blog settings saved.");
      } else {
        setError("Failed to save blog settings");
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to save blog settings");
    } finally {
      setSaving(false);
    }
  };

  const requestReset = () => {
    openActionConfirm(
      new ActionConfirmBuilder()
        .title("Reset blog settings")
        .message("Reset all blog settings to the platform defaults?")
        .confirmText("Reset")
        .danger()
        .build(),
      () => setConfig({ ...BLOG_DEFAULTS })
    );
  };

  if (loading) {
    return <div className="py-8 text-center text-ds-text-secondary">Loading blog settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ds-text-primary">Blog Settings</h2>
          <p className="mt-1 text-sm text-ds-text-secondary">
            Configure the public blog and SEO defaults. Changes apply immediately to viewer pages
            and the post editor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={requestReset}>
            Reset Defaults
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-ds-md bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-ds-md bg-ds-status-success-bg p-3 text-sm text-ds-status-success-text">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {CONFIG_FIELDS.map((field) => {
          const value = config[field.key];
          const fieldValue = value as string | number | boolean;

          if (field.type === "toggle") {
            return (
              <label
                key={field.key}
                className="flex items-start justify-between gap-4 rounded-ds-md border border-ds-border-base p-4"
              >
                <span>
                  <span className="block text-sm font-medium text-ds-text-primary">
                    {field.label}
                  </span>
                  {field.helper ? (
                    <span className="mt-1 block text-xs text-ds-text-tertiary">{field.helper}</span>
                  ) : null}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(fieldValue)}
                  onChange={(e) => updateField(field.key, e.target.checked)}
                  className="mt-1 h-4 w-4 accent-ds-brand-primary"
                  aria-label={field.label}
                />
              </label>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key}>
                <Input
                  label={field.label}
                  type="number"
                  min={1}
                  max={60}
                  value={Number(fieldValue)}
                  onChange={(e) => updateField(field.key, Number(e.target.value))}
                />
                {field.helper ? (
                  <p className="mt-1 text-xs text-ds-text-tertiary">{field.helper}</p>
                ) : null}
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.key} className={field.key === "seoDescription" ? "md:col-span-2" : ""}>
                <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                  {field.label}
                </label>
                <textarea
                  className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 text-sm"
                  rows={3}
                  value={String(fieldValue ?? "")}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.label}
                />
                {field.helper ? (
                  <p className="mt-1 text-xs text-ds-text-tertiary">{field.helper}</p>
                ) : null}
              </div>
            );
          }

          return (
            <div key={field.key}>
              <Input
                label={field.label}
                value={String(fieldValue ?? "")}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.label}
              />
              {field.helper ? (
                <p className="mt-1 text-xs text-ds-text-tertiary">{field.helper}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
