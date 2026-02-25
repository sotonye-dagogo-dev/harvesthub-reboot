"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Badge, Rating } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorName: string;
  vendorId: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  discount?: number;
  isFeatured?: boolean;
  onAddToCart?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  vendorName,
  vendorId,
  rating = 0,
  reviewCount = 0,
  stock = 0,
  discount,
  isFeatured,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className,
}: ProductCardProps) {
  const discountedPrice = discount ? price - (price * discount) / 100 : price;
  const isOutOfStock = stock === 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base transition-all hover:shadow-ds-lg  dark:bg-ds-surface-base",
        className
      )}
    >
      {/* Image Container */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-ds-surface-sunken">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute left-1 top-1 flex flex-col gap-0.5 sm:left-1.5 sm:top-1.5 sm:gap-1">
            {isFeatured && <Badge variant="primary">Featured</Badge>}
            {discount && discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
            {isOutOfStock && <Badge variant="default">Out of Stock</Badge>}
          </div>

          {/* Favorite Button - always visible */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.();
            }}
            className="absolute right-1.5 top-1.5 rounded-ds-full bg-ds-surface-base/80 p-1.5 shadow-ds-md transition-colors hover:bg-ds-surface-sunken dark:bg-ds-surface-overlay/80 dark:hover:bg-ds-surface-overlay"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-ds-status-error text-ds-status-error" : "text-ds-text-secondary"
              )}
            />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-2 sm:p-2.5">
        <Link href={`/products/${id}`}>
          <h3 className="mb-0.5 line-clamp-1 text-xs font-semibold text-ds-text-primary transition-colors hover:text-ds-text-brand sm:text-sm dark:text-ds-text-primary dark:hover:text-ds-brand-accent">
            {name}
          </h3>
        </Link>

        <Link
          href={`/vendors/${vendorId}`}
          className="mb-0.5 block text-[11px] text-ds-text-secondary transition-colors hover:text-ds-text-brand sm:text-xs dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
        >
          {vendorName}
        </Link>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mb-1 flex items-center gap-0.5">
            <Rating value={rating} readonly size="sm" />
            <span className="text-[10px] text-ds-text-secondary sm:text-xs">({reviewCount})</span>
          </div>
        )}

        {/* Price + Cart Row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-bold text-ds-text-brand sm:text-sm truncate">
              {formatCurrency(discountedPrice)}
            </span>
            {discount && discount > 0 && (
              <span className="text-[10px] text-ds-text-tertiary line-through sm:text-xs dark:text-ds-text-placeholder">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button - compact icon */}
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={cn(
                "flex-shrink-0 rounded-ds-md p-1.5 transition-colors sm:p-2",
                isOutOfStock
                  ? "cursor-not-allowed bg-ds-surface-sunken text-ds-text-placeholder"
                  : "bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
              )}
              aria-label={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
