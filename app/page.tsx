import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { BannerCarousel, ProductCard, CategoryNav, VendorCard } from "@/components/features";
import { mockBanners, mockProducts, mockVendors } from "@/lib/data/mockData";

export default function HomePage() {
  // Get active banners
  const activeBanners = mockBanners
    .filter((banner) => banner.isActive)
    .map((banner) => ({
      id: banner.id,
      title: banner.title,
      image: banner.imageUrl,
      link: banner.linkUrl || undefined,
      description: banner.description || undefined,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      {/* Banner Carousel */}
      {activeBanners.length > 0 && (
        <section className="mb-8">
          <BannerCarousel banners={activeBanners} autoPlay interval={5000} />
        </section>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Category Navigation */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Shop by Category
          </h2>
          <CategoryNav categories={categories} layout="horizontal" />
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Featured Products
              </h2>
              <Link
                href="/products?featured=true"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {featuredProducts.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start">
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
                      isFeatured={product.isFeatured}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
              <Link
                href="/products?sort=trending"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {trendingProducts.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start">
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
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Arrivals</h2>
              <Link
                href="/products?sort=newest"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {newArrivals.map((product) => {
                const vendor = mockVendors.find((v) => v.id === product.vendorId);
                const avgRating =
                  product.reviews && product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;

                return (
                  <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start">
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
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Popular Vendors */}
        {popularVendors.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Vendors</h2>
              <Link
                href="/vendors"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {popularVendors.map((vendor) => (
                <div key={vendor.id} className="min-w-[320px] max-w-[320px] snap-start">
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
        <section className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-center text-white dark:from-purple-800 dark:to-purple-950">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Selling?</h2>
          <p className="mb-6 text-lg opacity-90">
            Join hundreds of vendors already selling on HarvestHub
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-purple-600 transition-transform hover:scale-105 hover:shadow-lg"
          >
            Become a Vendor
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
}
