"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import {
  mockUsers,
  mockVendors,
  mockProducts,
  mockOrders,
  mockTransactions,
} from "@/lib/data/mockData";
import {
  Users,
  ShoppingBag,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { UserRole, OrderStatus, VendorStatus } from "@/lib/constants";
import { Tag } from "antd";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const stats = useMemo(() => {
    const totalRevenue = mockOrders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = mockOrders.length;
    const completedOrders = mockOrders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const pendingOrders = mockOrders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledOrders = mockOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const activeVendors = mockVendors.filter((v) => v.status === VendorStatus.APPROVED).length;
    const pendingVendors = mockVendors.filter((v) => v.status === VendorStatus.PENDING).length;

    const totalProducts = mockProducts.length;
    const activeProducts = mockProducts.filter((p) => p.isActive).length;
    const outOfStock = mockProducts.filter((p) => p.stock === 0).length;

    const totalUsers = mockUsers.length;
    const buyerCount = mockUsers.filter((u) => u.role === UserRole.BUYER).length;
    const vendorCount = mockUsers.filter((u) => u.role === UserRole.VENDOR).length;

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    const totalTransactions = mockTransactions?.length || 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      activeVendors,
      pendingVendors,
      totalProducts,
      activeProducts,
      outOfStock,
      totalUsers,
      buyerCount,
      vendorCount,
      averageOrderValue,
      totalTransactions,
    };
  }, []);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    mockOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / mockOrders.length) * 100).toFixed(1),
    }));
  }, []);

  // Top vendors by products
  const topVendors = useMemo(() => {
    return mockVendors
      .map((v) => ({
        ...v,
        productCount: mockProducts.filter((p) => p.vendorId === v.id).length,
        orderCount: mockOrders.filter((o) =>
          o.items?.some((item) =>
            mockProducts.find((p) => p.id === item.productId && p.vendorId === v.id)
          )
        ).length,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 5);
  }, []);

  // Top products by sales
  const topProducts = useMemo(() => {
    return [...mockProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  }, []);

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "green",
      PENDING: "orange",
      PROCESSING: "blue",
      CONFIRMED: "cyan",
      READY: "geekblue",
      CANCELLED: "red",
      REFUNDED: "volcano",
    };
    return colors[status] || "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Overview of platform performance and key metrics
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="h-10 w-10 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeVendors}</p>
            </div>
            <Store className="h-10 w-10 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-amber-600">{stats.totalUsers}</p>
            </div>
            <Users className="h-10 w-10 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Avg. Order Value</p>
              <p className="text-lg font-bold">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Active Products</p>
              <p className="text-lg font-bold">
                {stats.activeProducts}/{stats.totalProducts}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Out of Stock</p>
              <p className="text-lg font-bold">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-lg font-bold">{stats.totalTransactions}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Order Status Distribution
          </h2>
          <div className="space-y-3">
            {orderStatusData.map(({ status, count, percentage }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag color={statusColor(status)}>{status}</Tag>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{count} orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Breakdown */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">User Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Buyers</p>
                <p className="text-2xl font-bold text-green-600">{stats.buyerCount}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                {((stats.buyerCount / stats.totalUsers) * 100).toFixed(0)}% of users
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
                <p className="text-2xl font-bold text-blue-600">{stats.vendorCount}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                {((stats.vendorCount / stats.totalUsers) * 100).toFixed(0)}% of users
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Vendors</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingVendors}</p>
              </div>
              <div className="text-right text-sm text-gray-500">Awaiting approval</div>
            </div>
          </div>
        </Card>

        {/* Top Vendors */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Top Vendors</h2>
          {topVendors.length === 0 ? (
            <p className="text-gray-500">No vendor data available</p>
          ) : (
            <div className="space-y-3">
              {topVendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600 dark:bg-purple-900/30">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vendor.storeName}
                      </p>
                      <p className="text-xs text-gray-500">{vendor.productCount} products</p>
                    </div>
                  </div>
                  <Tag color={vendor.status === VendorStatus.APPROVED ? "green" : "orange"}>
                    {vendor.status}
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Top Products by Sales
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500">No product data available</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {product.sales || 0} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
