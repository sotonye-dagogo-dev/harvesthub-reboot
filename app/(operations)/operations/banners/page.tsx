"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, EmptyState } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { Image as ImageIcon, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import type { Banner } from "@/lib/types";

import { App, Modal, Form, Input, Select, Switch, DatePicker, Table } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { isAntdFormValidationError } from "@/lib/utils/formErrors";

const DEFAULT_DISPLAY_ORDER = 0;

export default function OperationsBannersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [form] = Form.useForm();

  const reloadBanners = useCallback(async () => {
    const res = await fetch("/api/banners");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch banners");
    }
    const list = data.banners;
    setBanners(Array.isArray(list) ? (list as Banner[]) : []);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await reloadBanners();
      } catch (error) {
        if (!mounted) return;
        message.error(error instanceof Error ? error.message : "Failed to load banners");
        setBanners([]);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [message, reloadBanners]);

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const handleCreate = () => {
    setEditingBanner(null);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      startDate: banner.startDate ? dayjs(banner.startDate) : null,
      endDate: banner.endDate ? dayjs(banner.endDate) : null,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const normalizedDisplayOrder = Number(values.displayOrder ?? DEFAULT_DISPLAY_ORDER);
      if (!Number.isFinite(normalizedDisplayOrder)) {
        message.error("Display order must be a valid number.");
        return;
      }
      const payload = {
        title: values.title,
        description: values.description || null,
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl || null,
        position: values.position,
        displayOrder: normalizedDisplayOrder,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      const endpoint = editingBanner ? `/api/banners/${editingBanner.id}` : "/api/banners";
      const method = editingBanner ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save banner");
      }

      message.success(editingBanner ? "Banner updated successfully" : "Banner created successfully");
      await reloadBanners();

      setShowModal(false);
      form.resetFields();
    } catch (error) {
      if (isAntdFormValidationError(error)) {
        message.error("Please fill in all required fields");
        return;
      }
      if (error instanceof Error) {
        message.error(error.message);
        return;
      }
      message.error("Failed to save banner");
    }
  };

  const handleDelete = (bannerId: string) => {
    openActionConfirm(ActionConfirmPresets.delete("banner"), async () => {
      try {
        const res = await fetch(`/api/banners/${bannerId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          message.error(data.error || "Failed to delete banner");
          return;
        }
        message.success("Banner deleted successfully");
        await reloadBanners();
      } catch (error) {
        message.error(error instanceof Error ? error.message : "Failed to delete banner");
      }
    });
  };

  const handleToggleActive = async (bannerId: string, currentStatus: boolean) => {
    try {
      const targetStatus = !currentStatus;
      const res = await fetch(`/api/banners/${bannerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: targetStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update banner status");
        return;
      }
      message.success(`Banner ${currentStatus ? "deactivated" : "activated"} successfully`);
      setBanners((prev) =>
        prev.map((banner) =>
          banner.id === bannerId ? { ...banner, isActive: targetStatus } : banner
        )
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to update banner status");
    }
  };

  const columns = [
    {
      title: "Banner",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 120,
      render: (imageUrl: string) => (
        <div className="relative h-16 w-24 overflow-hidden rounded-ds-xs">
          <Image src={imageUrl} alt="Banner" fill className="object-cover" />
        </div>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
      render: (position: string) => (
        <span className="rounded-ds-full bg-ds-brand-subtle px-2 py-1 text-xs text-ds-text-brand">
          {position}
        </span>
      ),
    },
    {
      title: "Order",
      dataIndex: "displayOrder",
      key: "displayOrder",
      width: 80,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <span
          className={`rounded-ds-full px-2 py-1 text-xs ${isActive ? "bg-ds-status-success-bg text-ds-status-success-text dark:bg-ds-status-success-bg dark:text-ds-status-success" : "bg-ds-surface-sunken text-ds-text-secondary dark:text-ds-text-placeholder"}`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Impressions",
      dataIndex: "impressionCount",
      key: "impressionCount",
      width: 120,
    },
    {
      title: "Clicks",
      dataIndex: "clickCount",
      key: "clickCount",
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: unknown, record: Banner) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(record.id, record.isActive)}
          >
            {record.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(record)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(record.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ds-text-primary">Banners Management</h1>
          <p className="mt-2 text-ds-text-secondary">Create and manage promotional banners</p>
        </div>
        <Button onClick={handleCreate}>
          <>
            <Plus className="mr-2 h-5 w-5" />
            Create Banner
          </>
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon className="h-12 w-12" />}
            title="No banners yet"
            description="Create your first banner to promote products and campaigns"
            action={
              <Button onClick={handleCreate}>
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Create Banner
                </>
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table columns={columns} dataSource={banners} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      )}

      <Modal
        title={editingBanner ? "Edit Banner" : "Create Banner"}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        width={700}
        okText={editingBanner ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter banner title" }]}
          >
            <Input placeholder="Enter banner title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter banner description" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Image"
            rules={[{ required: true, message: "Please upload an image" }]}
          >
            <ImageUpload
              folderType="banner"
              onUploaded={(res) => {
                form.setFieldValue("imageUrl", res.url);
                form.setFieldsValue({ imageUrl: res.url });
              }}
            />
          </Form.Item>

          <Form.Item name="linkUrl" label="Link URL">
            <Input placeholder="https://example.com/page" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="position"
              label="Position"
              rules={[{ required: true, message: "Please select position" }]}
            >
              <Select placeholder="Select position">
                <Select.Option value="TOP">Top Banner</Select.Option>
                <Select.Option value="HERO">Hero Banner</Select.Option>
                <Select.Option value="SIDEBAR">Sidebar</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="displayOrder"
              label="Display Order"
              rules={[{ required: true, message: "Please enter display order" }]}
            >
              <Input type="number" placeholder="0" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="startDate" label="Start Date">
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="endDate" label="End Date">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
