/**
 * Enhanced Review Display Component
 * Shows reviews with helpful votes, photos, and filtering
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Rate, Button, Image, Select, Empty, message } from "antd";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Review } from "@/lib/types";

interface ReviewDisplayProps {
  productId: string;
  allowVoting?: boolean;
  allowFlagging?: boolean;
}

export function ReviewDisplay({
  productId,
  allowVoting = true,
  allowFlagging = true,
}: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating-high" | "rating-low">(
    "recent"
  );
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, "helpful" | "not-helpful">>({});

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        ...(filterRating && { rating: filterRating.toString() }),
      });

      const res = await fetch(`/api/products/${productId}/reviews?${params}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, sortBy, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const voteHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });

      const data = await res.json();

      if (data.success) {
        setUserVotes((prev) => ({ ...prev, [reviewId]: helpful ? "helpful" : "not-helpful" }));
        fetchReviews(); // Refresh to get updated counts
      } else {
        message.error(data.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Failed to vote:", error);
      message.error("Failed to vote");
    }
  };

  const flagReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        message.success("Review flagged for moderation");
      } else {
        message.error(data.error || "Failed to flag review");
      }
    } catch (error) {
      console.error("Failed to flag review:", error);
      message.error("Failed to flag review");
    }
  };

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Customer Reviews
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {avgRating.toFixed(1)}
            </div>
            <Rate disabled value={avgRating} allowHalf className="mb-2" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{star} star</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={sortBy}
          onChange={setSortBy}
          className="w-48"
          options={[
            { label: "Most Recent", value: "recent" },
            { label: "Most Helpful", value: "helpful" },
            { label: "Highest Rating", value: "rating-high" },
            { label: "Lowest Rating", value: "rating-low" },
          ]}
        />

        <Select
          value={filterRating}
          onChange={setFilterRating}
          className="w-48"
          placeholder="Filter by rating"
          allowClear
          options={[
            { label: "5 Stars", value: 5 },
            { label: "4 Stars", value: 4 },
            { label: "3 Stars", value: 3 },
            { label: "2 Stars", value: 2 },
            { label: "1 Star", value: 1 },
          ]}
        />
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Empty description="No reviews yet" />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {review.userName}
                  </div>
                  <Rate disabled value={review.rating} className="text-sm" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              </div>

              {review.comment && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>
              )}

              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Image.PreviewGroup>
                    {review.photos.map((photo, index) => (
                      <Image
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                    ))}
                  </Image.PreviewGroup>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {allowVoting && (
                  <>
                    <Button
                      type="text"
                      size="small"
                      icon={<ThumbsUp className="h-4 w-4" />}
                      onClick={() => voteHelpful(review.id, true)}
                      className={userVotes[review.id] === "helpful" ? "text-purple-600" : ""}
                    >
                      Helpful ({review.helpfulCount || 0})
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<ThumbsDown className="h-4 w-4" />}
                      onClick={() => voteHelpful(review.id, false)}
                      className={userVotes[review.id] === "not-helpful" ? "text-red-600" : ""}
                    >
                      Not Helpful ({review.notHelpfulCount || 0})
                    </Button>
                  </>
                )}

                {allowFlagging && (
                  <Button
                    type="text"
                    size="small"
                    icon={<Flag className="h-4 w-4" />}
                    onClick={() => flagReview(review.id)}
                  >
                    Report
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
