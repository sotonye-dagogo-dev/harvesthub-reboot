/**
 * Vendor Response Component for Reviews
 *
 * Features:
 * - Display vendor's response to a review
 * - Add/edit vendor response (vendor only)
 * - Response timestamp
 */

"use client";

import { useState } from "react";
import { Button, Input, message } from "antd";
import { MessageSquare, Edit, Save, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const { TextArea } = Input;

interface VendorResponseProps {
  reviewId: string;
  response?: {
    text: string;
    vendorName: string;
    createdAt: Date;
  };
  isVendor?: boolean;
  onResponseAdded?: () => void;
}

export function VendorResponse({
  reviewId,
  response,
  isVendor = false,
  onResponseAdded,
}: VendorResponseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState(response?.text || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!responseText.trim()) {
      message.error("Response cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });

      if (res.ok) {
        message.success("Response saved successfully");
        setIsEditing(false);
        onResponseAdded?.();
      } else {
        message.error("Failed to save response");
      }
    } catch (error) {
      console.error("Save response error:", error);
      message.error("Failed to save response");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setResponseText(response?.text || "");
    setIsEditing(false);
  };

  if (!response && !isVendor) {
    return null;
  }

  return (
    <div className="mt-4 ml-8 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
      <div className="flex items-start gap-3">
        <MessageSquare size={20} className="text-purple-600 dark:text-purple-400 mt-1" />

        <div className="flex-1">
          {!response && isVendor && !isEditing && (
            <Button
              type="link"
              icon={<MessageSquare size={16} />}
              onClick={() => setIsEditing(true)}
              className="p-0"
            >
              Respond to this review
            </Button>
          )}

          {(response || isEditing) && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  {response?.vendorName || "Vendor"} Response
                </span>
                {isVendor && !isEditing && (
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit size={14} />}
                    onClick={() => setIsEditing(true)}
                  />
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <TextArea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    rows={4}
                    maxLength={500}
                    showCount
                  />
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      size="small"
                      icon={<Save size={14} />}
                      onClick={handleSave}
                      loading={loading}
                    >
                      Save
                    </Button>
                    <Button size="small" icon={<X size={14} />} onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {response?.text}
                  </p>
                  {response?.createdAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
