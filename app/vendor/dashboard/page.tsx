"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, StatCard } from "@/components/ui";
import type { StatColorPreset } from "@/components/ui";
import { Package, ShoppingBag, TrendingUp, DollarSign, LucideIcon } from "lucide-react";
import { mockProducts, mockOrders, mockVendors } from "@/lib/data/mockData";
import { useMemo } from "react";
import { OrderStatus } from "@/lib/constants";

export default function VendorDashboardPage() {
  const { user } = useAuth();

  // Calculate vendor stats from mock data
  const stats = useMemo(() => {
    if (!user) return [];

    // Resolve vendor record from user ID
    const vendor = mockVendors.find((v) => v.userId === user.id);
    // Get vendor's products using vendor.id (not user.id)
    const vendorProducts = mockProducts.filter((p) => p.vendorId === vendor?.id);
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
      { title: "Total Sales", value: `\u20a6${totalSales.toLocaleString()}`, icon: DollarSign, colorPreset: "brand" as StatColorPreset },
      { title: "Orders", value: vendorOrders.length.toString(), icon: ShoppingBag, colorPreset: "success" as StatColorPreset },
      { title: "Products", value: productCount.toString(), icon: Package, colorPreset: "info" as StatColorPreset },
      { title: "Revenue", value: `\u20a6${totalRevenue.toLocaleString()}`, icon: TrendingUp, colorPreset: "warning" as StatColorPreset },
    ] satisfies { title: string; value: string; icon: LucideIcon; colorPreset: StatColorPreset }[];
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Vendor Dashboard</h1>
        <p className="mt-1 text-ds-text-secondary">
          Welcome back, {user?.firstName}! Here&apos;s your store overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Getting Started</h2>
        <p className="mt-2 text-sm text-ds-text-secondary">
          Your store management tools will appear here. Start by adding products to your store.
        </p>
      </Card>
    </div>
  );
}
