"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import { Users, Package, ShoppingBag, Store, TrendingUp, AlertCircle } from "lucide-react";
import { mockUsers, mockVendors, mockProducts, mockOrders, mockReviews } from "@/lib/data/mockData";
import { useMemo } from "react";
import { OrderStatus } from "@/lib/constants";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Calculate platform stats from mock data
  const stats = useMemo(() => {
    const totalRevenue = mockOrders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .reduce((sum, order) => sum + order.total, 0);

    const pendingReviews = mockReviews.filter((r) => r.status === "PENDING").length;

    return [
      {
        title: "Total Users",
        value: mockUsers.length.toString(),
        icon: Users,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
      },
      {
        title: "Total Vendors",
        value: mockVendors.length.toString(),
        icon: Store,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        title: "Total Products",
        value: mockProducts.length.toString(),
        icon: Package,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      },
      {
        title: "Total Orders",
        value: mockOrders.length.toString(),
        icon: ShoppingBag,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
      },
      {
        title: "Revenue",
        value: `₦${totalRevenue.toLocaleString()}`,
        icon: TrendingUp,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      },
      {
        title: "Pending Reviews",
        value: pendingReviews.toString(),
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName}! Here&apos;s your platform overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Management</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Platform administration tools will appear here. Manage vendors, products, and users from
          the sidebar.
        </p>
      </Card>
    </div>
  );
}
