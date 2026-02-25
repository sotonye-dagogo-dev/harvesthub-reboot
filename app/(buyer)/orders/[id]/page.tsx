"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockOrders, mockVendors } from "@/lib/data/mockData";
import { Card, Button, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { StatusTag } from "@/components/ui";
import { Tag, Steps, message, Modal, Divider } from "antd";
import Image from "next/image";
import Link from "next/link";
import { OrderStatus, DeliveryMethod } from "@/lib/constants";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const order = useMemo(() => mockOrders.find((o) => o.id === orderId), [orderId]);

  // Must be before early return to satisfy Rules of Hooks
  const statusSteps = useMemo(() => {
    if (!order) return [];
    const allStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];

    // If cancelled, show cancelled step
    if (order.status === OrderStatus.CANCELLED) {
      return order.statusHistory.map((entry) => ({
        title: entry.status,
        description: new Date(entry.timestamp).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: entry.status === OrderStatus.CANCELLED ? ("error" as const) : ("finish" as const),
      }));
    }

    const currentIndex = allStatuses.indexOf(order.status as OrderStatus);

    return allStatuses.map((status, index) => {
      const historyEntry = order.statusHistory?.find((h) => h.status === status);
      return {
        title: status.replace(/_/g, " "),
        description: historyEntry
          ? new Date(historyEntry.timestamp).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
        status: index <= currentIndex ? ("finish" as const) : ("wait" as const),
      };
    });
  }, [order]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Order not found"
          description="The order you&rsquo;re looking for doesn&rsquo;t exist or has been removed."
          action={<Button onClick={() => router.push("/orders")}>Back to Orders</Button>}
        />
      </div>
    );
  }

  const vendor = mockVendors.find((v) => v.id === order.vendorId);

  const canCancel = order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED;

  const handleCancel = () => {
    Modal.confirm({
      title: "Cancel Order",
      content: "Are you sure you want to cancel this order? This action cannot be undone.",
      okText: "Cancel Order",
      okType: "danger",
      onOk: () => {
        message.success("Order cancelled successfully");
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ds-text-primary">Order {order.orderNumber}</h1>
            <p className="text-sm text-ds-text-tertiary">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusTag domain="order" status={order.status} className="text-sm" />
          <StatusTag domain="payment" status={order.paymentStatus} className="text-sm" />
        </div>
      </div>

      {/* Order Status Timeline */}
      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Order Progress</h2>
        <Steps
          current={statusSteps.findIndex((s) => s.status === "wait") - 1}
          items={statusSteps}
          size="small"
          responsive
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Order items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
              Order Items ({order.items.length})
            </h2>
            <div className="divide-y divide-ds-border-subtle">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-ds-md">
                    <Image
                      src={item.productImage || "/placeholder-product.png"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium text-ds-text-primary hover:text-ds-text-brand"
                    >
                      {item.productName}
                    </Link>
                    {item.selectedVariants && (
                      <div className="mt-1 flex gap-2">
                        {Object.entries(item.selectedVariants).map(([key, value]) => (
                          <Tag key={key} className="text-xs">
                            {key}: {value}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-sm text-ds-text-tertiary">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-ds-text-primary">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-5 w-5 text-ds-text-placeholder" />
                <div>
                  <h3 className="font-medium text-ds-text-primary">Order Notes</h3>
                  <p className="mt-1 text-sm text-ds-text-secondary">{order.notes}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column - Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ds-text-secondary">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ds-text-secondary">Delivery Fee</span>
                <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-ds-text-brand">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
              <CreditCard className="h-5 w-5" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ds-text-secondary">Method</span>
                <span>{order.paymentMethod.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ds-text-secondary">Status</span>
                <StatusTag domain="payment" status={order.paymentStatus} />
              </div>
            </div>
          </Card>

          {/* Delivery/Pickup Info */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
              {order.deliveryMethod === DeliveryMethod.DELIVERY ? (
                <Truck className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              {order.deliveryMethod === DeliveryMethod.DELIVERY ? "Delivery" : "Pickup"} Details
            </h2>
            <div className="space-y-2 text-sm">
              {order.deliveryMethod === DeliveryMethod.DELIVERY && order.deliveryAddress && (
                <>
                  <p className="font-medium">{order.deliveryAddress.fullName}</p>
                  <p className="text-ds-text-secondary">{order.deliveryAddress.addressLine1}</p>
                  <p className="text-ds-text-secondary">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}
                  </p>
                  {order.deliveryAddress.phoneNumber && (
                    <p className="flex items-center gap-1 text-ds-text-secondary">
                      <Phone className="h-3.5 w-3.5" />
                      {order.deliveryAddress.phoneNumber}
                    </p>
                  )}
                </>
              )}
              {order.deliveryMethod === DeliveryMethod.PICKUP && order.pickupDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-ds-text-secondary">Campus</span>
                    <span>{order.pickupDetails.campus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ds-text-secondary">Service</span>
                    <span>{order.pickupDetails.service.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ds-text-secondary">Contact</span>
                    <span>{order.pickupDetails.contactPhone}</span>
                  </div>
                  {order.pickupDetails.specialInstructions && (
                    <p className="mt-2 rounded-ds-xs bg-ds-surface-sunken p-2 text-xs text-ds-text-secondary dark:text-ds-text-placeholder">
                      {order.pickupDetails.specialInstructions}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Vendor Info */}
          {vendor && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-ds-text-primary">Vendor</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-sm font-bold text-ds-text-brand">
                  {vendor.storeName[0]}
                </div>
                <div>
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="font-medium text-ds-text-primary hover:text-ds-text-brand"
                  >
                    {vendor.storeName}
                  </Link>
                  <p className="text-xs text-ds-text-tertiary">{vendor.campus}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          {canCancel && (
            <Card>
              <Button
                variant="outline"
                className="w-full border-ds-status-error/30 text-ds-status-error-text hover:bg-ds-status-error-bg dark:hover:bg-ds-status-error-bg/20"
                onClick={handleCancel}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
              <Clock className="h-5 w-5" /> Timeline
            </h2>
            <div className="space-y-3">
              {order.statusHistory
                ?.slice()
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-ds-full bg-ds-brand-primary-light" />
                    <div>
                      <p className="text-sm font-medium text-ds-text-primary">
                        {entry.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-ds-text-tertiary">
                        {new Date(entry.timestamp).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {entry.notes && (
                        <p className="mt-0.5 text-xs text-ds-text-tertiary">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
