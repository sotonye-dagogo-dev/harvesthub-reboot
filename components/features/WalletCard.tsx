"use client";

import { Wallet, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export interface WalletCardProps {
  balance: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  showActions?: boolean;
  className?: string;
}

export function WalletCard({
  balance,
  onDeposit,
  onWithdraw,
  showActions = true,
  className,
}: WalletCardProps) {
  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-ds-brand-primary to-ds-palette-purple-800 text-white  ",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-ds-surface-base/20 p-3">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-ds-palette-purple-100">Wallet Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          {onDeposit && (
            <Button
              onClick={onDeposit}
              variant="outline"
              className="flex-1 border-ds-surface-base/30 bg-ds-surface-base/10 text-white hover:bg-ds-surface-base/20"
            >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Deposit
            </Button>
          )}
          {onWithdraw && (
            <Button
              onClick={onWithdraw}
              variant="outline"
              className="flex-1 border-ds-surface-base/30 bg-ds-surface-base/10 text-white hover:bg-ds-surface-base/20"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export interface TransactionItemProps {
  type: "deposit" | "withdrawal" | "payment" | "refund" | "commission";
  amount: number;
  description: string;
  date: Date;
  status: "pending" | "completed" | "failed";
  className?: string;
}

const typeConfig = {
  deposit: { icon: ArrowDownLeft, color: "text-ds-status-success-text", sign: "+" },
  withdrawal: { icon: ArrowUpRight, color: "text-ds-status-error-text", sign: "-" },
  payment: { icon: DollarSign, color: "text-ds-status-info-text", sign: "-" },
  refund: { icon: ArrowDownLeft, color: "text-ds-status-success-text", sign: "+" },
  commission: { icon: DollarSign, color: "text-ds-status-warning-text", sign: "-" },
};

export function TransactionItem({
  type,
  amount,
  description,
  date,
  status,
  className,
}: TransactionItemProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-ds-border-base bg-ds-surface-base p-4  dark:bg-ds-surface-base",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full bg-ds-surface-sunken p-2 ", config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-ds-text-primary">{description}</p>
          <p className="text-sm text-ds-text-secondary">{date.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-lg font-bold", config.color)}>
          {config.sign}
          {formatCurrency(amount)}
        </p>
        <p className="text-sm text-ds-text-secondary capitalize">{status}</p>
      </div>
    </div>
  );
}
