"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  ChevronRight,
  Wallet,
  LayoutDashboard,
  LogOut,
  Package,
  Heart,
  Store,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/utils/dashboard";
import { Button, ThemeToggle } from "@/components/ui";
import { SearchBar } from "@/components/features";
import { useCart } from "@/lib/store/cartStore";
import { cn } from "@/lib/utils";
import { PRODUCT_DISCOVERY_CATEGORIES } from "@/lib/config/productDiscovery";
import { useNotifications } from "@/lib/contexts/NotificationContext";

function renderCounterBadge(count: number) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-ds-full bg-ds-status-error px-1 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showDesktopCategories, setShowDesktopCategories] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const getDashboardLink = () => {
    return getDashboardRoute(user?.role);
  };
  const showDesktopCategoryStrip = pathname === "/" || pathname.startsWith("/products");

  const getOrdersLink = () => resolveOrdersLink();
  const handleHeaderSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

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
            <SearchBar
              onSearch={handleHeaderSearch}
              placeholder="Search products and vendors"
              showRecentSearches
            />
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
                  {renderCounterBadge(totalItems)}
                  <span className="hidden lg:block">Cart</span>
                </Link>

                {/* Notifications - All users */}
                <Link
                  href="/notifications"
                  className={cn(
                    "relative flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/notifications")
                      ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                      : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <Bell className="h-4 w-4" />
                  {renderCounterBadge(unreadCount)}
                  <span className="hidden lg:block">Notifications</span>
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
            onClick={() => {
              const next = !showMobileMenu;
              setShowMobileMenu(next);
              if (!next) {
                setShowMobileCategories(false);
              }
            }}
            aria-label="Toggle mobile menu"
            aria-controls="mobile-menu"
            data-expanded={showMobileMenu ? "true" : "false"}
            className="rounded-ds-md p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {showDesktopCategoryStrip && (
          <div className="hidden items-center gap-2 border-t border-ds-border-base py-2 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDesktopCategories((prev) => !prev)}
                aria-controls="desktop-categories-menu"
                data-expanded={showDesktopCategories ? "true" : "false"}
                className="inline-flex items-center gap-2 rounded-ds-md bg-ds-brand-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-ds-brand-primary-hover"
              >
                All Categories
                <ChevronDown className="h-4 w-4" />
              </button>
              {showDesktopCategories && (
                <div
                  id="desktop-categories-menu"
                  className="absolute left-0 top-12 z-40 max-h-[60vh] w-80 overflow-y-auto rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 shadow-ds-lg"
                >
                  <div className="grid grid-cols-1 gap-1">
                    {PRODUCT_DISCOVERY_CATEGORIES.map((category) => (
                      <Link
                        key={category.value}
                        href={`/products?category=${category.slug}`}
                        className="rounded-ds-sm px-3 py-2 text-sm text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken hover:text-ds-text-primary"
                        onClick={() => setShowDesktopCategories(false)}
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {PRODUCT_DISCOVERY_CATEGORIES.slice(0, 8).map((category) => (
                <Link
                  key={category.value}
                  href={`/products?category=${category.slug}`}
                  className="whitespace-nowrap rounded-ds-sm px-3 py-2 text-sm text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken hover:text-ds-text-primary"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div id="mobile-menu" className="border-t border-ds-border-base py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-ds-text-primary">Theme</span>
                <ThemeToggle className="p-2" />
              </div>

              <div className="px-2">
                <button
                  type="button"
                  onClick={() => setShowMobileCategories((prev) => !prev)}
                  aria-controls="mobile-categories-menu"
                  data-expanded={showMobileCategories ? "true" : "false"}
                  className="flex w-full items-center justify-between rounded-ds-md px-3 py-3 text-left text-sm font-medium text-ds-text-primary transition-colors hover:bg-ds-surface-sunken"
                >
                  <span className="inline-flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Browse Categories
                  </span>
                  {showMobileCategories ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {showMobileCategories && (
                  <div
                    id="mobile-categories-menu"
                    className="mt-1 max-h-72 overflow-y-auto rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-1"
                  >
                    {PRODUCT_DISCOVERY_CATEGORIES.map((category) => (
                      <Link
                        key={category.value}
                        href={`/products?category=${category.slug}`}
                        className="block rounded-ds-sm px-3 py-2 text-sm text-ds-text-secondary transition-colors hover:bg-ds-surface-base hover:text-ds-text-primary"
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowMobileCategories(false);
                        }}
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                )}
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
                      "relative flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/cart")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {renderCounterBadge(totalItems)}
                    Cart {totalItems > 0 && `(${totalItems})`}
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className={cn(
                      "relative flex items-center gap-3 rounded-ds-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive("/notifications")
                        ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle"
                        : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
                    )}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Bell className="h-5 w-5" />
                    {renderCounterBadge(unreadCount)}
                    Notifications {unreadCount > 0 && `(${unreadCount > 99 ? "99+" : unreadCount})`}
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

export function resolveOrdersLink() {
  return "/orders";
}
