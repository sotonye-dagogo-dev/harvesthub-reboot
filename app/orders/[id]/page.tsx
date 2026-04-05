"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

type OrderStatusHistoryEntry = {
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
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadOrder() {
      if (!orderId) {
        setError("Missing order id.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load order.");
        }
        if (mounted) setOrder((data?.order as OrderDetail | undefined) ?? null);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load order.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrder();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const statusHistory = useMemo(() => parseStatusHistory(order?.statusHistory), [order?.statusHistory]);
  const transactions = useMemo(
    () => (Array.isArray(order?.transactions) ? order.transactions : []),
    [order?.transactions]
  );

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
        <EmptyState title="Order not found" description="This order may not exist or you do not have access." />
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

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Order Items</h2>
        <div className="mt-4 space-y-3">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-ds-border-base pb-3 last:border-0">
              <div>
                <p className="font-medium text-ds-text-primary">{item.productName}</p>
                <p className="text-xs text-ds-text-secondary">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ds-text-brand">{formatCurrency(item.subtotal)}</p>
                <Link href={`/products/${item.productId}`} className="text-xs text-ds-text-brand hover:underline">
                  View product / Leave review
                </Link>
              </div>
            </div>
          ))}
          <div className="pt-2 text-right">
            <p className="text-sm text-ds-text-secondary">Delivery: {formatStatusLabel(order.deliveryMethod)}</p>
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
              <div key={`${entry.timestamp ?? "entry"}-${index}`} className="rounded-ds-md border border-ds-border-base p-3">
                <p className="font-medium text-ds-text-primary">{formatStatusLabel(entry.status)}</p>
                <p className="text-xs text-ds-text-secondary">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "No timestamp"}
                </p>
                {entry.note ? <p className="mt-1 text-sm text-ds-text-secondary">{entry.note}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Payment / Wallet Audit Trail</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-ds-text-secondary">No payment transactions recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-ds-md border border-ds-border-base p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ds-text-primary">
                    {formatStatusLabel(tx.type)} • {formatCurrency(tx.amount)}
                  </p>
                  <Badge variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "danger" : "warning"}>
                    {formatStatusLabel(tx.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ds-text-secondary">Reference: {tx.reference}</p>
                <p className="text-xs text-ds-text-secondary">{new Date(tx.createdAt).toLocaleString()}</p>
                {tx.description ? <p className="mt-1 text-sm text-ds-text-secondary">{tx.description}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
