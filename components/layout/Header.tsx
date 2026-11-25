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
  Ticket,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/utils/dashboard";
import { Button, ThemeToggle } from "@/components/ui";
import { SearchBar } from "@/components/features";
import { Logo } from "@/components/brand";
import { useCart } from "@/lib/store/cartStore";
import { cn } from "@/lib/utils";
import { PRODUCT_DISCOVERY_CATEGORIES } from "@/lib/config/productDiscovery";
import { useNotifications } from "@/lib/contexts/NotificationContext";

function renderCounterBadge(count: number) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-ds-full bg-ds-brand-primary px-1 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const activeLinkClass = "bg-ds-brand-subtle text-ds-text-brand dark:bg-ds-brand-subtle";
const idleLinkClass =
  "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised";

export function Header({ className }: { className?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowAccountMenu(false);
    setShowMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!showAccountMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAccountMenu]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Exact match, or a real sub-path ("/orders/123"), so "/" never matches everything.
  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  const dashboardLink = getDashboardRoute(user?.role);
  const ordersLink = resolveOrdersLink();

  const handleHeaderSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const accountLinks = user
    ? [
        ...(user.role === "ADMIN" || user.role === "VENDOR"
          ? [{ href: dashboardLink, label: "Dashboard", icon: LayoutDashboard }]
          : []),
        { href: "/profile", label: "My Account", icon: User },
        { href: ordersLink, label: "Orders", icon: Package },
        { href: "/notifications", label: "Notifications", icon: Bell, count: unreadCount },
        { href: "/favourites", label: "Favourites", icon: Heart },
        { href: "/vouchers", label: "Vouchers", icon: Ticket },
        { href: "/wallet", label: "Wallet", icon: Wallet },
        ...(user.role === "BUYER"
          ? [{ href: "/become-vendor", label: "Register Store", icon: Store }]
          : []),
      ]
    : [
        { href: "/profile", label: "My Account", icon: User },
        { href: ordersLink, label: "Orders", icon: Package },
        { href: "/favourites", label: "Favourites", icon: Heart },
        { href: "/vouchers", label: "Vouchers", icon: Ticket },
      ];

  return (
    <header className={cn("sticky top-0 z-ds-header w-full bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-base", className)}>
      {/* Top strip (Jumia-style promo bar) */}
      <div className="hidden bg-ds-brand-deep text-ds-brand-on-deep md:block">
        <div className="container mx-auto flex h-8 items-center justify-between gap-4 px-4 text-xs">
          <Link
            href="/become-vendor"
            className="inline-flex items-center gap-1.5 font-medium text-ds-brand-on-deep hover:text-ds-palette-magenta-200"
          >
            <Store className="h-3.5 w-3.5" />
            Sell on MyHarvestHub
          </Link>
          <span className="inline-flex items-center gap-1.5 text-ds-palette-purple-200">
            <MapPin className="h-3.5 w-3.5" />
            Pick up your orders at your campus
          </span>
          <Link
            href="/packages"
            className="font-medium text-ds-brand-on-deep hover:text-ds-palette-magenta-200"
          >
            Vendor packages
          </Link>
        </div>
      </div>

      <div className="border-b border-ds-border-base">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 md:h-16 md:flex-nowrap md:py-0">
            {/* Mobile menu button */}
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
              aria-expanded={showMobileMenu}
              data-expanded={showMobileMenu ? "true" : "false"}
              className="order-1 -ml-2 rounded-ds-md p-2 text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="order-1 flex flex-shrink-0 items-center" aria-label="MyHarvestHub home">
              <Logo markSize={36} wordmarkClassName="text-lg sm:text-xl" />
            </Link>

            {/* Search — full width row on mobile, centre column on desktop */}
            <div className="order-3 w-full min-w-0 md:order-2 md:mx-4 md:w-auto md:flex-1 md:max-w-2xl xl:max-w-3xl">
              <SearchBar
                onSearch={handleHeaderSearch}
                placeholder="Search products and vendors"
                expandDropdownOnDesktop
                showRecentSearches
                showSubmitButton
              />
            </div>

            {/* Actions */}
            <div className="order-2 ml-auto flex items-center gap-1 md:order-3 md:ml-0">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* Account dropdown */}
              <div className="relative hidden md:block" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={showAccountMenu}
                  aria-label="Account menu"
                  className={cn(
                    "flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                    showAccountMenu ? activeLinkClass : "text-ds-text-primary hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-raised"
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden max-w-[8rem] truncate lg:block">
                    {user ? `Hi, ${user.firstName}` : "Account"}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", showAccountMenu && "rotate-180")}
                  />
                </button>

                {showAccountMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 max-h-[min(75vh,32rem)] min-w-60 overflow-y-auto rounded-ds-md border border-ds-border-base bg-ds-surface-base p-2 shadow-ds-lg"
                  >
                    {!user && (
                      <div className="mb-2 border-b border-ds-border-base pb-3">
                        <Link href="/login" onClick={() => setShowAccountMenu(false)}>
                          <Button className="w-full">Sign In</Button>
                        </Link>
                        <p className="mt-2 text-center text-xs text-ds-text-secondary">
                          New here?{" "}
                          <Link
                            href="/signup"
                            className="font-medium"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Create an account
                          </Link>
                        </p>
                      </div>
                    )}

                    {accountLinks.map((item) => {
                      const Icon = item.icon;
                      const count = "count" in item ? item.count ?? 0 : 0;

                      return (
                        <Link
                          key={`${item.href}-${item.label}`}
                          href={item.href}
                          role="menuitem"
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-ds-sm px-3 py-2 text-sm font-medium transition-colors",
                            isActive(item.href) ? activeLinkClass : idleLinkClass
                          )}
                          onClick={() => setShowAccountMenu(false)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          {count > 0 ? (
                            <span className="rounded-ds-full bg-ds-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                              {count > 99 ? "99+" : count}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}

                    {user && (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 border-t border-ds-border-base px-3 pb-1 pt-3 text-left text-sm font-medium text-ds-status-error-text hover:bg-ds-status-error-bg"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Help */}
              <Link
                href="/help"
                className="hidden items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium text-ds-text-primary hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-raised lg:flex"
              >
                <HelpCircle className="h-5 w-5" />
                Help
              </Link>

              {/* Cart — always visible */}
              <Link
                href="/cart"
                aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"}
                className={cn(
                  "relative flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/cart") ? activeLinkClass : "text-ds-text-primary hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-raised"
                )}
              >
                <span className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {renderCounterBadge(totalItems)}
                </span>
                <span className="hidden lg:block">Cart</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-7rem)] overflow-y-auto border-b border-ds-border-base bg-ds-surface-base py-4 md:hidden"
        >
          <div className="container mx-auto flex flex-col gap-1 px-4">
            {!user && (
              <div className="mb-2 flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setShowMobileMenu(false)}>
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="outline" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {user && (
              <p className="px-3 pb-2 text-sm font-semibold text-ds-text-primary">Hi, {user.firstName}</p>
            )}

            <button
              type="button"
              onClick={() => setShowMobileCategories((prev) => !prev)}
              aria-controls="mobile-categories-menu"
              aria-expanded={showMobileCategories}
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
                className="mb-1 max-h-72 overflow-y-auto rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-1"
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

            {(user ? accountLinks : []).map((item) => {
              const Icon = item.icon;
              const count = "count" in item ? item.count ?? 0 : 0;
              return (
                <Link
                  key={`m-${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-ds-md px-3 py-3 text-sm font-medium transition-colors",
                    isActive(item.href) ? activeLinkClass : idleLinkClass
                  )}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {count > 0 ? ` (${count > 99 ? "99+" : count})` : null}
                </Link>
              );
            })}

            <Link
              href="/help"
              className={cn("flex items-center gap-3 rounded-ds-md px-3 py-3 text-sm font-medium", idleLinkClass)}
              onClick={() => setShowMobileMenu(false)}
            >
              <HelpCircle className="h-5 w-5" />
              Help Center
            </Link>

            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-ds-text-primary">Theme</span>
              <ThemeToggle className="p-2" />
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-ds-md px-3 py-3 text-left text-sm font-medium text-ds-status-error-text hover:bg-ds-status-error-bg dark:text-ds-status-error dark:hover:bg-ds-status-error-bg/20"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function resolveOrdersLink() {
  return "/orders";
}
