"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import { Package, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";
import { mockProducts, mockOrders } from "@/lib/data/mockData";
import { useMemo } from "react";
import { OrderStatus } from "@/lib/constants";

export default function VendorDashboardPage() {
  const { user } = useAuth();

  // Calculate vendor stats from mock data
  const stats = useMemo(() => {
    if (!user) return [];

    // Get vendor's products
    const vendorProducts = mockProducts.filter((p) => p.vendorId === user.id);
    const productCount = vendorProducts.length;

    // Get orders containing vendor's products
    const vendorOrders = mockOrders.filter((order) =>
      order.items.some((item) => vendorProducts.some((p) => p.id === item.productId))
    );

    // Calculate total revenue from vendor's products in orders
    const totalRevenue = vendorOrders.reduce((sum, order) => {
      const vendorItemsTotal = order.items
        .filter((item) => vendorProducts.some((p) => p.id === item.productId))
        .reduce((itemSum, item) => itemSum + item.subtotal, 0);
      return sum + vendorItemsTotal;
    }, 0);

    // Calculate total sales (completed orders)
    const completedOrders = vendorOrders.filter((o) => o.status === OrderStatus.COMPLETED);
    const totalSales = completedOrders.reduce((sum, order) => {
      const vendorItemsTotal = order.items
        .filter((item) => vendorProducts.some((p) => p.id === item.productId))
        .reduce((itemSum, item) => itemSum + item.subtotal, 0);
      return sum + vendorItemsTotal;
    }, 0);

    return [
      {
        title: "Total Sales",
        value: `\u20a6${totalSales.toLocaleString()}`,
        icon: DollarSign,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
      },
      {
        title: "Orders",
        value: vendorOrders.length.toString(),
        icon: ShoppingBag,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      },
      {
        title: "Products",
        value: productCount.toString(),
        icon: Package,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        title: "Revenue",
        value: `\u20a6${totalRevenue.toLocaleString()}`,
        icon: TrendingUp,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
      },
    ];
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName}! Here&apos;s your store overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={stat.bgColor}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-12 w-12 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Getting Started</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your store management tools will appear here. Start by adding products to your store.
        </p>
      </Card>
    </div>
  );
}
