"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockProducts, mockVendors, mockReviews } from "@/lib/data/mockData";
import { Button, Rating, Badge } from "@/components/ui";
import { EmptyState } from "@/components/ui";
import { ReviewCard, ProductCard } from "@/components/features";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/store/cartStore";
import { useFavorites } from "@/lib/store/favoritesStore";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
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
  const { toggleFavorite: rawToggleFavorite, isFavorite: checkIsFavorite } = useFavorites();
  const { requireAuth } = useGuestGuard();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
    if (!requireAuth("add items to your cart")) return;
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
        className="mb-6 flex items-center gap-2 text-ds-text-secondary hover:text-ds-text-primary dark:text-ds-text-placeholder dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div>
          <div className="mb-4 aspect-square overflow-hidden rounded-ds-md bg-ds-surface-sunken">
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
              {" "}
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                  className={`aspect-square overflow-hidden rounded-ds-md border-2 ${selectedImage === index ? "border-ds-border-brand" : "border-ds-border-base"}`}
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
              <h1 className="mb-2 text-3xl font-bold text-ds-text-primary">{product.name}</h1>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Rating value={avgRating} readonly />
                  <span className="text-sm text-ds-text-secondary">
                    ({productReviews.length} reviews)
                  </span>
                </div>

                {product.isFeatured && <Badge>Featured</Badge>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!requireAuth("save favourites")) return;
                  rawToggleFavorite(productId);
                }}
              >
                <Heart
                  className={`h-5 w-5 ${checkIsFavorite(productId) ? "fill-ds-status-error text-ds-status-error" : ""}`}
                />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mb-6 border-b border-ds-border-base pb-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-4xl font-bold text-ds-text-brand">
                {formatCurrency(
                  product.discount
                    ? product.price - (product.price * product.discount) / 100
                    : product.price
                )}
              </span>
              {product.discount && product.discount > 0 && (
                <>
                  <span className="text-xl text-ds-text-tertiary line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="rounded-ds-sm bg-ds-status-error px-2 py-0.5 text-sm font-semibold text-white">
                    -{product.discount}%
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-ds-text-tertiary" />
                <span
                  className={
                    product.stock > 0 ? "text-ds-status-success-text" : "text-ds-status-error-text"
                  }
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-ds-text-tertiary" />
                <span className="text-ds-text-secondary">Delivery available</span>
              </div>
            </div>
          </div>

          {/* Vendor Info */}
          <Link
            href={`/vendors/${vendor.id}`}
            className="mb-6 flex items-center gap-3 rounded-ds-md border border-ds-border-base p-4 transition-colors hover:bg-ds-surface-sunken"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-brand-subtle">
              <Store className="h-6 w-6 text-ds-text-brand" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ds-text-primary">{vendor.storeName}</div>
              <div className="text-sm text-ds-text-secondary">
                {vendor.campus} · {vendor.category}
              </div>
            </div>
          </Link>

          {/* Add to Cart */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
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
          <div className="border-t border-ds-border-base pt-6">
            <h2 className="mb-3 text-lg font-semibold text-ds-text-primary">Description</h2>
            <p className="whitespace-pre-line text-ds-text-secondary">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-ds-border-base pt-12">
        <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">
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
        <div className="mt-12 border-t border-ds-border-base pt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ds-text-primary">Related Products</h2>
            <Link
              href={`/products?category=${product.category}`}
              className="text-ds-text-brand hover:text-ds-palette-purple-700"
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
                  discount={relatedProduct.discount}
                  isFeatured={relatedProduct.isFeatured}
                  isFavorite={checkIsFavorite(relatedProduct.id)}
                  onToggleFavorite={() => {
                    if (!requireAuth("save favourites")) return;
                    rawToggleFavorite(relatedProduct.id);
                  }}
                  onAddToCart={() => {
                    if (!requireAuth("add items to your cart")) return;
                    const relatedCartItem = getItem(relatedProduct.id);
                    if ((relatedCartItem?.quantity || 0) >= relatedProduct.stock) {
                      message.error(`Only ${relatedProduct.stock} items available in stock`);
                      return;
                    }
                    addItem({
                      productId: relatedProduct.id,
                      name: relatedProduct.name,
                      price: relatedProduct.price,
                      image: relatedProduct.images[0] || "/placeholder-product.jpg",
                      vendorId: relatedProduct.vendorId,
                      vendorName: relatedVendor?.storeName || "Unknown Vendor",
                      stock: relatedProduct.stock,
                    });
                    message.success(`${relatedProduct.name} added to cart`);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
