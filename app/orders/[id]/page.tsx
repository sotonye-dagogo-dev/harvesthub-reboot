"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Input } from "antd";
import { emitWalletSync } from "@/lib/utils/walletSync";

type OrderStatusHistoryEntry = {
  id?: string;
  status?: string;
  timestamp?: string;
  note?: string;
};

type OrderTransaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  reference: string;
  description?: string | null;
  createdAt: string;
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  orderGroupId?: string | null;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  total: number;
  createdAt: string;
  statusHistory?: unknown;
  items?: OrderItem[];
  transactions?: OrderTransaction[];
};

type GroupedOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
};

function formatStatusLabel(value?: string): string {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseStatusHistory(input: unknown): OrderStatusHistoryEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => entry as OrderStatusHistoryEntry);
}

export default function OrderDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrderSummary[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Missing order id.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load order.");
      }
      setOrder((data?.order || null) as OrderDetail | null);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    (async () => {
      await loadOrder();
    })();
    return () => undefined;
  }, [loadOrder]);

  useEffect(() => {
    const groupId = order?.orderGroupId;
    if (!groupId) {
      setGroupedOrders([]);
      return;
    }

    let active = true;
    setGroupedLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/orders?groupId=${encodeURIComponent(groupId)}&limit=100`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Unable to load grouped orders.");
        }

        if (active) {
          const next = Array.isArray(data?.orders) ? (data.orders as GroupedOrderSummary[]) : [];
          setGroupedOrders(next);
        }
      } catch {
        if (active) {
          setGroupedOrders([]);
        }
      } finally {
        if (active) {
          setGroupedLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [order?.orderGroupId]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!orderId) return;
    setIsMutating(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to confirm delivery.");
      }

      setActionMessage(data?.message || "Delivery confirmed successfully.");
      emitWalletSync("order-confirm-delivery");
      await loadOrder();
    } catch (confirmError) {
      setActionMessage(
        confirmError instanceof Error ? confirmError.message : "Unable to confirm delivery."
      );
    } finally {
      setIsMutating(false);
    }
  }, [loadOrder, orderId]);

  const handleRefundRequest = useCallback(async () => {
    if (!orderId) return;
    setIsMutating(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/refund/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Buyer requested refund from order detail page." }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to submit refund request.");
      }

      setActionMessage(data?.message || "Refund request submitted.");
      emitWalletSync("order-refund-request");
      await loadOrder();
    } catch (refundError) {
      setActionMessage(
        refundError instanceof Error ? refundError.message : "Unable to submit refund request."
      );
    } finally {
      setIsMutating(false);
    }
  }, [loadOrder, orderId]);

  const handleCancelOrder = useCallback(async () => {
    if (!orderId) return;
    setIsMutating(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to cancel order.");
      }

      setActionMessage("Order cancelled successfully.");
      emitWalletSync("order-cancel");
      setCancelReason("");
      await loadOrder();
    } catch (cancelError) {
      setActionMessage(
        cancelError instanceof Error ? cancelError.message : "Unable to cancel order."
      );
    } finally {
      setIsMutating(false);
    }
  }, [cancelReason, loadOrder, orderId]);

  const handleAdminRefundReview = useCallback(
    async (action: "approve" | "reject") => {
      if (!orderId) return;
      setIsMutating(true);
      setActionMessage(null);

      try {
        const res = await fetch(`/api/orders/${orderId}/refund/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason:
              action === "approve"
                ? "Refund approved from order detail operations view."
                : "Refund rejected from order detail operations view.",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Unable to ${action} refund request.`);
        }

        setActionMessage(data?.message || `Refund ${action}d successfully.`);
        emitWalletSync("order-refund-review");
        await loadOrder();
      } catch (reviewError) {
        setActionMessage(
          reviewError instanceof Error ? reviewError.message : `Unable to ${action} refund request.`
        );
      } finally {
        setIsMutating(false);
      }
    },
    [loadOrder, orderId]
  );

  const handleGroupedAction = useCallback(
    async (action: "CANCEL" | "REFUND_REQUEST") => {
      if (!order?.orderGroupId || groupedOrders.length === 0) return;
      setIsMutating(true);
      setActionMessage(null);

      try {
        const res = await fetch(`/api/orders/group/${order.orderGroupId}/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason:
              action === "CANCEL"
                ? "Grouped cancellation requested from order detail page."
                : "Grouped refund request submitted from order detail page.",
            orderIds: groupedOrders.map((entry) => entry.id),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to perform grouped action.");
        }

        const appliedCount = Number(data?.summary?.applied) || 0;
        const skippedCount = Number(data?.summary?.skipped) || 0;
        setActionMessage(
          `${action === "CANCEL" ? "Grouped cancel" : "Grouped refund request"} completed. Applied: ${appliedCount}, Skipped: ${skippedCount}.`
        );
        emitWalletSync("order-grouped-action");
        await loadOrder();
      } catch (groupError) {
        setActionMessage(
          groupError instanceof Error ? groupError.message : "Unable to perform grouped action."
        );
      } finally {
        setIsMutating(false);
      }
    },
    [groupedOrders, loadOrder, order?.orderGroupId]
  );

  const statusHistory = useMemo(
    () => parseStatusHistory(order?.statusHistory),
    [order?.statusHistory]
  );
  const transactions = useMemo(
    () => (Array.isArray(order?.transactions) ? order.transactions : []),
    [order?.transactions]
  );
  const canBuyerConfirmDelivery =
    user?.role === "BUYER" && order?.status === "DELIVERED" && order?.paymentStatus === "PAID";
  const canBuyerCancelOrder =
    user?.role === "BUYER" && ["PENDING", "CONFIRMED", "PROCESSING"].includes(order?.status || "");
  const canBuyerRequestRefund =
    user?.role === "BUYER" && order?.paymentStatus === "PAID" && order?.status !== "REFUNDED";
  const hasPendingRefund = transactions.some(
    (tx) => tx.type === "REFUND" && tx.status === "PENDING"
  );
  const canAdminReviewRefund = user?.role === "ADMIN" && hasPendingRefund;
  const canRunGroupedActions =
    Boolean(order?.orderGroupId) &&
    groupedOrders.length > 1 &&
    (user?.role === "BUYER" || user?.role === "ADMIN");

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState title="Unable to load order details" description={error} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Order not found"
          description="This order may not exist or you do not have access."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Order #{order.orderNumber}</h1>
          <p className="text-sm text-ds-text-secondary">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{formatStatusLabel(order.status)}</Badge>
          <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>
            Payment: {formatStatusLabel(order.paymentStatus)}
          </Badge>
        </div>
      </div>

      {(canBuyerConfirmDelivery ||
        canBuyerRequestRefund ||
        canAdminReviewRefund ||
        canBuyerCancelOrder) && (
        <Card>
          <div className="space-y-3">
            {canBuyerCancelOrder ? (
              <div className="space-y-2 rounded-ds-md border border-ds-border-base p-3">
                <p className="text-sm text-ds-text-secondary">
                  Cancel is available while your order is pending, confirmed, or processing.
                </p>
                <Input.TextArea
                  rows={3}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Optional cancellation reason"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              {canBuyerCancelOrder && (
                <Button
                  variant="outline"
                  onClick={() => void handleCancelOrder()}
                  disabled={isMutating}
                >
                  Cancel Order
                </Button>
              )}
              {canBuyerConfirmDelivery && (
                <Button onClick={() => void handleConfirmDelivery()} disabled={isMutating}>
                  Confirm Delivery
                </Button>
              )}
              {canBuyerRequestRefund && (
                <Button
                  variant="outline"
                  onClick={() => void handleRefundRequest()}
                  disabled={isMutating}
                >
                  Request Refund
                </Button>
              )}
              {canAdminReviewRefund && (
                <>
                  <Button
                    onClick={() => void handleAdminRefundReview("approve")}
                    disabled={isMutating}
                  >
                    Approve Refund
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleAdminRefundReview("reject")}
                    disabled={isMutating}
                  >
                    Reject Refund
                  </Button>
                </>
              )}
            </div>
            {actionMessage ? (
              <p className="text-sm text-ds-text-secondary">{actionMessage}</p>
            ) : null}
          </div>
        </Card>
      )}

      {order.orderGroupId ? (
        <Card>
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-ds-text-primary">Grouped Checkout</h2>
                <p className="text-xs text-ds-text-secondary">Group ID: {order.orderGroupId}</p>
              </div>
              {canRunGroupedActions ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleGroupedAction("CANCEL")}
                    disabled={isMutating}
                  >
                    Bulk Cancel Eligible
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleGroupedAction("REFUND_REQUEST")}
                    disabled={isMutating}
                  >
                    Bulk Refund Request
                  </Button>
                </div>
              ) : null}
            </div>

            {groupedLoading ? (
              <p className="text-sm text-ds-text-secondary">Loading grouped orders...</p>
            ) : groupedOrders.length === 0 ? (
              <p className="text-sm text-ds-text-secondary">No grouped orders found.</p>
            ) : (
              <div className="space-y-2">
                {groupedOrders.map((groupOrder) => (
                  <div
                    key={groupOrder.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-ds-md border border-ds-border-base p-3"
                  >
                    <div>
                      <p className="font-medium text-ds-text-primary">{groupOrder.orderNumber}</p>
                      <p className="text-xs text-ds-text-secondary">
                        {formatStatusLabel(groupOrder.status)} • Payment:{" "}
                        {formatStatusLabel(groupOrder.paymentStatus)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-ds-text-primary">
                        {formatCurrency(groupOrder.total)}
                      </p>
                      {groupOrder.id !== order.id ? (
                        <Link
                          href={`/orders/${groupOrder.id}`}
                          className="text-xs text-ds-text-brand hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Order Items</h2>
        <div className="mt-4 space-y-3">
          {(order.items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 border-b border-ds-border-base pb-3 last:border-0"
            >
              <div>
                <p className="font-medium text-ds-text-primary">{item.productName}</p>
                <p className="text-xs text-ds-text-secondary">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ds-text-brand">{formatCurrency(item.subtotal)}</p>
                <Link
                  href={`/products/${item.productId}`}
                  className="text-xs text-ds-text-brand hover:underline"
                >
                  View product / Leave review
                </Link>
              </div>
            </div>
          ))}
          <div className="pt-2 text-right">
            <p className="text-sm text-ds-text-secondary">
              Delivery: {formatStatusLabel(order.deliveryMethod)}
            </p>
            <p className="text-xl font-bold text-ds-text-primary">{formatCurrency(order.total)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Order Tracking History</h2>
        {statusHistory.length === 0 ? (
          <p className="mt-3 text-sm text-ds-text-secondary">No tracking events yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {statusHistory.map((entry, index) => (
              <div
                key={entry.id ?? `entry-${index}`}
                className="rounded-ds-md border border-ds-border-base p-3"
              >
                <p className="font-medium text-ds-text-primary">
                  {formatStatusLabel(entry.status)}
                </p>
                <p className="text-xs text-ds-text-secondary">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "No timestamp"}
                </p>
                {entry.note ? (
                  <p className="mt-1 text-sm text-ds-text-secondary">{entry.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Payment / Wallet Audit Trail</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-ds-text-secondary">
            No payment transactions recorded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-ds-md border border-ds-border-base p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ds-text-primary">
                    {formatStatusLabel(tx.type)} • {formatCurrency(tx.amount)}
                  </p>
                  <Badge
                    variant={
                      tx.status === "COMPLETED"
                        ? "success"
                        : tx.status === "FAILED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {formatStatusLabel(tx.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ds-text-secondary">Reference: {tx.reference}</p>
                <p className="text-xs text-ds-text-secondary">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
                {tx.description ? (
                  <p className="mt-1 text-sm text-ds-text-secondary">{tx.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
