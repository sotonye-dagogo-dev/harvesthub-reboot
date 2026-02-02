"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: number;
}

export interface CategoryNavProps {
  categories: Category[];
  currentCategory?: string;
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function CategoryNav({
  categories,
  currentCategory,
  layout = "horizontal",
  className,
}: CategoryNavProps) {
  const isActive = (slug: string) => currentCategory === slug;

  if (layout === "vertical") {
    return (
      <div className={cn("space-y-1", className)}>
        <Link
          href="/products"
          className={cn(
            "block rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            !currentCategory
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          )}
        >
          All Categories
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className={cn(
              "block rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive(category.slug)
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{category.name}</span>
              {category.count !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{category.count}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      <Link
        href="/products"
        className={cn(
          "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
          !currentCategory
            ? "bg-purple-600 text-white dark:bg-purple-500"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        )}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
            isActive(category.slug)
              ? "bg-purple-600 text-white dark:bg-purple-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
        >
          {category.name}
          {category.count !== undefined && ` (${category.count})`}
        </Link>
      ))}
    </div>
  );
}
