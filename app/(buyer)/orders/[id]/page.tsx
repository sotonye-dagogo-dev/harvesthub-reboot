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
import { Tag, Steps, message, Modal, Divider } from "antd";
import Image from "next/image";
import Link from "next/link";
import { OrderStatus, PaymentStatus, DeliveryMethod } from "@/lib/constants";

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

  const statusColor = (status: OrderStatus | string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      CONFIRMED: "blue",
      PROCESSING: "cyan",
      READY: "geekblue",
      COMPLETED: "green",
      CANCELLED: "red",
      REFUNDED: "volcano",
    };
    return colors[status] || "default";
  };

  const paymentStatusColor = (status: PaymentStatus | string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      PAID: "green",
      FAILED: "red",
      REFUNDED: "purple",
    };
    return colors[status] || "default";
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">
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
          <Tag color={statusColor(order.status)} className="text-sm">
            {order.status}
          </Tag>
          <Tag color={paymentStatusColor(order.paymentStatus)} className="text-sm">
            {order.paymentStatus}
          </Tag>
        </div>
      </div>

      {/* Order Status Timeline */}
      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Order Progress</h2>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Order Items ({order.items.length})
            </h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
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
                      className="font-medium text-gray-900 hover:text-purple-600 dark:text-white"
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
                    <p className="mt-1 text-sm text-gray-500">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
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
                <MessageSquare className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Order Notes</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column - Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-purple-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <CreditCard className="h-5 w-5" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Method</span>
                <span>{order.paymentMethod.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <Tag color={paymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Tag>
              </div>
            </div>
          </Card>

          {/* Delivery/Pickup Info */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
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
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.deliveryAddress.addressLine1}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}
                  </p>
                  {order.deliveryAddress.phoneNumber && (
                    <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Phone className="h-3.5 w-3.5" />
                      {order.deliveryAddress.phoneNumber}
                    </p>
                  )}
                </>
              )}
              {order.deliveryMethod === DeliveryMethod.PICKUP && order.pickupDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Campus</span>
                    <span>{order.pickupDetails.campus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Service</span>
                    <span>{order.pickupDetails.service.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contact</span>
                    <span>{order.pickupDetails.contactPhone}</span>
                  </div>
                  {order.pickupDetails.specialInstructions && (
                    <p className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Vendor</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600 dark:bg-purple-900/30">
                  {vendor.storeName[0]}
                </div>
                <div>
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="font-medium text-gray-900 hover:text-purple-600 dark:text-white"
                  >
                    {vendor.storeName}
                  </Link>
                  <p className="text-xs text-gray-500">{vendor.campus}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          {canCancel && (
            <Card>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                onClick={handleCancel}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Clock className="h-5 w-5" /> Timeline
            </h2>
            <div className="space-y-3">
              {order.statusHistory
                ?.slice()
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {entry.notes && <p className="mt-0.5 text-xs text-gray-500">{entry.notes}</p>}
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
