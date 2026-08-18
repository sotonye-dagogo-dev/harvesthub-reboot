"use client";

import { useState, useCallback } from "react";
import { Button, Card, Tag, Modal, Input, Select, Empty, Spin, message, Image } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { SectionLoader, VendorAvatar, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";

const { TextArea } = Input;
const { Option } = Select;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "green",
  REJECTED: "red",
  ACTIVE: "blue",
  EXPIRED: "default",
};

const TYPE_LABELS: Record<string, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  TEXT: "Text / Copy",
  PROMO_BANNER: "Promo Banner",
};

interface ContentItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  mediaUrl?: string | null;
  textContent?: string | null;
  status: string;
  rejectionReason?: string | null;
  usageRights: boolean;
  targetPlatform?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  vendor?: { id: string; storeName: string; storeLogo?: string | null };
}

interface VendorContentApiResponse {
  success?: boolean;
  data?: ContentItem[];
}

export default function OperationsVendorContentPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [rejectModal, setRejectModal] = useState<ContentItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContent = useCallback(async (): Promise<ContentItem[]> => {
    const res = await fetch(`/api/admin/vendor-content?status=${statusFilter}`);
    const data = (await res.json().catch(() => ({}))) as VendorContentApiResponse;

    if (!res.ok || !data.success) {
      throw new Error("Failed to load vendor marketing submissions");
    }

    return Array.isArray(data.data) ? data.data : [];
  }, [statusFilter]);

  const { data, isLoading, isRefreshing, error, refresh } = useSmartResource(fetchContent, {
    key: `operations-vendor-content:${statusFilter}`,
    refreshIntervalMs: 90_000,
    staleTimeMs: 20_000,
  });

  const content = data ?? [];

  const handleModerate = async (id: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/vendor-content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`Content ${status.toLowerCase()}`);
        emitDataMutated(["vendor-content", "operations-dashboard"]);
        setRejectModal(null);
        setRejectionReason("");
        await refresh(true);
      } else {
        message.error(data.error || "Failed to moderate");
      }
    } catch {
      message.error("Failed to moderate content");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Vendor Content Moderation</h1>
          <p className="text-ds-text-secondary mt-1">
            Review and approve vendor marketing submissions only (separate from product media).
          </p>
          {isRefreshing ? (
            <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing submissions...</p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={setStatusFilter} className="w-40">
            <Option value="PENDING">Pending</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="REJECTED">Rejected</Option>
            <Option value="ACTIVE">Active</Option>
            <Option value="ALL">All</Option>
          </Select>
          <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={() => void refresh(true)}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && content.length === 0 ? <SectionLoader /> : null}

      <Spin spinning={isRefreshing && content.length > 0}>
        {content.length === 0 && !isLoading ? (
          <Empty description={`No ${statusFilter.toLowerCase()} content to review`} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {content.map((item) => (
              <Card
                key={item.id}
                title={
                  <div className="flex items-center gap-2">
                    <Tag color={STATUS_COLORS[item.status]}>{item.status}</Tag>
                    <span className="truncate">{item.title}</span>
                  </div>
                }
                extra={<Tag>{TYPE_LABELS[item.type] ?? item.type}</Tag>}
                className="shadow-sm"
              >
                <p className="text-sm text-ds-text-secondary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <VendorAvatar
                      src={item.vendor?.storeLogo}
                      alt={item.vendor?.storeName || "Vendor"}
                      label={item.vendor?.storeName || "Vendor"}
                      className="h-6 w-6"
                    />
                    By: <strong>{item.vendor?.storeName ?? "Unknown"}</strong>
                  </span>
                </p>

                {item.description && (
                  <p className="text-sm text-ds-text-primary mb-2">{item.description}</p>
                )}

                {item.mediaUrl && (item.type === "IMAGE" || item.type === "PROMO_BANNER") && (
                  <div className="mb-3">
                    <Image
                      src={item.mediaUrl}
                      alt={item.title}
                      className="rounded-md max-h-48 object-cover w-full"
                      preview
                    />
                  </div>
                )}

                {item.mediaUrl && item.type === "VIDEO" && (
                  <div className="mb-3">
                    <video src={item.mediaUrl} controls className="rounded-md w-full max-h-48" />
                  </div>
                )}

                {item.textContent && (
                  <div className="bg-ds-surface-raised p-3 rounded-md mb-3 text-sm max-h-32 overflow-auto">
                    {item.textContent}
                  </div>
                )}

                <div className="text-xs text-ds-text-secondary space-y-1">
                  {item.targetPlatform && <p>Platform: {item.targetPlatform}</p>}
                  {item.validFrom && (
                    <p>
                      Valid: {dayjs(item.validFrom).format("DD MMM YYYY")} -{" "}
                      {item.validTo ? dayjs(item.validTo).format("DD MMM YYYY") : "∞"}
                    </p>
                  )}
                  <p>Uploaded: {dayjs(item.createdAt).format("DD MMM YYYY HH:mm")}</p>
                  <p>Usage rights: {item.usageRights ? "✓ Granted" : "✗ Not granted"}</p>
                </div>

                {item.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm text-red-600">
                    Reason: {item.rejectionReason}
                  </div>
                )}

                {item.status === "PENDING" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={actionLoading === item.id}
                      onClick={() =>
                      openActionConfirm(
                        ActionConfirmPresets.approve("content"),
                        () => handleModerate(item.id, "APPROVED")
                      )
                    }
                      block
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => setRejectModal(item)}
                      block
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title={`Reject: "${rejectModal?.title}"`}
        open={!!rejectModal}
        onCancel={() => {
          setRejectModal(null);
          setRejectionReason("");
        }}
        onOk={() => rejectModal && handleModerate(rejectModal.id, "REJECTED", rejectionReason)}
        confirmLoading={!!actionLoading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p className="text-sm text-ds-text-secondary mb-3">
          Provide a reason so the vendor can improve their submission.
        </p>
        <TextArea
          rows={3}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Content does not meet platform guidelines..."
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
}
