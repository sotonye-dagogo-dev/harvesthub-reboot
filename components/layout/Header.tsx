"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Wallet,
  LayoutDashboard,
  LogOut,
  Package,
  Heart,
  Store,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/utils/dashboard";
import { Button, ThemeToggle } from "@/components/ui";
import { useCart } from "@/lib/store/cartStore";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const getDashboardLink = () => {
    return getDashboardRoute(user?.role);
  };

  const getOrdersLink = () => resolveOrdersLink(user?.role);

  return (
    <header className="sticky top-0 z-ds-header w-full border-b border-ds-border-base bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-base">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src="/myharvesthublogo.png"
                alt="MyHarvestHub"
                fill
                className="object-contain"
              />
            </div>
            <span className="hidden sm:block text-xl font-bold text-ds-text-primary">
              MyHarvestHub
            </span>
          </Link>

          {/* Search Bar - Always visible */}
          <div className="flex-1 min-w-0 max-w-xl">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-text-placeholder sm:left-3 sm:h-5 sm:w-5" />
              <input
                type="text"
                aria-label="Search products and vendors"
                placeholder="Search..."
                className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-sunken py-2 pl-8 pr-3 text-sm placeholder:text-ds-text-placeholder focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20 sm:pl-10 sm:pr-4 dark:text-ds-text-primary"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />

            {user ? (
              <>
                {/* Dashboard (Admin & Vendor only) */}
                {(user.role === "ADMIN" || user.role === "VENDOR") && (
                  <Link
                    href={getDashboardLink()}
                    className={cn(
                      "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(getDashboardLink())
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden lg:block">Dashboard</span>
                  </Link>
                )}

                {/* Cart - All users */}
                <Link
                  href="/cart"
                  className={cn(
                    "relative flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/cart")
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-ds-full bg-ds-brand-primary text-xs font-medium text-white">
                      {totalItems}
                    </span>
                  )}
                  <span className="hidden lg:block">Cart</span>
                </Link>

                {/* Orders - All users */}
                <Link
                  href={getOrdersLink()}
                  className={cn(
                    "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(getOrdersLink())
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden lg:block">Orders</span>
                </Link>

                {/* Favourites - All users */}
                <Link
                  href="/favourites"
                  className={cn(
                    "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/favourites")
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden lg:block">Favourites</span>
                </Link>

                {/* Wallet - All users */}
                <Link
                  href="/wallet"
                  className={cn(
                    "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/wallet")
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden lg:block">Wallet</span>
                </Link>

                {/* Profile - All users */}
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/profile")
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden lg:block">{user.firstName}</span>
                </Link>

                {/* Buyer -> Vendor conversion */}
                {user.role === "BUYER" && (
                  <Link
                    href="/become-vendor"
                    className={cn(
                      "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive("/become-vendor")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                  >
                    <Store className="h-4 w-4" />
                    <span className="hidden lg:block">Register Store</span>
                  </Link>
                )}

                {/* Logout */}
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:block">Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
            aria-controls="mobile-menu"
            data-expanded={showMobileMenu ? "true" : "false"}
            className="rounded-ds-md p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div id="mobile-menu" className="border-t border-ds-border-base py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-ds-text-primary">Theme</span>
                <ThemeToggle className="p-2" />
              </div>

              {user ? (
                <>
                  {/* Dashboard (Admin & Vendor only) */}
                  {(user.role === "ADMIN" || user.role === "VENDOR") && (
                    <Link
                      href={getDashboardLink()}
                      className={cn(
                        "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                        isActive(getDashboardLink())
                          ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                          : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                  )}

                  {/* Cart */}
                  <Link
                    href="/cart"
                    className={cn(
                      "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/cart")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart {totalItems > 0 && `(${totalItems})`}
                  </Link>

                  {/* Orders */}
                  <Link
                    href={getOrdersLink()}
                    className={cn(
                      "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive(getOrdersLink())
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Package className="h-5 w-5" />
                    Orders
                  </Link>

                  {/* Favourites */}
                  <Link
                    href="/favourites"
                    className={cn(
                      "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/favourites")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Heart className="h-5 w-5" />
                    Favourites
                  </Link>

                  {/* Wallet */}
                  <Link
                    href="/wallet"
                    className={cn(
                      "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/wallet")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Wallet className="h-5 w-5" />
                    Wallet
                  </Link>

                  {/* Profile */}
                  <Link
                    href="/profile"
                    className={cn(
                      "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/profile")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>

                  {user.role === "BUYER" && (
                    <Link
                      href="/become-vendor"
                      className={cn(
                        "flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                        isActive("/become-vendor")
                          ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                          : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Store className="h-5 w-5" />
                      Register Store
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-ds-md px-4 py-3 text-left text-sm font-medium text-ds-status-error-text hover:bg-ds-status-error-bg dark:text-ds-status-error dark:hover:bg-ds-status-error-bg/20"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "rounded-ds-md px-4 py-2 text-sm font-medium transition-colors",
                      isActive("/login")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      "rounded-ds-md px-4 py-2 text-sm font-medium transition-colors",
                      isActive("/signup")
                        ? "bg-ds-brand-primary text-white"
                        : "bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function resolveOrdersLink(role?: string) {
  return "/orders";
}
