"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { BannerCarousel, ProductCard, CategoryNav, VendorCard } from "@/components/features";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { formatVendorCategory } from "@/lib/utils/format";
import type { Banner, Product, Vendor } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { isVendorVerified } from "@/lib/utils/vendor";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_DISCOVERY_CATEGORIES,
  buildProductDiscoveryQueryString,
} from "@/lib/config/productDiscovery";
import { AD_RAIL_CONFIG } from "@/lib/config/adRail";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { useAutoScrollRail } from "@/lib/hooks/useAutoScrollRail";
import {
  getBannersClient,
  getProductsClient,
  getVendorsClient,
} from "@/lib/data/clientDataFetchers";

interface HomeContentProps {
  banners: Banner[];
  products: Product[];
  vendors: Vendor[];
}

const HOME_RAIL_CONTAINER_CLASS =
  "flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2";
const HOME_RAIL_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-brand-primary focus-visible:ring-offset-2";
const HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS = "w-[15rem] flex-shrink-0 sm:w-[16rem] lg:w-[17rem]";
const HOME_VENDOR_RAIL_ITEM_WIDTH_CLASS = "w-[18rem] flex-shrink-0 sm:w-[19rem] lg:w-[20rem]";

function normalizeBannerText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function HomeContent({ banners, products, vendors }: HomeContentProps) {
  const fetchHomeResource = useCallback(
    async (): Promise<{ banners: Banner[]; products: Product[]; vendors: Vendor[] }> => ({
      banners: await getBannersClient(),
      products: await getProductsClient({ limit: 120 }),
      vendors: await getVendorsClient(120),
    }),
    []
  );

  const {
    data: homeResource,
    isRefreshing,
    error,
  } = useSmartResource(fetchHomeResource, {
    key: "home-runtime-resource",
    refreshIntervalMs: 120_000,
    staleTimeMs: 30_000,
  });

  const liveBanners = homeResource?.banners ?? banners;
  const liveProducts = homeResource?.products ?? products;
  const liveVendors = homeResource?.vendors ?? vendors;

  const getProductReviewMetrics = (product: Product) => {
    const reviewCount =
      typeof product.totalReviews === "number"
        ? product.totalReviews
        : (product.reviews?.length ?? 0);

    if (!product.reviews || product.reviews.length === 0) {
      return {
        reviewCount,
        avgRating: typeof product.averageRating === "number" ? product.averageRating : 0,
      };
    }

    return {
      reviewCount,
      avgRating:
        product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length,
    };
  };

  // Get active HERO banners – map from the rich Banner type to BannerItem shape
  const activeBanners = liveBanners
    .filter(
      (b) =>
        b.isActive &&
        b.position === "HERO" &&
        (!b.endDate || new Date(b.endDate) >= new Date()) &&
        normalizeBannerText(b.title).length > 0
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

  const activeSidebarBanners = liveBanners
    .filter(
      (b) =>
        b.isActive &&
        b.position === "SIDEBAR" &&
        (!b.endDate || new Date(b.endDate) >= new Date()) &&
        typeof b.imageUrl === "string" &&
        b.imageUrl.trim().length > 0
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6);

  const hasHeroBanners = activeBanners.length > 0;
  const sidebarGridColumnsClass =
    activeSidebarBanners.length > 1
      ? hasHeroBanners
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-1";
  const sidebarImageSizes = hasHeroBanners
    ? "(min-width: 1280px) 13vw, (min-width: 1024px) 15vw, (min-width: 640px) 20vw, 44vw"
    : "(min-width: 1280px) 18vw, (min-width: 1024px) 20vw, (min-width: 640px) 28vw, 44vw";
  const enableRailAutoScroll = activeSidebarBanners.length > 1;
  const mobileRailAutoScroll = useAutoScrollRail({
    enabled: enableRailAutoScroll,
    direction: "horizontal",
    stepPx: AD_RAIL_CONFIG.mobile.autoScroll.stepPx,
    intervalMs: AD_RAIL_CONFIG.mobile.autoScroll.intervalMs,
    pauseAfterInteractionMs: AD_RAIL_CONFIG.interactionPauseMs,
  });
  const desktopRailAutoScroll = useAutoScrollRail({
    enabled: enableRailAutoScroll,
    direction: "vertical",
    stepPx: AD_RAIL_CONFIG.desktop.autoScroll.stepPx,
    intervalMs: AD_RAIL_CONFIG.desktop.autoScroll.intervalMs,
    pauseAfterInteractionMs: AD_RAIL_CONFIG.interactionPauseMs,
  });

  // Get featured products
  const featuredProducts = liveProducts
    .filter((product) => product.isFeatured && product.isActive)
    .slice(0, 8);

  // Get trending products (sort by reviews count)
  const trendingProducts = liveProducts
    .filter((product) => product.isActive)
    .sort((a, b) => getProductReviewMetrics(b).reviewCount - getProductReviewMetrics(a).reviewCount)
    .slice(0, 8);

  // Get new arrivals (sort by createdAt)
  const newArrivals = liveProducts
    .filter((product) => product.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Get deals (products with discount >= 5%)
  const dealsProducts = liveProducts
    .filter((p) => p.isActive && typeof p.discount === 'number' && p.discount >= 5)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    .slice(0, 12);

  // Get popular vendors (vendors with most products)
  const popularVendors = liveVendors
    .map((vendor) => ({
      ...vendor,
      productCount: liveProducts.filter((p) => p.vendorId === vendor.id && p.isActive).length,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);

  // Categories for navigation
  const categories = PRODUCT_DISCOVERY_CATEGORIES.map((category) => ({
    id: category.value,
    name: category.label,
    slug: category.slug,
  }));

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

  const handleAddToCart = (product: (typeof featuredProducts)[number]) => {
    if (!requireAuth("add items to your cart")) return;
    const vendor = liveVendors.find((v) => v.id === product.vendorId);
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
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-ds-surface-sunken dark:bg-ds-surface-sunken">
      {/* Hero + Side Banner Deck */}
      {(activeBanners.length > 0 || activeSidebarBanners.length > 0) && (
        <section className="container mx-auto px-4 py-3">
          <div className="grid min-w-0 gap-2 lg:grid-cols-12">
            {activeBanners.length > 0 && (
              <div className="min-w-0 lg:col-span-8">
                <BannerCarousel banners={activeBanners} autoPlay />
              </div>
            )}
            {activeSidebarBanners.length > 0 && (
              <aside className={hasHeroBanners ? "min-w-0 lg:col-span-4" : "min-w-0 lg:col-span-12"}>
                <div
                  data-testid="sidebar-banner-rail-mobile"
                  ref={mobileRailAutoScroll.railRef}
                  className={`flex ${AD_RAIL_CONFIG.mobile.gapClass} overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 lg:hidden`}
                  {...mobileRailAutoScroll.bind}
                >
                  {activeSidebarBanners.map((banner) => {
                    const href = banner.actions?.[0]?.href || banner.linkUrl || undefined;
                    const cardContent = (
                        <div
                          data-testid="sidebar-banner-tile"
                          className={`relative ${AD_RAIL_CONFIG.mobile.tileWidthClass} flex-shrink-0 overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base shadow-ds-sm`}
                        >
                        <div className="relative aspect-square w-full">
                          <Image
                            src={banner.imageUrl}
                            alt={normalizeBannerText(banner.title) || "Sidebar banner"}
                            fill
                            className="object-cover"
                            sizes={sidebarImageSizes}
                          />
                        </div>
                      </div>
                    );

                    if (!href) {
                      return <div key={banner.id}>{cardContent}</div>;
                    }

                    return (
                      <Link
                        key={banner.id}
                        href={href}
                        className="transition-opacity hover:opacity-95"
                      >
                        {cardContent}
                      </Link>
                    );
                  })}
                </div>

                <div
                  data-testid="sidebar-banner-grid"
                  ref={desktopRailAutoScroll.railRef}
                  className={`hidden w-full min-w-0 ${AD_RAIL_CONFIG.desktop.gapClass} lg:grid ${sidebarGridColumnsClass} ${
                    hasHeroBanners
                      ? `${AD_RAIL_CONFIG.desktop.maxHeightClass} overflow-y-auto overflow-x-hidden pr-1`
                      : "overflow-visible"
                  }`}
                  {...desktopRailAutoScroll.bind}
                >
                  {activeSidebarBanners.map((banner) => {
                    const href = banner.actions?.[0]?.href || banner.linkUrl || undefined;
                    const cardContent = (
                      <div
                        data-testid="sidebar-banner-tile"
                        className="relative w-full min-w-0 overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base shadow-ds-sm"
                      >
                        <div className="relative aspect-square w-full">
                          <Image
                            src={banner.imageUrl}
                            alt={normalizeBannerText(banner.title) || "Sidebar banner"}
                            fill
                            className="object-cover"
                            sizes={sidebarImageSizes}
                          />
                        </div>
                      </div>
                    );

                    if (!href) {
                      return <div key={banner.id}>{cardContent}</div>;
                    }

                    return (
                      <Link
                        key={banner.id}
                        href={href}
                        className="block min-w-0 transition-opacity hover:opacity-95"
                      >
                        {cardContent}
                      </Link>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
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

        {/*Fallback for when there are no products using EmptyState component*/}
        {liveProducts.length === 0 && <EmptyState title={"No Products Found"} />}
        {isRefreshing ? (
          <p className="mb-3 text-xs text-ds-text-tertiary">Refreshing marketplace data...</p>
        ) : null}
        {error ? <p className="mb-3 text-xs text-ds-status-error-text">{error}</p> : null}

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
            <div
              className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
              tabIndex={0}
              aria-label="Featured products horizontal list"
            >
              {featuredProducts.map((product) => {
                const vendor = liveVendors.find((v) => v.id === product.vendorId);
                const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
                const vendorStatus = vendor?.status || product.vendor?.status;
                const { avgRating, reviewCount } = getProductReviewMetrics(product);

                return (
                  <div key={product.id} className={HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || "/placeholder-product.jpg"}
                      vendorName={vendorName}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={reviewCount}
                      stock={product.stock}
                      discount={product.discount}
                      isFeatured={product.isFeatured}
                      isVendorVerified={vendorStatus === "APPROVED"}
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
                href={`/products?${buildProductDiscoveryQueryString({ sort: "trending" })}`}
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div
              className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
              tabIndex={0}
              aria-label="Trending products horizontal list"
            >
              {trendingProducts.map((product) => {
                const vendor = liveVendors.find((v) => v.id === product.vendorId);
                const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
                const vendorStatus = vendor?.status || product.vendor?.status;
                const { avgRating, reviewCount } = getProductReviewMetrics(product);

                return (
                  <div key={product.id} className={HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || "/placeholder-product.jpg"}
                      vendorName={vendorName}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={reviewCount}
                      stock={product.stock}
                      discount={product.discount}
                      isFeatured={product.isFeatured}
                      isVendorVerified={vendorStatus === "APPROVED"}
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
                href={`/products?${buildProductDiscoveryQueryString({ sort: DEFAULT_PRODUCT_SORT })}`}
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div
              className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
              tabIndex={0}
              aria-label="New arrivals horizontal list"
            >
              {newArrivals.map((product) => {
                const vendor = liveVendors.find((v) => v.id === product.vendorId);
                const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
                const vendorStatus = vendor?.status || product.vendor?.status;
                const { avgRating, reviewCount } = getProductReviewMetrics(product);

                return (
                  <div key={product.id} className={HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || "/placeholder-product.jpg"}
                      vendorName={vendorName}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={reviewCount}
                      stock={product.stock}
                      discount={product.discount}
                      isFeatured={product.isFeatured}
                      isVendorVerified={vendorStatus === "APPROVED"}
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

        {/* Hot Deals */}
        {dealsProducts.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ds-text-primary sm:text-2xl dark:text-ds-text-primary">
                🔥 Hot Deals
              </h2>
              <Link
                href={`/products?${buildProductDiscoveryQueryString({ sort: "trending" })}`}
                className="text-sm font-medium text-ds-text-brand hover:text-ds-palette-purple-700"
              >
                View All →
              </Link>
            </div>
            <div
              className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
              tabIndex={0}
              aria-label="Hot deals horizontal list"
            >
              {dealsProducts.map((product) => {
                const vendor = liveVendors.find((v) => v.id === product.vendorId);
                const vendorName = vendor?.storeName || product.vendor?.storeName || "Vendor";
                const vendorStatus = vendor?.status || product.vendor?.status;
                const { avgRating, reviewCount } = getProductReviewMetrics(product);

                return (
                  <div key={product.id} className={HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0] || "/placeholder-product.jpg"}
                      vendorName={vendorName}
                      vendorId={product.vendorId}
                      rating={avgRating}
                      reviewCount={reviewCount}
                      stock={product.stock}
                      discount={product.discount}
                      isFeatured={product.isFeatured}
                      isVendorVerified={vendorStatus === "APPROVED"}
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
            <div
              className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
              tabIndex={0}
              aria-label="Popular vendors horizontal list"
            >
              {popularVendors.map((vendor) => (
                <div key={vendor.id} className={HOME_VENDOR_RAIL_ITEM_WIDTH_CLASS}>
                  <VendorCard
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
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
