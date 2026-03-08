"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Order } from "@/lib/types";
import Image from "next/image";
import { StatusTag, PageLoader } from "@/components/ui";
import { message, Descriptions, Select } from "antd";
import { Button, Card } from "@/components/ui";
import { ArrowLeft, ShoppingBag, Package, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const { Option } = Select;

const ALL_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminOrderDetailPage() {
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
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
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

  const handleForceCancel = async () => {
    if (!confirm("Force cancel this order? A refund will be issued if paid via wallet.")) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      message.success("Order cancelled");
      setOrder(data.order);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader minHeight="min-h-[400px]" />;
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/orders")}
            className="rounded-ds-md p-2 text-ds-text-tertiary hover:bg-ds-surface-sunken"
            aria-label="Back to orders"
            title="Back to orders"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ds-text-primary flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-ds-text-brand" />
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-ds-text-tertiary">
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <StatusTag domain="order" status={order.status} className="text-sm px-3 py-1" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Order Items</h2>
            <div className="divide-y divide-ds-border-subtle">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 py-3">
                  <div className="h-12 w-12 relative flex-shrink-0 rounded-ds-md bg-ds-surface-sunken overflow-hidden flex items-center justify-center">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-ds-text-placeholder" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ds-text-primary">{item.productName}</p>
                    <p className="text-xs text-ds-text-tertiary">
                      {item.quantity} &times; {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-ds-text-brand">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-ds-border-subtle pt-4 text-sm">
              <div className="flex justify-between text-ds-text-tertiary">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-ds-text-tertiary">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-ds-text-primary text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Order Details */}
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Order Details</h2>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Order ID">{order.id}</Descriptions.Item>
              <Descriptions.Item label="Payment Method">{order.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <StatusTag domain="payment" status={order.paymentStatus} />
              </Descriptions.Item>
              <Descriptions.Item label="Fulfillment">{order.deliveryMethod}</Descriptions.Item>
              {order.deliveryAddress && (
                <Descriptions.Item label="Delivery Address" span={2}>
                  {[
                    order.deliveryAddress.addressLine1,
                    order.deliveryAddress.addressLine2,
                    order.deliveryAddress.city,
                    order.deliveryAddress.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Descriptions.Item>
              )}
              {order.pickupDetails && (
                <Descriptions.Item label="Pickup Details" span={2}>
                  {order.pickupDetails.service.replace(/_/g, " ")} — {order.pickupDetails.campus}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>

        {/* Admin Controls */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ds-text-primary">Update Status</h2>
            <div className="space-y-3">
              <Select
                value={newStatus || undefined}
                onChange={setNewStatus}
                placeholder="Select status"
                className="w-full"
                size="large"
              >
                {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
              <Button
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={!newStatus || updatingStatus}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {updatingStatus ? "Updating..." : "Apply Status"}
              </Button>
            </div>
          </Card>

          {!["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
            <Card>
              <h2 className="mb-3 text-base font-semibold text-ds-text-primary">Force Actions</h2>
              <Button
                variant="outline"
                className="w-full border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg"
                onClick={handleForceCancel}
                disabled={updatingStatus}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Force Cancel Order
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
