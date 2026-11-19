"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Input, Switch, message } from "antd";
import { Button, Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

type AppCurrencyConfig = {
  enabled: boolean;
  name: string;
  symbol: string;
  nairaPerUnit: number;
  minConversion: number;
  maxConversion: number;
  checkoutEnabled: boolean;
};

type Stats = {
  coinsInCirculation: number;
  holders: number;
  totals: Array<{ type: string; count: number; coins: number; naira: number }>;
};

const DEFAULT_CONFIG: AppCurrencyConfig = {
  enabled: false,
  name: "Harvest Coins",
  symbol: "HC",
  nairaPerUnit: 1,
  minConversion: 100,
  maxConversion: 500000,
  checkoutEnabled: true,
};

/**
 * Super-admin controls for the in-app currency (Operations → Settings).
 * Saves independently of the page's main "Save Changes" button.
 */
export function AppCurrencySettingsCard() {
  const [config, setConfig] = useState<AppCurrencyConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/app-currency", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to load in-app currency settings");
      setConfig({ ...DEFAULT_CONFIG, ...json.config });
      setStats(json.stats ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load in-app currency settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof AppCurrencyConfig>(key: K, value: AppCurrencyConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!config.name.trim() || !config.symbol.trim()) {
      setError("Give the currency a name and a symbol.");
      return;
    }
    if (!(config.nairaPerUnit > 0)) {
      setError("The rate must be more than ₦0.");
      return;
    }
    if (config.maxConversion < config.minConversion) {
      setError("The maximum conversion must be at least the minimum.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/app-currency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to save in-app currency settings");
      setConfig({ ...DEFAULT_CONFIG, ...json.config });
      setStats(json.stats ?? null);
      message.success(`${json.config?.name ?? "In-app currency"} settings saved`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save in-app currency settings");
    } finally {
      setSaving(false);
    }
  };

  const conversions = stats?.totals.find((row) => row.type === "CONVERSION");
  const payments = stats?.totals.find((row) => row.type === "PAYMENT");
  const disabled = loading || saving;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">In-App Currency</h2>
        </div>
        <Button size="sm" onClick={() => void handleSave()} loading={saving} disabled={loading}>
          Save currency settings
        </Button>
      </div>
      <p className="mb-4 text-xs text-ds-text-secondary">
        Let people turn naira from their wallet into {config.name || "coins"} and spend them at checkout. Conversions are
        one-way: coins can&apos;t be withdrawn. Vendors are still paid in naira. Changing the rate only affects new
        conversions and payments; refunds return the coins that were originally spent.
      </p>

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "In circulation", value: `${config.symbol} ${stats.coinsInCirculation.toLocaleString("en-NG")}` },
            { label: "Holders", value: stats.holders.toLocaleString("en-NG") },
            { label: "Naira converted", value: formatCurrency(conversions?.naira ?? 0) },
            { label: "Spent at checkout", value: formatCurrency(payments?.naira ?? 0) },
          ].map((tile) => (
            <div key={tile.label} className="rounded-ds-md border border-ds-border-base p-3">
              <p className="text-[11px] uppercase tracking-wide text-ds-text-tertiary">{tile.label}</p>
              <p className="mt-1 text-sm font-semibold text-ds-text-primary">{tile.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 rounded-ds-md bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-ds-md border border-ds-border-base p-4">
          <div>
            <div className="font-medium text-ds-text-primary">Enable in-app currency</div>
            <div className="text-xs text-ds-text-secondary">
              Shows the {config.name || "coin"} wallet and allows conversions. Off by default.
            </div>
          </div>
          <Switch checked={config.enabled} disabled={disabled} onChange={(checked) => update("enabled", checked)} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-ds-md border border-ds-border-base p-4">
          <div>
            <div className="font-medium text-ds-text-primary">Accept at checkout</div>
            <div className="text-xs text-ds-text-secondary">
              Lets buyers pay for orders with {config.name || "coins"}. Turn off to pause spending without hiding balances.
            </div>
          </div>
          <Switch
            checked={config.checkoutEnabled}
            disabled={disabled || !config.enabled}
            onChange={(checked) => update("checkoutEnabled", checked)}
          />
        </div>

        <div className="grid gap-3 rounded-ds-md border border-ds-border-base p-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ds-text-primary">Currency name</span>
            <Input
              value={config.name}
              maxLength={40}
              disabled={disabled}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Harvest Coins"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ds-text-primary">Symbol</span>
            <Input
              value={config.symbol}
              maxLength={8}
              disabled={disabled}
              onChange={(e) => update("symbol", e.target.value)}
              placeholder="HC"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ds-text-primary">Value of 1 {config.symbol || "coin"} (₦)</span>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={config.nairaPerUnit}
              disabled={disabled}
              onChange={(e) => update("nairaPerUnit", Number(e.target.value))}
              prefix="₦"
            />
          </label>
          <div className="text-xs text-ds-text-secondary sm:self-end sm:pb-2">
            ₦1,000 buys {config.symbol || "HC"}{" "}
            {config.nairaPerUnit > 0 ? (Math.round((1000 / config.nairaPerUnit) * 100) / 100).toLocaleString("en-NG") : "—"}
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ds-text-primary">Minimum per conversion (₦)</span>
            <Input
              type="number"
              min={0}
              value={config.minConversion}
              disabled={disabled}
              onChange={(e) => update("minConversion", Number(e.target.value))}
              prefix="₦"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ds-text-primary">Maximum per conversion (₦)</span>
            <Input
              type="number"
              min={0}
              value={config.maxConversion}
              disabled={disabled}
              onChange={(e) => update("maxConversion", Number(e.target.value))}
              prefix="₦"
            />
          </label>
        </div>
      </div>
    </Card>
  );
}

export default AppCurrencySettingsCard;
