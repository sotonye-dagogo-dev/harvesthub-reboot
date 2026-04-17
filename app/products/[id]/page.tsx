import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Rating } from "@/components/ui";
import { ProductCard } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { getFirstValidImageUrl, getSafeImageUrl } from "@/lib/utils/images";
import { prisma } from "@/lib/db/prisma";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import { MessageCircle } from "lucide-react";
import { buildDynamicEntityMetadata, resolveCanonicalBaseUrl } from "@/lib/seo/dynamicMetadata";
import { buildProductWhatsAppMessage } from "@/lib/utils/whatsappIntent";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base">
          <div className="relative aspect-square">
            {image ? (
              <Image src={image} alt={productName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-ds-surface-sunken text-ds-text-secondary">
                No image available
              </div>
            )}
          </div>
        </div>

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
          <h1 className="text-3xl font-bold text-ds-text-primary">{productName}</h1>
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
                  className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:underline"
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
            <span className="text-3xl font-bold text-ds-text-brand">
              {formatCurrency(discountedPrice)}
            </span>
            {productDiscount > 0 ? (
              <span className="ml-2 text-sm text-ds-text-tertiary line-through">
                {formatCurrency(productPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-ds-text-secondary">
            {product.description || "No description available for this product yet."}
          </p>

          <p className="mt-4 text-sm text-ds-text-secondary">
            Stock: {productStock > 0 ? productStock : "Out of stock"}
          </p>
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

      {/* Vendor Summary Card */}
      {product.vendor && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">About the Vendor</h2>
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-5 shadow-ds-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={vendorHref} className="text-lg font-bold text-ds-text-brand hover:underline">
                    {vendorName}
                  </Link>
                  {vendorVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                </div>
                {product.vendor.category && (
                  <p className="mt-1 text-sm text-ds-text-secondary">{String(product.vendor.category).replace(/_/g, " ")}</p>
                )}
                {product.vendor.campus && (
                  <p className="mt-1 text-sm text-ds-text-secondary">📍 {product.vendor.campus}</p>
                )}
                {product.vendor.storeDescription && (
                  <p className="mt-2 text-sm text-ds-text-secondary line-clamp-3">{product.vendor.storeDescription}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                {vendorAvgRating ? (
                  <div className="text-right">
                    <p className="text-xs text-ds-text-secondary">Vendor Rating</p>
                    <p className="font-bold text-ds-text-primary">
                      ⭐ {Number(vendorAvgRating).toFixed(1)}
                    </p>
                  </div>
                ) : null}
                <Link
                  href={vendorHref}
                  className="inline-flex items-center rounded-ds-md border border-ds-brand-primary px-4 py-2 text-sm font-medium text-ds-text-brand transition-colors hover:bg-ds-brand-surface"
                >
                  View Store →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Delivery & Policy */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Delivery &amp; Pickup</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏪</span>
              <div>
                <p className="font-semibold text-ds-text-primary">Church Pickup</p>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  Available at Sunday services (1st &amp; 2nd) and midweek. Coordinate directly with your vendor after ordering.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="font-semibold text-ds-text-primary">Home Delivery</p>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  Delivery is available at checkout with a fee per vendor. Delivery timeframes are coordinated by the vendor.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-semibold text-ds-text-primary">Returns &amp; Cancellations</p>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  Contact the vendor directly to discuss returns. Orders can be cancelled before the vendor begins processing.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold text-ds-text-primary">Buyer Protection</p>
                <p className="mt-1 text-sm text-ds-text-secondary">
                  All transactions are recorded on MyHarvestHub. Report any issues to our platform support for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Related Products</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
