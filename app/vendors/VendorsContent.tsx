"use client";

import { useEffect, useMemo, useState } from "react";
import { VendorCard } from "@/components/features";
import { Input, Select } from "antd";
import { EmptyState, SimplePagination } from "@/components/ui";
import { Search } from "lucide-react";
import { formatVendorCategory } from "@/lib/utils/format";
import type { Vendor, Product } from "@/lib/types";
import { isVendorVerified } from "@/lib/utils/vendor";

interface VendorsContentProps {
  vendors: Vendor[];
  products: Product[];
}

const VENDORS_PER_PAGE = 12;

export function VendorsContent({ vendors, products }: VendorsContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Get all approved vendors with product counts
  const allVendors = useMemo(
    () =>
      vendors
        .map((vendor) => ({
          ...vendor,
          productCount: products.filter((p) => p.vendorId === vendor.id && p.isActive).length,
        }))
        .sort((a, b) => b.productCount - a.productCount),
    [vendors, products]
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedCampus]);

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

  const totalPages = Math.ceil(filteredVendors.length / VENDORS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * VENDORS_PER_PAGE,
    currentPage * VENDORS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-ds-surface-sunken py-8 dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-ds-text-primary">Our Vendors</h1>
          <p className="text-ds-text-secondary">
            Discover trusted vendors from the MyHarvestHub community
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
                options={categories.map((cat) => ({
                  label: formatVendorCategory(cat),
                  value: cat,
                }))}
              />
            </div>

            {/* Campus Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Campus/Location
              </label>
              <Select
                placeholder="All Locations"
                size="large"
                className="w-full"
                value={selectedCampus || undefined}
                onChange={(value) => setSelectedCampus(value || "")}
                allowClear
                options={campuses.map((campus) => ({
                  label: campus,
                  value: campus,
                }))}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-ds-text-secondary">
          Showing {paginatedVendors.length} of {filteredVendors.length} vendors
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <EmptyState
            title="No vendors found"
            description="Try adjusting your filters or search query"
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
              {paginatedVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.storeName}
                  description={vendor.storeDescription || ""}
                  logo={vendor.storeLogo || "/placeholder-vendor.jpg"}
                  category={formatVendorCategory(vendor.category)}
                  campus={vendor.campus}
                  rating={vendor.analytics?.averageRating || 0}
                  productCount={vendor.productCount}
                  isVerified={isVendorVerified(vendor)}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-8 flex justify-center">
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : null}
          </>
        )}

        {/* Stats */}
        <div className="mt-12 grid gap-4 rounded-ds-md bg-ds-surface-base p-6 shadow-ds-sm md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-ds-text-brand">{allVendors.length}</div>
            <div className="text-sm text-ds-text-secondary">Total Vendors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-ds-text-brand">{filteredVendors.length}</div>
            <div className="text-sm text-ds-text-secondary">Vendors Found</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-ds-text-brand">
              {products.filter((p) => p.isActive).length}
            </div>
            <div className="text-sm text-ds-text-secondary">Total Products</div>
          </div>
        </div>
      </div>
    </div>
  );
}
