"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Button, Badge, Rating } from "@/components/ui";
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
        "group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Image Container */}
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-2">
            {isFeatured && <Badge variant="primary">Featured</Badge>}
            {discount && discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
            {isOutOfStock && <Badge variant="default">Out of Stock</Badge>}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-400"
                )}
              />
            </button>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 transition-colors hover:text-purple-600 dark:text-white dark:hover:text-purple-400">
            {name}
          </h3>
        </Link>

        <Link
          href={`/vendors/${vendorId}`}
          className="mb-2 block text-sm text-gray-600 transition-colors hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
        >
          {vendorName}
        </Link>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <Rating value={rating} readonly size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(discountedPrice)}
          </span>
          {discount && discount > 0 && (
            <span className="text-sm text-gray-500 line-through dark:text-gray-400">
              {formatCurrency(price)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        {onAddToCart && (
          <Button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            fullWidth
            size="sm"
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
