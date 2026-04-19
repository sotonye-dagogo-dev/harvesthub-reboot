"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/features";
import { EmptyState } from "@/components/ui";
import { getProductsClient, getVendorsClient } from "@/lib/data/clientDataFetchers";
import type { Product, Vendor } from "@/lib/types";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { useToast } from "@/lib/contexts/ToastContext";

export default function FavouritesPage() {
  const { addItem } = useCart();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [p, v] = await Promise.all([getProductsClient(), getVendorsClient()]);
        if (!mounted) return;
        setProducts(Array.isArray(p) ? p : []);
        setVendors(Array.isArray(v) ? v : []);
      } catch (error) {
        console.error("Failed to load favourites:", error);
        if (!mounted) return;
        setProducts([]);
        setVendors([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));

  const handleAddToCart = (product: Product) => {
    if (!requireAuth("add items to your cart")) return;

    const vendor = vendors.find((v) => v.id === product.vendorId);
    const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
    const discountPercent = Math.min(Math.max(Number(product.discount ?? 0), 0), 100);
    const effectivePrice =
      discountPercent > 0 ? Math.max(product.price - (product.price * discountPercent) / 100, 0) : product.price;
    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      originalPrice: discountPercent > 0 ? product.price : undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      image: product.images[0] || "/placeholder-product.jpg",
      vendorId: product.vendorId,
      vendorName,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleFavorite = (productId: string) => {
    const wasFavorite = isFavorite(productId);
    toggleFavorite(productId);
    toast.success(wasFavorite ? "Removed from favourites" : "Added to favourites");
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
                className="inline-block rounded-ds-md bg-ds-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ds-brand-primary-hover"
              >
                Browse Products
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {favoriteProducts.map((product) => {
              const vendor = vendors.find((v) => v.id === product.vendorId);
              const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
              const vendorStatus = vendor?.status || product.vendor?.status;
              const avgRating =
                product.reviews && product.reviews.length > 0
                  ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
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
                  isFeatured={product.isFeatured}
                  isVendorVerified={vendorStatus === "APPROVED"}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
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
