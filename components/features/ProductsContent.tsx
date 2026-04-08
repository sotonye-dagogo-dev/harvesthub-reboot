"use client";

import { useEffect, useState } from "react";
import { ProductCard, FilterSidebar, CategoryNav, SearchBar } from "@/components/features";
import { SimplePagination, EmptyState } from "@/components/ui";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { Package } from "lucide-react";
import { getSubcategoryValues } from "@/lib/constants";
import type { Product, Vendor } from "@/lib/types";
import { useToast } from "@/lib/contexts/ToastContext";
import { usePathname, useRouter } from "next/navigation";
import {
  buildProductDiscoveryQueryString,
  DEFAULT_PRODUCT_SORT,
  PRODUCT_DISCOVERY_CATEGORIES,
  PRODUCT_SORT_OPTIONS,
  type ProductDiscoveryQueryState,
  type ProductSortKey,
} from "@/lib/config/productDiscovery";

interface ProductsContentProps {
  products: Product[];
  vendors: Vendor[];
  initialQueryState?: ProductDiscoveryQueryState;
}

export default function ProductsContent({
  products,
  vendors,
  initialQueryState,
}: ProductsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem } = useCart();
  const { toggleFavorite: rawToggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();
  const toast = useToast();

  const guardedToggleFavorite = (productId: string) => {
    if (!requireAuth("save favourites")) return;
    const wasFavorite = isFavorite(productId);
    rawToggleFavorite(productId);
    toast.success(wasFavorite ? "Removed from favourites" : "Added to favourites");
  };

  const [filters, setFilters] = useState<{
    categories?: string[];
    listingType?: string;
    priceRange?: { min: number; max: number };
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    locations?: string[];
    vendors?: string[];
  }>({
    categories: initialQueryState?.categories || [],
    listingType: initialQueryState?.listingType,
    priceRange:
      typeof initialQueryState?.minPrice === "number" ||
      typeof initialQueryState?.maxPrice === "number"
        ? {
            min: initialQueryState?.minPrice || 0,
            max: initialQueryState?.maxPrice || 0,
          }
        : undefined,
    rating: initialQueryState?.rating,
    locations: initialQueryState?.locations || [],
    vendors: initialQueryState?.vendors || [],
  });
  const [searchQuery, setSearchQuery] = useState(initialQueryState?.search || "");
  const [sortBy, setSortBy] = useState<ProductSortKey>(
    initialQueryState?.sort || DEFAULT_PRODUCT_SORT
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  useEffect(() => {
    const queryString = buildProductDiscoveryQueryString({
      search: searchQuery,
      sort: sortBy,
      categories: filters.categories || [],
      listingType: filters.listingType,
      minPrice: filters.priceRange?.min,
      maxPrice: filters.priceRange?.max,
      rating: filters.rating,
      vendors: filters.vendors || [],
      locations: filters.locations || [],
    });

    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [filters, pathname, router, searchQuery, sortBy]);

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

  const minPrice = filters.priceRange?.min ?? filters.minPrice;
  const maxPrice = filters.priceRange?.max ?? filters.maxPrice;
  if (minPrice !== undefined || maxPrice !== undefined) {
    if (minPrice !== undefined && minPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      filteredProducts = filteredProducts.filter((p) => p.price <= maxPrice);
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

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "trending": {
        const reviewsA = a.reviews?.length || 0;
        const reviewsB = b.reviews?.length || 0;
        if (reviewsB !== reviewsA) return reviewsB - reviewsA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "new":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = PRODUCT_DISCOVERY_CATEGORIES.map((category) => ({
    id: category.value,
    name: category.label,
    slug: category.slug,
  }));

  const selectedCategoryValue =
    filters.categories && filters.categories.length === 1 ? filters.categories[0] : undefined;

  const activeCategorySlug = selectedCategoryValue
    ? PRODUCT_DISCOVERY_CATEGORIES.find((category) => category.value === selectedCategoryValue)
        ?.slug
    : undefined;

  const vendorsWithProducts = vendors.map((v) => ({ id: v.id, name: v.storeName }));

  const locations = Array.from(new Set(vendors.map((v) => v.campus)));

  const handleAddToCart = (product: Product) => {
    if (!requireAuth("add items to your cart")) return;
    const vendor = vendors.find((v) => v.id === product.vendorId);
    const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "/placeholder-product.jpg",
      vendorId: product.vendorId,
      vendorName,
      stock: product.stock,
    });
    toast.success("Added to cart");
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
        <CategoryNav
          categories={categories}
          currentCategory={activeCategorySlug}
          layout="horizontal"
        />
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ds-text-secondary">
              Showing {paginatedProducts.length} of {sortedProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="products-sort" className="text-sm text-ds-text-secondary">
                Sort by
              </label>
              <select
                id="products-sort"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as ProductSortKey);
                  setCurrentPage(1);
                }}
                className="rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-1.5 text-sm text-ds-text-primary"
              >
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
                  const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
                  const vendorStatus = vendor?.status || product.vendor?.status;
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
                      vendorName={vendorName}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={product.reviews?.length || 0}
                      stock={product.stock}
                      discount={product.discount}
                      isVendorVerified={vendorStatus === "APPROVED"}
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
