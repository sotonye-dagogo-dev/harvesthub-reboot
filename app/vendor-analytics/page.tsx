"use client";

import { Card } from "@/components/ui";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Star,
  Eye,
  Heart,
} from "lucide-react";
import { mockOrders, mockProducts, mockReviews } from "@/lib/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { Select } from "antd";
import { useState } from "react";

const { Option } = Select;

export default function VendorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const vendorId = "vendor-1";

  // Filter data for vendor
  const vendorOrders = mockOrders.filter((o) => o.vendorId === vendorId);
  const vendorProducts = mockProducts.filter((p) => p.vendorId === vendorId);
  const vendorReviews = mockReviews.filter((r) => vendorProducts.some((p) => p.id === r.productId));

  // Calculate metrics
  const totalRevenue = vendorOrders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
    }, 0);

  const totalOrders = vendorOrders.length;
  const completedOrders = vendorOrders.filter((o) => o.status === "COMPLETED").length;
  const pendingOrders = vendorOrders.filter((o) => o.status === "PENDING").length;
  const cancelledOrders = vendorOrders.filter((o) => o.status === "CANCELLED").length;

  const totalProducts = vendorProducts.length;
  const activeProducts = vendorProducts.filter((p) => p.isActive).length;
  const outOfStock = vendorProducts.filter((p) => p.stock === 0).length;
  const lowStock = vendorProducts.filter((p) => p.stock > 0 && p.stock < 10).length;

  const averageRating =
    vendorReviews.reduce((sum, r) => sum + r.rating, 0) / (vendorReviews.length || 1);
  const totalReviews = vendorReviews.length;

  const totalViews = vendorProducts.reduce((sum, p) => sum + (p.views || 0), 0);
  const averageOrderValue = totalRevenue / (completedOrders || 1);

  // Top selling products
  const productSales = vendorProducts.map((product) => {
    const sold = vendorOrders
      .filter((o) => o.status === "COMPLETED")
      .flatMap((o) => o.items)
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    return { product, sold };
  });

  const topProducts = productSales.sort((a, b) => b.sold - a.sold).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track your store performance and insights
          </p>
        </div>
        <Select value={timeRange} onChange={setTimeRange} className="w-40">
          <Option value="7">Last 7 days</Option>
          <Option value="30">Last 30 days</Option>
          <Option value="90">Last 90 days</Option>
          <Option value="365">Last year</Option>
          <Option value="all">All time</Option>
        </Select>
      </div>

      {/* Revenue Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="inline h-3 w-3" /> +12.5% from last month
              </p>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="inline h-3 w-3" /> +8.2% from last month
              </p>
            </div>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Order Value</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(averageOrderValue)}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                <TrendingUp className="inline h-3 w-3 rotate-180" /> -2.1% from last month
              </p>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {[...new Set(vendorOrders.map((o) => o.buyerId))].length}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="inline h-3 w-3" /> +15.3% from last month
              </p>
            </div>
            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-3">
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Breakdown */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Order Status Breakdown
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {completedOrders}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {((completedOrders / totalOrders) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
              {pendingOrders}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {((pendingOrders / totalOrders) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {vendorOrders.filter((o) => o.status === "PROCESSING").length}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {(
                (vendorOrders.filter((o) => o.status === "PROCESSING").length / totalOrders) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {cancelledOrders}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {((cancelledOrders / totalOrders) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Performance */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Product Performance
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Products</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {totalProducts}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {activeProducts}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Out of Stock</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {outOfStock}
                </p>
              </div>

              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Low Stock</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{lowStock}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Views</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {totalViews.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Star className="h-5 w-5" />
                  <span className="text-sm font-medium">Avg. Rating</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {averageRating.toFixed(1)} / 5.0
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {topProducts.map(({ product, sold }, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-sm font-bold text-purple-600 dark:text-purple-400">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{sold} sold</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(product.price * sold)}
                  </p>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div className="py-8 text-center text-gray-600 dark:text-gray-400">
                No sales data available yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Customer Satisfaction */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Customer Satisfaction
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">Average Rating</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Based on {totalReviews} reviews
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium">Repeat Customers</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {Math.floor(Math.random() * 40 + 30)}%
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Customer retention rate</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">5-Star Reviews</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {vendorReviews.filter((r) => r.rating === 5).length}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {((vendorReviews.filter((r) => r.rating === 5).length / totalReviews) * 100).toFixed(
                1
              )}
              % of all reviews
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
