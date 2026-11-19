"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, CalendarClock } from "lucide-react";
import { Badge, Rating } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorName: string;
  vendorId: string;
  isVendorVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  discount?: number;
  isFeatured?: boolean;
  isService?: boolean;
  rateLabel?: string;
  onAddToCart?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
  /** Flash-sale style "X items left" bar (Jumia pattern). */
  showStockBar?: boolean;
  /** Reference stock used to size the "items left" bar (defaults to 50). */
  stockBarCapacity?: number;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  vendorName,
  vendorId,
  isVendorVerified = false,
  rating = 0,
  reviewCount = 0,
  stock = 0,
  discount,
  isFeatured,
  isService: isServiceProp,
  rateLabel,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className,
  showStockBar = false,
  stockBarCapacity = 50,
}: ProductCardProps) {
  const normalizedDiscount = typeof discount === "number" ? discount : Number(discount ?? 0);
  const hasDiscount = Number.isFinite(normalizedDiscount) && normalizedDiscount > 0;
  const discountRate = hasDiscount ? Math.min(normalizedDiscount, 100) : 0;
  const discountedPrice = hasDiscount ? Math.max(price - (price * discountRate) / 100, 0) : price;
  const isService = isServiceProp || stock >= SERVICE_UNLIMITED_STOCK;
  const isOutOfStock = !isService && stock === 0;

  const stockPercent =
    stockBarCapacity > 0 ? Math.max(4, Math.min(100, Math.round((stock / stockBarCapacity) * 100))) : 0;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-ds-md bg-ds-surface-base transition-shadow hover:shadow-ds-lg dark:bg-ds-surface-raised",
        className
      )}
    >
      {/* Image */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-ds-surface-sunken">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Status badges (top-left) */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {isService && <Badge variant="info">Service</Badge>}
            {isFeatured && <Badge variant="primary">Featured</Badge>}
            {isOutOfStock && <Badge variant="default">Out of Stock</Badge>}
          </div>

          {/* Discount pill (top-right, Jumia style) */}
          {hasDiscount && (
            <span className="absolute right-1.5 top-1.5 rounded-ds-xs bg-ds-palette-magenta-100 px-1.5 py-0.5 text-xs font-bold text-ds-palette-magenta-700 dark:bg-ds-palette-magenta-900 dark:text-ds-palette-magenta-200">
              -{discountRate}%
            </span>
          )}
        </div>
      </Link>

      {/* Favourite */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite?.();
        }}
        className={cn(
          "absolute right-1.5 rounded-ds-full bg-ds-surface-base/90 p-1.5 shadow-ds-md transition-colors hover:bg-ds-surface-sunken dark:bg-ds-surface-overlay/90",
          hasDiscount ? "top-9" : "top-1.5"
        )}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={cn(
            "h-4 w-4",
            isFavorite ? "fill-ds-brand-primary text-ds-brand-primary" : "text-ds-text-secondary"
          )}
        />
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2 sm:p-2.5">
        <Link href={`/products/${id}`}>
          <h3 className="mb-1 line-clamp-2 min-h-[2.5em] text-xs font-normal leading-snug text-ds-text-primary transition-colors hover:text-ds-text-brand sm:text-sm">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex flex-col leading-tight">
          <span className="truncate text-sm font-bold text-ds-text-primary sm:text-base">
            {rateLabel && isService ? `${rateLabel} ` : ""}
            {formatCurrency(discountedPrice)}
          </span>
          {hasDiscount && (
            <span className="truncate text-[11px] text-ds-text-tertiary line-through sm:text-xs">
              {formatCurrency(price)}
            </span>
          )}
        </div>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-0.5">
            <Rating value={rating} readonly size="sm" />
            <span className="text-[10px] text-ds-text-secondary sm:text-xs">({reviewCount})</span>
          </div>
        )}

        {/* Sold by */}
        <div className="mt-1 flex min-w-0 items-center gap-1">
          <Link
            href={`/vendors/${vendorId}`}
            className="truncate text-[11px] text-ds-text-secondary transition-colors hover:text-ds-text-brand sm:text-xs"
          >
            {vendorName}
          </Link>
          {!isVendorVerified && (
            <Badge variant="warning" size="sm">
              Unverified
            </Badge>
          )}
        </div>

        {/* Flash-sale stock bar */}
        {showStockBar && !isService && !isOutOfStock && (
          <div className="mt-2">
            <p className="mb-1 text-[11px] text-ds-text-secondary">{stock} items left</p>
            <div className="h-1.5 w-full overflow-hidden rounded-ds-full bg-ds-palette-magenta-100 dark:bg-ds-palette-magenta-900">
              <div className="h-full rounded-ds-full bg-ds-brand-primary" style={{ width: `${stockPercent}%` }} />
            </div>
          </div>
        )}

        {/* Add to cart — always on touch, reveal on hover for desktop */}
        {onAddToCart && (
          <div className="mt-auto pt-2">
          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-ds-sm px-2 py-2 text-xs font-semibold uppercase tracking-wide shadow-ds-sm transition-all sm:text-[13px] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
              isOutOfStock
                ? "cursor-not-allowed bg-ds-surface-sunken text-ds-text-placeholder lg:opacity-100"
                : isService
                  ? "bg-ds-status-info text-white hover:bg-ds-status-info/80"
                  : "bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
            )}
            aria-label={isOutOfStock ? "Out of Stock" : isService ? "Book Now" : "Add to Cart"}
          >
            {isService ? (
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            )}
            {isOutOfStock ? "Out of stock" : isService ? "Book now" : "Add to cart"}
          </button>
          </div>
        )}
      </div>
    </div>
  );
}
