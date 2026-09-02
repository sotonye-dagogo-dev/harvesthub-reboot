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
    if (Array.isArray(variants) && variants.length > 0) {
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

  const handleAddToCart = () => {
    if (!requireAuth("add items to your cart")) return;
    // Non-blocking validation: only enforce when config says required
    const validation = validateSelectedVariants(category, selected, DEFAULT_VARIATION_CONFIG);
    if (!validation.valid && hasRequired) {
      toast.error(`Please select ${validation.missing.join(", ")} before adding to cart`);
      return;
    }
    const vendor = vendorName || "Vendor";
    const pricing = buildCartPricing(price, discount);

    // Keep both fields: selectedVariants map and legacy variant string for compat
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

  const isOutOfStock = stock !== undefined && stock !== null && stock <= 0;

  return (
    <div className="mt-6 space-y-4">
      <VariantSelector
        category={category}
        productVariants={variants ?? null}
        value={selected}
        onChange={setSelected}
        disabled={isOutOfStock}
      />
      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="bg-ds-brand-primary text-white"
      >
        {isOutOfStock ? "Out of stock" : "Add to Cart"}
      </Button>
      {hasRequired && !isOutOfStock ? (
        <p className="text-xs text-ds-text-tertiary">Required variants must be selected before adding to cart.</p>
      ) : null}
    </div>
  );
}
