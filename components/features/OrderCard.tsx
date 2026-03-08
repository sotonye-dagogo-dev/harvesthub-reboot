"use client";

import Link from "next/link";
import { Package, Clock, MapPin, Truck } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { OrderStatus, DeliveryMethod } from "@/lib/constants";
import type { Timestamp } from "@/lib/types";

export interface OrderCardProps {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo?: string;
  createdAt: Timestamp;
  estimatedDate?: Timestamp;
  className?: string;
}

const statusConfig = {
  pending: { label: "Pending", variant: "default" as const },
  confirmed: { label: "Confirmed", variant: "primary" as const },
  processing: { label: "Processing", variant: "warning" as const },
  ready: { label: "Ready", variant: "success" as const },
  completed: { label: "Completed", variant: "success" as const },
  cancelled: { label: "Cancelled", variant: "danger" as const },
  refunded: { label: "Refunded", variant: "default" as const },
};

export function OrderCard({
  id,
  orderNumber,
  status,
  total,
  itemCount,
  deliveryMethod,
  deliveryInfo,
  createdAt,
  estimatedDate,
  className,
}: OrderCardProps) {
  // Convert enum status to lowercase for statusConfig lookup
  const statusKey = status.toLowerCase() as keyof typeof statusConfig;
  const statusDetails = statusConfig[statusKey];

  // Convert Timestamp to Date for formatting
  const createdDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const estimatedDateObj = estimatedDate
    ? typeof estimatedDate === "string"
      ? new Date(estimatedDate)
      : estimatedDate
    : undefined;

  // Convert enum delivery method to lowercase
  const isPickup = deliveryMethod === DeliveryMethod.PICKUP;

  return (
    <Link href={`/orders/${id}`}>
      <Card className={cn("transition-all hover:shadow-ds-lg", className)} hoverable>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Order Number and Status */}
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold text-ds-text-primary">Order #{orderNumber}</h3>
              <Badge variant={statusDetails.variant}>{statusDetails.label}</Badge>
            </div>

            {/* Order Details */}
            <div className="mb-3 space-y-1 text-sm text-ds-text-secondary">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(createdDate, "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                {isPickup ? (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>Pickup: {deliveryInfo || "Church Campus"}</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Delivery: {deliveryInfo || "Home"}</span>
                  </>
                )}
              </div>
              {estimatedDateObj && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Estimated: {format(estimatedDateObj, "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="text-lg font-bold text-ds-text-brand">
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
