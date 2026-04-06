"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/contexts/ToastContext";

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  productId,
  productName,
  orderId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          orderId,
          isVerifiedPurchase: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        toast.error(data.error || "Failed to submit review");
        return;
      }

      setSubmitted(true);
      toast.success("Review submitted successfully");
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-ds-md border border-ds-status-success/30 bg-ds-status-success-bg p-4 text-center">
        <p className="font-medium text-ds-status-success-text">Thank you for your review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-ds-text-primary">
        Rate <span className="text-ds-text-brand">{productName}</span>
      </p>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hoveredRating || rating) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-ds-text-placeholder"
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-ds-text-secondary">
            {rating === 1
              ? "Poor"
              : rating === 2
                ? "Fair"
                : rating === 3
                  ? "Good"
                  : rating === 4
                    ? "Very Good"
                    : "Excellent"}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        rows={3}
        className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-sm text-ds-text-primary placeholder:text-ds-text-placeholder focus:border-ds-border-brand focus:outline-none focus:ring-1 focus:ring-ds-border-brand"
      />

      {error && <p className="text-sm text-ds-status-error-text">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="inline-flex items-center gap-2 rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit Review
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-ds-md px-4 py-2 text-sm text-ds-text-secondary hover:text-ds-text-primary"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
