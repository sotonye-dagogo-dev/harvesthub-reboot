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
              ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
              : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
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
                ? "bg-ds-brand-subtle text-ds-palette-purple-700 dark:bg-ds-brand-subtle "
                : "text-ds-text-secondary hover:bg-ds-surface-sunken dark:text-ds-text-placeholder dark:hover:bg-ds-surface-raised"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{category.name}</span>
              {category.count !== undefined && (
                <span className="text-xs text-ds-text-tertiary">{category.count}</span>
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
            ? "bg-ds-brand-primary text-white dark:bg-ds-brand-primary"
            : "bg-ds-surface-sunken text-ds-text-secondary hover:bg-ds-surface-disabled  dark:text-ds-text-placeholder dark:hover:bg-ds-surface-overlay"
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
              ? "bg-ds-brand-primary text-white dark:bg-ds-brand-primary"
              : "bg-ds-surface-sunken text-ds-text-secondary hover:bg-ds-surface-disabled  dark:text-ds-text-placeholder dark:hover:bg-ds-surface-overlay"
          )}
        >
          {category.name}
          {category.count !== undefined && ` (${category.count})`}
        </Link>
      ))}
    </div>
  );
}
