/**
 * Search Filter Chips Component
 *
 * Features:
 * - Display active filters as chips
 * - Remove individual filters
 * - Clear all filters
 */

"use client";

import { Tag } from "antd";

interface SearchFilterChipsProps {
  filters: {
    categories?: string[];
    priceRange?: [number, number];
    rating?: number;
    deliveryOptions?: string[];
    pickupOptions?: string[];
  };
  onRemoveFilter: (filterType: string, value?: string | number | [number, number]) => void;
  onClearAll: () => void;
}

export function SearchFilterChips({ filters, onRemoveFilter, onClearAll }: SearchFilterChipsProps) {
  const activeFilters: Array<{
    type: string;
    label: string;
    value?: string | number | [number, number];
  }> = [];

  // Categories
  filters.categories?.forEach((category) => {
    activeFilters.push({
      type: "categories",
      label: category,
      value: category,
    });
  });

  // Price Range
  if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000)) {
    activeFilters.push({
      type: "priceRange",
      label: `₦${filters.priceRange[0].toLocaleString()} - ₦${filters.priceRange[1].toLocaleString()}`,
    });
  }

  // Rating
  if (filters.rating && filters.rating > 0) {
    activeFilters.push({
      type: "rating",
      label: `${filters.rating}+ Stars`,
    });
  }

  // Delivery Options
  filters.deliveryOptions?.forEach((option) => {
    activeFilters.push({
      type: "deliveryOptions",
      label: option,
      value: option,
    });
  });

  // Pickup Options
  filters.pickupOptions?.forEach((option) => {
    activeFilters.push({
      type: "pickupOptions",
      label: option,
      value: option,
    });
  });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">Active Filters:</span>
      {activeFilters.map((filter, index) => (
        <Tag
          key={`${filter.type}-${index}`}
          closable
          onClose={() => onRemoveFilter(filter.type, filter.value)}
          className="m-0"
        >
          {filter.label}
        </Tag>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
      >
        Clear All
      </button>
    </div>
  );
}
