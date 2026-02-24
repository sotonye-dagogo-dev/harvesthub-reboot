"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, StatCard } from "@/components/ui";
import type { StatColorPreset } from "@/components/ui";
import { mockProducts, mockOrders, mockReviews, mockVendors } from "@/lib/data/mockData";
import { TrendingUp, Package, Star, Eye, ShoppingBag, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { OrderStatus } from "@/lib/constants";

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Resolve vendor record from user ID, then use vendor.id for data filtering
  const vendor = user?.role === "VENDOR" ? mockVendors.find((v) => v.userId === user?.id) : null;
  const vendorId = vendor?.id ?? null;

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
        <p className="text-center text-ds-text-secondary">Unable to load analytics</p>
      </div>
    );
  }

  const stats: { title: string; value: string; icon: LucideIcon; colorPreset: StatColorPreset }[] = [
    { title: "Total Revenue", value: formatCurrency(analytics.totalRevenue), icon: TrendingUp, colorPreset: "success" },
    { title: "Total Products", value: analytics.totalProducts.toString(), icon: Package, colorPreset: "info" },
    { title: "Total Views", value: analytics.totalViews.toLocaleString(), icon: Eye, colorPreset: "brand" },
    { title: "Total Sales", value: analytics.totalSales.toString(), icon: ShoppingBag, colorPreset: "warning" },
    { title: "Average Rating", value: analytics.avgRating.toFixed(1), icon: Star, colorPreset: "rating" },
    { title: "Total Reviews", value: analytics.totalReviews.toString(), icon: Star, colorPreset: "pink" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ds-text-primary">Analytics</h1>
        <p className="mt-2 text-ds-text-secondary">
          Track your store performance and sales metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} variant="compact" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Top Products</h2>
          <div className="space-y-3">
            {analytics.topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border-b border-ds-border-base pb-3 last:border-0"
              >
                <div>
                  <div className="font-medium text-ds-text-primary">{product.name}</div>
                  <div className="text-sm text-ds-text-secondary">
                    {product.sales || 0} sales • {product.views || 0} views
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ds-text-primary">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-ds-text-secondary">
                    <Star className="h-4 w-4 fill-ds-rating-fill text-ds-rating-fill" />
                    {product.averageRating.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">
            Recent Reviews
          </h2>
          <div className="space-y-3">
            {analytics.recentReviews.map((review) => {
              const product = mockProducts.find((p) => p.id === review.productId);
              return (
                <div
                  key={review.id}
                  className="border-b border-ds-border-base pb-3 last:border-0"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${ i < review.rating ? "fill-ds-rating-fill text-ds-rating-fill" : "text-ds-text-placeholder dark:text-ds-text-secondary" }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-ds-text-secondary">
                      {review.userName || "Anonymous"}
                    </span>
                  </div>
                  <p className="text-sm text-ds-text-secondary">{review.comment}</p>
                  <div className="mt-1 text-xs text-ds-text-tertiary">
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
