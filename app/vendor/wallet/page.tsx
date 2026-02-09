"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button, Card, SimplePagination, EmptyState } from "@/components/ui";
import { mockWallets, mockTransactions } from "@/lib/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Input, Modal, message, Form } from "antd";
import { useRouter } from "next/navigation";

export default function VendorWalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();
  const itemsPerPage = 15;

  // Redirect if not vendor
  if (user?.role !== "VENDOR") {
    router.push("/unauthorized");
    return null;
  }

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

  const handleWithdraw = async () => {
    try {
      const values = await form.validateFields();
      const amount = parseFloat(values.amount as string);

      if (isNaN(amount) || amount < 1000) {
        message.error("Minimum withdrawal amount is ₦1,000");
        return;
      }
      if (!userWallet || amount > userWallet.balance) {
        message.error("Insufficient balance");
        return;
      }

      message.success(
        `Withdrawal of ${formatCurrency(amount)} initiated. Processing takes 1-3 business days.`
      );
      setShowWithdrawModal(false);
      form.resetFields();
    } catch {
      message.error("Please fill in all required fields");
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Wallet</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your earnings and withdrawals
        </p>
      </div>

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

            <Button fullWidth onClick={() => setShowWithdrawModal(true)}>
              <>
                <ArrowUpCircle className="mr-2 h-5 w-5" />
                Withdraw Funds
              </>
            </Button>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-left dark:bg-blue-900/20">
              <div className="mb-1 text-xs font-semibold text-blue-900 dark:text-blue-300">
                Withdrawal Info
              </div>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
                <li>• Minimum: ₦1,000</li>
                <li>• Processing: 1-3 business days</li>
                <li>• To your registered bank account</li>
              </ul>
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
                            transaction.type === "DEPOSIT" || transaction.type === "PAYMENT"
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" || transaction.type === "PAYMENT" ? (
                            <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {transaction.type === "PAYMENT"
                              ? "Sale"
                              : transaction.type.charAt(0) +
                                transaction.type.slice(1).toLowerCase()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`font-semibold ${
                            transaction.type === "DEPOSIT" || transaction.type === "PAYMENT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" || transaction.type === "PAYMENT"
                            ? "+"
                            : "-"}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div
                          className={`text-xs ${
                            transaction.status === "COMPLETED"
                              ? "text-green-600"
                              : transaction.status === "PENDING"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
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

      {/* Withdraw Modal */}
      <Modal
        title="Withdraw Funds"
        open={showWithdrawModal}
        onCancel={() => {
          setShowWithdrawModal(false);
          form.resetFields();
        }}
        onOk={handleWithdraw}
        okText="Withdraw"
      >
        <div className="py-4">
          <div className="mb-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">Available Balance</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(userWallet.balance)}
            </div>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="Withdrawal Amount (₦)"
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  validator: (_, value) => {
                    const amount = parseFloat(value);
                    if (isNaN(amount) || amount < 1000) {
                      return Promise.reject("Minimum withdrawal is ₦1,000");
                    }
                    if (amount > userWallet.balance) {
                      return Promise.reject("Insufficient balance");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="number" placeholder="Enter amount" size="large" min={1000} />
            </Form.Item>

            <Form.Item name="accountNumber" label="Bank Account Number" initialValue="0123456789">
              <Input disabled size="large" />
            </Form.Item>

            <Form.Item name="bankName" label="Bank Name" initialValue="First Bank of Nigeria">
              <Input disabled size="large" />
            </Form.Item>
          </Form>

          <div className="mt-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <div className="text-xs text-yellow-800 dark:text-yellow-400">
              Funds will be transferred to your registered bank account within 1-3 business days.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
