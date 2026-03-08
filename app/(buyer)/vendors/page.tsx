"use client";

import { useState, useMemo } from "react";
import { mockVendors, mockProducts } from "@/lib/data/mockData";
import { VendorCard } from "@/components/features";
import { Input, Select } from "antd";
import { EmptyState } from "@/components/ui";
import { Search } from "lucide-react";

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");

  // Get all approved vendors with product counts
  const allVendors = useMemo(
    () =>
      mockVendors
        .filter((vendor) => vendor.status === "APPROVED")
        .map((vendor) => ({
          ...vendor,
          productCount: mockProducts.filter((p) => p.vendorId === vendor.id && p.isActive).length,
        }))
        .sort((a, b) => b.analytics.totalOrders - a.analytics.totalOrders),
    []
  );

  // Apply filters
  const filteredVendors = useMemo(() => {
    return allVendors.filter((vendor) => {
      const matchesSearch =
        !searchTerm ||
        vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.storeDescription?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || vendor.category === selectedCategory;

      const matchesCampus = !selectedCampus || vendor.campus === selectedCampus;

      return matchesSearch && matchesCategory && matchesCampus;
    });
  }, [allVendors, searchTerm, selectedCategory, selectedCampus]);

  // Get unique categories
  const categories = useMemo(
    () => Array.from(new Set(allVendors.map((v) => v.category))),
    [allVendors]
  );

  // Get unique campuses
  const campuses = useMemo(
    () => Array.from(new Set(allVendors.map((v) => v.campus))),
    [allVendors]
  );

  return (
    <div className="min-h-screen bg-ds-surface-sunken py-8 dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-ds-text-primary">Our Vendors</h1>
          <p className="text-ds-text-secondary">
            Discover trusted vendors from the HarvestHub community
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-ds-md bg-ds-surface-base p-6 shadow-ds-sm dark:bg-ds-surface-base">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Search Vendors
              </label>
              <Input
                prefix={<Search className="h-4 w-4 text-ds-text-placeholder" />}
                placeholder="Search by name or description..."
                size="large"
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Category
              </label>
              <Select
                placeholder="All Categories"
                size="large"
                className="w-full"
                value={selectedCategory || undefined}
                onChange={(value) => setSelectedCategory(value || "")}
                allowClear
                options={[
                  ...categories.map((cat) => ({
                    label: cat.replace(/_/g, " "),
                    value: cat,
                  })),
                ]}
              />
            </div>

            {/* Campus Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Location
              </label>
              <Select
                placeholder="All Locations"
                size="large"
                className="w-full"
                value={selectedCampus || undefined}
                onChange={(value) => setSelectedCampus(value || "")}
                allowClear
                options={[
                  ...campuses.map((campus) => ({
                    label: campus.replace(/_/g, " "),
                    value: campus,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || selectedCategory || selectedCampus) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-ds-text-secondary">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center rounded-ds-full bg-ds-brand-subtle px-3 py-1 text-sm text-ds-palette-purple-800">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center rounded-ds-full bg-ds-brand-subtle px-3 py-1 text-sm text-ds-palette-purple-800">
                  {selectedCategory.replace(/_/g, " ")}
                </span>
              )}
              {selectedCampus && (
                <span className="inline-flex items-center rounded-ds-full bg-ds-brand-subtle px-3 py-1 text-sm text-ds-palette-purple-800">
                  {selectedCampus.replace(/_/g, " ")}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedCampus("");
                }}
                className="text-sm text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-ds-text-secondary">
              Showing {filteredVendors.length} of {allVendors.length}{" "}
              {filteredVendors.length === 1 ? "vendor" : "vendors"}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.storeName}
                  category={vendor.category}
                  campus={vendor.campus}
                  rating={vendor.analytics.averageRating}
                  productCount={vendor.productCount}
                  logo={vendor.storeLogo || undefined}
                  isVerified={vendor.status === "APPROVED"}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-ds-md bg-ds-surface-base p-12 text-center shadow-ds-sm dark:bg-ds-surface-base">
            <EmptyState
              title="No Vendors Found"
              description={
                searchTerm || selectedCategory || selectedCampus
                  ? "Try adjusting your filters to see more results"
                  : "There are no vendors available at the moment"
              }
              icon={<Search className="h-10 w-10" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
