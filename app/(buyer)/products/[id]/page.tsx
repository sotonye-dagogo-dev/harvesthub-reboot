"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockProducts, mockVendors, mockReviews } from "@/lib/data/mockData";
import { Button, Rating, Badge } from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { ReviewCard, ProductCard } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/store/cartStore";
import { ShoppingCart, Store, Package, Truck, ArrowLeft, Heart, Share2 } from "lucide-react";
import { message } from "antd";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { addItem, getItem } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const product = mockProducts.find((p) => p.id === productId);
  const vendor = product ? mockVendors.find((v) => v.id === product.vendorId) : null;
  const productReviews = mockReviews.filter((r) => r.productId === productId);

  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;

  const relatedProducts = product
    ? mockProducts
        .filter((p) => p.id !== product.id && p.category === product.category && p.isActive)
        .slice(0, 4)
    : [];

  if (!product || !vendor) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed"
          action={<Button onClick={() => router.push("/products")}>Browse Products</Button>}
        />
      </div>
    );
  }

  const handleAddToCart = () => {
    const cartItem = getItem(product.id);
    const totalQuantity = (cartItem?.quantity || 0) + quantity;

    if (totalQuantity > product.stock) {
      message.error(`Only ${product.stock} items available in stock`);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "/placeholder-product.jpg",
      vendorId: product.vendorId,
      vendorName: vendor.storeName,
      quantity,
      stock: product.stock,
    });

    message.success(`Added ${quantity} ${quantity === 1 ? "item" : "items"} to cart`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success("Link copied to clipboard");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div>
          <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <Image
              src={product.images[selectedImage] || "/placeholder-product.jpg"}
              alt={product.name}
              width={600}
              height={600}
              className="h-full w-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index
                      ? "border-purple-600"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={150}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Rating value={avgRating} readonly />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({productReviews.length} reviews)
                  </span>
                </div>

                {product.isFeatured && <Badge>Featured</Badge>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFavorite(!isFavorite)}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-800">
            <div className="mb-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(product.price)}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Delivery available</span>
              </div>
            </div>
          </div>

          {/* Vendor Info */}
          <Link
            href={`/vendors/${vendor.id}`}
            className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">{vendor.storeName}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {vendor.campus} · {vendor.category}
              </div>
            </div>
          </Link>

          {/* Add to Cart */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleAddToCart} disabled={product.stock === 0}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>

          {/* Product Description */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
            <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-gray-200 pt-12 dark:border-gray-800">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews ({productReviews.length})
        </h2>

        {productReviews.length === 0 ? (
          <EmptyState title="No reviews yet" description="Be the first to review this product" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productReviews.slice(0, 6).map((review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                userName="Anonymous Buyer"
                rating={review.rating}
                comment={review.comment ?? ""}
                images={review.images ?? []}
                createdAt={new Date(review.createdAt)}
                verified={review.isVerifiedPurchase}
              />
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-12 dark:border-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Related Products</h2>
            <Link
              href={`/products?category=${product.category}`}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => {
              const relatedVendor = mockVendors.find((v) => v.id === relatedProduct.vendorId);
              const relatedReviews = mockReviews.filter((r) => r.productId === relatedProduct.id);
              const relatedAvgRating =
                relatedReviews.length > 0
                  ? relatedReviews.reduce((sum, r) => sum + r.rating, 0) / relatedReviews.length
                  : 0;

              return (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={relatedProduct.price}
                  image={relatedProduct.images[0] || "/placeholder-product.jpg"}
                  vendorName={relatedVendor?.storeName || "Unknown Vendor"}
                  vendorId={relatedProduct.vendorId}
                  rating={relatedAvgRating}
                  reviewCount={relatedReviews.length}
                  stock={relatedProduct.stock}
                  isFeatured={relatedProduct.isFeatured}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
