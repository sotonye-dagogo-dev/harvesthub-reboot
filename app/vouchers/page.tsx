"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Ticket, CheckCircle, Clock } from "lucide-react";

interface VoucherRedemption {
  id: string;
  voucherId: string;
  orderId?: string | null;
  discountApplied: number;
  redeemedAt: string;
  voucher: {
    id: string;
    code: string;
    type: string;
    value: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
  };
}

interface AvailableVoucher {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  validFrom: string;
  validTo: string;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  userUsedCount: number;
}

interface MyVouchersResponse {
  available: AvailableVoucher[];
  redemptions: VoucherRedemption[];
}

function VoucherStatusBadge({ voucher }: { voucher: AvailableVoucher }) {
  const now = new Date();
  const validTo = new Date(voucher.validTo);
  const remaining = voucher.usageLimit ? voucher.usageLimit - voucher.usedCount : null;
  const userMaxed = voucher.userUsedCount >= voucher.perUserLimit;

  if (userMaxed) return <Badge variant="danger">Used</Badge>;
  if (validTo < now) return <Badge variant="warning">Expired</Badge>;
  if (remaining !== null && remaining <= 0) return <Badge variant="danger">Exhausted</Badge>;
  return <Badge variant="success">Available</Badge>;
}

export default function MyVouchersPage() {
  const { user } = useAuth();

  const fetchMyVouchers = useCallback(async (): Promise<MyVouchersResponse> => {
    const res = await fetch("/api/vouchers/my", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to load vouchers");
    return data as MyVouchersResponse;
  }, []);

  const { data, isLoading, error } = useSmartResource(fetchMyVouchers, {
    key: `my-vouchers:${user?.id ?? "guest"}`,
    enabled: Boolean(user?.id),
    refreshIntervalMs: 120_000,
    staleTimeMs: 30_000,
  });

  const available = data?.available ?? [];
  const redemptions = data?.redemptions ?? [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState title="Sign in to view your vouchers" description="You must be logged in to see your available vouchers and redemption history." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ds-text-primary sm:text-3xl">
          <Ticket className="h-7 w-7 text-ds-text-brand" />
          My Vouchers &amp; Coupons
        </h1>
        <p className="mt-1 text-sm text-ds-text-secondary">
          View your available vouchers and redemption history.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-ds-text-secondary">Loading vouchers...</p>
        </div>
      ) : error ? (
        <div className="rounded-ds-md border border-ds-status-error-border bg-ds-status-error-bg p-4 text-ds-status-error-text">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Available Vouchers */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
              Available Vouchers ({available.length})
            </h2>
            {available.length === 0 ? (
              <EmptyState
                icon={<Ticket className="h-12 w-12" />}
                title="No vouchers available"
                description="Check back later or look out for promotions."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((v) => {
                  const discountLabel =
                    v.type === "PERCENTAGE" ? `${v.value}% off` : `₦${v.value} off`;
                  const minOrder = v.minOrderAmount ? `Min. order: ${formatCurrency(Number(v.minOrderAmount))}` : null;
                  const maxDisc = v.maxDiscount ? `Max discount: ${formatCurrency(Number(v.maxDiscount))}` : null;
                  const expiryDate = new Date(v.validTo).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });

                  return (
                    <Card key={v.id} className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-lg font-bold text-ds-text-brand">{v.code}</p>
                          <p className="text-sm font-medium text-ds-text-primary">{discountLabel}</p>
                        </div>
                        <VoucherStatusBadge voucher={v} />
                      </div>
                      <div className="space-y-0.5 text-xs text-ds-text-secondary">
                        {minOrder && <p>{minOrder}</p>}
                        {maxDisc && <p>{maxDisc}</p>}
                        <p className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Expires {expiryDate}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Redemption History */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">
              Redemption History ({redemptions.length})
            </h2>
            {redemptions.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12" />}
                title="No redemptions yet"
                description="Applied vouchers at checkout will appear here."
              />
            ) : (
              <div className="overflow-x-auto rounded-ds-md border border-ds-border-base">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ds-border-base bg-ds-surface-sunken">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Discount Applied</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((r) => (
                      <tr key={r.id} className="border-b border-ds-border-base last:border-0 hover:bg-ds-surface-sunken">
                        <td className="px-4 py-3 font-mono font-medium text-ds-text-brand">{r.voucher.code}</td>
                        <td className="px-4 py-3 text-ds-status-success-text">{formatCurrency(r.discountApplied)}</td>
                        <td className="px-4 py-3 text-ds-text-secondary">{r.orderId ?? "—"}</td>
                        <td className="px-4 py-3 text-ds-text-secondary">
                          {new Date(r.redeemedAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
