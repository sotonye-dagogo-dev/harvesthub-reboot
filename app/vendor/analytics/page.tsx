"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import { mockProducts, mockOrders, mockReviews } from "@/lib/data/mockData";
import { TrendingUp, Package, Star, Eye, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { OrderStatus } from "@/lib/constants";

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Get vendorId - for vendors, use their own user ID as the vendor ID
  const vendorId = user?.role === "VENDOR" ? user?.id : null;

  const analytics = useMemo(() => {
    if (!vendorId) return null;

    const vendorProducts = mockProducts.filter((p) => p.vendorId === vendorId);
    const vendorOrders = mockOrders.filter((o) =>
      o.items.some((item) => vendorProducts.find((p) => p.id === item.productId))
    );
    const vendorReviews = mockReviews.filter((r) =>
      vendorProducts.find((p) => p.id === r.productId)
    );

    const totalRevenue = vendorOrders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .reduce((sum, order) => {
        const vendorItemsTotal = order.items
          .filter((item) => vendorProducts.find((p) => p.id === item.productId))
          .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
        return sum + vendorItemsTotal;
      }, 0);

    const totalViews = vendorProducts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalSales = vendorProducts.reduce((sum, p) => sum + (p.sales || 0), 0);
    const avgRating =
      vendorReviews.length > 0
        ? vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length
        : 0;

    // Top products by sales
    const topProducts = [...vendorProducts]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5);

    // Recent reviews
    const recentReviews = [...vendorReviews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalRevenue,
      totalViews,
      totalSales,
      avgRating,
      totalProducts: vendorProducts.length,
      totalOrders: vendorOrders.length,
      totalReviews: vendorReviews.length,
      topProducts,
      recentReviews,
    };
  }, [vendorId]);

  // Redirect if not vendor
  if (user?.role !== "VENDOR") {
    router.push("/unauthorized");
    return null;
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-gray-600 dark:text-gray-400">Unable to load analytics</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics.totalRevenue),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Products",
      value: analytics.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Total Sales",
      value: analytics.totalSales.toString(),
      icon: ShoppingBag,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Average Rating",
      value: analytics.avgRating.toFixed(1),
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Total Reviews",
      value: analytics.totalReviews.toString(),
      icon: Star,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track your store performance and sales metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Top Products</h2>
          <div className="space-y-3">
            {analytics.topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 dark:border-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {product.sales || 0} sales • {product.views || 0} views
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {product.averageRating.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Recent Reviews
          </h2>
          <div className="space-y-3">
            {analytics.recentReviews.map((review) => {
              const product = mockProducts.find((p) => p.id === review.productId);
              return (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-3 last:border-0 dark:border-gray-800"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {review.userName || "Anonymous"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {product?.name} • {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
