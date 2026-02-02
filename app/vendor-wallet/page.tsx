"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, ArrowUpRight } from "lucide-react";
import { SimplePagination } from "@/components/ui";
import { mockWallets, mockTransactions } from "@/lib/data/mockData";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Modal, Input, Select, message } from "antd";

const { Option } = Select;

export default function VendorWalletPage() {
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock vendor wallet
  const vendorId = "vendor-1";
  const wallet = mockWallets.find((w) => w.userId === vendorId) || mockWallets[1];

  if (!wallet) {
    return <div>Wallet not found</div>;
  }

  // Mock transactions
  const transactions = mockTransactions
    .filter((t) => t.walletId === wallet.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalEarnings = transactions
    .filter((t) => t.type === "PAYMENT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "PENDING")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount < 1000) {
      message.error("Minimum withdrawal amount is ₦1,000");
      return;
    }

    if (amount > wallet.balance) {
      message.error("Insufficient balance");
      return;
    }

    if (!bankAccount) {
      message.error("Please select a bank account");
      return;
    }

    // In real app, this would create a withdrawal request
    message.success("Withdrawal request submitted! It will be processed within 1-3 business days.");
    setWithdrawalModalOpen(false);
    setWithdrawalAmount("");
    setBankAccount("");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "WITHDRAWAL":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "PAYMENT":
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      case "REFUND":
        return <ArrowUpRight className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: "success",
      PENDING: "warning",
      FAILED: "danger",
      REVERSED: "default",
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Wallet</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your earnings and withdrawals
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(wallet.balance)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
              <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawn</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalWithdrawals)}
              </p>
            </div>
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
              <Download className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Withdrawals</p>
              <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(pendingWithdrawals)}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-3">
              <TrendingDown className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Request withdrawals to your bank account
            </p>
          </div>
          <Button onClick={() => setWithdrawalModalOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Request Withdrawal
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction History
          </h2>
        </div>

        <div className="space-y-3">
          {paginatedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {transaction.reference && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Ref: {transaction.reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getStatusBadge(transaction.status)}
                <p
                  className={`text-lg font-semibold ${
                    transaction.type === "DEPOSIT" || transaction.type === "PAYMENT"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "DEPOSIT" || transaction.type === "PAYMENT" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Withdrawal Modal */}
      <Modal
        title="Request Withdrawal"
        open={withdrawalModalOpen}
        onCancel={() => {
          setWithdrawalModalOpen(false);
          setWithdrawalAmount("");
          setBankAccount("");
        }}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setWithdrawalModalOpen(false)}>
            Cancel
          </Button>,
          <Button key="submit" onClick={handleWithdrawal}>
            Submit Request
          </Button>,
        ]}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Balance
            </label>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(wallet.balance)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Withdrawal Amount (₦)
            </label>
            <Input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="Enter amount (min ₦1,000)"
              min={1000}
              max={wallet.balance}
            />
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Minimum withdrawal: ₦1,000
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bank Account
            </label>
            <Select
              value={bankAccount}
              onChange={setBankAccount}
              placeholder="Select bank account"
              className="w-full"
            >
              <Option value="access-****1234">Access Bank - ****1234</Option>
              <Option value="gtb-****5678">GTBank - ****5678</Option>
              <Option value="zenith-****9012">Zenith Bank - ****9012</Option>
            </Select>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Processing time: 1-3 business days
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
