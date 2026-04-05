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
  const product = await fetchProduct(id);
  if (!product) {
    return { title: "Product Not Found | MyHarvestHub" };
  }

  return {
    title: `${product.name} | MyHarvestHub`,
    description: product.description || `Buy ${product.name} on MyHarvestHub`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  const relatedOrFilters: Array<Record<string, unknown>> = [{ vendorId: product.vendorId }];
  if (product.category) {
    relatedOrFilters.push({ category: product.category });
  }

  const relatedProductsRaw = await prisma.product
    .findMany({
      where: {
        id: { not: id },
        isActive: true,
        OR: relatedOrFilters,
      },
      include: {
        vendor: { select: { storeName: true, status: true } },
      },
      orderBy: { sales: "desc" },
      take: 4,
    })
    .catch(() => []);
  const relatedProducts = (Array.isArray(relatedProductsRaw) ? relatedProductsRaw : []) as Array<
    {
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
    }
  >;

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
      : 0;

  const image = getFirstValidImageUrl(product.images);
  const vendorName = product.vendor?.storeName || "Vendor";
  const vendorVerified = product.vendor?.status === "APPROVED";
  const vendorHref = product.vendorId ? `/vendors/${product.vendorId}` : "/vendors";
  const orderingAllowed = vendorVerified;
  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base">
          <div className="relative aspect-square">
            {image ? (
              <Image src={image} alt={product.name} fill className="object-cover" />
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
            {product.category ? <Badge>{product.category}</Badge> : null}
          </div>
          <div className="mb-3 flex flex-wrap gap-2" aria-label="Vendor verification status">
            {!vendorVerified ? <Badge variant="warning">Unverified Vendor</Badge> : <Badge variant="success">Verified Vendor</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-ds-text-primary">{product.name}</h1>
          <p className="mt-2 text-sm text-ds-text-secondary">
            Sold by{" "}
            <Link href={vendorHref} className="text-ds-text-brand hover:underline">
              {vendorName}
            </Link>
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Rating value={averageRating} readonly />
            <span className="text-sm text-ds-text-secondary">({reviews.length} reviews)</span>
          </div>

          <div className="mt-5">
            <span className="text-3xl font-bold text-ds-text-brand">{formatCurrency(discountedPrice)}</span>
            {product.discount ? (
              <span className="ml-2 text-sm text-ds-text-tertiary line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-ds-text-secondary">
            {product.description || "No description available for this product yet."}
          </p>

          <p className="mt-4 text-sm text-ds-text-secondary">
            Stock: {product.stock > 0 ? product.stock : "Out of stock"}
          </p>
          {!orderingAllowed && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-3 rounded-ds-md border border-ds-status-warning/30 bg-ds-status-warning-bg p-3 text-sm text-ds-status-warning-text"
            >
              This vendor is currently unverified. You can browse their catalog, but order completion
              may require extra acknowledgment until verification is approved.
            </p>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-ds-text-primary">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                id={related.id}
                name={related.name}
                price={related.price}
                image={
                  getFirstValidImageUrl(related.images) ||
                  getSafeImageUrl(related.mainImage) ||
                  "/myharvesthublogo.png"
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
