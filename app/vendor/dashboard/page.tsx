"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, StatCard } from "@/components/ui";
import type { StatColorPreset } from "@/components/ui";
import { Package, ShoppingBag, TrendingUp, DollarSign, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
import {
  getProductsClient,
  getOrdersClient,
  getVendorsClient,
} from "@/lib/data/clientDataFetchers";
import type { Product, Order, Vendor } from "@/lib/types";
import { OrderStatus } from "@/lib/constants";

export default function VendorDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<
    { title: string; value: string; icon: LucideIcon; colorPreset: StatColorPreset }[]
  >([]);
  const [_mockProducts, setMockProducts] = useState<Product[]>([]);
  const [_mockOrders, setMockOrders] = useState<Order[]>([]);
  const [_mockVendors, setMockVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user) return;
      try {
        const [vendorsRaw, productsRaw, ordersRaw] = await Promise.all([
          getVendorsClient(),
          getProductsClient({}),
          getOrdersClient(),
        ]);

        if (!mounted) return;

        const vendorsList = Array.isArray(vendorsRaw) ? vendorsRaw : [];
        const productsList = Array.isArray(productsRaw) ? productsRaw : [];
        const ordersList = Array.isArray(ordersRaw) ? ordersRaw : [];

        const vendor = vendorsList.find((v) => v.userId === user.id);
        const vendorProducts = vendor
          ? productsList.filter((p: any) => p.vendorId === vendor.id)
          : [];
        const vendorOrders = vendor
          ? ordersList.filter(
              (order: any) =>
                Array.isArray(order.items) &&
                order.items.some((it: any) =>
                  vendorProducts.some((p: any) => p.id === it.productId)
                )
            )
          : [];

        const totalRevenue = vendorOrders.reduce((sum: number, order: any) => {
          const vendorItemsTotal = (order.items || [])
            .filter((item: any) => vendorProducts.some((p: any) => p.id === item.productId))
            .reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
          return sum + vendorItemsTotal;
        }, 0);

        const completedOrders = vendorOrders.filter((o: any) => o.status === OrderStatus.DELIVERED);
        const totalSales = completedOrders.reduce((sum: number, order: any) => {
          const vendorItemsTotal = (order.items || [])
            .filter((item: any) => vendorProducts.some((p: any) => p.id === item.productId))
            .reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
          return sum + vendorItemsTotal;
        }, 0);

        setMockVendors(vendorsList.length ? vendorsList : []);
        setMockProducts(productsList.length ? productsList : []);
        setMockOrders(ordersList.length ? ordersList : []);

        setStats([
          {
            title: "Total Sales",
            value: `\u20a6${totalSales.toLocaleString()}`,
            icon: DollarSign,
            colorPreset: "brand",
          },
          {
            title: "Orders",
            value: vendorOrders.length.toString(),
            icon: ShoppingBag,
            colorPreset: "success",
          },
          {
            title: "Products",
            value: vendorProducts.length.toString(),
            icon: Package,
            colorPreset: "info",
          },
          {
            title: "Revenue",
            value: `\u20a6${totalRevenue.toLocaleString()}`,
            icon: TrendingUp,
            colorPreset: "warning",
          },
        ]);
      } catch (e) {
        if (!mounted) return;

        // In case of errors, avoid falling back to undefined mock variables.
        // If in production, show zeros/empty sets; if in development and mock enabled, attempt to import mock data.
        if (!useMockData) {
          setMockVendors([]);
          setMockProducts([]);
          setMockOrders([]);
          setStats([
            { title: "Total Sales", value: `₦0`, icon: DollarSign, colorPreset: "brand" },
            { title: "Orders", value: "0", icon: ShoppingBag, colorPreset: "success" },
            { title: "Products", value: "0", icon: Package, colorPreset: "info" },
            { title: "Revenue", value: `₦0`, icon: TrendingUp, colorPreset: "warning" },
          ]);
          return;
        }

        try {
          const m = await import("@/lib/data/mockData");
          const vFallback = Array.isArray(m.mockVendors) ? m.mockVendors : [];
          const pFallback = Array.isArray(m.mockProducts) ? m.mockProducts : [];
          const oFallback = Array.isArray(m.mockOrders) ? m.mockOrders : [];

          const vendor = vFallback.find((v: any) => v.userId === user.id);
          const vendorProducts = vendor
            ? pFallback.filter((p: any) => p.vendorId === vendor.id)
            : [];
          const vendorOrders = oFallback.filter(
            (order: any) =>
              Array.isArray(order.items) &&
              order.items.some((it: any) => vendorProducts.some((p: any) => p.id === it.productId))
          );

          const totalRevenue = vendorOrders.reduce((sum: number, order: any) => {
            const vendorItemsTotal = (order.items || [])
              .filter((item: any) => vendorProducts.some((p: any) => p.id === item.productId))
              .reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
            return sum + vendorItemsTotal;
          }, 0);

          const completedOrders = vendorOrders.filter(
            (o: any) => o.status === OrderStatus.DELIVERED
          );
          const totalSales = completedOrders.reduce((sum: number, order: any) => {
            const vendorItemsTotal = (order.items || [])
              .filter((item: any) => vendorProducts.some((p: any) => p.id === item.productId))
              .reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
            return sum + vendorItemsTotal;
          }, 0);

          if (!mounted) return;
          setMockVendors(vFallback);
          setMockProducts(pFallback);
          setMockOrders(oFallback);
          setStats([
            {
              title: "Total Sales",
              value: `₦${totalSales.toLocaleString()}`,
              icon: DollarSign,
              colorPreset: "brand",
            },
            {
              title: "Orders",
              value: vendorOrders.length.toString(),
              icon: ShoppingBag,
              colorPreset: "success",
            },
            {
              title: "Products",
              value: vendorProducts.length.toString(),
              icon: Package,
              colorPreset: "info",
            },
            {
              title: "Revenue",
              value: `₦${totalRevenue.toLocaleString()}`,
              icon: TrendingUp,
              colorPreset: "warning",
            },
          ]);
        } catch (err) {
          if (!mounted) return;
          setMockVendors([]);
          setMockProducts([]);
          setMockOrders([]);
          setStats([
            { title: "Total Sales", value: `₦0`, icon: DollarSign, colorPreset: "brand" },
            { title: "Orders", value: "0", icon: ShoppingBag, colorPreset: "success" },
            { title: "Products", value: "0", icon: Package, colorPreset: "info" },
            { title: "Revenue", value: `₦0`, icon: TrendingUp, colorPreset: "warning" },
          ]);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
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
