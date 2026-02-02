"use client";

import { useState } from "react";
import { Button, Card, SimplePagination, EmptyState } from "@/components/ui";
import { mockWallets, mockTransactions } from "@/lib/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Input, Modal, message } from "antd";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Get user wallet (mock user ID "buyer-1")
  const userWallet = mockWallets.find((w) => w.userId === "buyer-1");
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
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">My Wallet</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <WalletIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Available Balance</div>
            <div className="mb-6 text-4xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(userWallet.balance)}
            </div>

            <div className="flex gap-3">
              <Button fullWidth onClick={() => setShowDepositModal(true)}>
                <>
                  <ArrowDownCircle className="mr-2 h-5 w-5" />
                  Deposit
                </>
              </Button>
              <Button fullWidth variant="outline">
                <>
                  <ArrowUpCircle className="mr-2 h-5 w-5" />
                  Withdraw
                </>
              </Button>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
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
                      className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            transaction.type === "DEPOSIT"
                              ? "bg-green-100 dark:bg-green-900"
                              : transaction.type === "WITHDRAWAL"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ? (
                            <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.type === "DEPOSIT" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
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
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Min: ₦100 • Max: ₦1,000,000
          </div>
        </div>
      </Modal>
    </div>
  );
}
