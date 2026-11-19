"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/config/categoryIcons";

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
  /** `grid` renders Jumia-style icon tiles. */
  layout?: "horizontal" | "vertical" | "grid";
  className?: string;
}

export function CategoryNav({
  categories,
  currentCategory,
  layout = "horizontal",
  className,
}: CategoryNavProps) {
  const isActive = (slug: string) => currentCategory === slug;

  if (layout === "grid") {
    return (
      <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8", className)}>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.id);
          return (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-ds-md p-2 text-center transition-colors hover:bg-ds-brand-surface",
                isActive(category.slug) && "bg-ds-brand-surface"
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-ds-text-brand transition-colors group-hover:bg-ds-brand-primary group-hover:text-white sm:h-16 sm:w-16">
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </span>
              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ds-text-primary sm:text-xs">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div className={cn("space-y-1", className)}>
        <Link
          href="/products"
          className={cn(
            "block rounded-ds-md px-4 py-2 text-sm font-medium transition-colors",
            !currentCategory
              ? "bg-ds-brand-subtle text-ds-text-brand dark:bg-ds-brand-subtle "
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
              "block rounded-ds-md px-4 py-2 text-sm font-medium transition-colors",
              isActive(category.slug)
                ? "bg-ds-brand-subtle text-ds-text-brand dark:bg-ds-brand-subtle "
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
          "whitespace-nowrap rounded-ds-full px-4 py-2 text-sm font-medium transition-colors",
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
            "whitespace-nowrap rounded-ds-full px-4 py-2 text-sm font-medium transition-colors",
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
