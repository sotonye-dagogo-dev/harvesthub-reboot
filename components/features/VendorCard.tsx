"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Package } from "lucide-react";
import { Card, Badge } from "@/components/ui";
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
    <Link href={`/vendors/${id}`}>
      <Card className={cn("transition-all hover:shadow-ds-lg", className)} hoverable>
        <div className="flex items-start gap-4">
          {/* Vendor Logo */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-ds-md bg-ds-surface-sunken">
            {logo ? (
              <Image src={logo} alt={name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ds-text-placeholder">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Vendor Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate font-semibold text-ds-text-primary">{name}</h3>
              {isVerified && (
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              )}
            </div>

            <p className="mb-2 text-sm text-ds-text-secondary">{category}</p>

            {description && (
              <p className="mb-2 line-clamp-2 text-sm text-ds-text-secondary">
                {description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-ds-text-secondary">
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
