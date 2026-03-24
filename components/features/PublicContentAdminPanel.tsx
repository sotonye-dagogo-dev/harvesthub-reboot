"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { fetchJson } from "@/lib/utils";

type PublicContentItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
};

const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export function PublicContentAdminPanel() {
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<PublicContentItem["status"]>("PUBLISHED");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<PublicContentItem[]>("/api/admin/public-content");
      if (data) setItems(data);
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

    if (!slug || !title || !body) {
      setError("slug, title, and body are required");
      return;
    }

    try {
      await fetchJson("/api/admin/public-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, body, status }),
      });

      setSlug("");
      setTitle("");
      setBody("");
      setStatus("PUBLISHED");
      setEditingId(null);
      await fetchContent();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save public content");
    }
  };

  const onEdit = (item: PublicContentItem) => {
    setSlug(item.slug);
    setTitle(item.title);
    setBody(item.body);
    setStatus(item.status);
    setEditingId(item.id);
  };

  const onDelete = async (item: PublicContentItem) => {
    if (!confirm(`Delete content "${item.title}"?`)) return;
    await fetchJson(`/api/admin/public-content?slug=${encodeURIComponent(item.slug)}`, {
      method: "DELETE",
    });
    await fetchContent();
  };

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [items]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Public Content Editor</h2>
      {error && <div className="rounded bg-rose-50 p-3 text-rose-700">{error}</div>}

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="terms"
          required
        />
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Terms & Conditions"
          required
        />
        <select
          className="form-select"
          value={status}
          onChange={(event) => setStatus(event.target.value as PublicContentItem["status"])}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="md:col-span-3">
          <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
            Body (HTML)
          </label>
          <textarea
            className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 text-sm dark:bg-ds-surface-raise"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="md:col-span-3">
          {editingId ? "Update" : "Create"}
        </Button>
      </form>

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
                  <tr key={item.id}>
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
                      <Button onClick={() => onDelete(item)} variant="danger" size="sm">
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
