"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Vendor, Product } from "@/lib/types";
import { message, Spin, Tag, Descriptions, Modal } from "antd";
import { Button, Card } from "@/components/ui";
import {
    ArrowLeft,
    Store,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    ShoppingBag,
    Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const VENDOR_STATUS_COLORS: Record<string, string> = {
    PENDING: "orange",
    APPROVED: "green",
    SUSPENDED: "red",
    REJECTED: "default",
};

export default function AdminVendorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const fetchVendor = useCallback(async () => {
        try {
            const [vRes, pRes] = await Promise.all([
                fetch(`/api/vendors/${id}`),
                fetch(`/api/vendors/${id}/products`),
            ]);
            if (!vRes.ok) throw new Error("Vendor not found");
            const vData = await vRes.json();
            setVendor(vData.vendor);
            if (pRes.ok) {
                const pData = await pRes.json();
                setProducts(pData.products ?? []);
            }
        } catch {
            message.error("Failed to load vendor");
            router.push("/admin/vendors");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace("/login"); return; }
        if (user.role !== "ADMIN") { router.replace("/"); return; }
        fetchVendor();
    }, [user, authLoading, router, fetchVendor]);

    const updateVendorStatus = async (status: string, extraData?: Record<string, unknown>) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/vendors/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, ...extraData }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            message.success(`Vendor ${status.toLowerCase()} successfully`);
            setVendor(data.vendor);
        } catch (err) {
            message.error(err instanceof Error ? err.message : "Action failed");
        } finally {
            setActionLoading(false);
            setRejectModal(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!vendor) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin/vendors")}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Back to vendors"
                        title="Back to vendors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Store className="h-5 w-5 text-purple-600" />
                            {vendor.storeName}
                        </h1>
                        <p className="text-sm text-gray-500">{vendor.category}</p>
                    </div>
                </div>
                <Tag color={VENDOR_STATUS_COLORS[vendor.status]} className="text-sm px-3 py-1">
                    {vendor.status}
                </Tag>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Vendor Details */}
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                            Store Information
                        </h2>
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Store Name">{vendor.storeName}</Descriptions.Item>
                            <Descriptions.Item label="Category">{vendor.category}</Descriptions.Item>
                            <Descriptions.Item label="Campus">{vendor.campus}</Descriptions.Item>
                            <Descriptions.Item label="Commission Rate">
                                {vendor.commissionRate ?? 10}%
                            </Descriptions.Item>
                            {vendor.whatsappNumber && (
                                <Descriptions.Item label="WhatsApp">{vendor.whatsappNumber}</Descriptions.Item>
                            )}
                            <Descriptions.Item label="Registered">
                                {new Date(vendor.createdAt).toLocaleDateString("en-NG")}
                            </Descriptions.Item>
                            {vendor.storeDescription && (
                                <Descriptions.Item label="Description" span={2}>
                                    {vendor.storeDescription}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            {
                                label: "Products",
                                value: products.length,
                                icon: <Package className="h-5 w-5 text-purple-600" />,
                            },
                            {
                                label: "Total Sales",
                                value: formatCurrency(vendor.analytics.totalSales),
                                icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
                            },
                            {
                                label: "Rating",
                                value: vendor.analytics.averageRating ? `${vendor.analytics.averageRating.toFixed(1)} / 5` : "—",
                                icon: <Star className="h-5 w-5 text-amber-500" />,
                            },
                        ].map((stat) => (
                            <Card key={stat.label}>
                                <div className="flex items-center gap-3">
                                    {stat.icon}
                                    <div>
                                        <p className="text-xs text-gray-500">{stat.label}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Products Preview */}
                    {products.length > 0 && (
                        <Card>
                            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Products ({products.length})
                            </h2>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {products.slice(0, 5).map((p) => (
                                    <div key={p.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{p.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-purple-600">
                                                {formatCurrency(p.price)}
                                            </p>
                                            <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                            Admin Actions
                        </h2>
                        <div className="space-y-3">
                            {vendor.status === "PENDING" && (
                                <>
                                    <Button
                                        className="w-full"
                                        onClick={() => updateVendorStatus("APPROVED")}
                                        disabled={actionLoading}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve Vendor
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => setRejectModal(true)}
                                        disabled={actionLoading}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Application
                                    </Button>
                                </>
                            )}
                            {vendor.status === "APPROVED" && (
                                <Button
                                    variant="outline"
                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => updateVendorStatus("SUSPENDED")}
                                    disabled={actionLoading}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Suspend Vendor
                                </Button>
                            )}
                            {vendor.status === "SUSPENDED" && (
                                <Button
                                    className="w-full"
                                    onClick={() => updateVendorStatus("APPROVED")}
                                    disabled={actionLoading}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Reinstate Vendor
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Reject Modal */}
            <Modal
                title="Reject Vendor Application"
                open={rejectModal}
                onCancel={() => setRejectModal(false)}
                onOk={() => updateVendorStatus("REJECTED", { reason: rejectReason })}
                okText="Reject"
                okButtonProps={{ danger: true, loading: actionLoading }}
            >
                <p className="mb-3 text-gray-600">
                    Please provide a reason for rejection (optional but recommended):
                </p>
                <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Incomplete information, product category not permitted..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </Modal>
        </div>
    );
}
