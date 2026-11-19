import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Rating } from "@/components/ui";
import { ProductCard } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { getFirstValidImageUrl, getSafeImageUrl } from "@/lib/utils/images";
import { prisma } from "@/lib/db/prisma";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import { MessageCircle, Store, Truck, RefreshCw, ShieldCheck, Star } from "lucide-react";
import { buildDynamicEntityMetadata, resolveCanonicalBaseUrl } from "@/lib/seo/dynamicMetadata";
import { buildProductWhatsAppMessage } from "@/lib/utils/whatsappIntent";
import ProductDetailActions from "@/components/features/ProductDetailActions";
import ProductImageGallery from "@/components/features/ProductImageGallery";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { serviceListingEnabled } from "@/lib/config/features";
import {
  ServiceDetailPanel,
  minServicePackagePrice,
  parseServiceDetails,
} from "@/components/features/services/ServiceDetailPanel";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

type ProductApiResponse = {
  success?: boolean;
  product?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    discount?: number | null;
    images?: string[] | null;
    stock: number;
    isFeatured?: boolean;
    listingType?: string | null;
    category?: string | null;
    variants?: Array<{ id?: string; name: string; values: string[]; priceAdjustment?: number | null }> | null;
    vendorId: string;
    vendor?: {
      id: string;
      storeName?: string | null;
      status?: string | null;
      whatsappNumber?: string | null;
      campus?: string | null;
      category?: string | null;
      storeDescription?: string | null;
      storeLogo?: string | null;
      averageRating?: number | null;
      totalReviews?: number | null;
      totalSales?: number | null;
      totalOrders?: number | null;
    } | null;
    reviews?: Array<{ rating?: number | null }>;
    /** Raw `Product.serviceDetails` JSON (services only). */
    serviceDetails?: unknown;
  };
};

