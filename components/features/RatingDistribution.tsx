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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Rating Distribution
      </h3>

      {/* Average Rating Summary */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
            {averageRating}
          </div>
          <div className="flex items-center justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(Number(averageRating))
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stars}</span>
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <Progress
                percent={percentage}
                showInfo={false}
                strokeColor="#9333ea"
                trailColor="#e5e7eb"
                className="dark:trail-gray-700"
              />
            </div>

            {/* Count */}
            <div className="w-16 text-right">
              <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
            </div>
          </div>
        ))}
      </div>

      {totalReviews === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No reviews yet</div>
      )}
    </div>
  );
}
