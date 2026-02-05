import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockVendors, mockProducts, mockUsers } from "@/lib/data/mockData";
import { ProductCard } from "@/components/features";
import { EmptyState } from "@/components/ui";
import { Button, Tag, Tabs } from "antd";
import { MapPin, Star, Package, Clock, Phone, Mail, ShoppingBag, CheckCircle } from "lucide-react";
import { formatCampus, formatVendorCategory } from "@/lib/utils/format";

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

  // Get vendor's user data for contact info
  const vendorUser = mockUsers.find((u) => u.id === vendor.userId);

  // Get vendor's products
  const vendorProducts = mockProducts.filter(
    (product) => product.vendorId === vendor.id && product.isActive
  );

  const activeProducts = vendorProducts.filter((p) => p.stock > 0);
  const totalProducts = vendorProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        {/* Vendor Header */}
        <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
          {/* Banner */}
          {vendor.storeBanner && (
            <div className="relative h-48 overflow-hidden bg-gradient-to-r from-purple-600 to-purple-800">
              <Image
                src={vendor.storeBanner}
                alt={`${vendor.storeName} banner`}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Vendor Logo */}
              <div className="flex-shrink-0">
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border-4 border-white bg-gray-100 shadow-lg dark:border-gray-800 dark:bg-gray-800">
                  {vendor.storeLogo ? (
                    <Image
                      src={vendor.storeLogo}
                      alt={vendor.storeName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-purple-100 dark:bg-purple-900">
                      <ShoppingBag className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div className="flex-1">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {vendor.storeName}
                      </h1>
                      {vendor.status === "APPROVED" && (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Tag color="purple">{formatVendorCategory(vendor.category)}</Tag>
                      <Tag icon={<MapPin className="h-3 w-3" />}>{formatCampus(vendor.campus)}</Tag>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Rating
                    </div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {vendor.analytics.averageRating.toFixed(1)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Package className="h-4 w-4 text-purple-600" />
                      Products
                    </div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {totalProducts}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      Orders
                    </div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {vendor.analytics.totalOrders}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 text-green-600" />
                      Joined
                    </div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {new Date(vendor.createdAt).getFullYear()}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {vendor.storeDescription && (
                  <p className="mb-4 text-gray-600 dark:text-gray-400">{vendor.storeDescription}</p>
                )}

                {/* Contact */}
                <div className="flex flex-wrap gap-4">
                  {vendorUser?.phoneNumber && (
                    <a
                      href={`tel:${vendorUser.phoneNumber}`}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      <Phone className="h-4 w-4" />
                      {vendorUser.phoneNumber}
                    </a>
                  )}
                  {vendorUser?.email && (
                    <a
                      href={`mailto:${vendorUser.email}`}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      <Mail className="h-4 w-4" />
                      {vendorUser.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
          <Tabs
            defaultActiveKey="all"
            items={[
              {
                key: "all",
                label: `All Products (${totalProducts})`,
                children: (
                  <div>
                    {vendorProducts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {vendorProducts.map((product) => {
                          const avgRating =
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
                              rating={avgRating}
                              reviewCount={product.reviews?.length || 0}
                              stock={product.stock}
                              isFeatured={product.isFeatured}
                            />
                          );
                        })}
                      </div>
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
                key: "available",
                label: `Available (${activeProducts.length})`,
                children: (
                  <div>
                    {activeProducts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {activeProducts.map((product) => {
                          const avgRating =
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
                              rating={avgRating}
                              reviewCount={product.reviews?.length || 0}
                              stock={product.stock}
                              isFeatured={product.isFeatured}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No Available Products"
                        description="All products are currently out of stock."
                      />
                    )}
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
