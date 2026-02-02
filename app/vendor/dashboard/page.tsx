"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import { Package, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";

export default function VendorDashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Sales",
      value: "₦0",
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Orders",
      value: "0",
      icon: ShoppingBag,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Products",
      value: "0",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Revenue",
      value: "₦0",
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

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
