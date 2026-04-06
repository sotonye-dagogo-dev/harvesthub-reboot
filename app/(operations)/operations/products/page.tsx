"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LISTING_TYPES, PRODUCT_SUBCATEGORIES, UserRole, VALIDATION_RULES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import ImageUpload from "@/components/ui/ImageUpload";
import { openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { loadLocalDraft, saveLocalDraft, clearLocalDraft } from "@/lib/utils/localDraft";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

interface VendorOption {
  id: string;
  storeName: string;
}

interface ProductFormValues {
  vendorId?: string;
  name: string;
  description: string;
  category: string;
  listingType: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  stock: number;
  isActive: boolean;
}

interface AuthMeResponse {
  roleData?: {
    id?: string;
  } | null;
}

const VENDOR_FILTER_ALL = "ALL";
const PRODUCT_FORM_DRAFT_KEY = "myharvesthub.operations.products.form-draft.v1";
const MAX_PRODUCT_IMAGES = VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT;
const MAX_ADDITIONAL_IMAGES = MAX_PRODUCT_IMAGES - 1;

interface ProductFormDraft {
  values?: Partial<ProductFormValues>;
  mainImageUrl?: string | null;
  additionalImageUrls?: string[];
  editingProductId?: string | null;
}

function buildImageArray(mainImage: string, additionalImageUrls: string[]): string[] {
  const normalized = [mainImage.trim(), ...additionalImageUrls.map((url) => url.trim())].filter(
    Boolean
  );
  return Array.from(new Set(normalized));
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function OperationsProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [vendorScopeId, setVendorScopeId] = useState<string | null>(null);
  const [adminVendorFilter, setAdminVendorFilter] = useState<string>(VENDOR_FILTER_ALL);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);

  const [form] = Form.useForm<ProductFormValues>();
  const selectedVendorId = Form.useWatch("vendorId", form);
  const draftKey = useMemo(
    () => `${PRODUCT_FORM_DRAFT_KEY}.${user?.id || user?.email || "anonymous"}`,
    [user?.email, user?.id]
  );

  const categoryLabelMap = useMemo(() => {
    return new Map<string, string>(PRODUCT_SUBCATEGORIES.map((item) => [item.value, item.label]));
  }, []);

  const listingLabelMap = useMemo(() => {
    return new Map<string, string>(LISTING_TYPES.map((item) => [item.value, item.label]));
  }, []);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((item) => item.isActive).length,
      inactive: products.filter((item) => !item.isActive).length,
    };
  }, [products]);

  const loadVendorOptions = useCallback(async (): Promise<VendorOption[]> => {
    const statuses = ["APPROVED", "PENDING", "SUSPENDED", "REJECTED"] as const;
    const responses = await Promise.all(
      statuses.map(async (status) => {
        const res = await fetch(`/api/vendors?status=${status}&limit=100`);
        if (!res.ok) return [] as VendorOption[];
        const data = (await res.json()) as { vendors?: Array<{ id: string; storeName: string }> };
        if (!Array.isArray(data.vendors)) return [];
        return data.vendors.map((vendor) => ({ id: vendor.id, storeName: vendor.storeName }));
      })
    );

    const uniqueVendors = new Map<string, VendorOption>();
    responses.flat().forEach((vendor) => {
      uniqueVendors.set(vendor.id, vendor);
    });

    return Array.from(uniqueVendors.values()).sort((a, b) =>
      a.storeName.localeCompare(b.storeName)
    );
  }, []);

  const loadVendorScope = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      throw new Error("Unable to load user context");
    }

    const data = (await response.json()) as AuthMeResponse;
    const id = data.roleData?.id;
    if (!id) {
      throw new Error("Vendor profile is required to manage products.");
    }

    return id;
  }, []);

  const loadProducts = useCallback(async () => {
    if (!user) return;

    const vendorId =
      user.role === UserRole.VENDOR
        ? vendorScopeId
        : adminVendorFilter === VENDOR_FILTER_ALL
          ? null
          : adminVendorFilter;

    if (user.role === UserRole.VENDOR && !vendorId) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (vendorId) {
        params.set("vendorId", vendorId);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = (await response.json()) as { products?: Product[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Failed to load products";
      message.error(description);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [adminVendorFilter, user, vendorScopeId]);

  useEffect(() => {
    if (!user) return;

    const currentUser = user;

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.VENDOR) {
      router.push("/unauthorized");
      return;
    }

    let mounted = true;

    async function bootstrap() {
      try {
        if (currentUser.role === UserRole.VENDOR) {
          const scopedVendorId = await loadVendorScope();
          if (!mounted) return;
          setVendorScopeId(scopedVendorId);
          return;
        }

        const vendors = await loadVendorOptions();
        if (!mounted) return;
        setVendorOptions(vendors);
        if (adminVendorFilter === VENDOR_FILTER_ALL && vendors.length > 0) {
          const firstVendor = vendors[0];
          if (firstVendor) {
            setAdminVendorFilter(firstVendor.id);
          }
        }
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Unable to load products workspace context.";
        message.error(description);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [adminVendorFilter, loadVendorOptions, loadVendorScope, router, user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreateModal = () => {
    const draft = loadLocalDraft<ProductFormDraft>(draftKey);
    const isCreateDraft = (draft?.editingProductId || null) === null;

    setEditingProduct(null);
    form.resetFields();
    const baseValues: Partial<ProductFormValues> = {
      listingType: "PRODUCT",
      stock: 1,
      isActive: true,
      vendorId: user?.role === UserRole.ADMIN ? adminVendorFilter : vendorScopeId || undefined,
    };

    form.setFieldsValue(isCreateDraft ? { ...baseValues, ...draft?.values } : baseValues);
    setMainImageUrl(isCreateDraft ? (draft?.mainImageUrl ?? "") : "");
    setAdditionalImageUrls(
      isCreateDraft ? (draft?.additionalImageUrls || []).slice(0, MAX_ADDITIONAL_IMAGES) : []
    );
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const draft = loadLocalDraft<ProductFormDraft>(draftKey);
    const isEditDraft = draft?.editingProductId === product.id;

    setEditingProduct(product);
    const baseValues: Partial<ProductFormValues> = {
      vendorId: product.vendorId,
      name: product.name,
      description: product.description,
      category: product.category,
      listingType: product.listingType,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      discount: product.discount || undefined,
      stock: product.stock,
      isActive: product.isActive,
    };
    const baseAdditionalImages = (
      Array.isArray(product.images)
        ? product.images.filter((imageUrl) => imageUrl && imageUrl !== product.mainImage)
        : []
    ).slice(0, MAX_ADDITIONAL_IMAGES);

    form.setFieldsValue(isEditDraft ? { ...baseValues, ...draft?.values } : baseValues);
    setMainImageUrl(
      isEditDraft ? (draft?.mainImageUrl ?? product.mainImage ?? "") : product.mainImage || ""
    );
    setAdditionalImageUrls(
      isEditDraft ? (draft?.additionalImageUrls || []).slice(0, MAX_ADDITIONAL_IMAGES) : baseAdditionalImages
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setMainImageUrl("");
    setAdditionalImageUrls([]);
    form.resetFields();
  };

  const saveProduct = async (values: ProductFormValues) => {
    if (!user) return;

    const scopedVendorId =
      user.role === UserRole.VENDOR ? vendorScopeId : values.vendorId || adminVendorFilter;

    if (!scopedVendorId || scopedVendorId === VENDOR_FILTER_ALL) {
      message.error("Select a vendor before saving this product.");
      return;
    }

    const mainImage = mainImageUrl.trim();
    if (!mainImage) {
      message.error("Please upload a main product image.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vendorId: scopedVendorId,
        name: values.name.trim(),
        description: values.description.trim(),
        category: values.category,
        listingType: values.listingType,
        price: Number(values.price),
        compareAtPrice:
          values.compareAtPrice !== undefined && values.compareAtPrice !== null
            ? Number(values.compareAtPrice)
            : null,
        discount:
          values.discount !== undefined && values.discount !== null ? Number(values.discount) : 0,
        stock: Number(values.stock),
        mainImage,
        images: buildImageArray(mainImage, additionalImageUrls).slice(0, MAX_PRODUCT_IMAGES),
        isActive: Boolean(values.isActive),
      };

      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save product");
      }

      message.success(
        editingProduct ? "Product updated successfully" : "Product created successfully"
      );
      clearLocalDraft(draftKey);
      closeModal();
      await loadProducts();
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to save product";
      message.error(description);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete product");
      }

      message.success("Product deleted successfully");
      await loadProducts();
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to delete product";
      message.error(description);
    }
  };

  const addAdditionalImages = useCallback(
    (urls: string[]) => {
      setAdditionalImageUrls((prev) => {
        if (prev.length >= MAX_ADDITIONAL_IMAGES) {
          if (urls.length > 0) {
            message.warning(
              `You can only add up to ${MAX_ADDITIONAL_IMAGES} additional image${
                MAX_ADDITIONAL_IMAGES === 1 ? "" : "s"
              }.`
            );
          }
          return prev;
        }

        const next = [...prev];
        let wasLimited = false;
        for (const rawUrl of urls) {
          const normalized = rawUrl.trim();
          if (!normalized || normalized === mainImageUrl || next.includes(normalized)) continue;
          if (next.length >= MAX_ADDITIONAL_IMAGES) {
            wasLimited = true;
            break;
          }
          next.push(normalized);
        }
        if (wasLimited) {
          message.warning(
            `You can only add up to ${MAX_ADDITIONAL_IMAGES} additional image${
              MAX_ADDITIONAL_IMAGES === 1 ? "" : "s"
            }.`
          );
        }
        return next;
      });
    },
    [mainImageUrl]
  );

  const removeAdditionalImage = (url: string) => {
    setAdditionalImageUrls((prev) => prev.filter((item) => item !== url));
  };

  useEffect(() => {
    if (!modalOpen) return;
    const values = form.getFieldsValue(true) as Partial<ProductFormValues>;
    saveLocalDraft<ProductFormDraft>(draftKey, {
      values,
      mainImageUrl,
      additionalImageUrls,
      editingProductId: editingProduct?.id || null,
    });
  }, [additionalImageUrls, draftKey, editingProduct?.id, form, mainImageUrl, modalOpen]);

  const columns: ColumnsType<Product> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_value, record) => (
        <div>
          <p className="font-medium text-ds-text-primary">{record.name}</p>
          <p className="text-xs text-ds-text-secondary">{record.id}</p>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (value: string) => <Tag>{categoryLabelMap.get(value) || value}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "listingType",
      key: "listingType",
      render: (value: string) => <Tag color="blue">{listingLabelMap.get(value) || value}</Tag>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value: number) => <span>{formatNaira(value)}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value: boolean) => (
        <Tag color={value ? "green" : "red"}>{value ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string | Date) => new Date(value).toLocaleDateString("en-NG"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_value, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              openActionConfirm(ActionConfirmPresets.delete("product"), () =>
                deleteProduct(record.id)
              )
            }
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Product Management</h1>
          <p className="mt-1 text-ds-text-secondary">
            Create, update, and deactivate products from the operations workspace.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Tag color="blue">Total: {stats.total}</Tag>
            <Tag color="green">Active: {stats.active}</Tag>
            <Tag color="red">Inactive: {stats.inactive}</Tag>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === UserRole.ADMIN && (
            <Select
              className="min-w-[220px]"
              value={adminVendorFilter}
              onChange={setAdminVendorFilter}
              options={[
                { value: VENDOR_FILTER_ALL, label: "All vendors" },
                ...vendorOptions.map((vendor) => ({
                  value: vendor.id,
                  label: vendor.storeName,
                })),
              ]}
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={loadProducts}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add Product
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={products}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form<ProductFormValues>
          form={form}
          layout="vertical"
          onFinish={saveProduct}
          onValuesChange={(_, allValues) =>
            saveLocalDraft<ProductFormDraft>(draftKey, {
              values: allValues as Partial<ProductFormValues>,
              mainImageUrl,
              additionalImageUrls,
              editingProductId: editingProduct?.id || null,
            })
          }
        >
          {user?.role === UserRole.ADMIN && (
            <Form.Item
              name="vendorId"
              label="Vendor"
              rules={[{ required: true, message: "Select a vendor" }]}
            >
              <Select
                options={vendorOptions.map((vendor) => ({
                  value: vendor.id,
                  label: vendor.storeName,
                }))}
                placeholder="Select vendor"
              />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input maxLength={120} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={3} maxLength={1200} />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Category is required" }]}
            >
              <Select
                options={PRODUCT_SUBCATEGORIES.map((category) => ({
                  value: category.value,
                  label: category.label,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="listingType"
              label="Listing Type"
              rules={[{ required: true, message: "Listing type is required" }]}
            >
              <Select
                options={LISTING_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="price"
              label="Price (NGN)"
              rules={[{ required: true, message: "Price is required" }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="Stock"
              rules={[{ required: true, message: "Stock is required" }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="compareAtPrice" label="Compare At Price (optional)">
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="discount" label="Discount % (optional)">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Main Product Image" required>
            <ImageUpload
              folderType="product"
              vendorId={
                user?.role === UserRole.VENDOR
                  ? vendorScopeId || undefined
                  : selectedVendorId || undefined
              }
              helpText="Upload a clear product cover image."
              onUploaded={(result) => setMainImageUrl(result.url)}
              valueUrl={mainImageUrl}
            />
            {mainImageUrl ? (
              <p className="mt-2 text-xs text-ds-text-secondary">Main image selected.</p>
            ) : (
              <p className="mt-2 text-xs text-ds-text-tertiary">No main image uploaded yet.</p>
            )}
          </Form.Item>

          <Form.Item
            label="Additional Product Images (optional)"
            extra="Upload more images to showcase angles, variants, or details."
          >
            <ImageUpload
              folderType="product"
              vendorId={
                user?.role === UserRole.VENDOR
                  ? vendorScopeId || undefined
                  : selectedVendorId || undefined
              }
              multiple
              maxFiles={Math.max(0, MAX_ADDITIONAL_IMAGES - additionalImageUrls.length)}
              disabled={additionalImageUrls.length >= MAX_ADDITIONAL_IMAGES}
              helpText={`Upload optional gallery images (up to ${MAX_ADDITIONAL_IMAGES}).`}
              onUploadedMany={(results) => addAdditionalImages(results.map((item) => item.url))}
            />

            {additionalImageUrls.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {additionalImageUrls.map((url, index) => (
                  <Tag key={url} closable onClose={() => removeAdditionalImage(url)}>
                    Image {index + 1}
                  </Tag>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-ds-text-secondary">
              {additionalImageUrls.length}/{MAX_ADDITIONAL_IMAGES} additional images selected.
            </p>
          </Form.Item>

          <Form.Item name="isActive" label="Active Listing" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
