"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { PLATFORM_DEFAULTS, COMMISSION_RATES } from "@/lib/constants";
import { Settings, Percent, CreditCard, Calendar, Info } from "lucide-react";
import { Input, Switch, message } from "antd";

export const dynamic = "force-dynamic";

interface CommissionTier {
  id: string;
  label: string;
  rate: number;
  description: string;
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
  {
    id: "church",
    label: "Church Affiliated",
    rate: COMMISSION_RATES.CHURCH_AFFILIATED * 100,
    description: "Special rate for church-affiliated vendors",
  },
];

export default function AdminSettingsPage() {
  const [tiers, setTiers] = useState<CommissionTier[]>(initialTiers);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(PLATFORM_DEFAULTS.PAYMENTS_ENABLED);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT);
  const [maxBookingDays, setMaxBookingDays] = useState<number>(PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS);
  const [isSaving, setIsSaving] = useState(false);

  const handleTierRateChange = (tierId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, rate: numValue } : t)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Mock save — in production this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    message.success("Platform settings saved successfully");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Commission Tiers */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Commission Rates</h2>
        </div>
        <p className="mb-4 text-sm text-ds-text-secondary">
          Set the platform commission rate for each vendor tier. Commissions are deducted from
          vendor earnings on each sale.
        </p>

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

        <div className="mt-4 flex items-start gap-2 rounded-ds-sm bg-ds-surface-sunken p-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-ds-text-tertiary" />
          <p className="text-xs text-ds-text-tertiary">
            Commission rates are applied when a vendor is assigned to a tier. Changes here will
            affect future transactions but not past ones.
          </p>
        </div>
      </Card>

      {/* Payment Processing */}
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
        </div>
      </Card>

      {/* Booking Settings */}
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
