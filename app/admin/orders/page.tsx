"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { OrderCard, FilterSidebar } from "@/components/features";
import { EmptyState, LoadingSpinner, SimplePagination, Button } from "@/components/ui";
import { Package, Download } from "lucide-react";
import { mockOrders, mockUsers } from "@/lib/data/mockData";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{
    status?: string[];
    dateRange?: { from: Date; to: Date };
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Access Denied"
          description="You don't have permission to view this page"
        />
      </div>
    );
  }

  // Get all orders (admin sees everything)
  let filteredOrders = [...mockOrders];

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    filteredOrders = filteredOrders.filter((o) => filters.status!.includes(o.status));
  }

  if (filters.dateRange) {
    filteredOrders = filteredOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= filters.dateRange!.from && orderDate <= filters.dateRange!.to;
    });
  }

  // Sort by most recent
  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === "PENDING").length,
    processing: mockOrders.filter((o) => o.status === "PROCESSING").length,
    completed: mockOrders.filter((o) => o.status === "COMPLETED").length,
    totalRevenue: mockOrders.reduce((sum, o) => sum + o.total, 0),
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-ds-surface-sunken dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ds-text-primary">All Orders</h1>
            <p className="mt-2 text-ds-text-secondary">
              Monitor and manage all platform orders
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-ds-surface-base p-4 shadow dark:bg-ds-surface-base">
            <p className="text-sm text-ds-text-secondary">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-ds-text-primary">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-ds-surface-base p-4 shadow dark:bg-ds-surface-base">
            <p className="text-sm text-ds-text-secondary">Pending</p>
            <p className="mt-1 text-2xl font-bold text-ds-status-warning-text">{stats.pending}</p>
          </div>
          <div className="rounded-lg bg-ds-surface-base p-4 shadow dark:bg-ds-surface-base">
            <p className="text-sm text-ds-text-secondary">Processing</p>
            <p className="mt-1 text-2xl font-bold text-ds-status-info-text">{stats.processing}</p>
          </div>
          <div className="rounded-lg bg-ds-surface-base p-4 shadow dark:bg-ds-surface-base">
            <p className="text-sm text-ds-text-secondary">Completed</p>
            <p className="mt-1 text-2xl font-bold text-ds-status-success-text">{stats.completed}</p>
          </div>
          <div className="rounded-lg bg-ds-surface-base p-4 shadow dark:bg-ds-surface-base">
            <p className="text-sm text-ds-text-secondary">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-ds-text-brand">
              ₦{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filters={{
                status: filters.status,
              }}
              onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
              statuses={[
                { label: "Pending", value: "PENDING" },
                { label: "Confirmed", value: "CONFIRMED" },
                { label: "Processing", value: "PROCESSING" },
                { label: "Ready", value: "READY" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
                { label: "Refunded", value: "REFUNDED" },
              ]}
            />
          </div>

          {/* Orders List */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-ds-text-secondary">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {paginatedOrders.length === 0 ? (
              <EmptyState
                icon={<Package className="h-16 w-16" />}
                title="No orders found"
                description="No orders match your filters"
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedOrders.map((order) => {
                    const buyer = mockUsers.find((u) => u.id === order.buyerId);
                    return (
                      <OrderCard
                        key={order.id}
                        id={order.id}
                        orderNumber={order.orderNumber}
                        status={order.status}
                        total={order.total}
                        itemCount={order.items.length}
                        deliveryMethod={order.deliveryMethod}
                        deliveryInfo={buyer ? `${buyer.firstName} ${buyer.lastName}` : "Unknown"}
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
      </div>
    </div>
  );
}
