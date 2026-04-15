"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeliveryMethod, OrderStatus, UserRole } from "@/lib/constants";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { Button, SectionLoader } from "@/components/ui";
import Link from "next/link";
import { Input, Modal, Select, Table, Tag, message } from "antd";
import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import type { Key } from "react";

type OrderLike = {
  id: string;
  orderNumber: string;
  orderGroupId?: string | null;
  status: unknown;
  paymentStatus?: unknown;
  total: number;
  itemCount?: unknown;
  totalQuantity?: unknown;
  deliveryMethod: unknown;
  deliveryAddress?: unknown;
  pickupDetails?: unknown;
  createdAt: string | Date;
  items?: unknown[];
};

type OrdersTableRow = {
  key: string;
  id: string;
  orderNumber: string;
  orderGroupId: string;
  status: OrderStatus;
  paymentStatus: string;
  total: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo: string;
  createdAt: Date;
  itemCount: number;
  sourceOrder: OrderLike;
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
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

function formatStatusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function OperationsOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderLike | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

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

  const orderList = orders ?? [];
  const selectedOrderStatus = toOrderStatus(selectedOrder?.status);
  const allowedTransitions = useMemo(
    () => STATUS_TRANSITIONS[selectedOrderStatus] ?? [],
    [selectedOrderStatus]
  );

  if (authLoading || (isLoading && !orders)) {
    return <SectionLoader />;
  }

  if (!user?.id) {
    return null;
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
    return null;
  }

  const openStatusModal = (order: OrderLike) => {
    const current = toOrderStatus(order.status);
    const options = STATUS_TRANSITIONS[current] ?? [];
    if (options.length === 0) {
      message.info("No further status transitions are available for this order.");
      return;
    }

    setSelectedOrder(order);
    setNextStatus(options[0] ?? null);
    setStatusNote("");
    setStatusModalOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedOrder || !nextStatus) {
      message.error("Select a valid order status update.");
      return;
    }

    setStatusSaving(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: statusNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update order status");
      }

      message.success("Order status updated successfully.");
      setStatusModalOpen(false);
      setSelectedOrder(null);
      setNextStatus(null);
      setStatusNote("");
      await refresh(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to update order status");
    } finally {
      setStatusSaving(false);
    }
  };

  const tableRows: OrdersTableRow[] = orderList.map((order) => {
    const status = toOrderStatus(order.status);
    const paymentStatus =
      typeof order.paymentStatus === "string" && order.paymentStatus.length > 0
        ? order.paymentStatus
        : "PENDING";

    return {
      key: order.id,
      id: order.id,
      orderNumber: order.orderNumber,
      orderGroupId: order.orderGroupId || "-",
      status,
      paymentStatus,
      total: Number(order.total) || 0,
      deliveryMethod: toDeliveryMethod(order.deliveryMethod),
      deliveryInfo: resolveDeliveryInfo(order) || "-",
      createdAt: new Date(order.createdAt),
      itemCount: resolveItemCount(order),
      sourceOrder: order,
    };
  });

  const columns: ColumnsType<OrdersTableRow> = [
    {
      title: "Order",
      dataIndex: "orderNumber",
      key: "orderNumber",
      sorter: (a: OrdersTableRow, b: OrdersTableRow) =>
        String(a.orderNumber).localeCompare(String(b.orderNumber)),
      render: (_: string, record: OrdersTableRow) => (
        <div>
          <Link href={`/orders/${record.id}`} className="font-semibold text-ds-text-brand hover:underline">
            {record.orderNumber}
          </Link>
          <p className="text-xs text-ds-text-tertiary">Items: {record.itemCount}</p>
        </div>
      ),
    },
    {
      title: "Group",
      dataIndex: "orderGroupId",
      key: "orderGroupId",
      render: (value: string) => <span className="text-xs text-ds-text-secondary">{value}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(OrderStatus).map((status) => ({
        text: formatStatusLabel(status),
        value: status,
      })),
      onFilter: (value: boolean | Key, record: OrdersTableRow) =>
        record.status === String(value),
      render: (value: string) => <Tag>{formatStatusLabel(value)}</Tag>,
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (value: string) => (
        <Tag color={value === "PAID" ? "green" : "orange"}>{formatStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "Delivery",
      dataIndex: "deliveryMethod",
      key: "deliveryMethod",
      render: (_: string, record: OrdersTableRow) => (
        <div>
          <p className="text-sm text-ds-text-primary">{formatStatusLabel(record.deliveryMethod)}</p>
          <p className="text-xs text-ds-text-tertiary">{record.deliveryInfo}</p>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      sorter: (a: OrdersTableRow, b: OrdersTableRow) => a.total - b.total,
      render: (value: number) => `N${value.toLocaleString()}`,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: OrdersTableRow, b: OrdersTableRow) =>
        a.createdAt.getTime() - b.createdAt.getTime(),
      render: (value: Date) => value.toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: OrdersTableRow) => (
        <div className="flex gap-2">
          <Link
            href={`/orders/${record.id}`}
            className="inline-flex items-center rounded-ds-sm border border-ds-border-base px-2 py-1 text-xs text-ds-text-primary"
          >
            View
          </Link>
          <button
            type="button"
            className="rounded-ds-sm border border-ds-border-base px-2 py-1 text-xs text-ds-text-primary"
            onClick={() => openStatusModal(record.sourceOrder)}
          >
            Update Status
          </button>
        </div>
      ),
    },
  ];

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
        <Table
          columns={columns}
          dataSource={tableRows}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1100 }}
        />
      )}

      <Modal
        title="Update Order Status"
        open={statusModalOpen}
        onCancel={() => {
          setStatusModalOpen(false);
          setSelectedOrder(null);
          setNextStatus(null);
          setStatusNote("");
        }}
        onOk={() => void submitStatusUpdate()}
        okButtonProps={{ loading: statusSaving, disabled: !nextStatus }}
      >
        <div className="space-y-3">
          <p className="text-sm text-ds-text-secondary">
            Order: <span className="font-medium text-ds-text-primary">{selectedOrder?.orderNumber}</span>
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-ds-text-secondary">Next status</label>
            <Select
              className="w-full"
              value={nextStatus ?? undefined}
              onChange={(value) => setNextStatus(value as OrderStatus)}
              options={allowedTransitions.map((status) => ({
                value: status,
                label: formatStatusLabel(status),
              }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ds-text-secondary">
              Reason / notes
            </label>
            <Input.TextArea
              rows={4}
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Add reason for this transition (for audit and timeline visibility)."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
