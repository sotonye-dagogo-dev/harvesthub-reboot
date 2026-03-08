import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockVendors, mockProducts, mockUsers, mockReviews } from "@/lib/data/mockData";
import { ProductCard, ReviewCard } from "@/components/features";
import { EmptyState } from "@/components/ui";
import { Button, Tag, Tabs } from "antd";
import {
  MapPin,
  Star,
  Package,
  Clock,
  Phone,
  Mail,
  ShoppingBag,
  CheckCircle,
  MessageCircle,
  Truck,
  Store,
  Shield,
  Info,
} from "lucide-react";
import { formatCampus, formatVendorCategory, formatPosition } from "@/lib/utils/format";

interface VendorDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VendorDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.id === id);

  if (!vendor) {
    return {
      title: "Vendor Not Found | HarvestHub",
    };
  }

  return {
    title: `${vendor.storeName} | HarvestHub`,
    description: vendor.storeDescription || `Shop from ${vendor.storeName} on HarvestHub`,
  };
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.id === id);

  if (!vendor || vendor.status !== "APPROVED") {
    notFound();
  }

  const vendorUser = mockUsers.find((u) => u.id === vendor.userId);

  const vendorProducts = mockProducts.filter(
    (product) => product.vendorId === vendor.id && product.isActive
  );
  const activeProducts = vendorProducts.filter((p) => p.stock > 0);
  const totalProducts = vendorProducts.length;

  // Gather reviews for all vendor products
  const vendorProductIds = new Set(vendorProducts.map((p) => p.id));
  const vendorReviews = mockReviews.filter((r) => vendorProductIds.has(r.productId));
  const avgRatingOverall =
    vendorReviews.length > 0
      ? vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length
      : vendor.analytics.averageRating;

  return (
    <div className="min-h-screen bg-ds-surface-sunken py-8 dark:bg-ds-surface-sunken">
      <div className="container mx-auto px-4">
        {/* Vendor Header — Facebook / LinkedIn style */}
        <div className="mb-8 overflow-hidden rounded-ds-md bg-ds-surface-base shadow-ds-sm">
          {/* Full-width Banner */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-r from-ds-brand-primary to-ds-palette-purple-800 sm:h-56 md:h-64">
            {vendor.storeBanner ? (
              <Image
                src={vendor.storeBanner}
                alt={`${vendor.storeName} banner`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900" />
            )}
          </div>

          {/* Profile section with overlapping logo */}
          <div className="relative px-6 pb-6 pt-0 sm:px-8">
            {/* Circular logo overlapping the banner */}
            <div className="-mt-16 mb-4 flex items-end gap-5 sm:-mt-20">
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border-4 border-ds-surface-base bg-ds-surface-sunken shadow-ds-lg sm:h-36 sm:w-36">
                {vendor.storeLogo ? (
                  <Image
                    src={vendor.storeLogo}
                    alt={vendor.storeName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-ds-brand-subtle">
                    <ShoppingBag className="h-14 w-14 text-ds-text-brand sm:h-16 sm:w-16" />
                  </div>
                )}
              </div>

              {/* Name + Badges (visible on sm+) */}
              <div className="hidden pb-1 sm:block">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-ds-text-primary md:text-3xl">
                    {vendor.storeName}
                  </h1>
                  {vendor.status === "APPROVED" && (
                    <CheckCircle className="h-6 w-6 text-ds-status-success" />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Tag color="purple">{formatVendorCategory(vendor.category)}</Tag>
                  <Tag icon={<MapPin className="h-3 w-3" />}>{formatCampus(vendor.campus)}</Tag>
                  {vendor.position && (
                    <Tag icon={<Shield className="h-3 w-3" />} color="blue">
                      {formatPosition(vendor.position)}
                    </Tag>
                  )}
                  {vendor.isChurchAffiliated && (
                    <Tag color="green">Church Affiliated</Tag>
                  )}
                </div>
              </div>
            </div>

            {/* Name + Badges (mobile only) */}
            <div className="mb-4 sm:hidden">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-ds-text-primary">
                  {vendor.storeName}
                </h1>
                {vendor.status === "APPROVED" && (
                  <CheckCircle className="h-5 w-5 text-ds-status-success" />
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color="purple">{formatVendorCategory(vendor.category)}</Tag>
                <Tag icon={<MapPin className="h-3 w-3" />}>{formatCampus(vendor.campus)}</Tag>
                {vendor.position && (
                  <Tag icon={<Shield className="h-3 w-3" />} color="blue">
                    {formatPosition(vendor.position)}
                  </Tag>
                )}
                {vendor.isChurchAffiliated && (
                  <Tag color="green">Church Affiliated</Tag>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-ds-md bg-ds-surface-sunken p-3">
                <div className="flex items-center gap-2 text-sm text-ds-text-secondary">
                  <Star className="h-4 w-4 text-ds-status-warning" />
                  Rating
                </div>
                <div className="mt-1 text-xl font-bold text-ds-text-primary">
                  {avgRatingOverall.toFixed(1)}
                  <span className="ml-1 text-sm font-normal text-ds-text-secondary">
                    ({vendorReviews.length})
                  </span>
                </div>
              </div>

              <div className="rounded-ds-md bg-ds-surface-sunken p-3">
                <div className="flex items-center gap-2 text-sm text-ds-text-secondary">
                  <Package className="h-4 w-4 text-ds-text-brand" />
                  Products
                </div>
                <div className="mt-1 text-xl font-bold text-ds-text-primary">
                  {totalProducts}
                </div>
              </div>

              <div className="rounded-ds-md bg-ds-surface-sunken p-3">
                <div className="flex items-center gap-2 text-sm text-ds-text-secondary">
                  <ShoppingBag className="h-4 w-4 text-ds-status-info-text" />
                  Orders
                </div>
                <div className="mt-1 text-xl font-bold text-ds-text-primary">
                  {vendor.analytics.totalOrders}
                </div>
              </div>

              <div className="rounded-ds-md bg-ds-surface-sunken p-3">
                <div className="flex items-center gap-2 text-sm text-ds-text-secondary">
                  <Clock className="h-4 w-4 text-ds-status-success-text" />
                  Joined
                </div>
                <div className="mt-1 text-xl font-bold text-ds-text-primary">
                  {new Date(vendor.createdAt).getFullYear()}
                </div>
              </div>
            </div>

            {/* Contact Row */}
            <div className="flex flex-wrap gap-3">
              {vendor.whatsappNumber && (
                <a
                  href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-ds-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {vendorUser?.phoneNumber && (
                <a
                  href={`tel:${vendorUser.phoneNumber}`}
                  className="inline-flex items-center gap-2 rounded-ds-md border border-ds-border-base px-4 py-2 text-sm text-ds-text-brand transition-colors hover:bg-ds-surface-sunken"
                >
                  <Phone className="h-4 w-4" />
                  {vendorUser.phoneNumber}
                </a>
              )}
              {vendorUser?.email && (
                <a
                  href={`mailto:${vendorUser.email}`}
                  className="inline-flex items-center gap-2 rounded-ds-md border border-ds-border-base px-4 py-2 text-sm text-ds-text-brand transition-colors hover:bg-ds-surface-sunken"
                >
                  <Mail className="h-4 w-4" />
                  {vendorUser.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Content: Products, Reviews, About */}
        <div className="rounded-ds-md bg-ds-surface-base p-6 shadow-ds-sm">
          <Tabs
            defaultActiveKey="products"
            items={[
              {
                key: "products",
                label: `Products (${totalProducts})`,
                children: (
                  <div>
                    {vendorProducts.length > 0 ? (
                      <>
                        {activeProducts.length < totalProducts && (
                          <p className="mb-4 text-sm text-ds-text-secondary">
                            {activeProducts.length} of {totalProducts} products currently in stock
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                          {vendorProducts.map((product) => {
                            const pRating =
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
                                vendorName={vendor.storeName}
                                vendorId={vendor.id}
                                rating={pRating}
                                reviewCount={product.reviews?.length || 0}
                                stock={product.stock}
                                discount={product.discount}
                                isFeatured={product.isFeatured}
                              />
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No Products Yet"
                        description="This vendor hasn't listed any products yet."
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "reviews",
                label: `Reviews (${vendorReviews.length})`,
                children: (
                  <div>
                    {vendorReviews.length > 0 ? (
                      <div className="space-y-4">
                        {vendorReviews.map((review) => {
                          const reviewer = mockUsers.find(
                            (u) => u.id === (
                              mockUsers.find(
                                (_u) =>
                                  _u.buyer?.id === review.buyerId ||
                                  _u.id === review.buyerId
                              )?.id ?? review.buyerId
                            )
                          );
                          const product = mockProducts.find(
                            (p) => p.id === review.productId
                          );

                          return (
                            <div key={review.id}>
                              {product && (
                                <p className="mb-1 text-xs font-medium text-ds-text-secondary">
                                  Re: {product.name}
                                </p>
                              )}
                              <ReviewCard
                                id={review.id}
                                userName={
                                  reviewer
                                    ? `${reviewer.firstName} ${reviewer.lastName}`
                                    : "Anonymous"
                                }
                                userAvatar={reviewer?.profilePicture ?? undefined}
                                rating={review.rating}
                                comment={review.comment || ""}
                                images={review.images ?? review.photos ?? undefined}
                                createdAt={new Date(review.createdAt)}
                                verified={review.isVerifiedPurchase}
                                helpful={review.helpfulCount}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Star className="h-12 w-12" />}
                        title="No Reviews Yet"
                        description="This vendor hasn't received any reviews yet."
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "about",
                label: "About",
                children: (
                  <div className="space-y-6">
                    {/* Description */}
                    {vendor.storeDescription && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
                          <Info className="h-5 w-5" />
                          About {vendor.storeName}
                        </h3>
                        <p className="text-ds-text-secondary">{vendor.storeDescription}</p>
                      </div>
                    )}

                    {/* Delivery & Pickup */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
                        <Truck className="h-5 w-5" />
                        Delivery &amp; Pickup
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {vendor.storeSettings.allowsPickup && (
                          <Tag color="green" className="!text-sm">
                            <Store className="mr-1 inline h-3 w-3" />
                            Pickup Available
                          </Tag>
                        )}
                        {vendor.storeSettings.allowsDelivery && (
                          <Tag color="blue" className="!text-sm">
                            <Truck className="mr-1 inline h-3 w-3" />
                            Delivery Available
                          </Tag>
                        )}
                      </div>
                      {vendor.storeSettings.pickupServices &&
                        vendor.storeSettings.pickupServices.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-1 text-sm font-medium text-ds-text-secondary">
                              Pickup Services:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {vendor.storeSettings.pickupServices.map((service) => (
                                <Tag key={service}>{service.replace(/_/g, " ")}</Tag>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Business Hours */}
                    {vendor.storeSettings.businessHours && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
                          <Clock className="h-5 w-5" />
                          Business Hours
                        </h3>
                        <p className="text-ds-text-secondary">
                          {vendor.storeSettings.businessHours}
                        </p>
                      </div>
                    )}

                    {/* Policies */}
                    {vendor.storeSettings.policies && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-ds-text-primary">
                          Store Policies
                        </h3>
                        <div className="space-y-3">
                          {vendor.storeSettings.policies.returnPolicy && (
                            <div className="rounded-ds-md bg-ds-surface-sunken p-4">
                              <p className="mb-1 text-sm font-medium text-ds-text-primary">
                                Return Policy
                              </p>
                              <p className="text-sm text-ds-text-secondary">
                                {vendor.storeSettings.policies.returnPolicy}
                              </p>
                            </div>
                          )}
                          {vendor.storeSettings.policies.shippingPolicy && (
                            <div className="rounded-ds-md bg-ds-surface-sunken p-4">
                              <p className="mb-1 text-sm font-medium text-ds-text-primary">
                                Shipping Policy
                              </p>
                              <p className="text-sm text-ds-text-secondary">
                                {vendor.storeSettings.policies.shippingPolicy}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
                        <MapPin className="h-5 w-5" />
                        Location
                      </h3>
                      <p className="text-ds-text-secondary">
                        Campus: {formatCampus(vendor.campus)}
                      </p>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Back to Vendors */}
        <div className="mt-8">
          <Link href="/vendors">
            <Button size="large">← Back to All Vendors</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
