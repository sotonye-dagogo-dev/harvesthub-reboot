"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { OrderCard, FilterSidebar } from "@/components/features";
import { EmptyState, LoadingSpinner, SimplePagination } from "@/components/ui";
import { Package } from "lucide-react";
import {
  getOrdersClient,
  getProductsClient,
  getVendorsClient,
} from "@/lib/data/clientDataFetchers";

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [_vendor, setVendor] = useState<any | null>(null);
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState<{
    status?: string[];
    dateRange?: { from: Date; to: Date };
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      const vendors = await getVendorsClient();
      const found = vendors.find((v: any) => v.user?.id === user?.id);
      if (!mounted) return;
      setVendor(found ?? null);

      const orders = await getOrdersClient();
      const products = await getProductsClient({ limit: 500 });
      if (!mounted) return;

      const vendorOrdersList = orders.filter((order: any) =>
        order.items.some((item: any) => {
          const product = products.find((p: any) => p.id === item.productId);
          return product?.vendorId === found?.id;
        })
      );

      setVendorOrders(
        vendorOrdersList.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setIsLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (!user || user.role !== "VENDOR") {
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

  // Resolve vendor record from user ID; vendorOrders are loaded via effect

  // Apply filters
  let filteredOrders = [...vendorOrders];

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-ds-surface-sunken dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ds-text-primary">My Orders</h1>
          <p className="mt-2 text-ds-text-secondary">Manage and track your incoming orders</p>
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
                { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
                { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
                { label: "Delivered", value: "DELIVERED" },
                { label: "Cancelled", value: "CANCELLED" },
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
                description="You haven't received any orders yet"
              />
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedOrders.map((order) => {
                    const buyer = order.buyer ?? null;
                    return (
                      <OrderCard
                        key={order.id}
                        id={order.id}
                        orderNumber={order.orderNumber}
                        status={order.status}
                        total={order.total}
                        itemCount={order.items.length}
                        deliveryMethod={order.deliveryMethod}
                        deliveryInfo={
                          buyer
                            ? `${buyer.user?.firstName ?? ""} ${buyer.user?.lastName ?? ""}`.trim()
                            : "Unknown"
                        }
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