async function fetchProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
            status: true,
            whatsappNumber: true,
            campus: true,
            category: true,
            storeDescription: true,
            storeLogo: true,
            averageRating: true,
            totalReviews: true,
            totalSales: true,
            totalOrders: true,
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
          take: 20,
        },
      },
    });
    return product as ProductApiResponse["product"] | null;
  } catch (error) {
    console.error("Product detail fetch failed:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = await resolveCanonicalBaseUrl();
  const path = `/products/${id}`;
  const product = await fetchProduct(id);
  if (!product) {
    return buildDynamicEntityMetadata({
      baseUrl,
      path,
      title: "Product Not Found | MyHarvestHub",
      description: "This product is currently unavailable on MyHarvestHub.",
      fallbackTitle: "Product Not Found | MyHarvestHub",
      fallbackDescription: "Browse verified vendors and products on MyHarvestHub.",
    });
  }

  const productName =
    typeof product.name === "string" && product.name.trim().length > 0 ? product.name : "Product";
  const image = getFirstValidImageUrl(product.images) || "/placeholder-product.jpg";

  return buildDynamicEntityMetadata({
    baseUrl,
    path,
    title: `${productName} | MyHarvestHub`,
    description: product.description || `Buy ${productName} on MyHarvestHub`,
    imageUrl: image,
    fallbackTitle: "Product | MyHarvestHub",
    fallbackDescription: "Discover products on MyHarvestHub.",
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  const productVendorId = typeof product.vendorId === "string" ? product.vendorId : "";
  const baseUrl = await resolveCanonicalBaseUrl();
  const canonicalProductUrl = new URL(`/products/${id}`, baseUrl).toString();
  const productCategory = typeof product.category === "string" ? product.category : null;

  const relatedOrFilters: Array<Record<string, unknown>> =
    productVendorId.length > 0 ? [{ vendorId: productVendorId }] : [];
  if (productCategory) {
    relatedOrFilters.push({ category: productCategory });
  }

  const relatedProductsRaw = await prisma.product
    .findMany({
      where: {
        id: { not: id },
        isActive: true,
        OR: relatedOrFilters.length > 0 ? relatedOrFilters : undefined,
      },
      include: {
        vendor: { select: { storeName: true, status: true } },
      },
      orderBy: { sales: "desc" },
      take: 6,
    })
    .catch(() => []);
  const relatedProducts = (Array.isArray(relatedProductsRaw) ? relatedProductsRaw : []) as Array<{
    id: string;
    name: string;
    price: number;
    discount?: number | null;
    mainImage?: string | null;
    averageRating?: number | null;
    totalReviews?: number | null;
    vendorId: string;
    stock?: number | null;
    images?: string[] | null;
    listingType?: string | null;
    vendor?: { storeName?: string | null; status?: string | null } | null;
  }>;

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
      : 0;

  const image = getFirstValidImageUrl(product.images);
  const vendorName =
    typeof product.vendor?.storeName === "string" && product.vendor.storeName.trim().length > 0
      ? product.vendor.storeName
      : "Vendor";
  const productName =
    typeof product.name === "string" && product.name.trim().length > 0 ? product.name : "Product";
  const vendorVerified = product.vendor?.status === "APPROVED";
  const vendorHref = productVendorId ? `/vendors/${productVendorId}` : "/vendors";
  const whatsappMessage = buildProductWhatsAppMessage({
    vendorName,
    productName,
    canonicalUrl: canonicalProductUrl,
  });
  const whatsappGuardHref = product.vendor?.whatsappNumber
    ? `/contact/whatsapp?${new URLSearchParams({
        vendorName,
        phone: product.vendor.whatsappNumber,
        returnTo: `/products/${id}`,
        source: "product-page",
        productName: productName,
        contextUrl: canonicalProductUrl,
        message: whatsappMessage,
      }).toString()}`
    : null;
  const orderingAllowed = vendorVerified;
  const vendorAvgRating = product.vendor?.averageRating ?? null;
  const productPrice = Number.isFinite(product.price) ? product.price : 0;
  const productDiscount = Number.isFinite(product.discount ?? NaN) ? (product.discount ?? 0) : 0;
  const productStock = Number.isFinite(product.stock) ? product.stock : 0;
  const discountedPrice =
    productDiscount > 0 ? productPrice - (productPrice * productDiscount) / 100 : productPrice;

  const parsedServiceDetails =
    product.listingType === "SERVICE" ? parseServiceDetails(product.serviceDetails) : null;
  const serviceView =
    serviceListingEnabled &&
    parsedServiceDetails !== null &&
    (parsedServiceDetails.packages?.length ?? 0) > 0;
  const serviceFromPrice =
    serviceView && parsedServiceDetails ? minServicePackagePrice(parsedServiceDetails) : null;

  const deliveryInfo = [
    {
      icon: Store,
      title: "Church Pickup",
      body: "Available at Sunday or Midweek services. Coordinate directly with your vendor after ordering.",
    },
    {
      icon: Truck,
      title: "Home Delivery",
      body: "Delivery is available at checkout with a fee per vendor. Delivery timeframes are coordinated by the vendor.",
    },
    {
      icon: RefreshCw,
      title: "Returns & Cancellations",
      body: "Contact the vendor directly to discuss returns. Orders can be cancelled before the vendor begins processing.",
    },
    {
      icon: ShieldCheck,
      title: "Buyer Protection",
      body: "All transactions are recorded on MyHarvestHub. Report any issues to our platform support for assistance.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ds-text-secondary">
        <Link href="/" className="text-ds-text-secondary hover:text-ds-text-brand">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/products" className="text-ds-text-secondary hover:text-ds-text-brand">Products</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ds-text-primary">{productName}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main product card (Jumia layout: gallery + buy box) */}
        <div className="rounded-ds-md bg-ds-surface-base p-4 shadow-ds-sm dark:bg-ds-surface-raised lg:col-span-9">
          <div className="grid gap-6 md:grid-cols-2">
            <ProductImageGallery images={(product.images as string[]) ?? []} alt={productName} />

            <div>
            <div className="mb-3 flex flex-wrap gap-2" aria-label="Product status badges">
              {product.isFeatured ? <Badge variant="primary">Featured</Badge> : null}
              {product.listingType === "SERVICE" ? <Badge variant="info">Service</Badge> : null}
              {productCategory ? <Badge>{productCategory}</Badge> : null}
            </div>
            <div className="mb-3 flex flex-wrap gap-2" aria-label="Vendor verification status">
              {!vendorVerified ? (
                <Badge variant="warning">Unverified Vendor</Badge>
              ) : (
                <Badge variant="success">Verified Vendor</Badge>
              )}
            </div>
            <h1 className="text-xl font-semibold text-ds-text-primary sm:text-2xl">{productName}</h1>
            <p className="mt-2 text-sm text-ds-text-secondary">
              Sold by{" "}
              <Link href={vendorHref} className="text-ds-text-brand hover:underline">
                {vendorName}
              </Link>
            </p>
            <p className="mt-2 text-sm text-ds-text-secondary">
              {whatsappGuardHref ? (
                <Link
                  href={whatsappGuardHref}
                  className="inline-flex items-center gap-1.5 text-ds-status-success-text hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat with vendor on WhatsApp
                </Link>
              ) : (
                "Vendor chat is currently unavailable for this listing."
              )}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Rating value={averageRating} readonly />
              <span className="text-sm text-ds-text-secondary">({reviews.length} reviews)</span>
            </div>

            <div className="mt-5">
              {serviceView ? (
                <span className="text-xl text-ds-text-secondary">From </span>
              ) : null}
              <span className="text-3xl font-bold text-ds-text-primary">
                {formatCurrency(serviceView ? (serviceFromPrice ?? productPrice) : discountedPrice)}
              </span>
              {!serviceView && productDiscount > 0 ? (
                <>
                  <span className="ml-2 text-sm text-ds-text-tertiary line-through">
                    {formatCurrency(productPrice)}
                  </span>
                  <span className="ml-2 rounded-ds-xs bg-ds-palette-magenta-100 px-1.5 py-0.5 text-xs font-bold text-ds-palette-magenta-700 dark:bg-ds-palette-magenta-900 dark:text-ds-palette-magenta-200">
                    -{productDiscount}%
                  </span>
                </>
              ) : null}
            </div>

            {serviceView && parsedServiceDetails ? (
              <ServiceDetailPanel
                productId={product.id}
                name={productName}
                price={productPrice}
                images={product.images ?? undefined}
                vendorId={productVendorId}
                vendorName={vendorName}
                details={parsedServiceDetails}
              />
            ) : (
              <ProductDetailActions
                id={product.id}
                name={productName}
                price={productPrice}
                discount={productDiscount}
                images={product.images ?? undefined}
                vendorId={productVendorId}
                vendorName={vendorName}
                stock={productStock}
                category={product.category ?? null}
                variants={(product.variants as ProductApiResponse["product"] extends { variants?: infer V } ? V : never) ?? null}
              />
            )}

            <div className="mt-4 max-h-[320px] overflow-y-auto overscroll-contain rounded-ds-md border border-ds-border-subtle bg-ds-surface-sunken/30 p-3 scrollbar-thin lg:max-h-[360px]">
              <h3 className="mb-2 text-sm font-semibold text-ds-text-primary">Description</h3>
              <MarkdownRenderer content={product.description || "No description available for this product yet."} />
            </div>

            {!serviceView ? (
              <p className="mt-4 text-sm text-ds-text-secondary">
                Stock: {productStock > 0 ? productStock : "Out of stock"}
              </p>
            ) : null}
            {!orderingAllowed && (
              <p
                role="alert"
                aria-live="polite"
                className="mt-3 rounded-ds-md border border-ds-status-warning/30 bg-ds-status-warning-bg p-3 text-sm text-ds-status-warning-text"
              >
                This vendor is currently unverified. You can browse their catalog, but order
                completion may require extra acknowledgment until verification is approved.
              </p>
            )}
            </div>
          </div>
        </div>

        {/* Right column: delivery + seller information */}
        <aside className="flex flex-col gap-4 lg:col-span-3">
          <section className="rounded-ds-md bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-raised">
            <h2 className="border-b border-ds-border-subtle px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary">
              Delivery &amp; Returns
            </h2>
            <ul className="divide-y divide-ds-border-subtle">
              {deliveryInfo.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-ds-text-brand dark:bg-ds-palette-purple-800 dark:text-ds-palette-purple-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ds-text-primary">{title}</p>
                    <p className="mt-0.5 text-xs text-ds-text-secondary">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {product.vendor && (
            <section className="rounded-ds-md bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-raised">
              <h2 className="border-b border-ds-border-subtle px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ds-text-primary">
                Seller Information
              </h2>
              <div className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={vendorHref} className="text-base font-bold text-ds-text-primary hover:text-ds-text-brand">
                    {vendorName}
                  </Link>
                  {vendorVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                </div>
                {product.vendor.category && (
                  <p className="text-xs text-ds-text-secondary">
                    {String(product.vendor.category).replace(/_/g, " ")}
                  </p>
                )}
                {product.vendor.campus && (
                  <p className="flex items-center gap-1 text-xs text-ds-text-secondary">
                    <Store className="h-3.5 w-3.5" /> {product.vendor.campus}
                  </p>
                )}
                {vendorAvgRating ? (
                  <p className="flex items-center gap-1 text-sm font-semibold text-ds-text-primary">
                    <Star className="h-4 w-4 fill-ds-rating-fill text-ds-rating-fill" />
                    {Number(vendorAvgRating).toFixed(1)}
                    <span className="text-xs font-normal text-ds-text-secondary">seller rating</span>
                  </p>
                ) : null}
                {product.vendor.storeDescription && (
                  <p className="line-clamp-3 text-xs text-ds-text-secondary">{product.vendor.storeDescription}</p>
                )}
              </div>
              <div className="border-t border-ds-border-subtle px-4 py-3">
                <Link
                  href={vendorHref}
                  className="flex w-full items-center justify-center rounded-ds-md border border-ds-brand-primary px-4 py-2 text-sm font-semibold text-ds-brand-primary transition-colors hover:bg-ds-brand-primary hover:text-white"
                >
                  Visit Store
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-6 rounded-ds-md bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-raised">
          <h2 className="border-b border-ds-border-subtle px-4 py-3 text-base font-semibold text-ds-text-primary">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:p-3 lg:grid-cols-4 xl:grid-cols-6">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                id={related.id}
                name={related.name}
                price={related.price}
                image={
                  getFirstValidImageUrl(related.images) ||
                  getSafeImageUrl(related.mainImage) ||
                  "/placeholder-product.jpg"
                }
                vendorName={related.vendor?.storeName || "Vendor"}
                vendorId={related.vendorId}
                rating={related.averageRating || 0}
                reviewCount={related.totalReviews || 0}
                discount={related.discount ?? undefined}
                stock={related.stock ?? 0}
                isService={
                  related.listingType === "SERVICE" ||
                  (related.stock ?? 0) >= SERVICE_UNLIMITED_STOCK
                }
                isVendorVerified={related.vendor?.status === "APPROVED"}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
