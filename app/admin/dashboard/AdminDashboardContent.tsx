"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, StatCard } from "@/components/ui";
import type { StatColorPreset } from "@/components/ui";
import {
  Users,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { OrderStatus } from "@/lib/constants";
import type { User, Vendor, Product, Order, Review } from "@/lib/types";

interface AdminDashboardContentProps {
  users: User[];
  vendors: Vendor[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
}

export function AdminDashboardContent({
  users,
  vendors,
  products,
  orders,
  reviews,
}: AdminDashboardContentProps) {
  const { user } = useAuth();

  // Calculate platform stats
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + order.total, 0);

    const pendingReviews = reviews.filter((r) => r.status === "PENDING").length;

    return [
      {
        title: "Total Users",
        value: users.length.toString(),
        icon: Users,
        colorPreset: "brand" as StatColorPreset,
      },
      {
        title: "Total Vendors",
        value: vendors.length.toString(),
        icon: Store,
        colorPreset: "info" as StatColorPreset,
      },
      {
        title: "Total Products",
        value: products.length.toString(),
        icon: Package,
        colorPreset: "success" as StatColorPreset,
      },
      {
        title: "Total Orders",
        value: orders.length.toString(),
        icon: ShoppingBag,
        colorPreset: "warning" as StatColorPreset,
      },
      {
        title: "Revenue",
        value: `₦${totalRevenue.toLocaleString()}`,
        icon: TrendingUp,
        colorPreset: "success" as StatColorPreset,
      },
      {
        title: "Pending Reviews",
        value: pendingReviews.toString(),
        icon: AlertCircle,
        colorPreset: "error" as StatColorPreset,
      },
    ] satisfies { title: string; value: string; icon: LucideIcon; colorPreset: StatColorPreset }[];
  }, [users, vendors, products, orders, reviews]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-ds-text-secondary">
          Welcome back, {user?.firstName}! Here&apos;s your platform overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-ds-text-primary">Platform Management</h2>
        <p className="mt-2 text-sm text-ds-text-secondary">
          Platform administration tools are available from the sidebar. Manage vendors, products,
          and users.
        </p>
      </Card>
    </div>
  );
}
