"use client";

import { useState } from "react";
import { OrderCard } from "@/components/features";
import { SimplePagination, EmptyState } from "@/components/ui";
import { mockOrders } from "@/lib/data/mockData";
import { Tabs, Badge } from "antd";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get user's orders (mock user ID "buyer-1")
  const userOrders = mockOrders.filter((order) => order.buyerId === "buyer-1");

  // Filter orders by tab
  let filteredOrders = userOrders;
  if (activeTab !== "ALL") {
    filteredOrders = userOrders.filter((order) => order.status === activeTab);
  }

  // Sort by date (newest first)
  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = [
    { key: "ALL", label: "All Orders", count: userOrders.length },
    {
      key: "PENDING",
      label: "Pending",
      count: userOrders.filter((o) => o.status === "PENDING").length,
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      count: userOrders.filter((o) => o.status === "CONFIRMED").length,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: userOrders.filter((o) => o.status === "COMPLETED").length,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: userOrders.filter((o) => o.status === "CANCELLED").length,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs.map((tab) => ({
          key: tab.key,
          label: (
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              <Badge count={tab.count} showZero />
            </div>
          ),
        }))}
      />

      <div className="mt-6">
        {paginatedOrders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No orders found"
            description={
              activeTab === "ALL"
                ? "You haven't placed any orders yet"
                : `No ${activeTab.toLowerCase()} orders`
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
                const totalAmount = order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );

                return (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    orderNumber={order.orderNumber}
                    status={order.status}
                    total={totalAmount}
                    itemCount={order.items.length}
                    deliveryMethod={order.deliveryMethod}
                    createdAt={order.createdAt}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
