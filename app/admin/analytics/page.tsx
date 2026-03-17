"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card } from "@/components/ui";
import {
  mockUsers,
  mockVendors as _mockVendorsFallback,
  mockProducts as _mockProductsFallback,
  mockOrders as _mockOrdersFallback,
  mockTransactions as _mockTransactionsFallback,
} from "@/lib/data/mockData";
import {
  getProductsClient,
  getVendorsClient,
  getOrdersClient,
} from "@/lib/data/clientDataFetchers";
import type { Product, Vendor, Order, Transaction } from "@/lib/types";
import {
  Users,
  ShoppingBag,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  BarChart3,
  Percent,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { UserRole, OrderStatus, VendorStatus } from "@/lib/constants";
import { StatusTag } from "@/components/ui";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [mockProducts, setMockProducts] = useState<Product[]>([]);
  const [mockVendors, setMockVendors] = useState<Vendor[]>([]);
  const [mockOrders, setMockOrders] = useState<Order[]>([]);
  const [mockTransactions, setMockTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, v, o] = await Promise.all([
          getProductsClient(),
          getVendorsClient(),
          getOrdersClient(),
        ]);
        if (!mounted) return;
        setMockProducts(Array.isArray(p) ? p : []);
        setMockVendors(Array.isArray(v) ? v : []);
        setMockOrders(Array.isArray(o) ? o : []);
      } catch (e) {
        if (process.env.NODE_ENV === "production") {
          if (!mounted) return;
          setMockProducts([]);
          setMockVendors([]);
          setMockOrders([]);
          setMockTransactions([]);
        } else {
          const m = await import("@/lib/data/mockData");
          if (!mounted) return;
          setMockProducts(m.mockProducts ?? _mockProductsFallback ?? []);
          setMockVendors(m.mockVendors ?? _mockVendorsFallback ?? []);
          setMockOrders(m.mockOrders ?? _mockOrdersFallback ?? []);
          setMockTransactions(m.mockTransactions ?? _mockTransactionsFallback ?? []);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = mockOrders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = mockOrders.length;
    const completedOrders = mockOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const pendingOrders = mockOrders.filter((o) => o.status === OrderStatus.PENDING).length;
    const cancelledOrders = mockOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const activeVendors = mockVendors.filter((v) => v.status === VendorStatus.APPROVED).length;
    const pendingVendors = mockVendors.filter((v) => v.status === VendorStatus.PENDING).length;

    const totalProducts = mockProducts.length;
    const activeProducts = mockProducts.filter((p) => p.isActive).length;
    const outOfStock = mockProducts.filter((p) => p.stock === 0).length;

    const totalUsers = mockUsers.length;
    const buyerCount = mockUsers.filter((u) => u.role === UserRole.BUYER).length;
    const vendorCount = mockUsers.filter((u) => u.role === UserRole.VENDOR).length;

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    const totalTransactions = mockTransactions?.length || 0;

    // Discount analytics
    const productsWithDiscount = mockProducts.filter((p) => p.discount && p.discount > 0);
    const discountedProductCount = productsWithDiscount.length;
    const avgDiscount =
      discountedProductCount > 0
        ? productsWithDiscount.reduce((sum, p) => sum + (p.discount || 0), 0) /
          discountedProductCount
        : 0;
    const totalDiscountSavings = productsWithDiscount.reduce((sum, p) => {
      const saving = (p.price * (p.discount || 0)) / 100;
      return sum + saving * (p.sales || 0);
    }, 0);
    const highestDiscount =
      discountedProductCount > 0
        ? Math.max(...productsWithDiscount.map((p) => p.discount || 0))
        : 0;
    const discountedActiveProducts = productsWithDiscount.filter((p) => p.isActive).length;

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
      totalTransactions,
      discountedProductCount,
      avgDiscount,
      totalDiscountSavings,
      highestDiscount,
      discountedActiveProducts,
    };
  }, [mockProducts, mockOrders, mockVendors, mockTransactions]);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    mockOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / mockOrders.length) * 100).toFixed(1),
    }));
  }, [mockOrders]);

  // Top vendors by products
  const topVendors = useMemo(() => {
    return mockVendors
      .map((v) => ({
        ...v,
        productCount: mockProducts.filter((p) => p.vendorId === v.id).length,
        orderCount: mockOrders.filter((o) =>
          o.items?.some((item) =>
            mockProducts.find((p) => p.id === item.productId && p.vendorId === v.id)
          )
        ).length,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 5);
  }, [mockVendors, mockProducts]);

  // Top products by sales
  const topProducts = useMemo(() => {
    return [...mockProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  }, [mockProducts]);

  // Top discounted products
  const topDiscountedProducts = useMemo(() => {
    return mockProducts
      .filter((p) => p.discount && p.discount > 0 && p.isActive)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 5);
  }, [mockProducts]);

  if (user?.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Platform Analytics</h1>
        <p className="mt-1 text-ds-text-secondary">
          Overview of platform performance and key metrics
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-ds-brand-surface to-ds-brand-subtle dark:from-ds-palette-purple-900/30 dark:to-ds-palette-purple-800/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-text-secondary">Total Revenue</p>
              <p className="text-2xl font-bold text-ds-text-brand">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-ds-brand-accent" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-ds-status-info-bg to-ds-status-info-bg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-text-secondary">Total Orders</p>
              <p className="text-2xl font-bold text-ds-status-info-text">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="h-10 w-10 text-ds-status-info" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-ds-status-success-bg to-ds-status-success-bg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-text-secondary">Active Vendors</p>
              <p className="text-2xl font-bold text-ds-status-success-text">
                {stats.activeVendors}
              </p>
            </div>
            <Store className="h-10 w-10 text-ds-status-success" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-ds-status-warning-bg to-ds-status-warning-bg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ds-text-secondary">Total Users</p>
              <p className="text-2xl font-bold text-ds-status-warning-text">{stats.totalUsers}</p>
            </div>
            <Users className="h-10 w-10 text-ds-status-warning" />
          </div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-ds-status-success" />
            <div>
              <p className="text-xs text-ds-text-tertiary">Avg. Order Value</p>
              <p className="text-lg font-bold">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-ds-status-info" />
            <div>
              <p className="text-xs text-ds-text-tertiary">Active Products</p>
              <p className="text-lg font-bold">
                {stats.activeProducts}/{stats.totalProducts}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-ds-status-warning" />
            <div>
              <p className="text-xs text-ds-text-tertiary">Out of Stock</p>
              <p className="text-lg font-bold">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-ds-brand-primary-light" />
            <div>
              <p className="text-xs text-ds-text-tertiary">Transactions</p>
              <p className="text-lg font-bold">{stats.totalTransactions}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ds-text-primary">Order Status Distribution</h2>
          <div className="space-y-3">
            {orderStatusData.map(({ status, count, percentage }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusTag domain="order" status={status} />
                  <span className="text-sm text-ds-text-secondary">{count} orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-ds-full bg-ds-surface-disabled dark:bg-ds-surface-overlay">
                    <div
                      className="h-full rounded-ds-full bg-ds-brand-primary-light"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Breakdown */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ds-text-primary">User Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-ds-md bg-ds-status-success-bg p-4 dark:bg-ds-status-success-bg/20">
              <div>
                <p className="text-sm text-ds-text-secondary">Buyers</p>
                <p className="text-2xl font-bold text-ds-status-success-text">{stats.buyerCount}</p>
              </div>
              <div className="text-right text-sm text-ds-text-tertiary">
                {((stats.buyerCount / stats.totalUsers) * 100).toFixed(0)}% of users
              </div>
            </div>
            <div className="flex items-center justify-between rounded-ds-md bg-ds-status-info-bg p-4 dark:bg-ds-status-info-bg/20">
              <div>
                <p className="text-sm text-ds-text-secondary">Vendors</p>
                <p className="text-2xl font-bold text-ds-status-info-text">{stats.vendorCount}</p>
              </div>
              <div className="text-right text-sm text-ds-text-tertiary">
                {((stats.vendorCount / stats.totalUsers) * 100).toFixed(0)}% of users
              </div>
            </div>
            <div className="flex items-center justify-between rounded-ds-md bg-ds-brand-surface p-4 dark:bg-ds-brand-subtle">
              <div>
                <p className="text-sm text-ds-text-secondary">Pending Vendors</p>
                <p className="text-2xl font-bold text-ds-text-brand">{stats.pendingVendors}</p>
              </div>
              <div className="text-right text-sm text-ds-text-tertiary">Awaiting approval</div>
            </div>
          </div>
        </Card>

        {/* Top Vendors */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ds-text-primary">Top Vendors</h2>
          {topVendors.length === 0 ? (
            <p className="text-ds-text-tertiary">No vendor data available</p>
          ) : (
            <div className="space-y-3">
              {topVendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between rounded-ds-md border border-ds-border-subtle p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-sm font-bold text-ds-text-brand">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-ds-text-primary">{vendor.storeName}</p>
                      <p className="text-xs text-ds-text-tertiary">
                        {vendor.productCount} products
                      </p>
                    </div>
                  </div>
                  <StatusTag domain="vendor" status={vendor.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ds-text-primary">Top Products by Sales</h2>
          {topProducts.length === 0 ? (
            <p className="text-ds-text-tertiary">No product data available</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-ds-md border border-ds-border-subtle p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-ds-status-info-bg text-sm font-bold text-ds-status-info-text dark:bg-ds-status-info-bg/30">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-ds-text-primary">{product.name}</p>
                      <p className="text-xs text-ds-text-tertiary">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ds-text-secondary">
                    {product.sales || 0} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Discount Analytics Section */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-ds-text-primary flex items-center gap-2">
          <Percent className="h-5 w-5 text-ds-text-brand" />
          Discount Analytics
        </h2>

        {/* Discount Summary Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-ds-status-error" />
              <div>
                <p className="text-xs text-ds-text-tertiary">Discounted Products</p>
                <p className="text-lg font-bold">
                  {stats.discountedActiveProducts}/{stats.activeProducts} active
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Percent className="h-8 w-8 text-ds-status-warning" />
              <div>
                <p className="text-xs text-ds-text-tertiary">Avg. Discount</p>
                <p className="text-lg font-bold">{stats.avgDiscount.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-ds-status-info" />
              <div>
                <p className="text-xs text-ds-text-tertiary">Highest Discount</p>
                <p className="text-lg font-bold">{stats.highestDiscount}%</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-ds-status-success" />
              <div>
                <p className="text-xs text-ds-text-tertiary">Total Savings (est.)</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalDiscountSavings)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Discounted Products */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-ds-text-primary">Top Discounted Products</h2>
          {topDiscountedProducts.length === 0 ? (
            <p className="text-ds-text-tertiary">No discounted products</p>
          ) : (
            <div className="space-y-3">
              {topDiscountedProducts.map((product, index) => {
                const discountedPrice =
                  product.price - (product.price * (product.discount || 0)) / 100;
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-ds-md border border-ds-border-subtle p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-ds-full bg-ds-status-error/10 text-sm font-bold text-ds-status-error">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-ds-text-primary">{product.name}</p>
                        <p className="text-xs text-ds-text-tertiary">
                          {vendor?.storeName || "Unknown"} &bull;{" "}
                          <span className="line-through">{formatCurrency(product.price)}</span> →{" "}
                          {formatCurrency(discountedPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-ds-sm bg-ds-status-error px-2 py-0.5 text-sm font-semibold text-white">
                      -{product.discount}%
                    </span>
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
