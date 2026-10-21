"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Alert } from "antd";
import { CreditCard, RefreshCw } from "lucide-react";
import { Badge, Card, EmptyState, SectionLoader, StatusTag } from "@/components/ui";
import { useSmartResource } from "@/lib/hooks/useSmartResource";

const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

type SubscriptionStatus = "NONE" | "ACTIVE" | "EXPIRED";
type EnforcementLevel = "NONE" | "WARN" | "BLOCK";

interface SubscriptionSummary {
  enabled: boolean;
  enforcementLevel: EnforcementLevel;
  status: SubscriptionStatus;
  subscription: {
    id: string;
    packageId: string;
    packageName: string;
    packageSlug: string;
    amount: number;
    paymentMethod: string;
    startAt: string;
    expiresAt: string;
  } | null;
  daysRemaining: number | null;
  expiringSoon: boolean;
  blocked: boolean;
}

interface HistoryItem {
  id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  amount: number;
  paymentMethod: string;
  paymentReference: string | null;
  startAt: string;
  expiresAt: string;
  createdAt: string;
  package: { id: string; name: string; slug: string; durationDays: number };
}

interface SubscriptionsResponse {
  summary: SubscriptionSummary;
  history: HistoryItem[];
  walletBalance: number;
  walletActive: boolean;
}

const HISTORY_STATUS_COLORS: Record<HistoryItem["status"], string> = {
  ACTIVE: "green",
  EXPIRED: "red",
  CANCELLED: "default",
  PENDING: "gold",
};

