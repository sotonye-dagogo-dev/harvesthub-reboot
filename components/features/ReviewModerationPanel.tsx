/**
 * Review Moderation Panel (Admin)
 * Allows admins to flag or delete inappropriate reviews
 */

"use client";

import { useState, useEffect } from "react";
import { booleanColor, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { Table, Button, Modal, message, Tag, Rate, Image, Space, Input } from "antd";
import { Flag, Trash2, Eye, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Review } from "@/lib/types";

export function ReviewModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews?flagged=all");
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const flagReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/flag`, {
        method: "PUT",
      });

      const data = await res.json();

      if (data.success) {
        message.success("Review flagged successfully");
        fetchReviews();
      } else {
        message.error(data.error || "Failed to flag review");
      }
    } catch (error) {
      console.error("Failed to flag review:", error);
      message.error("Failed to flag review");
    }
  };

  const deleteReview = async (reviewId: string) => {
    openActionConfirm(ActionConfirmPresets.delete("review"), async () => {
      try {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (data.success) {
          message.success("Review deleted successfully");
          fetchReviews();
        } else {
          message.error(data.error || "Failed to delete review");
        }
      } catch (error) {
        console.error("Failed to delete review:", error);
        message.error("Failed to delete review");
      }
    });
  };

  const viewReview = (review: Review) => {
    setSelectedReview(review);
    setModalVisible(true);
  };

  const filteredReviews = reviews.filter(
    (review) =>
      review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => <Rate disabled value={rating} className="text-sm" />,
    },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
      render: (comment: string) => (
        <div className="max-w-xs truncate">{comment || "No comment"}</div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isFlagged",
      key: "isFlagged",
      render: (isFlagged: boolean) => (
        <Tag color={booleanColor(!isFlagged)}>{isFlagged ? "Flagged" : "Active"}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true }),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, review: Review) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => viewReview(review)}
          />
          <Button
            type="text"
            size="small"
            icon={<Flag className="h-4 w-4" />}
            onClick={() => flagReview(review.id)}
            disabled={review.isFlagged}
          />
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => deleteReview(review.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-ds-text-primary">Review Moderation</h2>
        <Input
          placeholder="Search reviews..."
          prefix={<Search className="h-4 w-4 text-ds-text-placeholder" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredReviews}
        loading={loading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reviews`,
        }}
      />

      {/* Review Details Modal */}
      <Modal
        title="Review Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="flag"
            onClick={() => {
              if (selectedReview) {
                flagReview(selectedReview.id);
                setModalVisible(false);
              }
            }}
            disabled={selectedReview?.isFlagged}
          >
            Flag Review
          </Button>,
          <Button
            key="delete"
            danger
            onClick={() => {
              if (selectedReview) {
                deleteReview(selectedReview.id);
                setModalVisible(false);
              }
            }}
          >
            Delete Review
          </Button>,
        ]}
        width={600}
      >
        {selectedReview && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Product</h4>
              <p className="text-ds-text-secondary">{selectedReview.productName}</p>
            </div>

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">User</h4>
              <p className="text-ds-text-secondary">{selectedReview.userName}</p>
            </div>

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Rating</h4>
              <Rate disabled value={selectedReview.rating} />
            </div>

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Comment</h4>
              <p className="text-ds-text-secondary">{selectedReview.comment || "No comment"}</p>
            </div>

            {selectedReview.photos && selectedReview.photos.length > 0 && (
              <div>
                <h4 className="font-semibold text-ds-text-primary mb-2">Photos</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedReview.photos.map((photo, index) => (
                    <Image
                      key={index}
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-ds-sm object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Helpful Votes</h4>
              <p className="text-ds-text-secondary">
                {selectedReview.helpfulCount || 0} helpful, {selectedReview.notHelpfulCount || 0}{" "}
                not helpful
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Status</h4>
              <Tag color={booleanColor(!selectedReview.isFlagged)}>
                {selectedReview.isFlagged ? "Flagged" : "Active"}
              </Tag>
            </div>

            <div>
              <h4 className="font-semibold text-ds-text-primary mb-1">Created</h4>
              <p className="text-ds-text-secondary">
                {formatDistanceToNow(new Date(selectedReview.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
