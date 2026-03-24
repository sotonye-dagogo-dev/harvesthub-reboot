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
    const totalRevenue = orders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const activeVendors = vendors.filter((v) => v.status === VendorStatus.APPROVED).length;
    const pendingVendors = vendors.filter((v) => v.status === VendorStatus.PENDING).length;

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    const totalUsers = users.length;
    const buyerCount = users.filter((u) => u.role === UserRole.BUYER).length;
    const vendorCount = users.filter((u) => u.role === UserRole.VENDOR).length;

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
  }, [orders, vendors, products, users]);

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
        <p className="mt-1 text-ds-text-secondary">Overview of platform performance and key metrics.</p>
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
          <p className="text-sm text-ds-text-secondary">Active Vendors</p>
          <p className="text-2xl font-bold text-ds-status-success-text">{stats.activeVendors}</p>
        </Card>
        <Card>
          <p className="text-sm text-ds-text-secondary">Total Users</p>
          <p className="text-2xl font-bold text-ds-status-warning-text">{stats.totalUsers}</p>
        </Card>
      </div>
    </div>
  );
}
