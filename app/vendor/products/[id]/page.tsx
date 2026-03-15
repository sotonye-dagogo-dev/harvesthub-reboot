"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Product } from "@/lib/types";
import { Form, Input, InputNumber, Select, Switch } from "antd";
import { useToast } from "@/lib/contexts/ToastContext";
import { Button, Card, PageLoader } from "@/components/ui";
import { ArrowLeft, Package, Upload as UploadIcon } from "lucide-react";
import ImageUpload from "@/components/ui/imageupload";
import { formatCurrency } from "@/lib/utils";

const { TextArea } = Input;
const { Option } = Select;

const CATEGORIES = [
  "ELECTRONICS",
  "COMPUTERS_OFFICE",
  "HOME_APPLIANCES",
  "FURNITURE",
  "HOME_DECOR",
  "KITCHEN_DINING",
  "FASHION",
  "BEAUTY",
  "BABY_KIDS",
  "TOYS_GAMES",
  "AUTOMOTIVE",
  "MOTORCYCLES",
  "SPARE_PARTS",
  "INDUSTRIAL",
  "AGRICULTURE",
  "SECURITY",
  "GROCERY_FOOD",
  "SERVICES",
  "OTHERS",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: "Electronics",
  COMPUTERS_OFFICE: "Computers & Office",
  HOME_APPLIANCES: "Home Appliances",
  FURNITURE: "Furniture",
  HOME_DECOR: "Home Decor",
  KITCHEN_DINING: "Kitchen & Dining",
  FASHION: "Fashion",
  BEAUTY: "Beauty & Personal Care",
  BABY_KIDS: "Baby & Kids",
  TOYS_GAMES: "Toys & Games",
  AUTOMOTIVE: "Automotive",
  MOTORCYCLES: "Motorcycles",
  SPARE_PARTS: "Spare Parts",
  INDUSTRIAL: "Industrial & Construction",
  AGRICULTURE: "Agriculture",
  SECURITY: "Security & Surveillance",
  GROCERY_FOOD: "Grocery & Food",
  SERVICES: "Services",
  OTHERS: "Others",
};