export default function MySubscriptionPage() {
  const fetchSubscription = useCallback(async (): Promise<SubscriptionsResponse> => {
    const res = await fetch("/api/subscriptions");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Failed to load your subscription");
    }
    return {
      summary: data.summary as SubscriptionSummary,
      history: Array.isArray(data.history) ? (data.history as HistoryItem[]) : [],
      walletBalance: typeof data.walletBalance === "number" ? data.walletBalance : 0,
      walletActive: Boolean(data.walletActive),
    };
  }, []);

  const { data, isLoading, error, refresh } = useSmartResource(fetchSubscription, {
    key: "my-subscription",
    staleTimeMs: 15_000,
  });

  const summary = data?.summary ?? null;
  const history = data?.history ?? [];

  const statusTag = (() => {
    if (!summary) return null;
    if (summary.status === "ACTIVE") {
      return <StatusTag domain="payment" status="ACTIVE" color="green" label="Active" />;
    }
    if (summary.status === "EXPIRED") {
      return <StatusTag domain="payment" status="EXPIRED" color="red" label="Expired" />;
    }
    return (
      <StatusTag domain="payment" status="NONE" color="default" label="No subscription" />
    );
  })();

  const ctaLabel =
    summary?.status === "NONE" || !summary ? "Browse packages" : "Renew or upgrade";

  const expiredNotice = (() => {
    if (summary?.status !== "EXPIRED" || !summary.subscription) return null;
    const blockedHint =
      summary.enforcementLevel === "BLOCK"
        ? " New listings are blocked until you renew."
        : " Renew whenever you are ready to resume full selling access.";
    return (
      <Alert
        type="error"
        showIcon
        message={
          <>
            Your subscription expired on {formatDate(summary.subscription.expiresAt)}.{blockedHint}
          </>
        }
      />
    );
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ds-text-primary">
            <RefreshCw className="h-7 w-7 text-ds-text-brand" />
            My Subscription
          </h1>
          <p className="mt-1 text-ds-text-secondary">
            Track your vendor package, renewal window and purchase history.
          </p>
          {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
        </div>
        <Link
          href="/packages"
          className="inline-flex rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-ds-text-inverse hover:bg-ds-brand-primary-hover"
        >
          {ctaLabel}
        </Link>
      </div>

      {summary && !summary.enabled ? (
        <Alert
          type="info"
          showIcon
          message="Subscription packages are currently turned off by the platform. Your selling access is unaffected."
        />
      ) : null}

      {isLoading && !data ? (
        <Card>
          <SectionLoader />
          <p className="mt-2 text-center text-sm text-ds-text-secondary">
            Loading your subscription...
          </p>
        </Card>
      ) : !summary ? (
        <Card>
          <EmptyState
            icon={<RefreshCw className="h-12 w-12" />}
            title={error ? "Unable to load subscription" : "No subscription information"}
            description={error || "We could not find a subscription for your account yet."}
          />
        </Card>
      ) : (
        <>
          {/* Status card */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ds-text-secondary">Current status</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {statusTag}
                  {summary.subscription ? (
                    <span className="font-medium text-ds-text-primary">
                      {summary.subscription.packageName}
                    </span>
                  ) : null}
                </div>
                {summary.subscription ? (
                  <p className="mt-3 text-2xl font-bold text-ds-text-primary">
                    {formatNaira(summary.subscription.amount)}
                  </p>
                ) : null}
                {summary.status === "ACTIVE" && summary.subscription ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-ds-text-secondary">
                      Active until {formatDate(summary.subscription.expiresAt)}
                    </p>
                    {typeof summary.daysRemaining === "number" ? (
                      <Badge variant={summary.expiringSoon ? "warning" : "success"}>
                        {summary.daysRemaining} day
                        {summary.daysRemaining === 1 ? "" : "s"} remaining
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
                {summary.status === "EXPIRED" && summary.subscription ? (
                  <p className="mt-3 text-sm text-ds-text-secondary">
                    Expired on {formatDate(summary.subscription.expiresAt)}
                  </p>
                ) : null}
              </div>
              <Link
                href="/packages"
                className="inline-flex rounded-ds-md border border-ds-border-brand bg-ds-surface-base px-4 py-2 text-sm font-medium text-ds-text-brand hover:bg-ds-brand-surface"
              >
                {ctaLabel}
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {summary.status === "ACTIVE" && summary.expiringSoon ? (
                <Alert
                  type="warning"
                  showIcon
                  message={`Expiring in ${summary.daysRemaining ?? 0} day${
                    (summary.daysRemaining ?? 0) === 1 ? "" : "s"
                  } — renew to avoid interruption.`}
                />
              ) : null}
              {expiredNotice}
              {summary.status === "NONE" ? (
                <Alert
                  type="info"
                  showIcon
                  message="You don't have an active subscription yet."
                />
              ) : null}
            </div>
          </Card>

          {/* Purchase history */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Purchase history
            </h2>
            {history.length === 0 ? (
              <EmptyState
                title="No purchases yet"
                description="Your subscription purchases will appear here once you subscribe."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ds-border-base bg-ds-surface-sunken">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Package
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ds-text-secondary">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-ds-border-base last:border-0 hover:bg-ds-surface-sunken"
                      >
                        <td className="px-4 py-3 text-xs text-ds-text-secondary">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-ds-text-primary">
                          {item.package?.name ?? "Package"}
                          <p className="text-xs text-ds-text-tertiary">
                            {item.package?.durationDays ?? 0} days
                          </p>
                        </td>
                        <td className="px-4 py-3 text-ds-text-primary">
                          {formatNaira(item.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-ds-text-secondary">
                            <CreditCard className="h-3.5 w-3.5" />
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusTag
                            domain="payment"
                            status={item.status}
                            color={HISTORY_STATUS_COLORS[item.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-ds-text-secondary">
                          {formatDate(item.expiresAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs text-ds-text-tertiary">
              Payments are captured securely via Paystack or your wallet balance.
            </p>
          </Card>
        </>
      )}

      {!isLoading && !error && summary ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void refresh(true)}
            className="text-xs text-ds-text-tertiary hover:text-ds-text-brand"
          >
            Refresh subscription status
          </button>
        </div>
      ) : null}
    </div>
  );
}
