"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useCart, buildCartPricing } from "@/lib/store/cartStore";
import { useToast } from "@/lib/contexts/ToastContext";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import VariantSelector from "@/components/features/VariantSelector";
import {
  DEFAULT_VARIATION_CONFIG,
  getVariationsForCategory,
  validateSelectedVariants,
} from "@/lib/config/productVariations";
import type { ProductVariant } from "@/lib/types";

interface Props {
  id: string;
  name: string;
  price: number;
  discount?: number | null;
  images?: string[] | null;
  vendorId: string;
  vendorName?: string | null;
  stock?: number | null;
  category?: string | null;
  variants?: ProductVariant[] | null;
}

export default function ProductDetailActions({
  id,
  name,
  price,
  discount,
  images,
  vendorId,
  vendorName,
  stock = 0,
  category,
  variants,
}: Props) {
  const { addItem } = useCart();
  const toast = useToast();
  const { requireAuth } = useGuestGuard();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const definitions = useMemo(() => {
    // Per-product toggle: empty array means explicitly disabled → hide all variant UI
    if (Array.isArray(variants)) {
      if (variants.length === 0) return [];
      return variants.map((v) => ({
        key: v.name?.toLowerCase().trim() || v.id || "variant",
        label: v.name || "Variant",
        required: false as boolean,
        values: v.values,
      }));
    }
    return getVariationsForCategory(category, DEFAULT_VARIATION_CONFIG);
  }, [category, variants]);

  const hasRequired = useMemo(() => definitions.some((d) => (d as { required?: boolean }).required), [definitions]);
  const sizeDef = useMemo(() => definitions.find((d) => d.key === "size"), [definitions]);
  const nonSizeDefinitions = useMemo(() => definitions.filter((d) => d.key !== "size"), [definitions]);

  // Multi-size quantities: enables buying M×1, L×1, XL×1 in same order as separate cart lines
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});

  const hasSizing = !!sizeDef && sizeDef.values.length > 0;
  const isOutOfStock = stock !== undefined && stock !== null && stock <= 0;

  const adjustSizeQty = (sizeVal: string, delta: number) => {
    setSizeQuantities((prev) => {
      const cur = prev[sizeVal] ?? 0;
      const next = Math.max(0, Math.min(99, cur + delta));
      return { ...prev, [sizeVal]: next };
    });
  };

  const setSizeQtyDirect = (sizeVal: string, qty: number) => {
    const clamped = Math.max(0, Math.min(99, Math.floor(qty) || 0));
    setSizeQuantities((prev) => ({ ...prev, [sizeVal]: clamped }));
  };

  const handleAddSingleSize = (sizeVal: string, qty: number) => {
    if (!requireAuth("add items to your cart")) return;
    if (qty <= 0) {
      toast.error("Select quantity for that size first");
      return;
    }
    // Include any non-size variants (e.g. color) from selected state
    const baseVariants: Record<string, string> = {};
    for (const def of nonSizeDefinitions) {
      const v = selected[def.key];
      if (def.required && !v) {
        toast.error(`Please select ${def.label} before adding to cart`);
        return;
      }
      if (v) baseVariants[def.key] = v;
    }
    const merged: Record<string, string> = { ...baseVariants, size: sizeVal };
    const vendor = vendorName || "Vendor";
    const pricing = buildCartPricing(price, discount);
    addItem({
      productId: id,
      name,
      ...pricing,
      image: (Array.isArray(images) && images[0]) || "/placeholder-product.jpg",
      vendorId,
      vendorName: vendor,
      stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
      selectedVariants: merged,
      variant: sizeVal,
      quantity: qty,
    } as never);
    toast.success(`${name} (${sizeVal} × ${qty}) added to cart`);
  };

  const handleAddAllSizes = () => {
    if (!requireAuth("add items to your cart")) return;
    const entries = Object.entries(sizeQuantities).filter(([, q]) => q > 0);
    if (entries.length === 0) {
      toast.error("Select quantity for at least one size");
      return;
    }
    for (const def of nonSizeDefinitions) {
      if (def.required && !selected[def.key]) {
        toast.error(`Please select ${def.label} before adding to cart`);
        return;
      }
    }
    const vendor = vendorName || "Vendor";
    const pricing = buildCartPricing(price, discount);
    let added = 0;
    for (const [sizeVal, qty] of entries) {
      const baseVariants: Record<string, string> = {};
      for (const def of nonSizeDefinitions) {
        const v = selected[def.key];
        if (v) baseVariants[def.key] = v;
      }
      const merged: Record<string, string> = { ...baseVariants, size: sizeVal };
      addItem({
        productId: id,
        name,
        ...pricing,
        image: (Array.isArray(images) && images[0]) || "/placeholder-product.jpg",
        vendorId,
        vendorName: vendor,
        stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
        selectedVariants: merged,
        variant: sizeVal,
        quantity: qty,
      } as never);
      added += 1;
    }
    // Clear quantities after bulk add (non-blocking UX)
    setSizeQuantities({});
    toast.success(added === 1 ? `${name} added to cart` : `${added} sizes of ${name} added to cart`);
  };

  const handleAddToCartSingle = () => {
    if (!requireAuth("add items to your cart")) return;
    // When sizing is enabled via definitions but we are not using multi-size grid (fallback path),
    // reuse existing validation. However with hasSizing we now route through multi path, so this
    // handler is only for non-sizing products or non-size variants.
    if (hasSizing) {
      // Prefer bulk path if any quantity chosen, else show guidance
      const entries = Object.entries(sizeQuantities).filter(([, q]) => q > 0);
      if (entries.length > 0) {
        handleAddAllSizes();
        return;
      }
      // No multi qty chosen: fall back to single select value if present
      const validation = validateSelectedVariants(category, selected, DEFAULT_VARIATION_CONFIG);
      if (!validation.valid && hasRequired) {
        toast.error(`Please select ${validation.missing.join(", ")} before adding to cart`);
        return;
      }
      if (!selected.size) {
        toast.error("Select a size and quantity above, or use Add per size");
        return;
      }
    } else {
      const validation = validateSelectedVariants(category, selected, DEFAULT_VARIATION_CONFIG);
      if (!validation.valid && hasRequired) {
        toast.error(`Please select ${validation.missing.join(", ")} before adding to cart`);
        return;
      }
    }
    const vendor = vendorName || "Vendor";
    const pricing = buildCartPricing(price, discount);
    const legacyVariant = selected?.size || selected?.value || Object.values(selected)[0];
    addItem({
      productId: id,
      name,
      ...pricing,
      image: (Array.isArray(images) && images[0]) || "/placeholder-product.jpg",
      vendorId,
      vendorName: vendor,
      stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
      selectedVariants: Object.keys(selected).length > 0 ? selected : null,
      variant: legacyVariant,
    } as never);
    toast.success(`${name} added to cart`);
  };

  // Detect if we should show multi-size grid (sizing enabled and not out of stock)
  const showMultiSize = hasSizing && !isOutOfStock;

  return (
    <div className="mt-6 space-y-4">
      {hasSizing ? (
        <>
          {/* Non-size variants (e.g. color) via standard selector */}
          {nonSizeDefinitions.length > 0 ? (
            <VariantSelector
              category={null}
              productVariants={variants?.filter((v) => (v.name || "").toLowerCase().trim() !== "size") ?? null}
              value={selected}
              onChange={setSelected}
              disabled={isOutOfStock}
            />
          ) : null}
          {/* Size multi-quantity grid: supports buying multiple sizes in one order */}
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-3">
            <p className="mb-2 text-sm font-medium text-ds-text-primary">
              Select size and quantity
              <span className="ml-2 text-xs font-normal text-ds-text-tertiary">Add multiple sizes at once</span>
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sizeDef!.values.map((opt: unknown) => {
                const isObj = typeof opt === "object" && opt !== null && "value" in (opt as Record<string, unknown>);
                const val = isObj ? String((opt as { value: string }).value) : String(opt);
                const label = isObj ? String((opt as { label: string }).label ?? val) : val;
                const qty = sizeQuantities[val] ?? 0;
                return (
                  <div key={val} className="flex items-center justify-between rounded-ds-sm border border-ds-border-subtle px-3 py-2">
                    <span className="text-sm font-medium text-ds-text-primary">{label}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustSizeQty(val, -1)}
                        disabled={qty <= 0}
                        aria-label={`Decrease ${label} quantity`}
                        className="h-7 w-7 p-0"
                      >
                        −
                      </Button>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={qty}
                        onChange={(e) => setSizeQtyDirect(val, Number(e.target.value))}
                        className="h-7 w-12 rounded-ds-sm border border-ds-border-base bg-ds-surface-base text-center text-sm"
                        aria-label={`${label} quantity`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustSizeQty(val, 1)}
                        disabled={isOutOfStock}
                        aria-label={`Increase ${label} quantity`}
                        className="h-7 w-7 p-0"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddSingleSize(val, qty || 1)}
                        disabled={isOutOfStock || qty === 0 ? false : false}
                        className="ml-1 bg-ds-brand-primary text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={handleAddAllSizes} disabled={isOutOfStock} className="flex-1 bg-ds-brand-primary text-white">
                Add Selected Sizes to Cart
              </Button>
            </div>
            <p className="mt-2 text-xs text-ds-text-tertiary">
              Each size is added as a separate line in your cart (e.g. M × 1, L × 1, XL × 1). Edit quantities in the cart before checkout.
            </p>
          </div>
        </>
      ) : (
        <VariantSelector
          category={category}
          productVariants={variants ?? null}
          value={selected}
          onChange={setSelected}
          disabled={isOutOfStock}
        />
      )}
      {!showMultiSize ? (
        <Button onClick={handleAddToCartSingle} disabled={isOutOfStock} className="bg-ds-brand-primary text-white">
          {isOutOfStock ? "Out of stock" : "Add to Cart"}
        </Button>
      ) : null}
      {hasRequired && !isOutOfStock && !hasSizing ? (
        <p className="text-xs text-ds-text-tertiary">Required variants must be selected before adding to cart.</p>
      ) : null}
    </div>
  );
}
