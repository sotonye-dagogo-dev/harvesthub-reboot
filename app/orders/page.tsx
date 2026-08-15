"use client";

import { useCallback, useEffect, useState } from "react";
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
  itemCount?: unknown;
  totalQuantity?: unknown;
  deliveryMethod: unknown;
  deliveryAddress?: unknown;
  pickupDetails?: unknown;
  createdAt: string | Date;
  items?: unknown[];
};

type OrdersPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type OrdersResource = {
  orders: OrderLike[];
  pagination: OrdersPagination;
};

const DEFAULT_PAGE_SIZE = 12;

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

function resolveItemCount(order: OrderLike): number {
  const apiItemCount =
    typeof order.itemCount === "number" && Number.isFinite(order.itemCount)
      ? order.itemCount
      : null;

  if (apiItemCount !== null) {
    return Math.max(0, Math.trunc(apiItemCount));
  }

  return Array.isArray(order.items) ? order.items.length : 0;
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async (): Promise<OrdersResource> => {
    const response = await fetch(`/api/orders?page=${page}&limit=${DEFAULT_PAGE_SIZE}`);
    const data = (await response.json().catch(() => ({}))) as {
      orders?: OrderLike[];
      pagination?: Partial<OrdersPagination>;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || "Unable to load orders");
    }

    const orders = Array.isArray(data.orders) ? data.orders : [];
    const total =
      typeof data.pagination?.total === "number" && Number.isFinite(data.pagination.total)
        ? Math.max(0, Math.trunc(data.pagination.total))
        : orders.length;
    const limit =
      typeof data.pagination?.limit === "number" && Number.isFinite(data.pagination.limit)
        ? Math.max(1, Math.trunc(data.pagination.limit))
        : DEFAULT_PAGE_SIZE;
    const totalPagesRaw =
      typeof data.pagination?.totalPages === "number" && Number.isFinite(data.pagination.totalPages)
        ? Math.trunc(data.pagination.totalPages)
        : Math.ceil(total / limit);
    const totalPages = Math.max(1, totalPagesRaw);
    const currentPage =
      typeof data.pagination?.page === "number" && Number.isFinite(data.pagination.page)
        ? Math.max(1, Math.trunc(data.pagination.page))
        : page;

    return {
      orders,
      pagination: {
        total,
        page: currentPage,
        limit,
        totalPages,
      },
    };
  }, [page]);

  const {
    data: ordersResource,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useSmartResource(loadOrders, {
    key: `orders:${user?.id ?? "guest"}:page:${page}`,
    enabled: Boolean(user?.id),
    refreshIntervalMs: 60_000,
    staleTimeMs: 20_000,
  });

  const orderList = ordersResource?.orders ?? [];
  const pagination =
    ordersResource?.pagination ??
    ({
      total: orderList.length,
      page,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil((orderList.length || 1) / DEFAULT_PAGE_SIZE)),
    } satisfies OrdersPagination);
  const canGoPrevious = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;
  const resultsSummary = (() => {
    if (pagination.total === 0) {
      return "Showing 0 orders";
    }

    if (orderList.length === 0) {
      return `Showing 0 of ${pagination.total} orders`;
    }

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.total, pagination.page * pagination.limit);
    return `Showing ${start}-${end} of ${pagination.total} orders`;
  })();

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  if (authLoading || (isLoading && !ordersResource)) {
    return <SectionLoader />;
  }

  if (!user?.id) {
    return <div className="container mx-auto px-4 py-8">Please log in to view orders</div>;
  }

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
          <Button type="button" variant="outline" size="sm" loading={isRefreshing} onClick={() => void refresh(true)}>
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
              itemCount={resolveItemCount(order)}
              deliveryMethod={toDeliveryMethod(order.deliveryMethod)}
              deliveryInfo={resolveDeliveryInfo(order)}
              createdAt={order.createdAt}
            />
          ))
        )}

        {pagination.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-ds-md border border-ds-border-subtle bg-ds-surface-secondary/50 px-3 py-2 text-sm text-ds-text-secondary">
            <p>{resultsSummary}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-ds-text-tertiary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
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
