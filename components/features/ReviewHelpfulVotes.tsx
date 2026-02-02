/**
 * Review Helpful Votes Component
 *
 * Features:
 * - Upvote/downvote for review helpfulness
 * - Display helpful vote count
 * - Prevent duplicate voting
 */

"use client";

import { useState } from "react";
import { Button, message } from "antd";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface ReviewHelpfulVotesProps {
  reviewId: string;
  initialHelpfulCount: number;
  initialUnhelpfulCount: number;
  userVote?: "helpful" | "unhelpful" | null;
}

export function ReviewHelpfulVotes({
  reviewId,
  initialHelpfulCount,
  initialUnhelpfulCount,
  userVote: initialUserVote = null,
}: ReviewHelpfulVotesProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(initialUnhelpfulCount);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType: "helpful" | "unhelpful") => {
    if (loading) return;

    // If clicking the same vote, remove it
    if (userVote === voteType) {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews/${reviewId}/vote`, {
          method: "DELETE",
        });

        if (res.ok) {
          if (voteType === "helpful") {
            setHelpfulCount((prev) => prev - 1);
          } else {
            setUnhelpfulCount((prev) => prev - 1);
          }
          setUserVote(null);
        } else {
          message.error("Failed to remove vote");
        }
      } catch (error) {
        console.error("Vote error:", error);
        message.error("Failed to remove vote");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Change vote or add new vote
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });

      if (res.ok) {
        // Update counts
        if (userVote === "helpful" && voteType === "unhelpful") {
          setHelpfulCount((prev) => prev - 1);
          setUnhelpfulCount((prev) => prev + 1);
        } else if (userVote === "unhelpful" && voteType === "helpful") {
          setUnhelpfulCount((prev) => prev - 1);
          setHelpfulCount((prev) => prev + 1);
        } else if (voteType === "helpful") {
          setHelpfulCount((prev) => prev + 1);
        } else {
          setUnhelpfulCount((prev) => prev + 1);
        }

        setUserVote(voteType);
      } else {
        const data = await res.json();
        message.error(data.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Vote error:", error);
      message.error("Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Was this helpful?</span>

      <Button
        size="small"
        type={userVote === "helpful" ? "primary" : "default"}
        icon={<ThumbsUp size={14} />}
        onClick={() => handleVote("helpful")}
        loading={loading}
        className="flex items-center gap-1"
      >
        {helpfulCount > 0 && helpfulCount}
      </Button>

      <Button
        size="small"
        type={userVote === "unhelpful" ? "primary" : "default"}
        danger={userVote === "unhelpful"}
        icon={<ThumbsDown size={14} />}
        onClick={() => handleVote("unhelpful")}
        loading={loading}
        className="flex items-center gap-1"
      >
        {unhelpfulCount > 0 && unhelpfulCount}
      </Button>
    </div>
  );
}
