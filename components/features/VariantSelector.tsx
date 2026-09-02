"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import {
  DEFAULT_VARIATION_CONFIG,
  fetchVariationConfigNonBlocking,
  getVariationsForCategory,
  type ProductVariationConfig,
  type VariationDefinition,
} from "@/lib/config/productVariations";
import type { ProductVariant } from "@/lib/types";

interface VariantSelectorProps {
  category?: string | null;
  productVariants?: ProductVariant[] | null;
  value?: Record<string, string> | null;
  onChange?: (next: Record<string, string>) => void;
  disabled?: boolean;
}

function productVariantsToDefinitions(variants: ProductVariant[]): VariationDefinition[] {
  return variants.map((v) => ({
    key: v.name?.toLowerCase().trim() || v.id || "variant",
    label: v.name || "Variant",
    type: "select" as const,
    required: false,
    values: v.values.map((val) => ({ value: val, label: val })),
    placeholder: `Select ${v.name}`,
  }));
}

export default function VariantSelector({
  category,
  productVariants,
  value,
  onChange,
  disabled = false,
}: VariantSelectorProps) {
  const [externalConfig, setExternalConfig] = useState<ProductVariationConfig | null>(null);

  useEffect(() => {
    let mounted = true;
    // Non-blocking fetch; fallback is DEFAULT_VARIATION_CONFIG via helper
    void fetchVariationConfigNonBlocking().then((cfg) => {
      if (mounted) setExternalConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const definitions: VariationDefinition[] = useMemo(() => {
    // Per-product toggle: when productVariants is an array (even empty), it is the source of truth.
    // Empty array means sizing intentionally disabled for this product → hide selector.
    if (Array.isArray(productVariants)) {
      if (productVariants.length === 0) return [];
      try {
        return productVariantsToDefinitions(productVariants);
      } catch {
        // fallback to category config (non-blocking)
      }
    }
    // When productVariants is null/undefined, fall back to category-driven config (e.g. Fashion → Size)
    const cfg = externalConfig ?? DEFAULT_VARIATION_CONFIG;
    return getVariationsForCategory(category, cfg);
  }, [category, productVariants, externalConfig]);

  if (definitions.length === 0) return null;

  const handleSelect = (key: string, chosen: string) => {
    const next = { ...(value || {}), [key]: chosen };
    // Remove empty selections
    if (!chosen) delete next[key];
    onChange?.(next);
  };

  return (
    <div className="space-y-3">
      {definitions.map((def) => (
        <div key={def.key}>
          <label className="mb-1 block text-sm font-medium text-ds-text-secondary">
            {def.label}
            {def.required ? <span className="ml-1 text-ds-status-error">*</span> : null}
          </label>
          <Select
            className="w-full"
            placeholder={def.placeholder || `Select ${def.label}`}
            value={value?.[def.key] || undefined}
            onChange={(val: string) => handleSelect(def.key, val)}
            disabled={disabled}
            popupMatchSelectWidth={false}
            listHeight={256}
            options={def.values.map((v) => ({ value: v.value, label: v.label }))}
            allowClear={!def.required}
          />
        </div>
      ))}
    </div>
  );
}
