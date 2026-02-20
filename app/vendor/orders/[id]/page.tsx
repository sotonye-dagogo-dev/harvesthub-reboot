"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Select, message, Spin, Tag } from "antd";
import { Button, Card } from "@/components/ui";
import {
    ArrowLeft,
    ShoppingBag,
    MapPin,
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const { Option } = Select;

const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: "orange",
    CONFIRMED: "blue",
    PROCESSING: "purple",
    READY: "cyan",
    SHIPPED: "geekblue",
    DELIVERED: "green",
    CANCELLED: "red",
    REFUNDED: "magenta",
};

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    CONFIRMED: <CheckCircle className="h-4 w-4" />,
    PROCESSING: <Package className="h-4 w-4" />,
    READY: <Package className="h-4 w-4" />,
    SHIPPED: <Truck className="h-4 w-4" />,
    DELIVERED: <CheckCircle className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
    REFUNDED: <AlertCircle className="h-4 w-4" />,
};

const VENDOR_NEXT_STATUSES: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["READY"],
    READY: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
};

export default function VendorOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState<string>("");

    const fetchOrder = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (!res.ok) throw new Error("Order not found");
            const data = await res.json();
            setOrder(data.order);
        } catch {
            message.error("Failed to load order");
            router.push("/vendor/orders");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace("/login"); return; }
        if (user.role !== "VENDOR") { router.replace("/"); return; }
        fetchOrder();
    }, [user, authLoading, router, fetchOrder]);

    const handleStatusUpdate = async () => {
        if (!newStatus || !order) return;
        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");
            message.success(`Order status updated to ${newStatus}`);
            setOrder(data.order);
            setNewStatus("");
        } catch (err) {
            message.error(err instanceof Error ? err.message : "Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!order) return null;

    const nextStatuses = VENDOR_NEXT_STATUSES[order.status] ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/vendor/orders")}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Back to orders"
                        title="Back to orders"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-purple-600" />
                            Order #{order.id.slice(-8).toUpperCase()}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placed {new Date(order.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "long", year: "numeric",
                            })}
                        </p>
                    </div>
                </div>
                <Tag
                    color={ORDER_STATUS_COLORS[order.status]}
                    className="text-sm px-3 py-1"
                >
                    {ORDER_STATUS_ICONS[order.status]}{" "}
                    {order.status}
                </Tag>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Order Items */}
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                            Items Ordered
                        </h2>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {order.items.map((item) => (
                                <div key={item.productId} className="flex items-center gap-4 py-3">
                                    <div className="h-14 w-14 relative flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        {item.productImage ? (
                                            <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="56px" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Package className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {item.productName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Qty: {item.quantity} &times; {formatCurrency(item.price)}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-purple-600">
                                        {formatCurrency(item.subtotal)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.deliveryFee > 0 && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Delivery Fee</span>
                                    <span>{formatCurrency(order.deliveryFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Update Status */}
                    {nextStatuses.length > 0 && (
                        <Card>
                            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                                Update Order Status
                            </h2>
                            <div className="flex gap-3">
                                <Select
                                    value={newStatus || undefined}
                                    onChange={setNewStatus}
                                    placeholder="Select next status"
                                    className="flex-1"
                                    size="large"
                                >
                                    {nextStatuses.map((s) => (
                                        <Option key={s} value={s}>
                                            {s}
                                        </Option>
                                    ))}
                                </Select>
                                <Button
                                    onClick={handleStatusUpdate}
                                    disabled={!newStatus || updatingStatus}
                                >
                                    {updatingStatus ? "Updating..." : "Update"}
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar — Buyer & Delivery Info */}
                <div className="space-y-6">
                    {/* Delivery / Pickup */}
                    <Card>
                        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {order.deliveryMethod === "DELIVERY" ? (
                                <><Truck className="h-4 w-4 text-purple-600" /> Delivery Info</>
                            ) : (
                                <><MapPin className="h-4 w-4 text-purple-600" /> Pickup Info</>
                            )}
                        </h2>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <p>
                                <span className="font-medium">Type:</span>{" "}
                                {order.deliveryMethod === "DELIVERY" ? "Home Delivery" : "Church Pickup"}
                            </p>
                            {order.deliveryAddress && (
                                <p className="flex items-start gap-1">
                                    <MapPin className="mt-0.5 h-4 w-4 text-gray-400 flex-shrink-0" />
                                    {[order.deliveryAddress.addressLine1, order.deliveryAddress.addressLine2, order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean).join(", ")}
                                </p>
                            )}
                            {order.pickupDetails && (
                                <p className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    {order.pickupDetails.service.replace(/_/g, " ")} — {order.pickupDetails.campus}
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                            Payment
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <Tag color={order.paymentStatus === "PAID" ? "green" : "orange"}>
                                    {order.paymentStatus}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
