"use client";

import Image from "next/image";
import { ThumbsUp } from "lucide-react";
import { Rating, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface ReviewCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  verified?: boolean;
  helpful?: number;
  onHelpful?: () => void;
  className?: string;
}

export function ReviewCard({
  userName,
  userAvatar,
  rating,
  comment,
  images = [],
  createdAt,
  verified = false,
  helpful = 0,
  onHelpful,
  className,
}: ReviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4  dark:bg-ds-surface-base",
        className
      )}
    >
      {/* User Info */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-ds-full bg-ds-surface-sunken">
            {userAvatar ? (
              <Image src={userAvatar} alt={userName} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-ds-text-placeholder">
                {userName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ds-text-primary">{userName}</p>
              {verified && (
                <Badge variant="success" size="sm">
                  Verified Purchase
                </Badge>
              )}
            </div>
            <p className="text-sm text-ds-text-secondary">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <Rating value={rating} readonly size="sm" />
      </div>

      {/* Comment */}
      <p className="mb-3 text-ds-text-secondary">{comment}</p>

      {/* Review Images */}
      {images.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-ds-sm bg-ds-surface-sunken"
            >
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful Button */}
      {onHelpful && (
        <button
          onClick={onHelpful}
          className="flex items-center gap-2 text-sm text-ds-text-secondary transition-colors hover:text-ds-text-brand dark:text-ds-text-placeholder dark:hover:text-ds-brand-accent"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>Helpful ({helpful})</span>
        </button>
      )}
    </div>
  );
}
