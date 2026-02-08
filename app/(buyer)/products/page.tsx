"use client";

import { useState } from "react";
import { ProductCard, FilterSidebar, CategoryNav, SearchBar } from "@/components/features";
import { SimplePagination, EmptyState } from "@/components/ui";
import { mockProducts, mockVendors } from "@/lib/data/mockData";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  const [filters, setFilters] = useState<{
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    locations?: string[];
    vendors?: string[];
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Apply filters
  let filteredProducts = mockProducts.filter((p) => p.isActive);

  // Search filter
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    filteredProducts = filteredProducts.filter((p) => filters.categories!.includes(p.category));
  }

  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price <= filters.maxPrice!);
    }
  }

  // Rating filter
  if (filters.rating) {
    filteredProducts = filteredProducts.filter((p) => {
      if (!p.reviews || p.reviews.length === 0) return false;
      const avgRating = p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;
      return avgRating >= filters.rating!;
    });
  }

  // Location filter
  if (filters.locations && filters.locations.length > 0) {
    filteredProducts = filteredProducts.filter((p) => {
      const vendor = mockVendors.find((v) => v.id === p.vendorId);
      return vendor && filters.locations!.includes(vendor.campus);
    });
  }

  // Vendor filter
  if (filters.vendors && filters.vendors.length > 0) {
    filteredProducts = filteredProducts.filter((p) => filters.vendors!.includes(p.vendorId));
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = [
    { id: "FARM_PRODUCE", name: "Farm Produce", slug: "farm-produce" },
    { id: "FASHION_APPAREL", name: "Fashion & Apparel", slug: "fashion" },
    { id: "FOOD_BEVERAGES", name: "Food & Beverages", slug: "food" },
    { id: "BEAUTY_COSMETICS", name: "Beauty & Cosmetics", slug: "beauty" },
    { id: "ELECTRONICS", name: "Electronics", slug: "electronics" },
    { id: "HOME_KITCHEN", name: "Home & Kitchen", slug: "home" },
  ];

  const vendorsWithProducts = mockVendors.map((v) => ({
    id: v.id,
    name: v.storeName,
  }));

  const locations = Array.from(new Set(mockVendors.map((v) => v.campus)));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search for products..."
          defaultValue={searchQuery}
        />
      </div>

      {/* Category Navigation */}
      <div className="mb-8">
        <CategoryNav categories={categories} layout="horizontal" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            vendors={vendorsWithProducts}
            locations={locations}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </div>

          {paginatedProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="h-16 w-16" />}
              title="No products found"
              description="Try adjusting your filters or search query"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {paginatedProducts.map((product) => {
                  const vendor = mockVendors.find((v) => v.id === product.vendorId);
                  const avgRating =
                    product.reviews && product.reviews.length > 0
                      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                        product.reviews.length
                      : 0;

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || "/placeholder-product.jpg"}
                      vendorName={vendor?.storeName || "Unknown Vendor"}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={product.reviews?.length || 0}
                      stock={product.stock}
                      isFeatured={product.isFeatured}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <SimplePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
