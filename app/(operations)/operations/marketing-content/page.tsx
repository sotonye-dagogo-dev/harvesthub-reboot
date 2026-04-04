"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
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
  Spin,
  Popconfirm,
} from "antd";
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload";
import dayjs from "dayjs";

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
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Fetch vendor ID from user
  useEffect(() => {
    if (!user) return;
    fetch(`/api/vendors?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.id) {
          setVendorId(data.data.id);
        }
      })
      .catch(() => {});
  }, [user]);

  const fetchContent = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/content`);
      const data = await res.json();
      if (data.success) setContent(data.data);
    } catch {
      message.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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
        fetchContent();
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
        fetchContent();
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
    form.setFieldsValue({ usageRights: true });
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
          <Popconfirm title="Delete this content?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (!vendorId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Upload Content
        </Button>
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

      <Spin spinning={loading}>
        {content.length === 0 && !loading ? (
          <Empty description="No marketing content yet. Upload your first piece!" />
        ) : (
          <Table
            dataSource={content}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
          />
        )}
      </Spin>

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

          <Form.Item name="targetPlatform" label="Target Platform">
            <Select placeholder="Where should this be used?" allowClear>
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
