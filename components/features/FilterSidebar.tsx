"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  categories?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  vendors?: string[];
  locations?: string[];
  status?: string[];
}

export interface FilterSidebarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories?: { id: string; name: string }[];
  vendors?: { id: string; name: string }[];
  locations?: string[];
  statuses?: { label: string; value: string }[];
  className?: string;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  categories = [],
  vendors = [],
  locations = [],
  statuses = [],
  className,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((c) => c !== categoryId)
      : [...currentCategories, categoryId];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleVendorToggle = (vendorId: string) => {
    const currentVendors = filters.vendors || [];
    const newVendors = currentVendors.includes(vendorId)
      ? currentVendors.filter((v) => v !== vendorId)
      : [...currentVendors, vendorId];
    onFilterChange({ ...filters, vendors: newVendors });
  };

  const handleLocationToggle = (location: string) => {
    const currentLocations = filters.locations || [];
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter((l) => l !== location)
      : [...currentLocations, location];
    onFilterChange({ ...filters, locations: newLocations });
  };

  const handleStatusToggle = (statusValue: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(statusValue)
      ? currentStatuses.filter((s) => s !== statusValue)
      : [...currentStatuses, statusValue];
    onFilterChange({ ...filters, status: newStatuses });
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    onFilterChange({
      ...filters,
      priceRange: {
        min: type === "min" ? numValue : filters.priceRange?.min || 0,
        max: type === "max" ? numValue : filters.priceRange?.max || 0,
      },
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, rating: filters.rating === rating ? undefined : rating });
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-text-primary">Filters</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-ds-text-brand hover:text-ds-palette-purple-700"
        >
          Clear all
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-ds-text-primary">Categories</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category.id) || false}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
                />
                <span className="text-sm text-ds-text-secondary">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="mb-3 font-medium text-ds-text-primary">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceRange?.min || ""}
            onChange={(e) => handlePriceChange("min", e.target.value)}
            className="w-full rounded-ds-md border border-ds-border-base px-3 py-2 text-sm text-ds-text-primary focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20 dark:bg-ds-surface-base dark:text-ds-text-primary"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceRange?.max || ""}
            onChange={(e) => handlePriceChange("max", e.target.value)}
            className="w-full rounded-ds-md border border-ds-border-base px-3 py-2 text-sm text-ds-text-primary focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20 dark:bg-ds-surface-base dark:text-ds-text-primary"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="mb-3 font-medium text-ds-text-primary">Minimum Rating</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={filters.rating === rating}
                onChange={() => handleRatingChange(rating)}
                className="h-4 w-4 border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
              />
              <span className="text-sm text-ds-text-secondary">{rating} stars & up</span>
            </label>
          ))}
        </div>
      </div>

      {/* Locations */}
      {locations.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-ds-text-primary">Location</h4>
          <div className="space-y-2">
            {locations.map((location) => (
              <label key={location} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.locations?.includes(location) || false}
                  onChange={() => handleLocationToggle(location)}
                  className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
                />
                <span className="text-sm text-ds-text-secondary">{location}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Order Status */}
      {statuses.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-ds-text-primary">Order Status</h4>
          <div className="space-y-2">
            {statuses.map((status) => (
              <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(status.value) || false}
                  onChange={() => handleStatusToggle(status.value)}
                  className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
                />
                <span className="text-sm text-ds-text-secondary">{status.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Vendors */}
      {vendors.length > 0 && (
        <div>
          <h4 className="mb-3 font-medium text-ds-text-primary">Vendors</h4>
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <label key={vendor.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.vendors?.includes(vendor.id) || false}
                  onChange={() => handleVendorToggle(vendor.id)}
                  className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
                />
                <span className="text-sm text-ds-text-secondary">{vendor.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button onClick={() => setIsOpen(!isOpen)} variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block", className)}>{filterContent}</div>

      {/* Mobile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-ds-overlay lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-ds-surface-base p-6 shadow-ds-xl dark:bg-ds-surface-base overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close filters"
              className="absolute right-4 top-4 text-ds-text-tertiary hover:text-ds-text-secondary dark:text-ds-text-placeholder"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="mt-8 overflow-y-auto">{filterContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
