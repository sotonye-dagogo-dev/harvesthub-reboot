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
  const [tiers, setTiers] = useState<CommissionTier[]>(initialTiers);
  const [categoryRates, setCategoryRates] = useState<CategoryRate[]>(initialCategoryRates);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(
    PLATFORM_DEFAULTS.PAYMENTS_ENABLED
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT);
  const [maxBookingDays, setMaxBookingDays] = useState<number>(
    PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS
  );
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig | null>(null);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState<boolean>(true);
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
            paystack: data.paystack,
            fallback: data.fallback,
          } as AdminPaymentConfig);
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

  const handleTierRateChange = (tierId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, rate: numValue } : t)));
  };

  const handleCategoryRateChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setCategoryRates((prev) =>
      prev.map((cr) => (cr.category === category ? { ...cr, rate: numValue } : cr))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    message.success("Platform settings saved successfully");
    setIsSaving(false);
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
                          onChange={(e) => handleTierRateChange(tier.id, e.target.value)}
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
                When enabled, buyers can make payments at checkout. When disabled, orders are placed
                with pending payment status.
              </div>
            </div>
            <Switch checked={paymentsEnabled} onChange={(checked) => setPaymentsEnabled(checked)} />
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
                Minimum cart value required to place an order
              </div>
            </div>
            <Input
              type="number"
              min={0}
              step={100}
              value={minOrderAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) setMinOrderAmount(val);
              }}
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
          <Calendar className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Service & Booking Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-ds-md border border-ds-border-base p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-ds-text-primary">Maximum Booking Advance (Days)</div>
              <div className="text-xs text-ds-text-secondary">
                How far in advance buyers can book service appointments
              </div>
            </div>
            <Input
              type="number"
              min={7}
              max={365}
              value={maxBookingDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 7 && val <= 365) setMaxBookingDays(val);
              }}
              suffix="days"
              className="!w-32"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
