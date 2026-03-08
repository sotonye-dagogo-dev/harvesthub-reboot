/**
 * Product Filters Component
 *
 * Advanced filtering for products with:
 * - Category selection
 * - Price range
 * - Rating filter
 * - Vendor filter
 * - Location filter
 * - Clear all filters
 */

"use client";

import { useState, useEffect } from "react";
import { Card, Checkbox, Slider, Rate, Button, Collapse, Badge } from "antd";
import { Filter } from "lucide-react";
import { PRODUCT_CATEGORIES, CAMPUS_LOCATIONS, LISTING_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const { Panel } = Collapse;

export interface ProductFilters {
  categories: string[];
  listingType: string;
  serviceCategories: string[];
  priceRange: [number, number];
  minRating: number;
  vendors: string[];
  locations: string[];
  inStock: boolean;
}

interface ProductFiltersProps {
  onFilterChange: (filters: ProductFilters) => void;
  availableVendors?: Array<{ id: string; name: string }>;
  className?: string;
}

export function ProductFiltersSidebar({
  onFilterChange,
  availableVendors = [],
  className = "",
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    listingType: "",
    serviceCategories: [],
    priceRange: [0, 100000],
    minRating: 0,
    vendors: [],
    locations: [],
    inStock: false,
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.listingType) count++;
    if (filters.serviceCategories.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++;
    if (filters.minRating > 0) count++;
    if (filters.vendors.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.inStock) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Update filters
  const updateFilters = (
    key: keyof ProductFilters,
    value: ProductFilters[keyof ProductFilters]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const resetFilters: ProductFilters = {
      categories: [],
      listingType: "",
      serviceCategories: [],
      priceRange: [0, 100000],
      minRating: 0,
      vendors: [],
      locations: [],
      inStock: false,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Handle category toggle
  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilters("categories", newCategories);
  };

  // Handle vendor toggle
  const toggleVendor = (vendorId: string) => {
    const newVendors = filters.vendors.includes(vendorId)
      ? filters.vendors.filter((v) => v !== vendorId)
      : [...filters.vendors, vendorId];
    updateFilters("vendors", newVendors);
  };

  // Handle location toggle
  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location];
    updateFilters("locations", newLocations);
  };

  return (
    <Card
      className={`product-filters ${className}`}
      title={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && <Badge count={activeFiltersCount} className="ml-2" />}
          </span>
          {activeFiltersCount > 0 && (
            <Button
              type="text"
              size="small"
              onClick={clearAllFilters}
              className="text-xs text-ds-text-brand"
            >
              Clear All
            </Button>
          )}
        </div>
      }
    >
      <Collapse
        defaultActiveKey={["listing-type", "categories", "price", "rating"]}
        bordered={false}
        expandIconPosition="end"
        className="bg-transparent"
      >
        {/* Listing Type */}
        <Panel
          header={
            <span className="font-semibold">
              Type {filters.listingType && "(1)"}
            </span>
          }
          key="listing-type"
        >
          <div className="space-y-2">
            {LISTING_TYPES.map((type) => (
              <Checkbox
                key={type.value}
                checked={filters.listingType === type.value}
                onChange={() =>
                  updateFilters("listingType", filters.listingType === type.value ? "" : type.value)
                }
              >
                <span className="text-sm">{type.label}</span>
              </Checkbox>
            ))}
          </div>
        </Panel>

        {/* Service Categories — only shown when listing type is SERVICE */}
        {filters.listingType === "SERVICE" && (
          <Panel
            header={
              <span className="font-semibold">
                Service Type {filters.serviceCategories.length > 0 && `(${filters.serviceCategories.length})`}
              </span>
            }
            key="service-categories"
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {SERVICE_CATEGORIES.map((cat) => (
                <Checkbox
                  key={cat.value}
                  checked={filters.serviceCategories.includes(cat.value)}
                  onChange={() => {
                    const newCats = filters.serviceCategories.includes(cat.value)
                      ? filters.serviceCategories.filter((c) => c !== cat.value)
                      : [...filters.serviceCategories, cat.value];
                    updateFilters("serviceCategories", newCats);
                  }}
                >
                  <span className="text-sm">{cat.label}</span>
                </Checkbox>
              ))}
            </div>
          </Panel>
        )}

        {/* Categories */}
        <Panel
          header={
            <span className="font-semibold">
              Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
            </span>
          }
          key="categories"
        >
          <div className="space-y-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <Checkbox
                key={category.value}
                checked={filters.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
              >
                <span className="text-sm">{category.label}</span>
              </Checkbox>
            ))}
          </div>
        </Panel>

        {/* Price Range */}
        <Panel header={<span className="font-semibold">Price Range</span>} key="price">
          <div className="px-2">
            <Slider
              range
              min={0}
              max={100000}
              step={1000}
              value={filters.priceRange}
              onChange={(value) => updateFilters("priceRange", value as [number, number])}
              tooltip={{
                formatter: (value) => formatCurrency(value || 0),
              }}
            />
            <div className="flex justify-between mt-2 text-sm text-ds-text-secondary">
              <span>{formatCurrency(filters.priceRange[0])}</span>
              <span>{formatCurrency(filters.priceRange[1])}</span>
            </div>
          </div>
        </Panel>

        {/* Rating */}
        <Panel header={<span className="font-semibold">Minimum Rating</span>} key="rating">
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <div
                key={rating}
                onClick={() =>
                  updateFilters("minRating", filters.minRating === rating ? 0 : rating)
                }
                className="flex items-center gap-2 cursor-pointer hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay p-2 rounded-ds-xs"
              >
                <Checkbox checked={filters.minRating === rating} />
                <Rate disabled value={rating} className="text-sm" />
                <span className="text-sm text-ds-text-secondary">& up</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Vendors */}
        {availableVendors.length > 0 && (
          <Panel
            header={
              <span className="font-semibold">
                Vendors {filters.vendors.length > 0 && `(${filters.vendors.length})`}
              </span>
            }
            key="vendors"
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableVendors.map((vendor) => (
                <Checkbox
                  key={vendor.id}
                  checked={filters.vendors.includes(vendor.id)}
                  onChange={() => toggleVendor(vendor.id)}
                >
                  <span className="text-sm">{vendor.name}</span>
                </Checkbox>
              ))}
            </div>
          </Panel>
        )}

        {/* Location */}
        <Panel
          header={
            <span className="font-semibold">
              Location {filters.locations.length > 0 && `(${filters.locations.length})`}
            </span>
          }
          key="location"
        >
          <div className="space-y-2">
            {CAMPUS_LOCATIONS.map((location) => (
              <Checkbox
                key={location.value}
                checked={filters.locations.includes(location.value)}
                onChange={() => toggleLocation(location.value)}
              >
                <span className="text-sm">{location.label}</span>
              </Checkbox>
            ))}
          </div>
        </Panel>

        {/* Stock Status */}
        <Panel header={<span className="font-semibold">Availability</span>} key="stock">
          <Checkbox
            checked={filters.inStock}
            onChange={(e) => updateFilters("inStock", e.target.checked)}
          >
            <span className="text-sm">In Stock Only</span>
          </Checkbox>
        </Panel>
      </Collapse>
    </Card>
  );
}
