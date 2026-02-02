import type { Metadata } from "next";
import { mockVendors, mockProducts } from "@/lib/data/mockData";
import { VendorCard } from "@/components/features";
import { Input, Select, Empty } from "antd";
import { Search, Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Vendors | HarvestHub",
  description: "Discover trusted vendors selling quality products on HarvestHub marketplace",
};

export default function VendorsPage() {
  // Get all approved vendors with product counts
  const vendors = mockVendors
    .filter((vendor) => vendor.status === "APPROVED")
    .map((vendor) => ({
      ...vendor,
      productCount: mockProducts.filter((p) => p.vendorId === vendor.id && p.isActive).length,
    }))
    .sort((a, b) => b.analytics.totalOrders - a.analytics.totalOrders);

  // Get unique categories
  const categories = Array.from(new Set(vendors.map((v) => v.category)));

  // Get unique campuses
  const campuses = Array.from(new Set(vendors.map((v) => v.campus)));

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Our Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover trusted vendors from the HarvestHub community
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Vendors
              </label>
              <Input
                prefix={<Search className="h-4 w-4 text-gray-400" />}
                placeholder="Search by name..."
                size="large"
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <Select
                placeholder="All Categories"
                size="large"
                className="w-full"
                options={[
                  { label: "All Categories", value: "" },
                  ...categories.map((cat) => ({
                    label: cat.replace(/_/g, " "),
                    value: cat,
                  })),
                ]}
              />
            </div>

            {/* Campus Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <Select
                placeholder="All Locations"
                size="large"
                className="w-full"
                options={[
                  { label: "All Locations", value: "" },
                  ...campuses.map((campus) => ({
                    label: campus.replace(/_/g, " "),
                    value: campus,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Vendor Grid */}
        {vendors.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => (
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
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-900">
            <Empty
              description={
                <div>
                  <p className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    No Vendors Found
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
