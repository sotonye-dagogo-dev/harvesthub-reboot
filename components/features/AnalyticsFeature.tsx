"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";
import {
  getProductsClient,
  getVendorsClient,
  getOrdersClient,
  getUserCountsClient,
} from "@/lib/data/clientDataFetchers";
import { formatCurrency } from "@/lib/utils";
import { UserRole, OrderStatus, VendorStatus } from "@/lib/constants";
import type { Order, Product, Vendor } from "@/lib/types";

export function AnalyticsFeature() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isVendor = user?.role === UserRole.VENDOR;

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCounts, setUserCounts] = useState({ totalUsers: 0, buyers: 0, vendors: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (![UserRole.ADMIN, UserRole.VENDOR].includes(user.role)) {
      setError("Analytics are only available for vendor and admin users.");
      return;
    }

    let mounted = true;
    async function load() {
      try {
        const results = await Promise.allSettled([
          getProductsClient(),
          getVendorsClient(),
          getOrdersClient(),
          getUserCountsClient(),
        ]);

        if (!mounted) return;

        const [p, v, o, u] = results;
        setProducts(p.status === "fulfilled" && Array.isArray(p.value) ? p.value : []);
        setVendors(v.status === "fulfilled" && Array.isArray(v.value) ? v.value : []);
        setOrders(o.status === "fulfilled" && Array.isArray(o.value) ? o.value : []);
        setUserCounts(
          u.status === "fulfilled" && typeof u.value === "object" && u.value !== null
            ? {
                totalUsers: typeof u.value.totalUsers === "number" ? u.value.totalUsers : 0,
                buyers: typeof u.value.buyers === "number" ? u.value.buyers : 0,
                vendors: typeof u.value.vendors === "number" ? u.value.vendors : 0,
              }
            : { totalUsers: 0, buyers: 0, vendors: 0 }
        );

        if (results.every((entry) => entry.status === "rejected")) {
          setError("Failed to load analytics. Please try again later.");
        }
      } catch (e) {
        console.error("Analytics load failure", e);
        if (!mounted) return;
        setError("Failed to load analytics. Please try again later.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isLoading, router, user]);

  const stats = useMemo(() => {
    const currentVendor = isVendor ? vendors.find((vendor) => vendor.userId === user?.id) : null;
    const scopedOrders = currentVendor
      ? orders.filter((order) => order.vendorId === currentVendor.id)
      : orders;
    const scopedProducts = currentVendor
      ? products.filter((product) => product.vendorId === currentVendor.id)
      : products;

    const totalRevenue = scopedOrders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const totalOrders = scopedOrders.length;
    const completedOrders = scopedOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const pendingOrders = scopedOrders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledOrders = scopedOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const activeVendors = isVendor
      ? currentVendor
        ? 1
        : 0
      : vendors.filter((v) => v.status === VendorStatus.APPROVED).length;
    const pendingVendors = isVendor
      ? currentVendor
        ? 0
        : 1
      : vendors.filter((v) => v.status === VendorStatus.PENDING).length;

    const totalProducts = scopedProducts.length;
    const activeProducts = scopedProducts.filter((p) => p.isActive).length;
    const outOfStock = scopedProducts.filter((p) => p.stock === 0).length;

    const totalUsers = isVendor ? 0 : userCounts.totalUsers;
    const buyerCount = isVendor ? 0 : userCounts.buyers;
    const vendorCount = isVendor ? 1 : userCounts.vendors;

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

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
      totalTransactions: 0,
    };
  }, [isVendor, orders, products, user?.id, userCounts, vendors]);

  if (isLoading) {
    return <div className="text-center py-12">Loading analytics ...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState title="Access Denied" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Analytics</h1>
        <p className="mt-1 text-ds-text-secondary">
          {isVendor
            ? "Overview of your store performance and order metrics."
            : "Overview of platform performance and key metrics."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-ds-text-secondary">Total Revenue</p>
          <p className="text-2xl font-bold text-ds-text-brand">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ds-text-secondary">Total Orders</p>
          <p className="text-2xl font-bold text-ds-status-info-text">{stats.totalOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-ds-text-secondary">Active Products</p>
          <p className="text-2xl font-bold text-ds-status-success-text">{stats.activeProducts}</p>
        </Card>
        <Card>
          <p className="text-sm text-ds-text-secondary">
            {isVendor ? "Pending Orders" : "Total Users"}
          </p>
          <p className="text-2xl font-bold text-ds-status-warning-text">
            {isVendor ? stats.pendingOrders : stats.totalUsers}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-medium text-ds-text-secondary">Order Status Breakdown</p>
          <div className="space-y-2">
            {[
              {
                label: "Completed",
                value: stats.completedOrders,
                total: stats.totalOrders,
                color: "bg-ds-status-success-bg",
              },
              {
                label: "Pending",
                value: stats.pendingOrders,
                total: stats.totalOrders,
                color: "bg-ds-status-warning-bg",
              },
              {
                label: "Cancelled",
                value: stats.cancelledOrders,
                total: stats.totalOrders,
                color: "bg-ds-status-error-bg",
              },
            ].map((item) => {
              const percentage = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-ds-text-secondary">
                    <span>{item.label}</span>
                    <span>
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ds-surface-muted">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-medium text-ds-text-secondary">Catalog Health</p>
          {stats.totalProducts === 0 ? (
            <p className="text-sm text-ds-text-secondary">No product data is available yet.</p>
          ) : (
            <div className="space-y-2">
              {[
                {
                  label: "Active Products",
                  value: stats.activeProducts,
                  total: stats.totalProducts,
                  color: "bg-ds-brand-primary",
                },
                {
                  label: "Out of Stock",
                  value: stats.outOfStock,
                  total: stats.totalProducts,
                  color: "bg-ds-status-warning-bg",
                },
              ].map((item) => {
                const percentage = Math.round((item.value / item.total) * 100);
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-ds-text-secondary">
                      <span>{item.label}</span>
                      <span>
                        {item.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ds-surface-muted">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
