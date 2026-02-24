/**
 * Rating Distribution Chart Component
 *
 * Features:
 * - Visual bar chart showing rating distribution
 * - Percentage calculation
 * - Total reviews count
 * - Responsive design
 */

"use client";

import { useMemo } from "react";
import { Progress } from "antd";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface RatingDistributionProps {
  reviews: Review[];
}

export function RatingDistribution({ reviews }: RatingDistributionProps) {
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
      counts[rating]++;
    });

    const total = reviews.length || 1; // Avoid division by zero

    return Object.entries(counts)
      .map(([stars, count]) => ({
        stars: Number(stars),
        count,
        percentage: (count / total) * 100,
      }))
      .reverse(); // Show 5 stars first
  }, [reviews]);

  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / totalReviews).toFixed(1);
  }, [reviews, totalReviews]);

  return (
    <div className="bg-ds-surface-base rounded-lg p-6 border border-ds-border-base">
      <h3 className="text-lg font-semibold mb-4 text-ds-text-primary">
        Rating Distribution
      </h3>

      {/* Average Rating Summary */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ds-border-base">
        <div className="text-center">
          <div className="text-4xl font-bold text-ds-text-brand">
            {averageRating}
          </div>
          <div className="flex items-center justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(Number(averageRating))
                    ? "fill-ds-rating-fill text-ds-rating-fill"
                    : "text-ds-text-placeholder dark:text-ds-text-secondary"
                }
              />
            ))}
          </div>
          <div className="text-sm text-ds-text-secondary mt-1">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-3">
        {distribution.map(({ stars, count, percentage }) => (
          <div key={stars} className="flex items-center gap-3">
            {/* Star Label */}
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium text-ds-text-secondary">{stars}</span>
              <Star size={14} className="fill-ds-rating-fill text-ds-rating-fill" />
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <Progress
                percent={percentage}
                showInfo={false}
                strokeColor="#9333ea"
                trailColor="#e5e7eb"
                className=""
              />
            </div>

            {/* Count */}
            <div className="w-16 text-right">
              <span className="text-sm text-ds-text-secondary">{count}</span>
            </div>
          </div>
        ))}
      </div>

      {totalReviews === 0 && (
        <div className="text-center py-8 text-ds-text-tertiary">No reviews yet</div>
      )}
    </div>
  );
}
