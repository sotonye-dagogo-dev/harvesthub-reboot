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
  Bug,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buildNav } from "@/lib/navigation";
import { UserRole } from "@/lib/constants";

interface SidebarProps {
  type: "vendor" | "admin";
}

const ADMIN_LINKS = new Set([
  "/operations/dashboard",
  "/analytics",
  "/operations/vendors",
  "/operations/users",
  "/operations/banners",
  "/operations/ads",
  "/operations/vendor-content",
  "/operations/bug-reports",
  "/operations/settings",
  "/operations/public-content",
  "/wallet",
  "/notifications",
  "/profile",
]);

const VENDOR_LINKS = new Set([
  "/operations/dashboard",
  "/analytics",
  "/products",
  "/orders",
  "/operations/marketing-content",
  "/store-settings",
  "/wallet",
  "/notifications",
  "/profile",
]);

function getSidebarLinks(type: "vendor" | "admin") {
  const role = type === "admin" ? UserRole.ADMIN : UserRole.VENDOR;
  const allowed = type === "admin" ? ADMIN_LINKS : VENDOR_LINKS;
  return buildNav(role).filter((item) => allowed.has(item.path));
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = getSidebarLinks(type);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "/operations/dashboard": LayoutDashboard,
    "/analytics": BarChart3,
    "/operations/vendors": Users,
    "/operations/users": Users,
    "/operations/banners": AlertCircle,
    "/operations/ads": Megaphone,
    "/operations/public-content": Megaphone,
    "/operations/vendor-content": Megaphone,
    "/operations/bug-reports": Bug,
    "/operations/settings": Settings,
    "/operations/marketing-content": Megaphone,
    "/products": Package,
    "/orders": ShoppingBag,
    "/store-settings": Settings,
    "/wallet": Wallet,
    "/notifications": BarChart3,
    "/profile": Users,
  };

  const getIcon = (href: string) => {
    return iconMap[href];
  };

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
            className="m-2 flex items-center justify-center rounded-ds-md p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {links.map((link) => {
              const href = link.path;
              const Icon = getIcon(href);
              const active = isActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null}
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-ds-header border-t border-ds-border-base bg-ds-surface-base dark:bg-ds-surface-base md:hidden">
        <div className="flex items-center overflow-x-auto px-2 py-1">
          {links.map((link) => {
            const href = link.path;
            const Icon = getIcon(href);
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[72px] flex-col items-center gap-1 px-3 py-2 text-xs font-medium",
                  active ? "text-ds-text-brand" : "text-ds-text-secondary"
                )}
              >
                {Icon ? <Icon className="h-5 w-5" /> : null}
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
