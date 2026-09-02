"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { Input, message } from "antd";
import { DEFAULT_VARIATION_CONFIG, type ProductVariationConfig } from "@/lib/config/productVariations";

export const dynamic = "force-dynamic";

export default function VariationConfigPage() {
  const [config, setConfig] = useState<ProductVariationConfig>(DEFAULT_VARIATION_CONFIG);
  const [rawJson, setRawJson] = useState<string>(JSON.stringify(DEFAULT_VARIATION_CONFIG, null, 2));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/variation-config", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.config) throw new Error(data?.error || "Failed to load config");
        if (active) {
          setConfig(data.config);
          setRawJson(JSON.stringify(data.config, null, 2));
        }
      } catch (e) {
        if (active) message.error(e instanceof Error ? e.message : "Failed to load variation config");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleResetToDefault = () => {
    setRawJson(JSON.stringify(DEFAULT_VARIATION_CONFIG, null, 2));
    message.info("Reset to default config — save to apply");
  };

  const handleSave = async () => {
    let parsed: ProductVariationConfig;
    try {
      parsed = JSON.parse(rawJson) as ProductVariationConfig;
      if (!Array.isArray(parsed.categories)) throw new Error("categories must be an array");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/variation-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: parsed.categories, version: (parsed.version ?? 1) + 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to save");
      setConfig(data.config);
      setRawJson(JSON.stringify(data.config, null, 2));
      message.success("Variation config saved (non-blocking, live without redeploy)");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-ds-text-secondary">Loading variation config…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Product Variation Config</h1>
          <p className="mt-1 text-sm text-ds-text-secondary">
            Config-driven, admin-editable variation templates. Expand to any category (e.g. Fashion → size, color). All reads are non-blocking with fallback to defaults.
          </p>
          <p className="mt-2 text-xs text-ds-text-tertiary">
            Example: Fashion category currently has Size = M, L, XL, XXL (edit values as needed). Add new CategoryVariationConfig entries to cover other categories.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefault} disabled={saving}>
            Reset to Default
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Config
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-ds-text-primary">Current Config (JSON)</h2>
        <p className="mb-3 text-xs text-ds-text-secondary">Edit carefully — invalid JSON will be rejected. Version auto-increments on save.</p>
        <Input.TextArea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          rows={22}
          className="font-mono text-xs"
          style={{ fontFamily: "monospace" }}
        />
        <p className="mt-2 text-xs text-ds-text-tertiary">Effective config has {config.categories.length} category group(s), version {config.version}.</p>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ds-text-primary">Non-blocking guarantee</h3>
        <p className="mt-1 text-xs text-ds-text-secondary">
          Clients fetch <code>/api/config/variation-config</code> with a 2.5s timeout. On any failure (network, DB, timeout) they fall back to built-in <code>DEFAULT_VARIATION_CONFIG</code>. Product and checkout pages never block rendering on variation config — they degrade to per-product <code>variants</code> or no variants.
        </p>
      </Card>
    </div>
  );
}
