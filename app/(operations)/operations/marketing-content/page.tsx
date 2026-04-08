"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { PageLoader, SectionLoader } from "@/components/ui";
import {
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  DatePicker,
  Table,
  Tag,
  message,
  Switch,
  Empty,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload";
import dayjs from "dayjs";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";

const { TextArea } = Input;
const { Option } = Select;

const CONTENT_TYPES = [
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text / Copy" },
  { value: "PROMO_BANNER", label: "Promo Banner" },
];

const TARGET_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "website", label: "Website" },
  { value: "all", label: "All Platforms" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "green",
  REJECTED: "red",
  ACTIVE: "blue",
  EXPIRED: "default",
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
}

export default function OperationsMarketingContentPage() {
  const { user } = useAuth();
  const [resolvingVendor, setResolvingVendor] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Resolve vendor context for vendor users
  useEffect(() => {
    let mounted = true;

    const resolveVendor = async () => {
      if (!user) {
        if (mounted) {
          setVendorId(null);
          setLoading(false);
          setResolvingVendor(false);
        }
        return;
      }

      if (user.role !== "VENDOR") {
        if (mounted) {
          setVendorId(null);
          setLoading(false);
          setResolvingVendor(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/vendors/me/store-settings");
        const data = await res.json();
        if (mounted && res.ok && data.success && data.vendorId) {
          setVendorId(data.vendorId);
        }
      } catch {
        if (mounted) {
          setVendorId(null);
        }
      } finally {
        if (mounted) {
          setResolvingVendor(false);
        }
      }
    };

    resolveVendor();
    return () => {
      mounted = false;
    };
  }, [user]);

  const fetchContent = useCallback(async (): Promise<ContentItem[]> => {
    if (!vendorId) return [];

    const res = await fetch(`/api/vendors/${vendorId}/content`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to load marketing content");
    }

    const list = Array.isArray(data.data) ? data.data : [];
    return list as ContentItem[];
  }, [vendorId]);

  const {
    data: contentData,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useSmartResource(fetchContent, {
    key: `vendor-marketing-content:${vendorId ?? "none"}`,
    enabled: Boolean(vendorId),
    refreshIntervalMs: 120_000,
    staleTimeMs: 20_000,
  });

  const content = contentData ?? [];

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!vendorId) return;
    setSubmitting(true);
    try {
      let mediaFile: string | undefined;
      if (fileList.length > 0 && fileList[0]?.originFileObj) {
        mediaFile = await handleFileToBase64(fileList[0].originFileObj);
      }

      const payload = {
        ...values,
        mediaFile,
        validFrom: values.validFrom ? (values.validFrom as dayjs.Dayjs).toISOString() : undefined,
        validTo: values.validTo ? (values.validTo as dayjs.Dayjs).toISOString() : undefined,
      };

      const url = editItem
        ? `/api/vendors/${vendorId}/content/${editItem.id}`
        : `/api/vendors/${vendorId}/content`;
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        message.success(editItem ? "Content updated" : "Content submitted for review");
        setModalOpen(false);
        setEditItem(null);
        setFileList([]);
        form.resetFields();
        await refresh(true);
      } else {
        message.error(data.error || "Failed to save content");
      }
    } catch {
      message.error("Failed to save content");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!vendorId) return;
    try {
      const res = await fetch(`/api/vendors/${vendorId}/content/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        message.success("Content deleted");
        await refresh(true);
      } else {
        message.error(data.error || "Delete failed");
      }
    } catch {
      message.error("Failed to delete content");
    }
  };

  const openEdit = (item: ContentItem) => {
    setEditItem(item);
    form.setFieldsValue({
      type: item.type,
      title: item.title,
      description: item.description,
      textContent: item.textContent,
      usageRights: item.usageRights,
      targetPlatform: item.targetPlatform,
      validFrom: item.validFrom ? dayjs(item.validFrom) : undefined,
      validTo: item.validTo ? dayjs(item.validTo) : undefined,
    });
    setFileList([]);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ usageRights: true, targetPlatform: "all" });
    setFileList([]);
    setModalOpen(true);
  };

  const contentType = Form.useWatch("type", form);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => CONTENT_TYPES.find((c) => c.value === t)?.label ?? t,
    },
    {
      title: "Platform",
      dataIndex: "targetPlatform",
      key: "targetPlatform",
      render: (p: string | null) => TARGET_PLATFORMS.find((t) => t.value === p)?.label ?? p ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag color={STATUS_COLORS[s] ?? "default"}>{s}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: ContentItem) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              openActionConfirm(ActionConfirmPresets.delete("content"), () =>
                handleDelete(record.id)
              )
            }
          />
        </div>
      ),
    },
  ];

  if (resolvingVendor) {
    return <PageLoader minHeight="min-h-96" message="Resolving vendor workspace..." />;
  }

  if (!vendorId && user?.role === "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-ds-text-secondary">
          Use Vendor Content in Operations to review and manage submissions across vendors.
        </p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-ds-text-secondary">Vendor account required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Marketing Content</h1>
          <p className="text-ds-text-secondary mt-1">
            Upload images, videos, and promotional content for platform-assisted marketing.
          </p>
          {isRefreshing ? (
            <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing in background...</p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => void refresh(true)}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Upload Content
          </Button>
        </div>
      </div>

      {/* Rejection notices */}
      {content
        .filter((c) => c.status === "REJECTED")
        .map((c) => (
          <Card key={c.id} size="small" className="border-red-300 bg-red-50 dark:bg-red-950/30">
            <p className="text-sm">
              <strong>&quot;{c.title}&quot;</strong> was rejected:{" "}
              {c.rejectionReason || "No reason provided."}
            </p>
          </Card>
        ))}

      {isLoading && content.length === 0 ? (
        <SectionLoader />
      ) : content.length === 0 ? (
        <Empty description="No content found." />
      ) : (
        <Table
          dataSource={content}
          columns={columns}
          rowKey="id"
          loading={isRefreshing}
          pagination={{ defaultPageSize: 10 }}
          scroll={{ x: 600 }}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editItem ? "Edit Content" : "Upload Marketing Content"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Form.Item
            name="type"
            label="Content Type"
            rules={[{ required: true, message: "Select a type" }]}
          >
            <Select placeholder="Select type" disabled={!!editItem}>
              {CONTENT_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="title" label="Title" rules={[{ required: true, min: 3, max: 120 }]}>
            <Input placeholder="e.g., Summer Sale Banner" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="Brief description of this content"
              maxLength={500}
              showCount
            />
          </Form.Item>

          {(contentType === "TEXT" || contentType === "PROMO_BANNER") && (
            <Form.Item name="textContent" label="Text / Copy">
              <TextArea
                rows={4}
                placeholder="Marketing text or promotional copy"
                maxLength={2000}
                showCount
              />
            </Form.Item>
          )}

          {(contentType === "IMAGE" || contentType === "VIDEO" || contentType === "PROMO_BANNER") &&
            !editItem && (
              <Form.Item label="Media File">
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
                  maxCount={1}
                  accept={
                    contentType === "VIDEO"
                      ? "video/mp4,video/webm,video/quicktime"
                      : "image/jpeg,image/png,image/webp"
                  }
                >
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
                <p className="text-xs text-ds-text-secondary mt-1">
                  Max 10MB. {contentType === "VIDEO" ? "MP4, WebM, MOV" : "JPG, PNG, WebP"}
                </p>
              </Form.Item>
            )}

          <Form.Item
            name="targetPlatform"
            label="Target Platform"
            rules={[{ required: true, message: "Please choose where this content should be used" }]}
          >
            <Select placeholder="Where should this be used?">
              {TARGET_PLATFORMS.map((p) => (
                <Option key={p.value} value={p.value}>
                  {p.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="validFrom" label="Valid From">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="validTo" label="Valid To">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="usageRights"
            label="Usage Rights"
            valuePropName="checked"
            rules={[
              {
                validator: (_, v) =>
                  v ? Promise.resolve() : Promise.reject("You must confirm usage rights"),
              },
            ]}
          >
            <Switch checkedChildren="Granted" unCheckedChildren="Not granted" />
          </Form.Item>
          <p className="text-xs text-ds-text-secondary -mt-4 mb-4">
            I confirm that I own or have rights to this content and grant MyHarvestHub permission to
            use it for marketing purposes.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditItem(null);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editItem ? "Update" : "Submit for Review"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
