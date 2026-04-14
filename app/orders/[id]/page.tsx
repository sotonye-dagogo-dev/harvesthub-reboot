"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";

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
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  total: number;
  createdAt: string;
  statusHistory?: unknown;
  items?: OrderItem[];
  transactions?: OrderTransaction[];
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
      await loadOrder();
    } catch (refundError) {
      setActionMessage(
        refundError instanceof Error ? refundError.message : "Unable to submit refund request."
      );
    } finally {
      setIsMutating(false);
    }
  }, [loadOrder, orderId]);

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
  const canBuyerRequestRefund =
    user?.role === "BUYER" && order?.paymentStatus === "PAID" && order?.status !== "REFUNDED";
  const hasPendingRefund = transactions.some(
    (tx) => tx.type === "REFUND" && tx.status === "PENDING"
  );
  const canAdminReviewRefund = user?.role === "ADMIN" && hasPendingRefund;

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

      {(canBuyerConfirmDelivery || canBuyerRequestRefund || canAdminReviewRefund) && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
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
            {actionMessage ? (
              <p className="text-sm text-ds-text-secondary">{actionMessage}</p>
            ) : null}
          </div>
        </Card>
      )}

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
