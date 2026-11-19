"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Coins, Gift, RotateCcw, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { message } from "antd";
import { emitWalletSync, subscribeWalletSync } from "@/lib/utils/walletSync";
import { cn, formatCurrency } from "@/lib/utils";

type CoinType = "CONVERSION" | "PAYMENT" | "REFUND" | "REWARD" | "REWARD_REVERSAL" | "ADJUSTMENT";

type AppCurrencyConfig = {
  enabled: boolean;
  name: string;
  symbol: string;
  nairaPerUnit: number;
  minConversion: number;
  maxConversion: number;
  checkoutEnabled: boolean;
};

type CoinEntry = {
  id: string;
  type: CoinType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  nairaValue: number;
  description: string;
  createdAt: string;
};

type CurrencyResponse = {
  config: AppCurrencyConfig;
  coinBalance: number;
  coinBalanceNairaValue: number;
  nairaBalance: number;
  transactions: CoinEntry[];
};

const CREDIT_TYPES: CoinType[] = ["CONVERSION", "REFUND", "REWARD"];

const TYPE_META: Record<CoinType, { label: string; icon: typeof Coins }> = {
  CONVERSION: { label: "Converted", icon: ArrowRightLeft },
  PAYMENT: { label: "Spent", icon: ShoppingBag },
  REFUND: { label: "Refunded", icon: RotateCcw },
  REWARD: { label: "Reward", icon: Gift },
  REWARD_REVERSAL: { label: "Reward reversed", icon: RotateCcw },
  ADJUSTMENT: { label: "Adjustment", icon: SlidersHorizontal },
};

