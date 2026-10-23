"use client";

import { useCallback, useMemo, useState } from "react";
import { App, Button, Input, Switch, Tag } from "antd";
import { Card } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import type { OptionListKey, OptionListTier, OptionRow } from "@/lib/config/optionLists";

type AdminList = {
  key: OptionListKey;
  tier: OptionListTier;
  label: string;
  description?: string | null;
  options: OptionRow[];
  allowedValues?: string[] | null;
  maxOptions?: number | null;
  fallback: boolean;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
};

type InventoryEntry = {
  key: OptionListKey;
  tier: OptionListTier;
  label: string;
  count: number;
  fallback: boolean;
  updatedAt?: string;
};

const TIER_COLOR: Record<OptionListTier, string> = {
  DISPLAY: "blue",
  FREEFORM: "purple",
};

export default function OptionListsPage() {
  const { message } = App.useApp();
  const [editing, setEditing] = useState<OptionListKey | null>(null);
  const [draft, setDraft] = useState<OptionRow[]>([]);
  const [maxOptions, setMaxOptions] = useState<number>(200);
  const [saving, setSaving] = useState(false);

  const fetchLists = useCallback(async (): Promise<InventoryEntry[]> => {
    const res = await fetch("/api/admin/option-lists", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to load option lists");
    return data.lists as InventoryEntry[];
  }, []);

  const { data: lists, refresh, isLoading } = useSmartResource(fetchLists, {
    key: "admin-option-lists",
    staleTimeMs: 15_000,
  });

  const startEdit = useCallback(
    async (key: OptionListKey) => {
      try {
        const res = await fetch(`/api/admin/option-lists/${key}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load list");
        const list = data.list as AdminList;
        setEditing(key);
        setDraft(list.options.map((row) => ({ ...row })));
        setMaxOptions(list.maxOptions ?? 200);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "Failed to load list");
      }
    },
    [message],
  );

  const updateRow = useCallback((index: number, patch: Partial<OptionRow>) => {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  const moveRow = useCallback((index: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const current = next[index];
      const swapWith = next[target];
      if (!current || !swapWith) return prev;
      next[index] = swapWith;
      next[target] = current;
      return next;
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addRow = useCallback(() => {
    setDraft((prev) =>
      prev.length >= maxOptions
        ? prev
        : [...prev, { value: "", label: "", description: "", group: "" }],
    );
  }, [maxOptions]);

  const editingDefinition = useMemo(
    () => lists?.find((entry) => entry.key === editing),
    [lists, editing],
  );
  const isFreeform = editingDefinition?.tier === "FREEFORM";

  const save = useCallback(async () => {
    if (!editing) return;

    const cleaned = draft
      .map((row) => ({
        ...row,
        value: (row.value ?? "").trim(),
        label: (row.label ?? "").trim(),
        description: (row.description ?? "").trim() || undefined,
        group: (row.group ?? "").trim() || undefined,
      }))
      .filter((row) => row.value.length > 0 && row.label.length > 0);

    if (cleaned.length !== draft.length) {
      message.error("Every option needs both a value and a label.");
      return;
    }
    if (isFreeform && new Set(cleaned.map((row) => row.value)).size !== cleaned.length) {
      message.error("Duplicate option values are not allowed.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/option-lists/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: cleaned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      message.success("Option list saved");
      setEditing(null);
      setDraft([]);
      await refresh(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [editing, draft, isFreeform, message, refresh]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Option Lists</h1>
        <p className="text-sm text-ds-text-secondary">
          Dropdown values used across the marketplace. <Tag color="blue">DISPLAY</Tag> lists have a
          fixed value set — you can relabel, reorder and hide entries but not add new ones.{" "}
          <Tag color="purple">FREEFORM</Tag> lists can also add and remove options.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ds-text-tertiary">Loading option lists…</p>
      ) : null}

      <div className="grid gap-4">
        {(lists ?? []).map((list) => (
          <Card key={list.key}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ds-text-primary">
                  {list.label}{" "}
                  <span className="ml-2 text-xs font-normal text-ds-text-tertiary">{list.key}</span>{" "}
                  <Tag color={TIER_COLOR[list.tier]}>{list.tier}</Tag>
                  {list.fallback ? (
                    <Tag color="default">fallback</Tag>
                  ) : (
                    <Tag color="green">custom</Tag>
                  )}
                </p>
                <p className="text-xs text-ds-text-secondary">
                  {list.count} option{list.count === 1 ? "" : "s"}
                  {list.updatedAt ? ` · updated ${new Date(list.updatedAt).toLocaleString()}` : ""}
                </p>
              </div>
              <Button size="small" onClick={() => void startEdit(list.key)}>
                {editing === list.key ? "Editing…" : "Edit"}
              </Button>
            </div>

            {editing === list.key ? (
              <div className="mt-4 space-y-3">
                <div className="rounded border border-ds-border-base bg-ds-surface-sunken p-3">
                  <p className="mb-2 text-xs font-medium text-ds-text-secondary">
                    {isFreeform
                      ? "Add, remove, rename and reorder options."
                      : "Rename labels, reorder, or hide an option. Values cannot be changed."}
                    {maxOptions ? ` Maximum ${maxOptions} options.` : ""}
                  </p>

                  <div className="space-y-2">
                    {draft.map((row, index) => (
                      <div
                        key={`${row.value || "new"}-${index}`}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <div className="flex gap-1">
                          <Button
                            size="small"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => moveRow(index, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            size="small"
                            aria-label="Move down"
                            disabled={index === draft.length - 1}
                            onClick={() => moveRow(index, 1)}
                          >
                            ↓
                          </Button>
                        </div>

                        <Input
                          className="w-44"
                          size="small"
                          placeholder="Value"
                          value={row.value}
                          disabled={!isFreeform}
                          onChange={(event) =>
                            isFreeform ? updateRow(index, { value: event.target.value }) : undefined
                          }
                        />
                        <Input
                          className="w-56"
                          size="small"
                          placeholder="Label"
                          value={row.label}
                          onChange={(event) => updateRow(index, { label: event.target.value })}
                        />
                        <Input
                          className="w-40"
                          size="small"
                          placeholder="Group (optional)"
                          value={row.group ?? ""}
                          onChange={(event) => updateRow(index, { group: event.target.value })}
                        />

                        <label className="flex items-center gap-2 text-xs text-ds-text-secondary">
                          <Switch
                            size="small"
                            checked={!row.hidden}
                            onChange={(checked) => updateRow(index, { hidden: !checked })}
                          />
                          Visible
                        </label>

                        {isFreeform ? (
                          <Button size="small" danger onClick={() => removeRow(index)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    ))}

                    {draft.length === 0 ? (
                      <p className="text-xs text-ds-text-tertiary">
                        No options. {isFreeform ? "Add one below." : "Fallbacks will be used."}
                      </p>
                    ) : null}
                  </div>

                  {isFreeform && draft.length < maxOptions ? (
                    <Button size="small" className="mt-3" onClick={addRow}>
                      Add option
                    </Button>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button type="primary" size="small" loading={saving} onClick={() => void save()}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(null);
                      setDraft([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
