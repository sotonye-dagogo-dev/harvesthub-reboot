"use client";

import { useState } from "react";
import { ProductCard, FilterSidebar, CategoryNav, SearchBar } from "@/components/features";
import { SimplePagination, EmptyState } from "@/components/ui";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { Package } from "lucide-react";
import { getSubcategoryValues, VENDOR_CATEGORIES } from "@/lib/constants";
import type { Product, Vendor } from "@/lib/types";

interface ProductsContentProps {
  products: Product[];
  vendors: Vendor[];
}

export default function ProductsContent({ products, vendors }: ProductsContentProps) {
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

  let filteredProducts = products.filter((p) => p.isActive);

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    const subcatValues = getSubcategoryValues(filters.categories);
    filteredProducts = filteredProducts.filter((p) => subcatValues.includes(p.category));
  }

  if (filters.listingType) {
    filteredProducts = filteredProducts.filter((p) => p.listingType === filters.listingType);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price <= filters.maxPrice!);
    }
  }

  if (filters.rating) {
    filteredProducts = filteredProducts.filter((p) => {
      if (!p.reviews || p.reviews.length === 0) return false;
      const avgRating = p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;
      return avgRating >= filters.rating!;
    });
  }

  if (filters.locations && filters.locations.length > 0) {
    filteredProducts = filteredProducts.filter((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId);
      return vendor && filters.locations!.includes(vendor.campus);
    });
  }

  if (filters.vendors && filters.vendors.length > 0) {
    filteredProducts = filteredProducts.filter((p) => filters.vendors!.includes(p.vendorId));
  }

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

  const vendorsWithProducts = vendors.map((v) => ({ id: v.id, name: v.storeName }));

  const locations = Array.from(new Set(vendors.map((v) => v.campus)));

  const handleAddToCart = (product: Product) => {
    if (!requireAuth("add items to your cart")) return;
    const vendor = vendors.find((v) => v.id === product.vendorId);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "/placeholder-product.jpg",
      vendorId: product.vendorId,
      vendorName: vendor?.storeName || "Unknown Vendor",
      stock: product.stock,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search for products..."
          defaultValue={searchQuery}
        />
      </div>

      <div className="mb-6 sm:mb-8">
        <CategoryNav categories={categories} layout="horizontal" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              vendors={vendorsWithProducts}
              locations={locations}
            />
          </div>
        </div>

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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedProducts.map((product) => {
                  const vendor = vendors.find((v) => v.id === product.vendorId);
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
                      isFavorite={isFavorite(product.id)}
                      onToggleFavorite={() => guardedToggleFavorite(product.id)}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  );
                })}
              </div>

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
