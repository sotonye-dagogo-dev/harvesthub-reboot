"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button, EmptyState } from "@/components/ui";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { BannerPlacementPreview, BannerImageGuidelines } from "@/components/features";
import { Image as ImageIcon, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import type { Banner } from "@/lib/types";

import { App, Modal, Form, Input, Select, Switch, DatePicker, Table } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { isAntdFormValidationError } from "@/lib/utils/formErrors";
import type { BannerPlacementWarning } from "@/lib/utils/bannerPlacementValidation";
import { generateRequestKey } from "@/lib/utils/requestKey";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";
import { AdStrip } from "@/components/features/ads/AdStrip";

const DEFAULT_DISPLAY_ORDER = 0;

export default function OperationsBannersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [placementWarning, setPlacementWarning] = useState<BannerPlacementWarning | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();
  const previewPosition = (Form.useWatch("position", form) ?? "HERO") as
    | "TOP"
    | "HERO"
    | "SIDEBAR";
  const previewImageUrl = Form.useWatch("imageUrl", form) ?? "";
  const previewTitle = Form.useWatch("title", form) ?? "";
  const watchedDisplayStyle = (Form.useWatch("displayStyle", form) ?? "IMAGE") as "IMAGE" | "DESIGNED";
  const watchedIsSponsored = Boolean(Form.useWatch("isSponsored", form));
  const isDesignedTop = previewPosition === "TOP" && watchedDisplayStyle === "DESIGNED";
  const watchedSubtitle = Form.useWatch("subtitle", form) ?? "";
  const watchedCta = Form.useWatch("knowMoreLabel", form) ?? "";
  const watchedTheme = Form.useWatch("theme", form) ?? "BUSINESS";
  const watchedLink = Form.useWatch("linkUrl", form) ?? "";
  const watchedPremiumTop = Boolean(Form.useWatch("premiumTopPlacement", form));

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
    setPlacementWarning(null);
    form.resetFields();
    form.setFieldsValue({
      position: "HERO",
      isActive: true,
      displayOrder: DEFAULT_DISPLAY_ORDER,
      isSponsored: false,
      displayStyle: "IMAGE",
      premiumTopPlacement: false,
      theme: "BUSINESS",
    });
    setShowModal(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setPlacementWarning(null);
    form.setFieldsValue({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      subtitle: banner.subtitle ?? "",
      knowMoreLabel: banner.knowMoreLabel ?? "",
      theme: banner.theme ?? "BUSINESS",
      isSponsored: banner.isSponsored === true,
      displayStyle: banner.displayStyle === "DESIGNED" ? "DESIGNED" : "IMAGE",
      premiumTopPlacement: banner.premiumTopPlacement === true,
      startDate: banner.startDate ? dayjs(banner.startDate) : null,
      endDate: banner.endDate ? dayjs(banner.endDate) : null,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const values = await form.validateFields();
      const normalizedDisplayOrder = Number(values.displayOrder ?? DEFAULT_DISPLAY_ORDER);
      if (!Number.isFinite(normalizedDisplayOrder)) {
        message.error("Display order must be a valid number.");
        return;
      }
      const designed = values.position === "TOP" && values.displayStyle === "DESIGNED";
      const sponsored = values.isSponsored === true;
      const payload = {
        title: values.position === "TOP" ? values.title || "" : values.title,
        subtitle: values.subtitle || null,
        knowMoreLabel: values.knowMoreLabel || null,
        theme: values.theme || "BUSINESS",
        isSponsored: sponsored,
        displayStyle: designed ? "DESIGNED" : "IMAGE",
        premiumTopPlacement: sponsored && values.position === "TOP" && values.premiumTopPlacement === true,
        description: values.description || null,
        imageUrl: values.imageUrl || "",
        linkUrl: values.linkUrl || null,
        position: values.position,
        displayOrder: normalizedDisplayOrder,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      const endpoint = editingBanner ? `/api/banners/${editingBanner.id}` : "/api/banners";
      const method = editingBanner ? "PUT" : "POST";
      const requestKey = generateRequestKey(editingBanner ? "banner-update" : "banner-create");
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": requestKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save banner");
      }

      message.success(
        editingBanner ? "Banner updated successfully" : "Banner created successfully"
      );
      emitDataMutated(["banners", "operations-dashboard"]);

      setShowModal(false);
      setPlacementWarning(null);
      form.resetFields();

      // Reload list in background; don't block the modal close on list refresh
      reloadBanners().catch((reloadErr) => {
        message.error(
          reloadErr instanceof Error ? reloadErr.message : "Failed to refresh banner list"
        );
      });
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
    } finally {
      setIsSubmitting(false);
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
        emitDataMutated(["banners", "operations-dashboard"]);
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
      emitDataMutated(["banners", "operations-dashboard"]);
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
      render: (imageUrl: string, record: Banner) =>
        imageUrl ? (
          <div className="relative h-16 w-24 overflow-hidden rounded-ds-xs">
            <Image src={imageUrl} alt="Banner" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-ds-xs bg-ds-brand-deep px-1 text-center text-[10px] font-semibold text-white">
            {record.displayStyle === "DESIGNED" ? "Branded design" : "No image"}
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
      render: (position: string, record: Banner) => (
        <span className="inline-flex flex-wrap gap-1">
          <span className="rounded-ds-full bg-ds-brand-subtle px-2 py-1 text-xs text-ds-text-brand">
            {position}
          </span>
          {record.isSponsored ? (
            <span className="rounded-ds-full bg-ds-status-warning-bg px-2 py-1 text-xs text-ds-status-warning-text">
              {record.premiumTopPlacement ? "Sponsored · Premium top" : "Sponsored"}
            </span>
          ) : null}
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
            onClick={() =>
              openActionConfirm(
                record.isActive
                  ? ActionConfirmPresets.deactivate("banner")
                  : ActionConfirmPresets.activate("banner"),
                () => handleToggleActive(record.id, record.isActive)
              )
            }
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
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={banners}
              rowKey="id"
              pagination={{ defaultPageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </Card>
      )}

      <Modal
        title={editingBanner ? "Edit Banner" : "Create Banner"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setPlacementWarning(null);
        }}
        onOk={handleSubmit}
        okButtonProps={{ loading: isSubmitting, disabled: isSubmitting }}
        cancelButtonProps={{ disabled: isSubmitting }}
        width={700}
        okText={editingBanner ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <BannerImageGuidelines
            className="mb-4"
            title="Placement Size Guide"
            subtitle="Use the right ratio for hero, top, and sidebar to prevent letterboxing in production slots."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="isSponsored"
              label="Advert type"
              tooltip="Sponsored adverts are labelled, can be closed by visitors, and are kept out of the top strip unless you give them premium top placement."
            >
              <Select
                options={[
                  { value: false, label: "MyHarvestHub campaign" },
                  { value: true, label: "Sponsored (third-party advert)" },
                ]}
              />
            </Form.Item>

            {previewPosition === "TOP" ? (
              <Form.Item name="displayStyle" label="Design">
                <Select
                  options={[
                    { value: "IMAGE", label: "Upload an image design" },
                    { value: "DESIGNED", label: "Branded design (built from text)" },
                  ]}
                />
              </Form.Item>
            ) : null}
          </div>

          {previewPosition === "TOP" && watchedIsSponsored ? (
            <div className="mb-4 flex items-start justify-between gap-4 rounded-ds-md border border-ds-border-base p-3">
              <div className="text-sm">
                <p className="font-medium text-ds-text-primary">Premium top placement</p>
                <p className="text-xs text-ds-text-secondary">
                  Off: shown in the &quot;Sponsored&quot; slot between home-page sections. On: shown in the strip at the
                  very top of every page (charge more for this).
                </p>
              </div>
              <Form.Item name="premiumTopPlacement" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
          ) : null}

          {previewPosition === "TOP" && !isDesignedTop ? (
            <div className="mb-4 rounded-ds-md border border-ds-border-subtle bg-ds-surface-sunken p-3 text-sm text-ds-text-secondary">
              Image designs fill the strip edge to edge (about 64:10, at least 1280 × 200). Keep key text in the
              middle — the strip is short on phones.
            </div>
          ) : null}

          {previewPosition !== "TOP" || isDesignedTop ? (
            <Form.Item
              name="title"
              label={isDesignedTop ? "Headline" : "Title"}
              rules={[{ required: true, message: isDesignedTop ? "Please enter a headline" : "Please enter banner title" }]}
            >
              <Input placeholder={isDesignedTop ? "e.g. Mega Thanksgiving market — this Sunday" : "Enter banner title"} maxLength={90} />
            </Form.Item>
          ) : null}

          {isDesignedTop ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Form.Item name="subtitle" label="Supporting line" className="md:col-span-2">
                <Input placeholder="e.g. Shop from 50+ church vendors and pick up after service" maxLength={120} />
              </Form.Item>
              <Form.Item name="knowMoreLabel" label="Button text">
                <Input placeholder="Learn more" maxLength={24} />
              </Form.Item>
              <Form.Item name="theme" label="Colour" className="md:col-span-3">
                <Select
                  options={[
                    { value: "BUSINESS", label: "Brand Purple" },
                    { value: "PROMOTION", label: "Brand Magenta" },
                    { value: "EVENT", label: "Purple to violet" },
                    { value: "CHURCH", label: "Purple to magenta (church events)" },
                  ]}
                />
              </Form.Item>
            </div>
          ) : null}

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter banner description" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label={isDesignedTop ? "Background image (optional — not used by branded designs)" : "Image"}
            rules={isDesignedTop ? [] : [{ required: true, message: "Please upload an image" }]}
            hidden={isDesignedTop}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <ImageUpload
                folderType="banner"
                placementValidation={{
                  getPlacement: () => previewPosition,
                  onWarning: setPlacementWarning,
                }}
                onUploaded={(res) => {
                  form.setFieldValue("imageUrl", res.url);
                  form.setFieldsValue({ imageUrl: res.url });
                }}
              />
              <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-2">
                <p className="mb-2 text-xs font-medium text-ds-text-secondary">Current image preview</p>
                {previewImageUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-ds-sm border border-ds-border-subtle bg-ds-surface-base">
                    <Image
                      src={previewImageUrl}
                      alt="Selected banner preview"
                      fill
                      className="object-contain"
                      sizes="220px"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-ds-sm border border-dashed border-ds-border-base text-xs text-ds-text-tertiary">
                    No image selected yet
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          {placementWarning ? (
            <div className="mb-4 rounded-ds-md border border-ds-status-warning-border bg-ds-status-warning-bg px-3 py-2 text-xs text-ds-status-warning-text">
              {placementWarning.message}
            </div>
          ) : null}

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

          {previewPosition === "TOP" && (isDesignedTop ? previewTitle.trim() : previewImageUrl) ? (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-ds-text-secondary">
                Live preview —{" "}
                {watchedIsSponsored && !watchedPremiumTop
                  ? "shown in the Sponsored slot on the home page"
                  : "shown in the top strip"}
              </p>
              <div className="pointer-events-none overflow-hidden rounded-ds-md border border-ds-border-base">
                <AdStrip
                  banner={
                    {
                      id: "preview",
                      title: previewTitle,
                      subtitle: watchedSubtitle,
                      knowMoreLabel: watchedCta,
                      theme: watchedTheme,
                      imageUrl: previewImageUrl,
                      linkUrl: watchedLink || "#",
                      position: "TOP",
                      isSponsored: watchedIsSponsored,
                      displayStyle: isDesignedTop ? "DESIGNED" : "IMAGE",
                    } as unknown as Banner
                  }
                  variant={watchedIsSponsored && !watchedPremiumTop ? "inline" : "top"}
                  trackingSource="top"
                  onDismiss={watchedIsSponsored ? () => undefined : undefined}
                />
              </div>
            </div>
          ) : (
            <BannerPlacementPreview
              position={previewPosition}
              imageUrl={previewImageUrl}
              title={previewTitle}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
}
