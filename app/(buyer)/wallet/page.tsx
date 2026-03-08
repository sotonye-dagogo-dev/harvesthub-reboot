"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, SimplePagination, EmptyState } from "@/components/ui";
import { mockWallets, mockTransactions } from "@/lib/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Input, Modal, message } from "antd";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  const { user } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Get user wallet
  const userWallet = mockWallets.find((w) => w.userId === user?.id);
  const userTransactions = mockTransactions
    .filter((t) => t.walletId === userWallet?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const totalPages = Math.ceil(userTransactions.length / itemsPerPage);
  const paginatedTransactions = userTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      message.error("Minimum deposit amount is ₦100");
      return;
    }
    if (amount > 1000000) {
      message.error("Maximum deposit amount is ₦1,000,000");
      return;
    }

    // Mock deposit
    message.success(`Deposited ${formatCurrency(amount)} to your wallet`);
    setShowDepositModal(false);
    setDepositAmount("");
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

    // Mock withdrawal
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

  if (!userWallet) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<WalletIcon className="h-12 w-12" />}
          title="Wallet not found"
          description="Unable to load your wallet information"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ds-text-primary">My Wallet</h1>
        <p className="mt-2 text-ds-text-secondary">
          {user.role === "VENDOR"
            ? "Manage your earnings and withdrawals"
            : "Add funds and track your transactions"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Wallet Balance Card */}
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

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
              Transaction History
            </h2>

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
                      <div className="flex items-center gap-3"> <div className={`flex h-10 w-10 items-center justify-center rounded-ds-full ${ transaction.type ==="DEPOSIT" ? "bg-ds-status-success-bg dark:bg-ds-status-success-bg" : transaction.type === "WITHDRAWAL" ? "bg-ds-status-error-bg dark:bg-ds-status-error-bg" : "bg-ds-status-info-bg dark:bg-ds-status-info-bg" }`}
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
                          className={`font-semibold ${ transaction.type === "DEPOSIT" ? "text-ds-status-success-text" : "text-ds-status-error-text" }`}
                        >
                          {transaction.type === "DEPOSIT" ? "+" : "-"} {formatCurrency(transaction.amount)} </div> <div className={`text-xs ${ transaction.status ==="COMPLETED" ? "text-ds-status-success-text" : transaction.status === "PENDING" ? "text-ds-status-warning-text" : "text-ds-status-error-text" }`}
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

      {/* Deposit Modal */}
      <Modal
        title="Deposit Funds"
        open={showDepositModal}
        onCancel={() => setShowDepositModal(false)}
        onOk={handleDeposit}
        okText="Deposit"
      >
        <div className="py-4">
          <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
            Amount (₦)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min={100}
            max={1000000}
            size="large"
          />
          <div className="mt-2 text-sm text-ds-text-secondary">
            Min: ₦100 • Max: ₦1,000,000
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        title="Withdraw Funds"
        open={showWithdrawModal}
        onCancel={() => setShowWithdrawModal(false)}
        onOk={handleWithdraw}
        okText="Withdraw"
      >
        <div className="py-4">
          <div className="mb-4 rounded-ds-md bg-ds-surface-sunken p-3">
            <div className="text-sm text-ds-text-secondary">Available Balance</div>
            <div className="text-xl font-bold text-ds-text-primary">
              {formatCurrency(userWallet.balance)}
            </div>
          </div>
          <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
            Withdrawal Amount (₦)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min={100}
            max={userWallet.balance}
            size="large"
          />
          <div className="mt-2 text-sm text-ds-text-secondary">
            Min: ₦100 • Max: {formatCurrency(userWallet.balance)}
          </div>
        </div>
      </Modal>
    </div>
  );
}
