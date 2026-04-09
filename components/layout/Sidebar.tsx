"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bug,
  CircleUser,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  Package,
  ShoppingBag,
  BarChart3,
  Wallet,
  Settings,
  Store,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buildNav } from "@/lib/navigation";
import { UserRole } from "@/lib/constants";

interface SidebarProps {
  type: "vendor" | "admin";
}

const ADMIN_LINK_ORDER = [
  "/operations/dashboard",
  "/operations/orders",
  "/operations/products",
  "/operations/vendors",
  "/operations/users",
  "/operations/ads",
  "/operations/banners",
  "/operations/vendor-content",
  "/operations/bug-reports",
  "/operations/public-content",
  "/operations/settings",
  "/analytics",
  "/wallet",
  "/notifications",
  "/notifications/settings",
  "/profile",
] as const;

const VENDOR_LINK_ORDER = [
  "/operations/dashboard",
  "/operations/orders",
  "/operations/products",
  "/operations/marketing-content",
  "/analytics",
  "/store-settings",
  "/wallet",
  "/notifications",
  "/notifications/settings",
  "/profile",
] as const;

function getSidebarLinks(type: "vendor" | "admin") {
  const role = type === "admin" ? UserRole.ADMIN : UserRole.VENDOR;
  const orderedPaths = type === "admin" ? ADMIN_LINK_ORDER : VENDOR_LINK_ORDER;
  const navByPath = new Map(buildNav(role).map((item) => [item.path, item]));

  return orderedPaths
    .map((path) => navByPath.get(path))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = getSidebarLinks(type);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "/operations/dashboard": LayoutDashboard,
    "/analytics": BarChart3,
    "/operations/vendors": Store,
    "/operations/users": Users,
    "/operations/banners": ImageIcon,
    "/operations/ads": Megaphone,
    "/operations/public-content": FileText,
    "/operations/orders": ShoppingBag,
    "/operations/vendor-content": FileText,
    "/operations/bug-reports": Bug,
    "/operations/settings": Settings,
    "/operations/marketing-content": Megaphone,
    "/operations/products": Package,
    "/store-settings": Settings,
    "/wallet": Wallet,
    "/notifications": Bell,
    "/notifications/settings": Settings,
    "/profile": CircleUser,
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
          "hidden h-[calc(100vh-4rem)] overflow-hidden border-r border-ds-border-base bg-ds-surface-base transition-all duration-300 dark:bg-ds-surface-base md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="m-2 flex items-center justify-center rounded-ds-md p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          {/* Navigation Links */}
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4">
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
                  "flex min-w-[72px] flex-col items-center gap-1 px-2 py-2 text-center text-xs font-medium",
                  active ? "text-ds-text-brand" : "text-ds-text-secondary"
                )}
              >
                {Icon ? <Icon className="h-5 w-5" /> : null}
                <span className="max-w-[72px] whitespace-normal break-words leading-tight">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
