"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { booleanColor } from "@/components/ui/StatusTag";
import { message, Tag, Descriptions, Switch, Modal } from "antd";
import { Button, Card , PageLoader } from "@/components/ui";
import {
    ArrowLeft,
    Package,
    Eye,
    EyeOff,
    Star,
    Trash2,
    ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    const fetchProduct = useCallback(async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error("Product not found");
            const data = await res.json();
            setProduct(data.product);
        } catch {
            message.error("Failed to load product");
            router.push("/admin/products");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace("/login"); return; }
        if (user.role !== "ADMIN") { router.replace("/"); return; }
        fetchProduct();
    }, [user, authLoading, router, fetchProduct]);

    const updateProduct = async (updates: Partial<Product>) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            message.success("Product updated successfully");
            setProduct(data.product);
        } catch (err) {
            message.error(err instanceof Error ? err.message : "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            message.success("Product deleted");
            router.push("/admin/products");
        } catch {
            message.error("Failed to delete product");
        } finally {
            setActionLoading(false);
            setDeleteModal(false);
        }
    };

    if (authLoading || loading) {
        return (
            <PageLoader minHeight="min-h-[400px]" />
        );
    }

    if (!product) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin/products")}
                        className="rounded-lg p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
                        aria-label="Back to products"
                        title="Back to products"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-ds-text-primary flex items-center gap-2">
                            <Package className="h-5 w-5 text-ds-text-brand" />
                            {product.name}
                        </h1>
                        <p className="text-sm text-ds-text-tertiary">
                            {product.category} &bull; {formatCurrency(product.price)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Tag color={booleanColor(product.isActive)}>
                        {product.isActive ? "Active" : "Inactive"}
                    </Tag>
                    {product.isFeatured && <Tag color="gold">Featured</Tag>}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Product Info */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Images */}
                        {product.images && product.images.length > 0 && (
                        <Card>
                            <div className="flex flex-wrap gap-3">
                                {product.images.map((img, i) => (
                                    <div key={i} className="relative h-32 w-32 rounded-lg overflow-hidden border border-ds-border-base">
                                        <Image
                                            src={img}
                                            alt={`${product.name} ${i + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="128px"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Details */}
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-ds-text-primary">
                            Product Details
                        </h2>
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Name" span={2}>{product.name}</Descriptions.Item>
                            <Descriptions.Item label="Category">{product.category}</Descriptions.Item>
                            <Descriptions.Item label="Unit">{"—"}</Descriptions.Item>
                            <Descriptions.Item label="Price">{formatCurrency(product.price)}</Descriptions.Item>
                            <Descriptions.Item label="Original Price">
                                {product.compareAtPrice ? formatCurrency(product.compareAtPrice) : "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Stock">{product.stock}</Descriptions.Item>
                            <Descriptions.Item label="Views">{product.views ?? 0}</Descriptions.Item>
                            <Descriptions.Item label="Rating">
                                {product.averageRating ? `${product.averageRating.toFixed(1)} / 5` : "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Pickup">
                                {product.vendor?.storeSettings?.allowsPickup ? "Yes" : "No"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Delivery">
                                {product.vendor?.storeSettings?.allowsDelivery ? "Yes" : "No"}
                            </Descriptions.Item>
                            {product.description && (
                                <Descriptions.Item label="Description" span={2}>
                                    {product.description}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                </div>

                {/* Moderation Controls */}
                <div className="space-y-4">
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-ds-text-primary">
                            Moderation
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-ds-border-base p-3">
                                <div className="flex items-center gap-2">
                                    {product.isActive ? (
                                        <Eye className="h-4 w-4 text-ds-status-success-text" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-ds-status-error" />
                                    )}
                                    <span className="text-sm font-medium">Visible / Active</span>
                                </div>
                                <Switch
                                    checked={product.isActive}
                                    onChange={(checked) => updateProduct({ isActive: checked })}
                                    loading={actionLoading}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-ds-border-base p-3">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-medium">Featured</span>
                                </div>
                                <Switch
                                    checked={product.isFeatured}
                                    onChange={(checked) => updateProduct({ isFeatured: checked })}
                                    loading={actionLoading}
                                />
                            </div>

                            <a
                                href={`/products/${product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-ds-brand-muted px-4 py-2 text-sm font-medium text-ds-text-brand hover:bg-ds-brand-surface dark:hover:bg-ds-brand-subtle transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View Public Listing
                            </a>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="mb-3 text-base font-semibold text-ds-text-primary">
                            Danger Zone
                        </h2>
                        <Button
                            variant="outline"
                            className="w-full border-ds-status-error text-ds-status-error-text hover:bg-ds-status-error-bg"
                            onClick={() => setDeleteModal(true)}
                            disabled={actionLoading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Modal
                title="Delete Product"
                open={deleteModal}
                onCancel={() => setDeleteModal(false)}
                onOk={handleDelete}
                okText="Delete Permanently"
                okButtonProps={{ danger: true, loading: actionLoading }}
            >
                <p className="text-gray-700">
                    Are you sure you want to permanently delete{" "}
                    <strong>&ldquo;{product.name}&rdquo;</strong>? This cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
