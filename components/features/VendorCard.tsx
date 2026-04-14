"use client";

import Link from "next/link";
import { MapPin, Star, Package } from "lucide-react";
import { Card, Badge, VendorAvatar } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface VendorCardProps {
  id: string;
  name: string;
  logo?: string;
  category: string;
  campus: string;
  rating?: number;
  productCount?: number;
  description?: string;
  isVerified?: boolean;
  className?: string;
}

export function VendorCard({
  id,
  name,
  logo,
  category,
  campus,
  rating = 0,
  productCount = 0,
  description,
  isVerified = false,
  className,
}: VendorCardProps) {
  return (
    <Link href={`/vendors/${id}`} className="block h-full">
      <Card className={cn("h-full transition-all hover:shadow-ds-lg", className)} hoverable>
        <div className="flex h-full items-start gap-4">
          {/* Vendor Logo */}
          <VendorAvatar
            src={logo}
            alt={name}
            label={name}
            className="h-16 w-16 flex-shrink-0 rounded-ds-md"
            shape="rounded"
          />

          {/* Vendor Info */}
          <div className="flex min-h-[120px] min-w-0 flex-1 flex-col">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate font-semibold text-ds-text-primary">{name}</h3>
              {isVerified ? (
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Unverified
                </Badge>
              )}
            </div>

            <p className="mb-2 text-sm text-ds-text-secondary">{category}</p>

            {description && (
              <p className="mb-2 line-clamp-2 text-sm text-ds-text-secondary">{description}</p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-ds-text-secondary">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{campus}</span>
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-ds-rating-fill text-ds-status-warning" />
                  <span>{rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{productCount} products</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