function formatCoins(value: number, symbol: string) {
  return `${symbol} ${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function newIdempotencyKey() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

interface AppCurrencyCardProps {
  className?: string;
  /** Naira available to convert (from the wallet page) — used for the quick "max" fill */
  nairaBalance?: number;
}

/**
 * In-app currency panel on the wallet page: coin balance, naira → coin conversion and coin history.
 * Hidden entirely when the super admin has the currency switched off and the user holds no coins.
 */
export function AppCurrencyCard({ className, nairaBalance }: AppCurrencyCardProps) {
  const [data, setData] = useState<CurrencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/currency?limit=15", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const json = (await res.json()) as CurrencyResponse;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return subscribeWalletSync(() => void load());
  }, [load]);

  const config = data?.config;
  const parsedAmount = Number(amount);
  const previewCoins = useMemo(() => {
    if (!config || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return 0;
    return Math.round((parsedAmount / config.nairaPerUnit) * 100) / 100;
  }, [config, parsedAmount]);

  if (loading || !data || !config) return null;
  if (!config.enabled && data.coinBalance <= 0) return null;

  const available = nairaBalance ?? data.nairaBalance;

  const validate = (): string | null => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return "Enter an amount to convert.";
    if (parsedAmount < config.minConversion) return `The minimum is ${formatCurrency(config.minConversion)}.`;
    if (parsedAmount > config.maxConversion) return `The maximum is ${formatCurrency(config.maxConversion)}.`;
    if (parsedAmount > available) return "That's more than your available wallet balance.";
    return null;
  };

  const handleConvert = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/currency/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, idempotencyKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Conversion failed. Please try again.");
        return;
      }
      message.success(`${formatCoins(json.coinsCredited, config.symbol)} added to your ${config.name}`);
      setAmount("");
      setIdempotencyKey(newIdempotencyKey());
      emitWalletSync("app-currency-convert");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden p-0", className)} padding="none">
      <div className="grid gap-0 lg:grid-cols-3">
        {/* Balance */}
        <div className="flex flex-col justify-between gap-4 bg-ds-brand-deep p-6 text-ds-brand-on-deep">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ds-palette-magenta-200">
            <Coins className="h-4 w-4" aria-hidden="true" />
            {config.name}
          </div>
          <div>
            <p className="text-4xl font-bold text-white" data-testid="coin-balance">
              {formatCoins(data.coinBalance, config.symbol)}
            </p>
            <p className="mt-1 text-sm text-ds-palette-purple-200">
              Worth {formatCurrency(data.coinBalanceNairaValue)} · 1 {config.symbol} = {formatCurrency(config.nairaPerUnit)}
            </p>
          </div>
          <p className="text-xs text-ds-palette-purple-200">
            Spend {config.name} at checkout{config.checkoutEnabled ? "" : " (checkout payments are paused right now)"}.
            {" "}{config.name} can&apos;t be withdrawn as cash.
          </p>
        </div>

        {/* Convert */}
        <div className="border-b border-ds-border-base p-6 lg:border-b-0 lg:border-r">
          <h2 className="text-base font-semibold text-ds-text-primary">Convert naira to {config.name}</h2>
          {config.enabled ? (
            <>
              <p className="mt-1 text-xs text-ds-text-secondary">
                From your wallet balance ({formatCurrency(available)}). Limits {formatCurrency(config.minConversion)} –{" "}
                {formatCurrency(config.maxConversion)} per conversion.
              </p>
              <label htmlFor="coin-convert-amount" className="mt-4 block text-sm font-medium text-ds-text-primary">
                Amount in naira
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="coin-convert-amount"
                  type="number"
                  inputMode="decimal"
                  min={config.minConversion}
                  max={config.maxConversion}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={String(config.minConversion)}
                  aria-invalid={Boolean(error)}
                  aria-describedby="coin-convert-help"
                  className="w-full rounded-ds-md border border-ds-border-strong px-3 py-2 text-sm focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20"
                />
                <button
                  type="button"
                  className="flex-shrink-0 rounded-ds-md border border-ds-border-base px-3 text-xs font-semibold text-ds-text-brand hover:bg-ds-brand-surface"
                  onClick={() => {
                    setAmount(String(Math.max(0, Math.min(available, config.maxConversion))));
                    setError(null);
                  }}
                >
                  Max
                </button>
              </div>
              <p id="coin-convert-help" className={cn("mt-2 text-xs", error ? "text-ds-status-error-text" : "text-ds-text-secondary")}>
                {error ?? (previewCoins > 0 ? `You'll get ${formatCoins(previewCoins, config.symbol)}` : "Conversions are one-way.")}
              </p>
              <Button className="mt-4" fullWidth loading={submitting} onClick={() => void handleConvert()}>
                Convert
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-ds-text-secondary">
              Conversions are paused right now. You can still spend the {config.name} you have when checkout payments are on.
            </p>
          )}
        </div>

        {/* History */}
        <div className="p-6">
          <h2 className="text-base font-semibold text-ds-text-primary">{config.name} history</h2>
          {data.transactions.length === 0 ? (
            <p className="mt-2 text-sm text-ds-text-secondary">No activity yet.</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
              {data.transactions.map((entry) => {
                const meta = TYPE_META[entry.type] ?? TYPE_META.ADJUSTMENT;
                const Icon = meta.icon;
                const credit =
                  entry.balanceAfter !== entry.balanceBefore
                    ? entry.balanceAfter > entry.balanceBefore
                    : CREDIT_TYPES.includes(entry.type);
                return (
                  <li key={entry.id} className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-ds-text-brand dark:bg-ds-palette-purple-800 dark:text-ds-palette-purple-100">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ds-text-primary">{meta.label}</p>
                        <p className="truncate text-xs text-ds-text-secondary">{entry.description}</p>
                        <p className="text-[11px] text-ds-text-tertiary">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={cn("flex-shrink-0 text-sm font-semibold", credit ? "text-ds-status-success-text" : "text-ds-status-error-text")}>
                      {credit ? "+" : "−"}
                      {formatCoins(entry.amount, config.symbol)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

export default AppCurrencyCard;
