"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Wallet,
  Settings,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  type: "vendor" | "admin";
}

const vendorLinks = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/vendor/store-settings", label: "Store Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/banners", label: "Banners", icon: AlertCircle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = type === "vendor" ? vendorLinks : adminLinks;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-[calc(100vh-4rem)] border-r border-ds-border-base bg-ds-surface-base transition-all duration-300  dark:bg-ds-surface-base md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="m-2 flex items-center justify-center rounded-lg p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-ds-header border-t border-ds-border-base bg-ds-surface-base dark:bg-ds-surface-base md:hidden">
        <div className="flex items-center justify-around">
          {links.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium",
                  active
                    ? "text-ds-text-brand"
                    : "text-ds-text-secondary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
