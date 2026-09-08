"use client";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { App, Input, Button, Tag } from "antd";

type Tpl = { key: string; subject: string; body: string; variables: string[]; isActive?: boolean; label?: string; description?: string; fallback?: boolean };

export default function EmailTemplatesPage() {
  const { message } = App.useApp();
  const [editing, setEditing] = useState<Tpl | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTpls = useCallback(async (): Promise<Tpl[]> => {
    const res = await fetch("/api/admin/email-templates", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to load templates");
    return data.templates as Tpl[];
  }, []);

  const { data: templates, refresh, isLoading } = useSmartResource(fetchTpls, { key: "admin-email-templates", staleTimeMs: 15000 });

  const startEdit = (tpl: Tpl) => {
    setEditing(tpl);
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editing.key, subject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      message.success("Template saved");
      setEditing(null);
      await refresh(true);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Email Templates</h1>
        <p className="text-sm text-ds-text-secondary">Config-driven, admin-editable. Variables like {"{{orderNumber}}"} are replaced at send time. Fallback defaults are used when no DB row exists (non-blocking).</p>
      </div>
      {isLoading ? <p className="text-sm text-ds-text-tertiary">Loading templates...</p> : null}
      <div className="grid gap-4">
        {(templates ?? []).map((tpl) => (
          <Card key={tpl.key}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ds-text-primary">{tpl.label || tpl.key} <span className="ml-2 text-xs font-normal text-ds-text-tertiary">{tpl.key}</span> {tpl.fallback ? <Tag color="default">fallback</Tag> : <Tag color="green">custom</Tag>}</p>
                <p className="text-xs text-ds-text-secondary">{tpl.description}</p>
                <p className="mt-1 text-xs text-ds-text-tertiary">Variables: {(tpl.variables ?? []).join(", ")}</p>
              </div>
              <Button size="small" onClick={() => startEdit(tpl)}>Edit</Button>
            </div>
            {editing?.key === tpl.key ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ds-text-secondary">Subject</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject with {{variables}}" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ds-text-secondary">Body (use {{variable}} placeholders)</label>
                  <Input.TextArea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button type="primary" loading={saving} onClick={save}>Save</Button>
                  <Button onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded border border-ds-border-base bg-ds-surface-sunken p-3">
                <p className="text-xs font-medium text-ds-text-secondary">Subject: <span className="font-normal">{tpl.subject}</span></p>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-ds-text-secondary">{tpl.body.slice(0, 300)}{tpl.body.length > 300 ? "…" : ""}</pre>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
