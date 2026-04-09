"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, SimplePagination, EmptyState, SectionLoader } from "@/components/ui";
import { ClientDashboardShell } from "@/components/layout";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react";
import { Input, Modal, message } from "antd";
import { PLATFORM_DEFAULTS, TransactionStatus, TransactionType } from "@/lib/constants";
import type { Wallet, Transaction } from "@/lib/types";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { runOptimisticMutation } from "@/lib/data-runtime/mutationCoordinator";
import type { ReactElement } from "react";

export default function WalletPage() {
  const { user } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const loadWalletResource = useCallback(async (): Promise<{
    wallet: Wallet | null;
    transactions: Transaction[];
  }> => {
    const res = await fetch("/api/wallet");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Failed to load wallet");
    }

    const wallet = (data?.wallet ?? null) as Wallet | null;
    const transactions = ((wallet?.transactions ?? []) as Transaction[])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { wallet, transactions };
  }, []);

  const {
    data: walletResource,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useSmartResource(loadWalletResource, {
    key: `wallet-resource:${user?.id ?? "guest"}`,
    enabled: Boolean(user?.id),
    refreshIntervalMs: 120_000,
    staleTimeMs: 20_000,
  });

  const userWallet = walletResource?.wallet ?? null;
  const userTransactions = walletResource?.transactions ?? [];
  const hasWalletPayload = typeof walletResource !== "undefined";
  const isWalletBootstrapLoading = Boolean(user?.id) && !hasWalletPayload && !error;

  const totalPages = Math.ceil(userTransactions.length / itemsPerPage);
  const paginatedTransactions = userTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderWithDashboardShell = (content: ReactElement): ReactElement => {
    if (user?.role === "ADMIN" || user?.role === "VENDOR") {
      return (
        <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
          {content}
        </ClientDashboardShell>
      );
    }

    return content;
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      message.error("Minimum deposit amount is ₦100");
      return;
    }
    if (amount > 1000000) {
      message.error("Maximum deposit amount is ₦1,000,000");
      return;
    }

    setIsProcessingDeposit(true);
    try {
      const initializeRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "PAYSTACK",
          amount,
          currency: "NGN",
          metadata: { source: "wallet-deposit" },
        }),
      });
      const initializeData = await initializeRes.json().catch(() => ({}));
      if (!initializeRes.ok || !initializeData?.payment?.reference) {
        throw new Error(initializeData?.error || "Unable to initialize payment");
      }

      const paymentReference = initializeData.payment.reference as string;
      const optimisticTransactionId = `optimistic-deposit-${Date.now()}-${Math.round(Math.random() * 1000)}`;

      await runOptimisticMutation<
        { wallet: Wallet | null; transactions: Transaction[] },
        { wallet: Wallet; transaction: Transaction; optimisticTransactionId: string }
      >({
        key: `wallet-resource:${user?.id ?? "guest"}`,
        applyOptimistic: (previous) => {
          if (!previous?.wallet) return previous ?? { wallet: null, transactions: [] };
          return {
            wallet: {
              ...previous.wallet,
              balance: previous.wallet.balance + amount,
            },
            transactions: [
              {
                id: optimisticTransactionId,
                walletId: previous.wallet.id,
                type: TransactionType.DEPOSIT,
                amount,
                balanceBefore: previous.wallet.balance,
                balanceAfter: previous.wallet.balance + amount,
                status: TransactionStatus.PENDING,
                reference: paymentReference,
                description: "Wallet deposit pending confirmation",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              ...previous.transactions,
            ],
          };
        },
        commit: async () => {
          const depositRes = await fetch("/api/wallet/deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount,
              description: "Wallet deposit via gateway stub",
              paymentReference,
              paymentGateway: "PAYSTACK",
              paymentVerificationReference: `${paymentReference}-success`,
            }),
          });
          const depositData = await depositRes.json().catch(() => ({}));
          if (!depositRes.ok || !depositData?.wallet || !depositData?.transaction) {
            throw new Error(depositData?.error || "Failed to complete wallet deposit");
          }

          return {
            wallet: depositData.wallet as Wallet,
            transaction: depositData.transaction as Transaction,
            optimisticTransactionId,
          };
        },
        reconcile: (current, serverResult) => ({
          wallet: serverResult.wallet,
          transactions: [
            serverResult.transaction,
            ...((current?.transactions ?? []).filter(
              (transaction) => transaction.id !== serverResult.optimisticTransactionId
            ) as Transaction[]),
          ],
        }),
      });

      message.success(`Deposited ${formatCurrency(amount)} to your wallet`);
      setShowDepositModal(false);
      setDepositAmount("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to process deposit";
      message.error(errorMessage);
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      message.error("Minimum withdrawal amount is ₦100");
      return;
    }
    if (!userWallet || amount > userWallet.balance) {
      message.error("Insufficient balance");
      return;
    }

    message.success(`Withdrawal of ${formatCurrency(amount)} initiated`);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<WalletIcon className="h-12 w-12" />}
          title="Please log in"
          description="You need to be logged in to access your wallet"
        />
      </div>
    );
  }

  if (isWalletBootstrapLoading || (isLoading && !hasWalletPayload)) {
    return renderWithDashboardShell(
      <div className="container mx-auto px-4 py-16">
        <SectionLoader />
        <p className="mt-2 text-center text-sm text-ds-text-secondary">
          Loading wallet information...
        </p>
      </div>
    );
  }

  if (!userWallet) {
    return renderWithDashboardShell(
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<WalletIcon className="h-12 w-12" />}
          title={error ? "Unable to load wallet" : "Wallet not found"}
          description={error || "Unable to load your wallet information"}
        />
      </div>
    );
  }

  const walletContent = (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ds-text-primary">My Wallet</h1>
        <p className="mt-2 text-ds-text-secondary">
          {user.role === "VENDOR"
            ? "Manage your earnings and withdrawals"
            : "Add funds and track your transactions"}
        </p>
        {isLoading ? <p className="mt-1 text-xs text-ds-text-tertiary">Loading wallet...</p> : null}
        {isRefreshing ? (
          <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing wallet data...</p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-ds-status-error-text">{error}</p> : null}
      </div>

      {!PLATFORM_DEFAULTS.PAYMENTS_ENABLED && (
        <div className="mb-6 flex items-start gap-3 rounded-ds-md border border-ds-status-info-border bg-ds-status-info-bg p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-ds-status-info" />
          <div>
            <p className="text-sm font-medium text-ds-status-info-text">
              Wallet Deposits & Withdrawals Coming Soon
            </p>
            <p className="mt-1 text-xs text-ds-text-secondary">
              Payment processing is not yet active. Deposit and withdrawal functionality will be
              enabled once our payment partners are integrated.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-ds-full bg-ds-brand-subtle">
              <WalletIcon className="h-8 w-8 text-ds-text-brand" />
            </div>
            <div className="mb-2 text-sm text-ds-text-secondary">Available Balance</div>
            <div className="mb-6 text-4xl font-bold text-ds-text-brand">
              {formatCurrency(userWallet.balance)}
            </div>
            <div className="flex gap-3">
              {user.role !== "ADMIN" && (
                <>
                  <Button fullWidth onClick={() => setShowDepositModal(true)}>
                    <>
                      <ArrowDownCircle className="mr-2 h-5 w-5" />
                      Deposit
                    </>
                  </Button>
                  <Button fullWidth variant="outline" onClick={() => setShowWithdrawModal(true)}>
                    <>
                      <ArrowUpCircle className="mr-2 h-5 w-5" />
                      Withdraw
                    </>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Transaction History</h2>
            <div className="mb-3">
              <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
                Refresh
              </Button>
            </div>
            {paginatedTransactions.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                description="Your transaction history will appear here"
              />
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b border-ds-border-base pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-ds-full ${transaction.type === "DEPOSIT" ? "bg-ds-status-success-bg dark:bg-ds-status-success-bg" : transaction.type === "WITHDRAWAL" ? "bg-ds-status-error-bg dark:bg-ds-status-error-bg" : "bg-ds-status-info-bg dark:bg-ds-status-info-bg"}`}
                        >
                          {transaction.type === "DEPOSIT" ? (
                            <ArrowDownCircle className="h-5 w-5 text-ds-status-success-text" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-ds-status-error-text" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-ds-text-primary">
                            {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                          </div>
                          <div className="text-sm text-ds-text-secondary">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-ds-text-tertiary dark:text-ds-text-tertiary">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`font-semibold ${transaction.type === "DEPOSIT" ? "text-ds-status-success-text" : "text-ds-status-error-text"}`}
                        >
                          {transaction.type === "DEPOSIT" ? "+" : "-"}{" "}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div
                          className={`text-xs ${transaction.status === "COMPLETED" ? "text-ds-status-success-text" : transaction.status === "PENDING" ? "text-ds-status-warning-text" : "text-ds-status-error-text"}`}
                        >
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <SimplePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title="Deposit"
        open={showDepositModal}
        onOk={handleDeposit}
        onCancel={() => setShowDepositModal(false)}
        confirmLoading={isProcessingDeposit}
      >
        <Input
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </Modal>

      <Modal
        title="Withdraw"
        open={showWithdrawModal}
        onOk={handleWithdraw}
        onCancel={() => setShowWithdrawModal(false)}
      >
        <Input
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </Modal>
    </div>
  );

  return renderWithDashboardShell(walletContent);
}
