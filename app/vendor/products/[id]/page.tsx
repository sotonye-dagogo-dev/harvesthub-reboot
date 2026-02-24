"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Product } from "@/lib/types";
import { Form, Input, InputNumber, Select, Switch, message } from "antd";
import { Button, Card , PageLoader } from "@/components/ui";
import { ArrowLeft, Package, Upload as UploadIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const { TextArea } = Input;
const { Option } = Select;

const CATEGORIES = [
    "FARM_PRODUCE",
    "FASHION",
    "FOOD",
    "BEAUTY",
    "ELECTRONICS",
    "HOME",
    "BOOKS",
    "SERVICES",
    "CRAFTS",
    "OTHERS",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
    FARM_PRODUCE: "Farm Produce",
    FASHION: "Fashion & Apparel",
    FOOD: "Food & Beverages",
    BEAUTY: "Beauty & Cosmetics",
    ELECTRONICS: "Electronics & Gadgets",
    HOME: "Home & Kitchen",
    BOOKS: "Books & Stationery",
    SERVICES: "Services",
    CRAFTS: "Crafts & Handmade",
    OTHERS: "Others" };

export default function VendorProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [form] = Form.useForm();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                category: data.product.category,
                stock: data.product.stock,
                unit: data.product.unit,
                isActive: data.product.isActive,
                isFeatured: data.product.isFeatured,
                allowsPickup: data.product.allowsPickup,
                allowsDelivery: data.product.allowsDelivery });
        } catch {
            message.error("Failed to load product");
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
                body: JSON.stringify(values) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            message.success(isNew ? "Product created successfully!" : "Product updated successfully!");
            if (isNew) {
                router.push(`/vendor/products/${data.product.id}`);
            } else {
                setProduct(data.product);
            }
        } catch (err) {
            message.error(err instanceof Error ? err.message : "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            message.success("Product deleted");
            router.push("/vendor/products");
        } catch {
            message.error("Failed to delete product");
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <PageLoader minHeight="min-h-[400px]" />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/vendor/products")}
                        className="rounded-lg p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
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
                    <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
                        Basic Information
                    </h2>
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
                    <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
                        Pricing & Stock
                    </h2>
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
                            name="stock"
                            label="Stock Quantity"
                            rules={[{ required: true, message: "Stock is required" }]}
                        >
                            <InputNumber min={0} className="w-full" size="large" />
                        </Form.Item>
                    </div>
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
                    <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
                        Product Images
                    </h2>
                    <div className="rounded-lg border-2 border-dashed border-ds-border-base p-8 text-center">
                        <UploadIcon className="mx-auto h-8 w-8 text-ds-text-placeholder" />
                        <p className="mt-2 text-sm text-ds-text-tertiary">
                            Image upload via Cloudinary available in production
                        </p>
                        {product?.images && product.images.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {(product.images as string[]).map((img: string, i: number) => (
                                    <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden">
                                        <Image
                                            src={img}
                                            alt={`Product ${i + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
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
