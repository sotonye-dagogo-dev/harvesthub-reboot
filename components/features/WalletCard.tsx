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
        "bg-gradient-to-br from-purple-600 to-purple-800 text-white dark:from-purple-700 dark:to-purple-900",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-white/20 p-3">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-purple-100">Wallet Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          {onDeposit && (
            <Button
              onClick={onDeposit}
              variant="outline"
              className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Deposit
            </Button>
          )}
          {onWithdraw && (
            <Button
              onClick={onWithdraw}
              variant="outline"
              className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
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
  deposit: { icon: ArrowDownLeft, color: "text-green-600 dark:text-green-400", sign: "+" },
  withdrawal: { icon: ArrowUpRight, color: "text-red-600 dark:text-red-400", sign: "-" },
  payment: { icon: DollarSign, color: "text-blue-600 dark:text-blue-400", sign: "-" },
  refund: { icon: ArrowDownLeft, color: "text-green-600 dark:text-green-400", sign: "+" },
  commission: { icon: DollarSign, color: "text-amber-600 dark:text-amber-400", sign: "-" },
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
        "flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full bg-gray-100 p-2 dark:bg-gray-800", config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{description}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{date.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-lg font-bold", config.color)}>
          {config.sign}
          {formatCurrency(amount)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status}</p>
      </div>
    </div>
  );
}
