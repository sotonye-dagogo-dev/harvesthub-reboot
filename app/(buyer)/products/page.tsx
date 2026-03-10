"use client";

import { useState } from "react";
import { ProductCard, FilterSidebar, CategoryNav, SearchBar } from "@/components/features";
import { SimplePagination, EmptyState } from "@/components/ui";
import { mockProducts, mockVendors } from "@/lib/data/mockData";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { Package } from "lucide-react";
import { getSubcategoryValues, VENDOR_CATEGORIES } from "@/lib/constants";
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  const { addItem } = useCart();
  const { toggleFavorite: rawToggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();

  const guardedToggleFavorite = (productId: string) => {
    if (!requireAuth("save favourites")) return;
    rawToggleFavorite(productId);
  };
  const [filters, setFilters] = useState<{
    categories?: string[];
    listingType?: string;
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

  // Category filter — map parent categories to their subcategory values
  if (filters.categories && filters.categories.length > 0) {
    const subcatValues = getSubcategoryValues(filters.categories);
    filteredProducts = filteredProducts.filter((p) => subcatValues.includes(p.category));
  }

  // Listing type filter
  if (filters.listingType) {
    filteredProducts = filteredProducts.filter((p) => p.listingType === filters.listingType);
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

  const categories = VENDOR_CATEGORIES.map((cat) => ({
    id: cat.value,
    name: cat.label,
    slug: cat.value.toLowerCase().replace(/_/g, "-"),
  }));

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
          <div className="mb-4 text-sm text-ds-text-secondary">
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
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
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
                      discount={product.discount}
                      isFeatured={product.isFeatured}
                      isFavorite={isFavorite(product.id)}
                      onToggleFavorite={() => guardedToggleFavorite(product.id)}
                      onAddToCart={() => {
                        if (!requireAuth("add items to your cart")) return;
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.images[0] || "/placeholder-product.jpg",
                          vendorId: product.vendorId,
                          vendorName: vendor?.storeName || "Unknown Vendor",
                          stock: product.stock,
                        });
                      }}
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
