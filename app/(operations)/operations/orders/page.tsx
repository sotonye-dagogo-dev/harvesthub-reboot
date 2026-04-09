"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeliveryMethod, OrderStatus, UserRole } from "@/lib/constants";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { OrderCard } from "@/components/features/OrderCard";
import { Button, SectionLoader } from "@/components/ui";

type OrderLike = {
  id: string;
  orderNumber: string;
  status: unknown;
  total: number;
  deliveryMethod: unknown;
  deliveryAddress?: unknown;
  pickupDetails?: unknown;
  createdAt: string | Date;
  items?: unknown[];
};

function resolveDeliveryInfo(order: Pick<OrderLike, "deliveryAddress" | "pickupDetails">) {
  const deliveryAddress =
    order.deliveryAddress && typeof order.deliveryAddress === "object"
      ? (order.deliveryAddress as Record<string, unknown>)
      : null;
  if (deliveryAddress && typeof deliveryAddress.address === "string") {
    return deliveryAddress.address;
  }

  const pickupDetails =
    order.pickupDetails && typeof order.pickupDetails === "object"
      ? (order.pickupDetails as Record<string, unknown>)
      : null;
  if (pickupDetails && typeof pickupDetails.location === "string") {
    return pickupDetails.location;
  }

  return undefined;
}

function toOrderStatus(value: unknown): OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus)
    ? (value as OrderStatus)
    : OrderStatus.PENDING;
}

function toDeliveryMethod(value: unknown): DeliveryMethod {
  return Object.values(DeliveryMethod).includes(value as DeliveryMethod)
    ? (value as DeliveryMethod)
    : DeliveryMethod.PICKUP;
}

export default function OperationsOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      router.replace("/login?from=/operations/orders");
      return;
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
      router.replace("/unauthorized");
    }
  }, [authLoading, router, user?.id, user?.role]);

  const loadOrders = useCallback(async (): Promise<OrderLike[]> => {
    const response = await fetch("/api/orders?limit=100");
    const data = (await response.json().catch(() => ({}))) as {
      orders?: OrderLike[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || "Unable to load orders");
    }

    return Array.isArray(data.orders) ? data.orders : [];
  }, []);

  const {
    data: orders,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useSmartResource(loadOrders, {
    key: `operations-orders:${user?.id ?? "guest"}`,
    enabled: Boolean(user?.id) && (user?.role === UserRole.ADMIN || user?.role === UserRole.VENDOR),
    refreshIntervalMs: 60_000,
    staleTimeMs: 15_000,
  });

  if (authLoading || (isLoading && !orders)) {
    return <SectionLoader />;
  }

  if (!user?.id) {
    return null;
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
    return null;
  }

  const orderList = orders ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Orders Operations</h1>
          <p className="text-ds-text-secondary">
            Manage {user.role === UserRole.ADMIN ? "platform-wide" : "store"} orders.
          </p>
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
          {isRefreshing ? (
            <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing orders...</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
          Refresh
        </Button>
      </div>

      {orderList.length === 0 ? (
        <p className="text-ds-text-secondary">No orders found yet.</p>
      ) : (
        <div className="space-y-4">
          {orderList.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              orderNumber={order.orderNumber}
              status={toOrderStatus(order.status)}
              total={order.total}
              itemCount={order.items?.length ?? 0}
              deliveryMethod={toDeliveryMethod(order.deliveryMethod)}
              deliveryInfo={resolveDeliveryInfo(order)}
              createdAt={order.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
