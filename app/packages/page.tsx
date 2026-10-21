"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, App, Modal, Radio } from "antd";
import { Badge, Button, Card, EmptyState, SectionLoader } from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { emitDataMutated } from "@/lib/data-runtime/mutationBus";
import {
  buildPaystackReference,
  initializePaystackInlinePayment,
} from "@/lib/utils/paystackInline";
import { Check, CreditCard, Package, Sparkles, Wallet as WalletIcon } from "lucide-react";

const PENDING_SUB_KEY = "myharvesthub.packages.pending-sub.v1";

const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

interface PublicPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: unknown;
  sortOrder: number;
}

interface PublicPackagesResponse {
  packages: PublicPackage[];
  subscriptionsEnabled: boolean;
  enforcementLevel: "NONE" | "WARN" | "BLOCK";
}

interface SubscriptionSummary {
  enabled: boolean;
  enforcementLevel: "NONE" | "WARN" | "BLOCK";
  status: "NONE" | "ACTIVE" | "EXPIRED";
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

interface SubscriptionsResponse {
  summary: SubscriptionSummary;
  history: unknown[];
  walletBalance: number;
  walletActive: boolean;
}

interface PaymentsConfigResponse {
  paystackPublicKey: string | null;
  inlinePopupEnabled: boolean;
  paymentsEnabled: boolean;
  gatewayReady: boolean;
}

interface PendingSubRecord {
  reference: string;
  packageId: string;
  savedAt: number;
}

interface PurchaseResult {
  ok: boolean;
  error?: string;
  code?: string;
  message?: string;
}

const toFeatures = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

function readPendingFor(packageId: string): PendingSubRecord | null {
  try {
    const raw = window.localStorage.getItem(PENDING_SUB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingSubRecord>;
    if (
      parsed &&
      typeof parsed.reference === "string" &&
      parsed.reference.length > 0 &&
      parsed.packageId === packageId
    ) {
      return {
        reference: parsed.reference,
        packageId: parsed.packageId,
        savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writePendingRecord(record: PendingSubRecord): void {
  try {
    window.localStorage.setItem(PENDING_SUB_KEY, JSON.stringify(record));
  } catch {
    // localStorage may be unavailable — the purchase can still proceed.
  }
}

function clearPendingRecord(): void {
  try {
    window.localStorage.removeItem(PENDING_SUB_KEY);
  } catch {
    // ignore
  }
}

function PackagesPageInner() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("selected");

  const [selected, setSelected] = useState<PublicPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CARD">("WALLET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoOpenedRef = useRef(false);

  const fetchPackages = useCallback(async (): Promise<PublicPackagesResponse> => {
    const res = await fetch("/api/subscription-packages");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Failed to load subscription packages");
    }
    return {
      packages: Array.isArray(data.packages) ? (data.packages as PublicPackage[]) : [],
      subscriptionsEnabled: Boolean(data.subscriptionsEnabled),
      enforcementLevel: (data.enforcementLevel ?? "NONE") as PublicPackagesResponse["enforcementLevel"],
    };
  }, []);

  const fetchMySubscription = useCallback(async (): Promise<SubscriptionsResponse> => {
    const res = await fetch("/api/subscriptions");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Failed to load your subscription");
    }
    return {
      summary: data.summary as SubscriptionSummary,
      history: Array.isArray(data.history) ? data.history : [],
      walletBalance: typeof data.walletBalance === "number" ? data.walletBalance : 0,
      walletActive: Boolean(data.walletActive),
    };
  }, []);

  const fetchPaymentsConfig = useCallback(async (): Promise<PaymentsConfigResponse> => {
    const res = await fetch("/api/payments/config", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Unable to load payment configuration");
    }
    return {
      paystackPublicKey:
        typeof data.paystackPublicKey === "string" && data.paystackPublicKey.trim().length > 0
          ? data.paystackPublicKey.trim()
          : null,
      inlinePopupEnabled: Boolean(data.inlinePopupEnabled),
      paymentsEnabled: Boolean(data.paymentsEnabled),
      gatewayReady: Boolean(data.gatewayReady),
    };
  }, []);

  const {
    data: packagesData,
    isLoading,
    error,
    refresh: refreshPackages,
  } = useSmartResource(fetchPackages, {
    key: "public-packages",
    staleTimeMs: 15_000,
  });

  const {
    data: mySubscription,
    error: subscriptionError,
    refresh: refreshSubscription,
  } = useSmartResource(fetchMySubscription, {
    key: "my-subscription-public",
    enabled: Boolean(user),
    staleTimeMs: 15_000,
  });

  const { data: paymentsConfig } = useSmartResource(fetchPaymentsConfig, {
    key: "packages-payment-config",
    staleTimeMs: 30_000,
  });

  const packages = useMemo(() => packagesData?.packages ?? [], [packagesData]);
  const subscriptionsEnabled = packagesData?.subscriptionsEnabled ?? true;
  const summary = mySubscription?.summary ?? null;
  const walletBalance = mySubscription?.walletBalance ?? 0;
  const walletActive = mySubscription?.walletActive ?? false;

  const cardReady = Boolean(
    paymentsConfig?.inlinePopupEnabled && paymentsConfig?.paystackPublicKey
  );

  const walletUsableFor = useCallback(
    (pkg: PublicPackage) =>
      Boolean(mySubscription) &&
      walletActive &&
      (pkg.price <= 0 || walletBalance >= pkg.price),
    [mySubscription, walletActive, walletBalance]
  );

  const cardDisabledReason = !paymentsConfig
    ? "Checking card payment availability…"
    : !paymentsConfig.inlinePopupEnabled || !paymentsConfig.paystackPublicKey
      ? "Card payments are unavailable right now — the platform has inline card payment turned off. Pay with your wallet balance instead."
      : null;

  const openPurchase = useCallback(
    (pkg: PublicPackage) => {
      const canWallet = walletUsableFor(pkg);
      setPaymentMethod(canWallet ? "WALLET" : cardReady ? "CARD" : "WALLET");
      setSelected(pkg);
    },
    [walletUsableFor, cardReady]
  );

  // Deep link support: /packages?selected=<slug> opens the purchase modal once
  // (only when the visitor is authenticated and the slug matches a package).
  useEffect(() => {
    if (!user || !selectedSlug || autoOpenedRef.current) return;
    if (!mySubscription && !subscriptionError) return;
    const match = packages.find((pkg) => pkg.slug === selectedSlug);
    if (!match) return;
    autoOpenedRef.current = true;
    openPurchase(match);
  }, [user, selectedSlug, packages, mySubscription, subscriptionError, openPurchase]);

  const previewEndDate = useMemo(() => {
    if (!selected || summary?.status !== "ACTIVE" || !summary.subscription) return null;
    const next = new Date(summary.subscription.expiresAt);
    if (Number.isNaN(next.getTime())) return null;
    next.setDate(next.getDate() + selected.durationDays);
    return next;
  }, [selected, summary]);

  const postSubscription = useCallback(
    async (
      pkg: PublicPackage,
      method: "WALLET" | "CARD",
      reference?: string
    ): Promise<PurchaseResult> => {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod: method,
          ...(reference ? { paymentReference: reference } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        ok: Boolean(res.ok && data?.success),
        error: typeof data?.error === "string" ? data.error : undefined,
        code: typeof data?.code === "string" ? data.code : undefined,
        message: typeof data?.message === "string" ? data.message : undefined,
      };
    },
    []
  );

  const runPaystackPopup = useCallback(
    (pkg: PublicPackage, reference: string): Promise<void> => {
      const publicKey = paymentsConfig?.paystackPublicKey;
      if (!publicKey) {
        return Promise.reject(new Error("Paystack public key is unavailable for card payment."));
      }
      if (!user?.email) {
        return Promise.reject(new Error("Account email is required for card payment."));
      }
      return new Promise<void>((resolve, reject) => {
        initializePaystackInlinePayment({
          key: publicKey,
          email: user.email,
          amount: pkg.price,
          currency: "NGN",
          reference,
          metadata: { source: "packages", packageSlug: pkg.slug },
          onSuccess: () => resolve(),
          onClose: () => reject(new Error("Payment popup closed before completion.")),
        }).catch(reject);
      });
    },
    [paymentsConfig, user]
  );

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;
    const pkg = selected;
    setIsSubmitting(true);
    try {
      let result: PurchaseResult;

      if (paymentMethod === "WALLET") {
        // Persist the reference for WALLET too: if the response is lost after a
        // committed purchase, the retry replays idempotently instead of
        // generating a fresh reference and debiting twice.
        const stored = readPendingFor(pkg.id);
        const walletReference = stored?.reference ?? buildPaystackReference("SUB");
        if (!stored) {
          writePendingRecord({ reference: walletReference, packageId: pkg.id, savedAt: Date.now() });
        }
        result = await postSubscription(pkg, "WALLET", walletReference);
      } else {
        const stored = readPendingFor(pkg.id);
        if (stored) {
          // Retry of the same unpaid attempt — reuse the stored reference so the
          // server can replay idempotently instead of charging twice.
          result = await postSubscription(pkg, "CARD", stored.reference);
          if (!result.ok && result.code === "PAYMENT_NOT_CONFIRMED") {
            await runPaystackPopup(pkg, stored.reference);
            result = await postSubscription(pkg, "CARD", stored.reference);
          }
        } else {
          const reference = buildPaystackReference("SUB");
          writePendingRecord({ reference, packageId: pkg.id, savedAt: Date.now() });
          await runPaystackPopup(pkg, reference);
          result = await postSubscription(pkg, "CARD", reference);
        }
      }

      if (!result.ok) {
        // A price change between attempts makes the stored reference unusable —
        // drop it so the next attempt starts a fresh, correctly-priced attempt.
        if (result.code === "PAYMENT_AMOUNT_MISMATCH" || result.code === "PACKAGE_NOT_FOUND") {
          clearPendingRecord();
        }
        throw new Error(result.error || "Unable to complete subscription purchase");
      }

      clearPendingRecord();
      message.success(result.message || "Subscription activated");
      setSelected(null);
      void refreshPackages(true);
      void refreshSubscription(true);
      emitDataMutated(["subscriptions", "operations-dashboard"]);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to complete subscription purchase"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ctaFor = (pkg: PublicPackage) => {
    if (!user) {
      const fromPath = encodeURIComponent(`/packages?selected=${pkg.slug}`);
      return (
        <div className="flex flex-col gap-2">
          <Link
            href={`/login?from=${fromPath}`}
            className="inline-flex w-full justify-center rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-ds-text-inverse hover:bg-ds-brand-primary-hover"
          >
            Sign in to subscribe
          </Link>
          <Link
            href={`/signup?from=${fromPath}`}
            className="inline-flex w-full justify-center rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-2 text-sm font-medium text-ds-text-primary hover:bg-ds-surface-sunken"
          >
            Create an account
          </Link>
        </div>
      );
    }

    if (user.role === "ADMIN") {
      return (
        <Link href="/operations/subscriptions" className="block">
          <Button variant="outline" fullWidth disabled>
            Managed in Operations
          </Button>
        </Link>
      );
    }

    let label = "Subscribe";
    if (summary?.status === "ACTIVE" && summary.subscription) {
      label =
        summary.subscription.packageSlug === pkg.slug ? "Renew & extend" : "Upgrade";
    } else if (summary?.status === "EXPIRED") {
      label = "Renew";
    }

    return (
      <Button fullWidth onClick={() => openPurchase(pkg)}>
        {label}
      </Button>
    );
  };

  const selectedWalletUsable = selected ? walletUsableFor(selected) : false;
  const selectedCardUsable = cardReady;
  const walletDisabledReason = !mySubscription
    ? "Loading your wallet balance…"
    : !walletActive
      ? "Your wallet is not active yet."
      : selected && walletBalance < selected.price
        ? `Insufficient wallet balance — you have ${formatNaira(walletBalance)} and this package costs ${formatNaira(selected.price)}.`
        : null;
  const canConfirm =
    paymentMethod === "WALLET" ? selectedWalletUsable : selectedCardUsable;

  const body = (() => {
    if (isLoading) {
      return (
        <div className="py-12">
          <SectionLoader />
          <p className="mt-2 text-center text-sm text-ds-text-secondary">
            Loading subscription packages...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Unable to load packages"
          description={String(error)}
        />
      );
    }

    if (!subscriptionsEnabled) {
      return (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Subscription packages are not currently offered"
          description="The platform currently has packages turned off — check back soon."
        />
      );
    }

    if (packages.length === 0) {
      return (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No packages available yet"
          description="The platform has not published any packages right now — check back soon."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => {
          const features = toFeatures(pkg.features);
          return (
            <Card key={pkg.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-ds-text-primary">{pkg.name}</h3>
                <Badge variant="primary">{pkg.durationDays}d</Badge>
              </div>
              <p className="mt-3 text-3xl font-bold text-ds-text-brand">
                {formatNaira(pkg.price)}
                <span className="ml-1 text-sm font-normal text-ds-text-secondary">
                  per {pkg.durationDays} days
                </span>
              </p>
              {pkg.description ? (
                <p className="mt-2 text-sm text-ds-text-secondary">{pkg.description}</p>
              ) : null}
              {features.length > 0 ? (
                <ul className="mt-4 flex-1 space-y-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-ds-text-secondary"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ds-status-success-text" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1" />
              )}
              <div className="mt-6">{ctaFor(pkg)}</div>
            </Card>
          );
        })}
      </div>
    );
  })();

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero */}
      <section className="rounded-ds-lg border border-ds-border-base bg-ds-brand-surface p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-ds-text-brand">
          For vendors
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ds-text-primary sm:text-4xl">
          Sell more with a subscription package
        </h1>
        <p className="mt-3 max-w-2xl text-ds-text-secondary">
          Subscription packages unlock selling access on MyHarvestHub — pick the package that fits
          how you want to sell and get access as soon as your payment lands. Pricing and
          availability are controlled by the platform team, so everything below reflects what is
          currently offered.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-ds-text-secondary">
          <Sparkles className="h-4 w-4 text-ds-text-brand" />
          Packages renew, extend and upgrade without losing any remaining time.
        </div>
      </section>

      <div className="mt-8">{body}</div>

      {user?.role === "VENDOR" ? (
        <div className="mt-8 rounded-ds-md border border-ds-border-base bg-ds-surface-sunken px-4 py-3 text-sm text-ds-text-secondary">
          Already selling?{" "}
          <Link
            href="/operations/subscription"
            className="font-medium text-ds-text-brand hover:underline"
          >
            Manage your subscription
          </Link>
        </div>
      ) : null}

      {/* Purchase modal */}
      <Modal
        title={selected ? `Subscribe to ${selected.name}` : "Subscribe"}
        open={Boolean(selected)}
        onCancel={() => setSelected(null)}
        onOk={() => void handleConfirm()}
        okText={paymentMethod === "WALLET" ? "Pay with Wallet" : "Pay with Card"}
        okButtonProps={{ loading: isSubmitting, disabled: !canConfirm }}
        cancelButtonProps={{ disabled: isSubmitting }}
        destroyOnHidden
        width="min(92vw, 520px)"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3">
              <p className="font-medium text-ds-text-primary">{selected.name}</p>
              <p className="mt-1 text-sm text-ds-text-secondary">
                {formatNaira(selected.price)} for {selected.durationDays} days
              </p>
            </div>

            {summary?.status === "ACTIVE" && summary.subscription ? (
              <Alert
                type="info"
                showIcon
                message={
                  <>
                    Your current {summary.subscription.packageName} subscription runs until{" "}
                    {formatDate(summary.subscription.expiresAt)}. This purchase extends it.
                  </>
                }
                description={
                  previewEndDate ? (
                    <span>
                      New end date (preview): {formatDate(previewEndDate.toISOString())}
                    </span>
                  ) : null
                }
              />
            ) : null}

            {user?.role === "BUYER" ? (
              <p className="text-xs text-ds-text-secondary">
                New to selling? Your subscription activates immediately and applies once you
                register your store — start at{" "}
                <Link
                  href="/become-vendor"
                  className="font-medium text-ds-text-brand hover:underline"
                >
                  Become Vendor
                </Link>
                .
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-ds-text-primary">Payment method</p>
              <Radio.Group
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="flex flex-col gap-2"
              >
                <Radio value="WALLET" disabled={!selectedWalletUsable}>
                  <span className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-ds-text-brand" />
                    Wallet — {formatNaira(walletBalance)}
                    {!walletActive ? " (inactive)" : ""}
                  </span>
                </Radio>
                <Radio value="CARD" disabled={!selectedCardUsable}>
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-ds-text-brand" />
                    Card (Paystack)
                  </span>
                </Radio>
              </Radio.Group>

              {paymentMethod === "WALLET" && walletDisabledReason ? (
                <p className="mt-2 text-xs text-ds-status-warning-text">{walletDisabledReason}</p>
              ) : null}
              {paymentMethod === "CARD" && cardDisabledReason ? (
                <p className="mt-2 text-xs text-ds-status-warning-text">{cardDisabledReason}</p>
              ) : null}
              {!selectedWalletUsable && walletDisabledReason && paymentMethod !== "WALLET" ? (
                <p className="mt-2 text-xs text-ds-text-tertiary">{walletDisabledReason}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16">
          <SectionLoader />
        </div>
      }
    >
      <PackagesPageInner />
    </Suspense>
  );
}
