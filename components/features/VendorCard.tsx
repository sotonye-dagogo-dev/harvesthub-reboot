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
        <div className="flex h-full min-h-[172px] flex-col gap-3">
          <div className="flex min-h-[48px] items-start gap-3">
            <VendorAvatar
              src={logo}
              alt={name}
              label={name}
              className="h-12 w-12 flex-shrink-0 rounded-ds-md"
              shape="rounded"
            />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ds-text-primary">{name}</h3>
              <div className="mt-1">
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
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-ds-md border border-ds-border-subtle bg-ds-surface-sunken p-3">
            <div>
              <p className="truncate text-sm text-ds-text-secondary">{category}</p>
              {description ? (
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-ds-text-secondary">
                  {description}
                </p>
              ) : (
                <p className="mt-1 min-h-[2.5rem] text-sm text-ds-text-tertiary">
                  No description provided yet.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ds-text-secondary">
              <div className="flex min-w-0 items-center gap-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{campus}</span>
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
