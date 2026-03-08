"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  BannerCarousel,
  ProductCard,
  CategoryNav,
  VendorCard,
  TopAdBanner,
} from "@/components/features";
import { mockBanners, mockProducts, mockVendors } from "@/lib/data/mockData";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";

export default function HomePage() {
  // Get active HERO banners – map from the rich Banner type to BannerItem shape
  const activeBanners = mockBanners
    .filter(
      (b) =>
        b.isActive && b.position === "HERO" && (!b.endDate || new Date(b.endDate) >= new Date())
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      image: b.imageUrl,
      link: b.linkUrl ?? undefined,
      description: b.description ?? undefined,
      actions:
        b.actions?.map((a) => ({
          label: a.label,
          href: a.href,
          variant: a.variant,
          openInNewTab: a.openInNewTab,
        })) ?? undefined,
      theme: b.theme ?? undefined,
      accentColor: b.accentColor ?? undefined,
      details: b.details ?? undefined,
      knowMoreLabel: b.knowMoreLabel ?? undefined,
    }));

  // Get featured products
  const featuredProducts = mockProducts
    .filter((product) => product.isFeatured && product.isActive)
    .slice(0, 8);

  // Get trending products (sort by reviews count)
  const trendingProducts = mockProducts
    .filter((product) => product.isActive)
    .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
    .slice(0, 8);

  // Get new arrivals (sort by createdAt)
  const newArrivals = mockProducts
    .filter((product) => product.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Get popular vendors (vendors with most products)
  const popularVendors = mockVendors
    .map((vendor) => ({
      ...vendor,
      productCount: mockProducts.filter((p) => p.vendorId === vendor.id && p.isActive).length,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);

  // Categories for navigation
  const categories = [
    { id: "1", name: "Farm Produce", slug: "farm-produce" },
    { id: "2", name: "Fashion & Apparel", slug: "fashion" },
    { id: "3", name: "Food & Beverages", slug: "food" },
    { id: "4", name: "Beauty & Cosmetics", slug: "beauty" },
    { id: "5", name: "Electronics", slug: "electronics" },
    { id: "6", name: "Home & Kitchen", slug: "home" },
  ];

  const { addItem } = useCart();
  const { toggleFavorite: rawToggleFavorite, isFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();

  const guardedToggleFavorite = (productId: string) => {
    if (!requireAuth("save favourites")) return;
    rawToggleFavorite(productId);
  };

  const handleAddToCart = (product: (typeof featuredProducts)[number]) => {
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
      <Header />
      {/* Top Ad Banner - below navbar */}
      <TopAdBanner />
      {/* Hero Banner Carousel */}
      {activeBanners.length > 0 && (
        <section>
          <BannerCarousel banners={activeBanners} autoPlay />
        </section>
      )}

      <div className="container mx-auto px-4 py-3">
        {/* Category Navigation */}
        <section className="mb-3">
          <h2 className="mb-3 text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
            Shop by Category
          </h2>
          <CategoryNav categories={categories} layout="horizontal" />
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
                Featured Products
              </h2>
              <Link
                href="/products?featured=true"
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-3">
              {featuredProducts.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="min-w-[140px] max-w-[140px] snap-start sm:min-w-[170px] sm:max-w-[170px] md:min-w-[200px] md:max-w-[200px]"
                  >
                    <ProductCard
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
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
                Trending Now
              </h2>
              <Link
                href="/products?sort=trending"
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-3">
              {trendingProducts.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="min-w-[140px] max-w-[140px] snap-start sm:min-w-[170px] sm:max-w-[170px] md:min-w-[200px] md:max-w-[200px]"
                  >
                    <ProductCard
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
                New Arrivals
              </h2>
              <Link
                href="/products?sort=newest"
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-3">
              {newArrivals.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="min-w-[140px] max-w-[140px] snap-start sm:min-w-[170px] sm:max-w-[170px] md:min-w-[200px] md:max-w-[200px]"
                  >
                    <ProductCard
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Popular Vendors */}
        {popularVendors.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
                Popular Vendors
              </h2>
              <Link
                href="/vendors"
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory sm:gap-3">
              {popularVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="min-w-[240px] max-w-[240px] snap-start sm:min-w-[280px] sm:max-w-[280px]"
                >
                  <VendorCard
                    id={vendor.id}
                    name={vendor.storeName}
                    category={vendor.category}
                    campus={vendor.campus}
                    rating={vendor.analytics.averageRating}
                    productCount={vendor.productCount}
                    logo={vendor.storeLogo || undefined}
                    isVerified={vendor.status === "APPROVED"}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="rounded-ds-md bg-gradient-to-r from-ds-brand-primary to-ds-palette-purple-800 p-8 text-center text-white dark:from-ds-palette-purple-800">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Selling?</h2>
          <p className="mb-6 text-lg opacity-90">
            Join hundreds of vendors already selling on HarvestHub
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-ds-md bg-ds-surface-base px-8 py-3 font-semibold text-ds-text-brand transition-transform hover:scale-105 hover:shadow-ds-lg"
          >
            Become a Vendor
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
}
