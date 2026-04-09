"use client";

import { useCallback } from "react";
import { DeliveryMethod, OrderStatus } from "@/lib/constants";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { OrderCard } from "@/components/features/OrderCard";
import { RoleAwareFeatureRenderer } from "@/components/ui/RoleAwareFeatureRenderer";
import { Button, SectionLoader } from "@/components/ui";
import { ClientDashboardShell } from "@/components/layout";
import { orderModule } from "@/modules/orders";

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

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();

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
    key: `orders:${user?.id ?? "guest"}`,
    enabled: Boolean(user?.id),
    refreshIntervalMs: 60_000,
    staleTimeMs: 20_000,
  });

  if (authLoading || (isLoading && !orders)) {
    return <SectionLoader />;
  }

  if (!user?.id) {
    return <div className="container mx-auto px-4 py-8">Please log in to view orders</div>;
  }

  const orderList = orders ?? [];

  const ordersContent = (
    <RoleAwareFeatureRenderer requiredCapability={orderModule.capability}>
      <div className="container mx-auto space-y-4 px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ds-text-primary">My Orders</h1>
            {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
            {isRefreshing ? (
              <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing your orders...</p>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
            Refresh
          </Button>
        </div>

        {orderList.length === 0 ? (
          <p className="text-ds-text-secondary">No orders found yet.</p>
        ) : (
          orderList.map((order) => (
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
          ))
        )}
      </div>
    </RoleAwareFeatureRenderer>
  );

  if (user.role === "ADMIN" || user.role === "VENDOR") {
    return (
      <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
        {ordersContent}
      </ClientDashboardShell>
    );
  }

  return ordersContent;
}
