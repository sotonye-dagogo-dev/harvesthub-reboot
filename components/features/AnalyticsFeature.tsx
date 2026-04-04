"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";
import {
  getProductsClient,
  getVendorsClient,
  getOrdersClient,
  getUsersClient,
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
  const [users, setUsers] = useState<any[]>([]);
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
        const [p, v, o, u] = await Promise.all([
          getProductsClient(),
          getVendorsClient(),
          getOrdersClient(),
          getUsersClient(),
        ]);

        if (!mounted) return;

        setProducts(Array.isArray(p) ? p : []);
        setVendors(Array.isArray(v) ? v : []);
        setOrders(Array.isArray(o) ? o : []);
        setUsers(Array.isArray(u) ? u : []);
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
    const scopedOrders = currentVendor ? orders.filter((order) => order.vendorId === currentVendor.id) : orders;
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

    const totalUsers = isVendor ? 0 : users.length;
    const buyerCount = isVendor ? 0 : users.filter((u) => u.role === UserRole.BUYER).length;
    const vendorCount = isVendor ? 1 : users.filter((u) => u.role === UserRole.VENDOR).length;

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
  }, [isVendor, orders, products, user?.id, users, vendors]);

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
          <p className="text-2xl font-bold text-ds-text-brand">{formatCurrency(stats.totalRevenue)}</p>
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
    </div>
  );
}