export default function VendorProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [form] = Form.useForm();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);

  const isNew = id === "new";

  const fetchProduct = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      setProduct(data.product);
      form.setFieldsValue({
        name: data.product.name,
        description: data.product.description,
        price: data.product.price,
        originalPrice: data.product.originalPrice,
        discount: data.product.discount,
        category: data.product.category,
        stock: data.product.stock,
        unit: data.product.unit,
        isActive: data.product.isActive,
        isFeatured: data.product.isFeatured,
        allowsPickup: data.product.allowsPickup,
        allowsDelivery: data.product.allowsDelivery,
        images: data.product.images || [],
        mainImage: data.product.mainImage || null,
      });
      setImages(data.product.images || []);
      setMainImage(data.product.mainImage || null);
    } catch {
      toast.error("Failed to load product");
      router.push("/vendor/products");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, form, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "VENDOR") {
      router.replace("/");
      return;
    }
    fetchProduct();
  }, [user, authLoading, router, fetchProduct]);

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const url = isNew ? "/api/products" : `/api/products/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(isNew ? "Product created successfully!" : "Product updated successfully!");
      if (isNew) {
        router.push(`/vendor/products/${data.product.id}`);
      } else {
        setProduct(data.product);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone."))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Product deleted");
      router.push("/vendor/products");
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader minHeight="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/vendor/products")}
            className="rounded-ds-md p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
            aria-label="Back to products"
            title="Back to products"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2">
              <Package className="h-6 w-6 text-ds-text-brand" />
              {isNew ? "Add New Product" : "Edit Product"}
            </h1>
            {product && (
              <p className="text-sm text-ds-text-tertiary">
                {product.name} &bull; {formatCurrency(product.price)}
              </p>
            )}
          </div>
        </div>
        {!isNew && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg"
          >
            {deleting ? "Deleting..." : "Delete Product"}
          </Button>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: "Product name is required" }]}
              className="md:col-span-2"
            >
              <Input placeholder="Enter product name" size="large" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Description is required" }]}
              className="md:col-span-2"
            >
              <TextArea rows={4} placeholder="Describe your product" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Category is required" }]}
            >
              <Select placeholder="Select category" size="large">
                {CATEGORIES.map((cat) => (
                  <Option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="unit" label="Unit (e.g. kg, piece, pack)">
              <Input placeholder="e.g. kg" size="large" />
            </Form.Item>
          </div>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Pricing & Stock</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Form.Item
              name="price"
              label="Selling Price (₦)"
              rules={[{ required: true, message: "Price is required" }]}
            >
              <InputNumber
                min={0}
                className="w-full"
                size="large"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
            </Form.Item>

            <Form.Item name="originalPrice" label="Original Price (₦) — optional">
              <InputNumber
                min={0}
                className="w-full"
                size="large"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
            </Form.Item>

            <Form.Item
              name="discount"
              label="Discount (%)"
              tooltip="Enter a percentage discount (0-99). Leave empty for no discount."
              rules={[{ type: "number", min: 0, max: 99, message: "Discount must be 0-99%" }]}
            >
              <InputNumber
                min={0}
                max={99}
                className="w-full"
                size="large"
                placeholder="0"
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item
              name="stock"
              label="Stock Quantity"
              rules={[{ required: true, message: "Stock is required" }]}
            >
              <InputNumber min={0} className="w-full" size="large" />
            </Form.Item>
          </div>

          {/* Discount Preview */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.price !== cur.price || prev.discount !== cur.discount}
          >
            {({ getFieldValue }) => {
              const price = getFieldValue("price");
              const discount = getFieldValue("discount");
              if (price && discount && discount > 0) {
                const discountedPrice = price - (price * discount) / 100;
                return (
                  <div className="mt-2 rounded-ds-md bg-ds-status-success-bg p-3">
                    <p className="text-sm text-ds-status-success-text">
                      <span className="font-medium">Discount Preview:</span>{" "}
                      <span className="line-through text-ds-text-tertiary">
                        {formatCurrency(price)}
                      </span>{" "}
                      → <span className="font-bold">{formatCurrency(discountedPrice)}</span>{" "}
                      <span className="rounded bg-ds-status-error px-1.5 py-0.5 text-xs font-semibold text-white">
                        -{discount}%
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>
        </Card>

        {/* Fulfilment & Visibility */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
            Fulfilment & Visibility
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Form.Item name="allowsPickup" label="Church Pickup" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="allowsDelivery" label="Home Delivery" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label="Active / Visible" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item name="isFeatured" label="Featured Product" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Card>

        {/* Images (placeholder — Cloudinary in production) */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Product Images</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ds-text-secondary mb-2">
                Main Image
              </label>
              <div className="mb-2">
                {mainImage ? (
                  <div className="relative h-40 w-40 rounded-ds-md overflow-hidden">
                    <Image src={mainImage} alt="Main image" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-40 w-40 rounded-ds-md border border-ds-border-base bg-ds-surface-base flex items-center justify-center text-ds-text-placeholder">
                    No main image
                  </div>
                )}
              </div>
              <ImageUpload
                folderType="product"
                vendorId={user?.id}
                onUploaded={(res) => {
                  setMainImage(res.url);
                  form.setFieldsValue({ mainImage: res.url });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ds-text-secondary mb-2">
                Additional Images
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-ds-md overflow-hidden">
                    <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const next = images.filter((_, i) => i !== idx);
                        setImages(next);
                        form.setFieldsValue({ images: next });
                      }}
                      className="absolute right-1 top-1 rounded bg-black/40 p-1 text-white text-xs"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <ImageUpload
                folderType="product"
                vendorId={user?.id}
                onUploaded={(res) => {
                  const next = [...images, res.url];
                  setImages(next);
                  form.setFieldsValue({ images: next });
                }}
              />
            </div>
            <Form.Item name="mainImage" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="images" hidden>
              <Input />
            </Form.Item>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/vendor/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
