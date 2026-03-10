/**
 * Filter Drawer Component
 *
 * Features:
 * - Advanced filters for products
 * - Price range slider
 * - Category selection
 * - Rating filter
 * - Availability filter
 * - Vendor filter
 */

"use client";

import { useState } from "react";
import { Drawer, Button, Slider, Checkbox, Radio, Divider, InputNumber } from "antd";
import { Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ProductFilters) => void;
  initialFilters?: Partial<ProductFilters>;
}

interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  vendors: string[];
  deliveryOptions: string[];
  pickupOptions: string[];
}

const CATEGORIES = [
  "Electronics",
  "Computers & Office",
  "Home Appliances",
  "Furniture",
  "Home Decor",
  "Kitchen & Dining",
  "Fashion",
  "Beauty & Personal Care",
  "Baby & Kids",
  "Toys & Games",
  "Automotive",
  "Motorcycles",
  "Spare Parts",
  "Industrial & Construction",
  "Agriculture",
  "Security & Surveillance",
  "Grocery & Food",
  "Services",
  "Others",
];

const DELIVERY_OPTIONS = ["Home Delivery", "Campus Pickup", "Church Pickup"];

const CHURCH_PICKUP_OPTIONS = [
  "Sunday Service (First)",
  "Sunday Service (Second)",
  "Midweek Service",
  "Special Events",
];

export function FilterDrawer({ open, onClose, onApplyFilters, initialFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: initialFilters?.categories || [],
    priceRange: initialFilters?.priceRange || [0, 100000],
    rating: initialFilters?.rating || 0,
    inStock: initialFilters?.inStock ?? true,
    vendors: initialFilters?.vendors || [],
    deliveryOptions: initialFilters?.deliveryOptions || [],
    pickupOptions: initialFilters?.pickupOptions || [],
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      categories: [],
      priceRange: [0, 100000],
      rating: 0,
      inStock: true,
      vendors: [],
      deliveryOptions: [],
      pickupOptions: [],
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <span>Filters</span>
          </div>
          <Button type="text" size="small" onClick={handleReset}>
            Reset All
          </Button>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      footer={
        <div className="flex gap-2">
          <Button onClick={onClose} block>
            Cancel
          </Button>
          <Button type="primary" onClick={handleApply} block>
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h4 className="font-semibold mb-3">Price Range (₦)</h4>
          <Slider
            range
            min={0}
            max={100000}
            step={1000}
            value={filters.priceRange}
            onChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
            tooltip={{ formatter: (value) => (value != null ? formatCurrency(value) : "") }}
          />
          <div className="flex items-center gap-2 mt-3">
            <InputNumber
              min={0}
              max={filters.priceRange[1]}
              value={filters.priceRange[0]}
              onChange={(value) =>
                setFilters({ ...filters, priceRange: [value || 0, filters.priceRange[1]] })
              }
              formatter={(value) => (value != null ? formatCurrency(Number(value)) : "")}
              parser={(value) => Number(value?.replace(/[^\d.]/g, "") || 0)}
              className="flex-1"
            />
            <span>-</span>
            <InputNumber
              min={filters.priceRange[0]}
              max={100000}
              value={filters.priceRange[1]}
              onChange={(value) =>
                setFilters({ ...filters, priceRange: [filters.priceRange[0], value || 100000] })
              }
              formatter={(value) => (value != null ? formatCurrency(Number(value)) : "")}
              parser={(value) => Number(value?.replace(/[^\d.]/g, "") || 0)}
              className="flex-1"
            />
          </div>
        </div>

        <Divider />

        {/* Categories */}
        <div>
          <h4 className="font-semibold mb-3">Categories</h4>
          <Checkbox.Group
            options={CATEGORIES}
            value={filters.categories}
            onChange={(values) => setFilters({ ...filters, categories: values as string[] })}
            className="flex flex-col gap-2"
          />
        </div>

        <Divider />

        {/* Rating */}
        <div>
          <h4 className="font-semibold mb-3">Minimum Rating</h4>
          <Radio.Group
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            className="flex flex-col gap-2"
          >
            <Radio value={0}>All Ratings</Radio>
            <Radio value={4}>4 Stars & Above</Radio>
            <Radio value={3}>3 Stars & Above</Radio>
            <Radio value={2}>2 Stars & Above</Radio>
          </Radio.Group>
        </div>

        <Divider />

        {/* Availability */}
        <div>
          <h4 className="font-semibold mb-3">Availability</h4>
          <Checkbox
            checked={filters.inStock}
            onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
          >
            In Stock Only
          </Checkbox>
        </div>

        <Divider />

        {/* Delivery Options */}
        <div>
          <h4 className="font-semibold mb-3">Delivery Options</h4>
          <Checkbox.Group
            options={DELIVERY_OPTIONS}
            value={filters.deliveryOptions}
            onChange={(values) => setFilters({ ...filters, deliveryOptions: values as string[] })}
            className="flex flex-col gap-2"
          />
        </div>

        {filters.deliveryOptions.includes("Church Pickup") && (
          <div className="ml-4">
            <h4 className="font-medium text-sm mb-2">Pickup Times</h4>
            <Checkbox.Group
              options={CHURCH_PICKUP_OPTIONS}
              value={filters.pickupOptions}
              onChange={(values) => setFilters({ ...filters, pickupOptions: values as string[] })}
              className="flex flex-col gap-2"
            />
          </div>
        )}
      </div>
    </Drawer>
  );
}
