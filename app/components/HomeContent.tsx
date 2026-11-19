"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, MapPin, Store, Zap } from "lucide-react";
import Image from "next/image";
import { BannerCarousel, ProductCard, CategoryNav, VendorCard } from "@/components/features";
import { BannerActionModal } from "@/components/features/BannerCarousel";
import { buildCartPricing, useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { formatVendorCategory } from "@/lib/utils/format";
import type { Banner, Product, Vendor } from "@/lib/types";
import type { BannerItem } from "@/components/features";
import { EmptyState } from "@/components/ui/EmptyState";
import { isVendorVerified } from "@/lib/utils/vendor";
import { useToast } from "@/lib/contexts/ToastContext";
import { HomeBlogSection } from "@/components/features/blog/HomeBlogSection";
import { CategorySidebar } from "@/components/features/home/CategorySidebar";
import { FlashSaleCountdown } from "@/components/features/home/FlashSaleCountdown";
import { HomeSection } from "@/components/features/home/HomeSection";
import { HomeValueStrip } from "@/components/features/home/HomeValueStrip";
import { HarvestersCross } from "@/components/brand";
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_DISCOVERY_CATEGORIES,
  buildProductDiscoveryQueryString,
} from "@/lib/config/productDiscovery";
import { AD_RAIL_CONFIG } from "@/lib/config/adRail";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { useAutoScrollRail } from "@/lib/hooks/useAutoScrollRail";
import { resolveBannerActions } from "@/lib/utils/bannerActions";
import { trackBannerImpression, trackBannerClick } from "@/lib/tracking/bannerTracking";
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
const HOME_PRODUCT_RAIL_ITEM_WIDTH_CLASS =
  "w-[calc((100%-0.75rem)/2)] min-w-[10.5rem] flex-shrink-0 sm:w-[calc((100%-1.5rem)/3)] md:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-3.75rem)/6)]";
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
  const [activeSidebarModalBanner, setActiveSidebarModalBanner] = useState<BannerItem | null>(null);

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
      actions: resolveBannerActions({
        actions: b.actions,
        linkUrl: b.linkUrl,
        defaultLabel: "Open promotion",
      }),
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      image: b.imageUrl,
      link: b.linkUrl ?? undefined,
      description: b.description ?? undefined,
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

  // Track sidebar ad impressions once per session (deduped client-side).
  useEffect(() => {
    activeSidebarBanners.forEach((banner) => trackBannerImpression(banner.id, "sidebar"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSidebarBanners.length]);
  // The ad rail always sits in the narrow right column beside the hero (Jumia layout).
  const sidebarGridColumnsClass = activeSidebarBanners.length > 1 ? "grid-cols-2" : "grid-cols-1";
  const sidebarImageSizes = "(min-width: 1280px) 11vw, (min-width: 1024px) 13vw, (min-width: 640px) 20vw, 44vw";
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
    .slice(0, 12);

  // Get trending products (sort by reviews count)
  const trendingProducts = liveProducts
    .filter((product) => product.isActive)
    .sort((a, b) => getProductReviewMetrics(b).reviewCount - getProductReviewMetrics(a).reviewCount)
    .slice(0, 12);

  // Get new arrivals (sort by createdAt)
  const newArrivals = liveProducts
    .filter((product) => product.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  // Get deals (products with discount >= 5%)
  const dealsProducts = liveProducts
    .filter((p) => p.isActive && typeof p.discount === "number" && p.discount >= 5)
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
    const pricing = buildCartPricing(product.price, product.discount);
    addItem({
      productId: product.id,
      name: product.name,
      ...pricing,
      image: product.images[0] || "/placeholder-product.jpg",
      vendorId: product.vendorId,
      vendorName,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  };

  const mapBannerToModalItem = useCallback(
    (banner: Banner): BannerItem => ({
      id: banner.id,
      title: normalizeBannerText(banner.title) || "Sponsored promotion",
      subtitle: banner.subtitle ?? undefined,
      image: banner.imageUrl,
      link: banner.linkUrl ?? undefined,
      description: banner.description ?? undefined,
      actions: resolveBannerActions({
        actions: banner.actions,
        linkUrl: banner.linkUrl,
        defaultLabel: "Open promotion",
      }),
      theme: banner.theme ?? undefined,
      accentColor: banner.accentColor ?? undefined,
      details: banner.details ?? undefined,
      knowMoreLabel: banner.knowMoreLabel ?? undefined,
    }),
    []
  );

  const renderProductRail = (
    list: Product[],
    ariaLabel: string,
    options: { showStockBar?: boolean } = {}
  ) => (
    <div
      className={`${HOME_RAIL_CONTAINER_CLASS} ${HOME_RAIL_FOCUS_CLASS}`}
      tabIndex={0}
      aria-label={ariaLabel}
    >
      {list.map((product) => {
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
              showStockBar={options.showStockBar}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-ds-surface-sunken dark:bg-ds-surface-sunken">
      {/* Hero deck: category menu | hero slider | ad rail or promo tiles (Jumia layout) */}
      <section className="container mx-auto px-4 py-3">
        <div className="grid min-w-0 gap-3 lg:grid-cols-12">
          <aside className="hidden min-w-0 lg:col-span-2 lg:block">
            <CategorySidebar categories={categories} />
          </aside>

          <div className="min-w-0 lg:col-span-7">
            {hasHeroBanners ? (
              <BannerCarousel banners={activeBanners} autoPlay />
            ) : (
              <div className="relative flex h-full min-h-[14rem] flex-col justify-center overflow-hidden rounded-ds-md bg-ds-brand-deep p-6 text-ds-brand-on-deep sm:p-10">
                <HarvestersCross
                  size={260}
                  className="pointer-events-none absolute -right-10 -top-6 text-white opacity-10"
                  title=""
                />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-palette-magenta-200">
                  The Harvesters marketplace
                </p>
                <h1 className="mt-2 max-w-md text-2xl font-bold text-white sm:text-4xl">
                  Shop. Serve. Grow.
                </h1>
                <p className="mt-2 max-w-md text-sm text-ds-palette-purple-200 sm:text-base">
                  Buy from trusted vendors in the Harvesters family and pick up at your campus.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="rounded-ds-md bg-ds-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-ds-md hover:bg-ds-brand-primary-hover hover:text-white"
                  >
                    Start shopping
                  </Link>
                  <Link
                    href="/become-vendor"
                    className="rounded-ds-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    Open your store
                  </Link>
                </div>
              </div>
            )}
          </div>

          {activeSidebarBanners.length > 0 ? (
            <aside className="min-w-0 lg:col-span-3">
              <div
                data-testid="sidebar-banner-rail-mobile"
                ref={mobileRailAutoScroll.railRef}
                className={`flex ${AD_RAIL_CONFIG.mobile.gapClass} overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 lg:hidden`}
                {...mobileRailAutoScroll.bind}
              >
                {activeSidebarBanners.map((banner) => {
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

                  return (
                    <button
                      type="button"
                      key={banner.id}
                      onClick={() => {
                        trackBannerClick(banner.id, "sidebar");
                        setActiveSidebarModalBanner(mapBannerToModalItem(banner));
                      }}
                      className="transition-opacity hover:opacity-95"
                      aria-label={`Know more about ${normalizeBannerText(banner.title) || "this sidebar ad"}`}
                    >
                      {cardContent}
                    </button>
                  );
                })}
              </div>

              <div
                data-testid="sidebar-banner-grid"
                ref={desktopRailAutoScroll.railRef}
                className={`hidden w-full min-w-0 ${AD_RAIL_CONFIG.desktop.gapClass} ${AD_RAIL_CONFIG.desktop.maxHeightClass} overflow-y-auto overflow-x-hidden pr-1 lg:grid ${sidebarGridColumnsClass}`}
                {...desktopRailAutoScroll.bind}
              >
                {activeSidebarBanners.map((banner) => {
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

                  return (
                    <button
                      type="button"
                      key={banner.id}
                      onClick={() => {
                        trackBannerClick(banner.id, "sidebar");
                        setActiveSidebarModalBanner(mapBannerToModalItem(banner));
                      }}
                      className="block min-w-0 transition-opacity hover:opacity-95"
                      aria-label={`Know more about ${normalizeBannerText(banner.title) || "this sidebar ad"}`}
                    >
                      {cardContent}
                    </button>
                  );
                })}
              </div>
            </aside>
          ) : (
            <aside className="hidden min-w-0 flex-col gap-3 lg:col-span-3 lg:flex">
              <Link
                href="/become-vendor"
                className="group flex flex-1 flex-col justify-between rounded-ds-md bg-ds-surface-base p-4 shadow-ds-sm transition-shadow hover:shadow-ds-md dark:bg-ds-surface-raised"
              >
                <Store className="h-7 w-7 text-ds-brand-primary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ds-text-primary">Sell on MyHarvestHub</span>
                  <span className="block text-xs text-ds-text-secondary">Reach the whole Harvesters community</span>
                </span>
              </Link>
              <Link
                href="/help"
                className="group flex flex-1 flex-col justify-between rounded-ds-md bg-ds-surface-base p-4 shadow-ds-sm transition-shadow hover:shadow-ds-md dark:bg-ds-surface-raised"
              >
                <MapPin className="h-7 w-7 text-ds-text-brand" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ds-text-primary">Campus pickup</span>
                  <span className="block text-xs text-ds-text-secondary">Collect your order after service</span>
                </span>
              </Link>
              <Link
                href="/advertise"
                className="group flex flex-1 flex-col justify-between rounded-ds-md bg-ds-brand-primary p-4 text-white shadow-ds-sm transition-colors hover:bg-ds-brand-primary-hover hover:text-white"
              >
                <Megaphone className="h-7 w-7" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">Advertise with us</span>
                  <span className="block text-xs text-ds-palette-magenta-100">Put your brand in front of buyers</span>
                </span>
              </Link>
            </aside>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 pb-3">
        {/* Phones/tablets: the side category menu is hidden, so show one compact scrollable row */}
        <nav aria-label="Shop by category" className="mb-3 lg:hidden">
          <CategoryNav categories={categories} layout="horizontal" className="pb-1" />
        </nav>

        <HomeValueStrip />

        {liveProducts.length === 0 && <EmptyState title={"No Products Found"} />}
        {isRefreshing ? (
          <p className="mb-3 text-xs text-ds-text-tertiary">Refreshing marketplace data...</p>
        ) : null}
        {error ? <p className="mb-3 text-xs text-ds-status-error-text">{error}</p> : null}

        {/* Flash Sales */}
        {dealsProducts.length > 0 && (
          <HomeSection
            tone="magenta"
            title={
              <>
                <Zap className="h-5 w-5 fill-current" aria-hidden="true" /> Flash Sales
              </>
            }
            headerExtra={<FlashSaleCountdown />}
            href={`/products?${buildProductDiscoveryQueryString({ sort: "trending" })}`}
          >
            {renderProductRail(dealsProducts, "Hot deals horizontal list", { showStockBar: true })}
          </HomeSection>
        )}

        {featuredProducts.length > 0 && (
          <HomeSection tone="deep" title="Top Picks for You" href="/products?featured=true">
            {renderProductRail(featuredProducts, "Featured products horizontal list")}
          </HomeSection>
        )}

        {trendingProducts.length > 0 && (
          <HomeSection
            title="Trending Now"
            href={`/products?${buildProductDiscoveryQueryString({ sort: "trending" })}`}
          >
            {renderProductRail(trendingProducts, "Trending products horizontal list")}
          </HomeSection>
        )}

        {newArrivals.length > 0 && (
          <HomeSection
            title="New Arrivals"
            href={`/products?${buildProductDiscoveryQueryString({ sort: DEFAULT_PRODUCT_SORT })}`}
          >
            {renderProductRail(newArrivals, "New arrivals horizontal list")}
          </HomeSection>
        )}

        {popularVendors.length > 0 && (
          <HomeSection tone="deep" title="Official Stores" href="/vendors">
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
          </HomeSection>
        )}
      </div>

      <HomeBlogSection />

      {activeSidebarModalBanner ? (
        <BannerActionModal
          banner={activeSidebarModalBanner}
          onClose={() => setActiveSidebarModalBanner(null)}
          trackingSource="sidebar-modal"
        />
      ) : null}
    </div>
  );
}
