"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  PLATFORM_DEFAULTS,
  COMMISSION_RATES,
  VENDOR_CATEGORIES,
  CATEGORY_COMMISSION_DEFAULTS,
} from "@/lib/constants";
import {
  Settings,
  Percent,
  CreditCard,
  Calendar,
  Clock3,
  Info,
  Tag,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Input, Switch, message, Tabs } from "antd";

export const dynamic = "force-dynamic";

interface CommissionTier {
  id: string;
  label: string;
  rate: number;
  description: string;
}

interface CategoryRate {
  category: string;
  label: string;
  rate: number;
}

interface AdminPaymentConfig {
  gateway: "PAYSTACK";
  mode: "test" | "live";
  paymentsEnabled: boolean;
  paystack: {
    mode: "test" | "live";
    callbackUrl: string | null;
    dashboardWebhookUrl: string;
    keyStatus: {
      publicKeyConfigured: boolean;
      secretKeyConfigured: boolean;
      webhookSecretConfigured: boolean;
    };
    webhooksEnabled: boolean;
    whitelistIps: readonly string[];
  };
  fallback: {
    bankTransferEnabled: boolean;
  };
}

interface CommerceLifecycleConfig {
  autoConfirmEnabled: boolean;
  autoConfirmHours: number;
  refundWindowHours: number;
}

const initialTiers: CommissionTier[] = [
  {
    id: "default",
    label: "Default",
    rate: COMMISSION_RATES.DEFAULT * 100,
    description: "Standard commission rate for all vendors",
  },
  {
    id: "premium",
    label: "Premium Vendor",
    rate: COMMISSION_RATES.PREMIUM_VENDOR * 100,
    description: "Reduced rate for verified premium vendors",
  },
];

const initialCategoryRates: CategoryRate[] = VENDOR_CATEGORIES.map((vc) => ({
  category: vc.value,
  label: vc.label,
  rate: (CATEGORY_COMMISSION_DEFAULTS[vc.value] ?? COMMISSION_RATES.DEFAULT) * 100,
}));

