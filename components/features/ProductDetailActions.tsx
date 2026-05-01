"use client";

import React from "react";
import { Button } from "@/components/ui";
import { useCart, buildCartPricing } from "@/lib/store/cartStore";
import { useToast } from "@/lib/contexts/ToastContext";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";

interface Props {
  id: string;
  name: string;
  price: number;
  discount?: number | null;
  images?: string[] | null;
  vendorId: string;
  vendorName?: string | null;
  stock?: number | null;
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
}: Props) {
  const { addItem } = useCart();
  const toast = useToast();
  const { requireAuth } = useGuestGuard();

  const handleAddToCart = () => {
    if (!requireAuth("add items to your cart")) return;
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
    });

    toast.success(`${name} added to cart`);
  };

  const isOutOfStock = stock !== undefined && stock !== null && stock <= 0;

  return (
    <div className="mt-6">
      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="bg-ds-brand-primary text-white"
      >
        {isOutOfStock ? "Out of stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
