"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { getCategoryIcon } from "@/lib/config/categoryIcons";
import { cn } from "@/lib/utils";

export interface CategorySidebarItem {
  id: string;
  name: string;
  slug: string;
}

interface CategorySidebarProps {
  categories: CategorySidebarItem[];
  /** How many categories to list before the "All categories" link. */
  limit?: number;
  className?: string;
}

/** Jumia-style vertical category menu shown beside the hero slider on desktop. */
export function CategorySidebar({ categories, limit = 11, className }: CategorySidebarProps) {
  const visible = categories.slice(0, limit);

  return (
    <nav
      aria-label="Shop categories"
      className={cn(
        "flex h-full flex-col rounded-ds-md bg-ds-surface-base py-2 shadow-ds-sm dark:bg-ds-surface-raised",
        className
      )}
    >
      <ul className="flex-1">
        {visible.map((category) => {
          const Icon = getCategoryIcon(category.id);
          return (
            <li key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className="group flex items-center gap-3 px-4 py-[0.4rem] text-[13px] text-ds-text-primary transition-colors hover:text-ds-brand-primary"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-ds-text-secondary group-hover:text-ds-brand-primary" aria-hidden="true" />
                <span className="truncate">{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/products"
        className="mx-2 mt-1 flex items-center justify-between rounded-ds-sm px-2 py-2 text-[13px] font-semibold text-ds-text-brand hover:bg-ds-brand-surface"
      >
        <span className="inline-flex items-center gap-3">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          All categories
        </span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