export default function OperationsSettingsPage() {
  const tiers: CommissionTier[] = initialTiers;
  const [categoryRates, setCategoryRates] = useState<CategoryRate[]>(initialCategoryRates);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(
    PLATFORM_DEFAULTS.PAYMENTS_ENABLED
  );
  const minOrderAmount = PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT;
  const maxBookingDays = PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS;
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig | null>(null);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState<boolean>(true);
  const [commissionConfigLoading, setCommissionConfigLoading] = useState<boolean>(true);
  const [commerceLifecycleConfig, setCommerceLifecycleConfig] = useState<CommerceLifecycleConfig>({
    autoConfirmEnabled: true,
    autoConfirmHours: 48,
    refundWindowHours: 72,
  });
  const [commerceConfigLoading, setCommerceConfigLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPaymentConfig = async () => {
      setPaymentConfigLoading(true);
      try {
        const res = await fetch("/api/admin/payments/config", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load payment gateway config");
        }

        if (active) {
          setPaymentConfig({
            gateway: data.gateway,
            mode: data.mode,
            paymentsEnabled: Boolean(data.paymentsEnabled),
            paystack: data.paystack,
            fallback: data.fallback,
          } as AdminPaymentConfig);
          setPaymentsEnabled(Boolean(data.paymentsEnabled));
        }
      } catch (error) {
        if (active) {
          setPaymentConfig(null);
          message.error(
            error instanceof Error ? error.message : "Unable to load payment gateway config"
          );
        }
      } finally {
        if (active) {
          setPaymentConfigLoading(false);
        }
      }
    };

    void loadPaymentConfig();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCommerceConfig = async () => {
      setCommerceConfigLoading(true);
      try {
        const res = await fetch("/api/admin/commerce-config", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.config) {
          throw new Error(data?.error || "Unable to load commerce lifecycle settings");
        }

        if (active) {
          setCommerceLifecycleConfig({
            autoConfirmEnabled: Boolean(data.config.autoConfirmEnabled),
            autoConfirmHours: Number(data.config.autoConfirmHours) || 48,
            refundWindowHours: Number(data.config.refundWindowHours) || 72,
          });
        }
      } catch (error) {
        if (active) {
          message.error(
            error instanceof Error
              ? error.message
              : "Unable to load commerce lifecycle settings"
          );
        }
      } finally {
        if (active) {
          setCommerceConfigLoading(false);
        }
      }
    };

    void loadCommerceConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleCategoryRateChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setCategoryRates((prev) =>
      prev.map((cr) => (cr.category === category ? { ...cr, rate: numValue } : cr))
    );
  };

  useEffect(() => {
    let active = true;

    const loadCommissionConfig = async () => {
      setCommissionConfigLoading(true);
      try {
        const res = await fetch("/api/admin/commission", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !Array.isArray(data?.commissionConfigs)) {
          throw new Error(data?.error || "Unable to load commission defaults");
        }

        if (active) {
          const categoryLabelByValue = new Map<string, string>(
            VENDOR_CATEGORIES.map((entry) => [entry.value, entry.label])
          );
          setCategoryRates(
            data.commissionConfigs
              .filter(
                (entry: unknown): entry is { category: string; rate: number } =>
                  Boolean(entry) &&
                  typeof (entry as { category?: unknown }).category === "string" &&
                  typeof (entry as { rate?: unknown }).rate === "number"
              )
              .map((entry: { category: string; rate: number }) => ({
                category: entry.category,
                label: categoryLabelByValue.get(entry.category) ?? entry.category,
                rate: Math.round(entry.rate * 1000) / 10,
              }))
          );
        }
      } catch (error) {
        if (active) {
          message.error(error instanceof Error ? error.message : "Unable to load commission defaults");
        }
      } finally {
        if (active) {
          setCommissionConfigLoading(false);
        }
      }
    };

    void loadCommissionConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    let commissionSaved = false;
    let lifecycleSaved = false;

    try {
      const commissionRes = await fetch("/api/admin/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: categoryRates.map((entry) => ({
            category: entry.category,
            rate: entry.rate / 100,
          })),
        }),
      });

      const commissionData = await commissionRes.json().catch(() => ({}));
      if (!commissionRes.ok || !commissionData?.success) {
        throw new Error(commissionData?.error || "Unable to save commission defaults");
      }
      commissionSaved = true;

      const commerceRes = await fetch("/api/admin/commerce-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoConfirmEnabled: commerceLifecycleConfig.autoConfirmEnabled,
          autoConfirmHours: commerceLifecycleConfig.autoConfirmHours,
          refundWindowHours: commerceLifecycleConfig.refundWindowHours,
        }),
      });

      const commerceData = await commerceRes.json().catch(() => ({}));
      if (!commerceRes.ok || !commerceData?.success || !commerceData?.config) {
        throw new Error(commerceData?.error || "Unable to save commerce lifecycle settings");
      }
      lifecycleSaved = true;

      setCommerceLifecycleConfig({
        autoConfirmEnabled: Boolean(commerceData.config.autoConfirmEnabled),
        autoConfirmHours: Number(commerceData.config.autoConfirmHours) || 48,
        refundWindowHours: Number(commerceData.config.refundWindowHours) || 72,
      });

      message.success("Commission and lifecycle settings saved successfully");
    } catch (error) {
      if (commissionSaved || lifecycleSaved) {
        message.warning(
          error instanceof Error
            ? `Partially saved settings. ${error.message}`
            : "Partially saved settings."
        );
      } else {
        message.error(
          error instanceof Error ? error.message : "Unable to save platform settings"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Platform Settings</h1>
          <p className="mt-1 text-sm text-ds-text-secondary">
            Manage commission rates, payment processing, and platform configuration
          </p>
        </div>
        <Button onClick={handleSave} loading={isSaving}>
          <Settings className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Commission Rates</h2>
        </div>
        <p className="mb-4 text-sm text-ds-text-secondary">
          Set the platform commission rate for each vendor tier and category. Commissions are
          deducted from vendor earnings on each sale.
        </p>

        <Tabs
          defaultActiveKey="tiers"
          items={[
            {
              key: "tiers",
              label: "Vendor Tiers",
              children: (
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-ds-text-primary">{tier.label}</div>
                        <div className="text-xs text-ds-text-secondary">{tier.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={tier.rate}
                          disabled
                          className="!w-24"
                          suffix="%"
                        />
                        <span className="text-xs text-ds-text-tertiary">
                          ({formatCurrency(1000)} sale → {formatCurrency(1000 * (tier.rate / 100))}{" "}
                          commission)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: "categories",
              label: "Category Defaults",
              children: (
                <div className="space-y-3">
                  {commissionConfigLoading ? (
                    <p className="text-xs text-ds-text-secondary">Loading category commission defaults...</p>
                  ) : null}
                  <p className="text-xs text-ds-text-secondary">
                    Default commission rate applied to new vendors in each category. Individual
                    vendor rates can still be overridden.
                  </p>
                  {categoryRates.map((cr) => (
                    <div
                      key={cr.category}
                      className="flex items-center justify-between rounded-ds-md border border-ds-border-base px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-ds-text-tertiary" />
                        <span className="text-sm font-medium text-ds-text-primary">{cr.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={cr.rate}
                          onChange={(e) => handleCategoryRateChange(cr.category, e.target.value)}
                          className="!w-24"
                          suffix="%"
                        />
                        <span className="text-xs text-ds-text-tertiary">
                          ({formatCurrency(1000)} → {formatCurrency(1000 * (cr.rate / 100))})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />

        <div className="mt-4 flex items-start gap-2 rounded-ds-sm bg-ds-surface-sunken p-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-ds-text-tertiary" />
          <p className="text-xs text-ds-text-tertiary">
            Vendor tier rates take precedence over category defaults. Changes here will affect
            future transactions but not past ones.
          </p>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Payment Processing</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-ds-md border border-ds-border-base p-4">
            <div>
              <div className="font-medium text-ds-text-primary">Enable Payment Processing</div>
              <div className="text-xs text-ds-text-secondary">
                Payments are enabled automatically when active-mode Paystack keys are configured.
              </div>
            </div>
            <Switch checked={paymentsEnabled} disabled />
          </div>

          {!paymentsEnabled && (
            <div className="flex items-start gap-3 rounded-ds-md border border-ds-status-warning/30 bg-ds-status-warning-bg p-4">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-status-warning" />
              <div>
                <p className="text-sm font-medium text-ds-status-warning-text">
                  Payment processing is currently disabled
                </p>
                <p className="mt-1 text-xs text-ds-text-secondary">
                  Buyers will see a notice at checkout and wallet pages. Orders can still be placed
                  but payment will be pending.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-ds-text-primary">Minimum Order Amount</div>
              <div className="text-xs text-ds-text-secondary">
                Minimum cart value required to place an order (runtime default, read-only)
              </div>
            </div>
            <Input
              type="number"
              min={0}
              step={100}
              value={minOrderAmount}
              disabled
              prefix="₦"
              className="!w-36"
            />
          </div>

          <div className="rounded-ds-md border border-ds-border-base p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ds-text-primary">
                  Paystack Gateway Panel
                </h3>
                <p className="text-xs text-ds-text-secondary">
                  Environment-driven status and dashboard setup guidance for payment operations.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  paymentConfig?.mode === "live"
                    ? "bg-ds-status-error-bg text-ds-status-error"
                    : "bg-ds-status-info-bg text-ds-status-info"
                }`}
              >
                {paymentConfigLoading
                  ? "Checking..."
                  : paymentConfig?.mode === "live"
                    ? "LIVE MODE"
                    : "TEST MODE"}
              </span>
            </div>

            {paymentConfigLoading ? (
              <p className="text-xs text-ds-text-secondary">
                Loading payment gateway configuration...
              </p>
            ) : paymentConfig ? (
              <div className="space-y-3">
                <div className="grid gap-2 text-xs text-ds-text-secondary sm:grid-cols-2">
                  <p>
                    Public key configured:{" "}
                    {paymentConfig.paystack.keyStatus.publicKeyConfigured ? "Yes" : "No"}
                  </p>
                  <p>
                    Secret key configured:{" "}
                    {paymentConfig.paystack.keyStatus.secretKeyConfigured ? "Yes" : "No"}
                  </p>
                  <p>Webhooks enabled: {paymentConfig.paystack.webhooksEnabled ? "Yes" : "No"}</p>
                  <p>
                    Webhook signing secret configured:{" "}
                    {paymentConfig.paystack.keyStatus.webhookSecretConfigured ? "Yes" : "No"}
                  </p>
                </div>

                <div className="rounded-ds-sm bg-ds-surface-sunken p-3 text-xs text-ds-text-secondary">
                  <p>
                    Callback URL (mode-aware):{" "}
                    {paymentConfig.paystack.callbackUrl || "Not set in env"}
                  </p>
                  <p className="mt-1">
                    Webhook URL for dashboard: {paymentConfig.paystack.dashboardWebhookUrl}
                  </p>
                  <p className="mt-1">
                    IP whitelist: {paymentConfig.paystack.whitelistIps.join(", ")}
                  </p>
                </div>

                {paymentConfig.mode === "test" ? (
                  <div className="rounded-ds-sm border border-ds-status-info-border bg-ds-status-info-bg p-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-ds-status-info" />
                      <div>
                        <p className="text-xs font-semibold text-ds-status-info-text">
                          Test mode behavior (safe for QA)
                        </p>
                        <p className="mt-1 text-xs text-ds-text-secondary">
                          No real money moves in Paystack test mode. Charges and refunds are
                          simulated for integration testing only, so no actual bank transfer should
                          occur.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-ds-sm border border-ds-status-warning/30 bg-ds-status-warning-bg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-ds-status-warning" />
                      <div>
                        <p className="text-xs font-semibold text-ds-status-warning-text">
                          Live mode behavior (real transactions)
                        </p>
                        <p className="mt-1 text-xs text-ds-text-secondary">
                          Real money will be charged in live mode. Confirm dashboard
                          callback/webhook URLs and keys before enabling this in production.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-ds-status-warning-text">
                Payment gateway configuration is unavailable right now. Confirm admin auth and API
                health.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Order Lifecycle Settings</h2>
        </div>

        {commerceConfigLoading ? (
          <p className="text-sm text-ds-text-secondary">Loading lifecycle settings...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-ds-md border border-ds-border-base p-4">
              <div>
                <div className="font-medium text-ds-text-primary">Enable Auto-Confirmation</div>
                <div className="text-xs text-ds-text-secondary">
                  Automatically release settlement after the configured delivery window.
                </div>
              </div>
              <Switch
                checked={commerceLifecycleConfig.autoConfirmEnabled}
                onChange={(checked) =>
                  setCommerceLifecycleConfig((prev) => ({
                    ...prev,
                    autoConfirmEnabled: checked,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-ds-text-primary">Auto-Confirm Delivery Window</div>
                <div className="text-xs text-ds-text-secondary">
                  Hours after DELIVERED status before automatic buyer confirmation.
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={240}
                value={commerceLifecycleConfig.autoConfirmHours}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 240) {
                    setCommerceLifecycleConfig((prev) => ({
                      ...prev,
                      autoConfirmHours: val,
                    }));
                  }
                }}
                suffix="hours"
                className="!w-36"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-ds-text-primary">Refund Request Window</div>
                <div className="text-xs text-ds-text-secondary">
                  Hours after delivery during which buyers can initiate refunds.
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={720}
                value={commerceLifecycleConfig.refundWindowHours}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 720) {
                    setCommerceLifecycleConfig((prev) => ({
                      ...prev,
                      refundWindowHours: val,
                    }));
                  }
                }}
                suffix="hours"
                className="!w-36"
              />
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Service & Booking Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-ds-text-primary">Maximum Booking Advance (Days)</div>
              <div className="text-xs text-ds-text-secondary">
                How far in advance buyers can book service appointments (runtime default, read-only)
              </div>
            </div>
            <Input
              type="number"
              min={7}
              max={365}
              value={maxBookingDays}
              disabled
              suffix="days"
              className="!w-32"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
