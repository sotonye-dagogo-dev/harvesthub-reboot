"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Search, Menu, Store } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
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

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HarvestHub</span>
          </Link>

          <div className="hidden flex-1 max-w-xl mx-8 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, stores..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />

            {user ? (
              <>
                {user.role === "BUYER" && (
                  <Link
                    href="/cart"
                    className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-medium text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <Link
                    href={
                      user.role === "ADMIN"
                        ? "/admin/dashboard"
                        : user.role === "VENDOR"
                          ? "/vendor/dashboard"
                          : "/profile"
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive(
                        user.role === "ADMIN"
                          ? "/admin/dashboard"
                          : user.role === "VENDOR"
                            ? "/vendor/dashboard"
                            : "/profile"
                      )
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span>{user.firstName}</span>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
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

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {showMobileMenu && (
          <div className="border-t border-gray-200 py-4 dark:border-gray-800 md:hidden">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={
                      user.role === "ADMIN"
                        ? "/admin/dashboard"
                        : user.role === "VENDOR"
                          ? "/vendor/dashboard"
                          : "/profile"
                    }
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Profile
                  </Link>
                  {user.role === "BUYER" && (
                    <Link
                      href="/cart"
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Cart ({totalItems})
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
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
