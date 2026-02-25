"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/features";
import { EmptyState } from "@/components/ui";
import { mockProducts, mockVendors } from "@/lib/data/mockData";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";

export default function FavouritesPage() {
  const { addItem } = useCart();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();

  const favoriteProducts = mockProducts.filter((p) => favoriteIds.includes(p.id));

  const handleAddToCart = (product: (typeof favoriteProducts)[number]) => {
    if (!requireAuth("add items to your cart")) return;
    const vendor = mockVendors.find((v) => v.id === product.vendorId);
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
    <div className="min-h-screen bg-ds-surface-sunken dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ds-text-primary sm:text-3xl">My Favourites</h1>
          <p className="mt-1 text-sm text-ds-text-secondary">
            {favoriteProducts.length > 0
              ? `${favoriteProducts.length} item${favoriteProducts.length !== 1 ? "s" : ""} saved`
              : "Products you love will appear here"}
          </p>
        </div>

        {favoriteProducts.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-12 w-12" />}
            title="No favourites yet"
            description="Browse products and tap the heart icon to save your favourites"
            action={
              <Link
                href="/products"
                className="inline-block rounded-ds-md bg-ds-brand-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-ds-brand-primary-hover transition-colors"
              >
                Browse Products
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {favoriteProducts.map((product) => {
              const vendor = mockVendors.find((v) => v.id === product.vendorId);
              const avgRating =
                product.reviews && product.reviews.length > 0
                  ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
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
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
