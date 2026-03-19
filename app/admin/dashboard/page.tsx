import { getUsers, getVendors, getProducts, getOrders, getReviews } from "@/lib/data/dataFetchers";
import { AdminDashboardContent } from "./AdminDashboardContent";

export default async function AdminDashboardPage() {
  const [users, vendors, products, orders, reviews] = await Promise.all([
    getUsers(),
    getVendors(),
    getProducts(),
    getOrders(),
    getReviews(),
  ]);

  // Ensure reviews have product.variants as ProductVariant[] | null | undefined
  const normalizedReviews = reviews.map((review: any) => {
    if (review.product && review.product.variants && typeof review.product.variants === "string") {
      try {
        return {
          ...review,
          product: {
            ...review.product,
            variants: JSON.parse(review.product.variants) as ProductVariant[],
          },
        };
      } catch {
        return {
          ...review,
          product: {
            ...review.product,
            variants: null,
          },
        };
      }
    }
    return review;
  });

  return (
    <AdminDashboardContent
      users={users}
      vendors={vendors}
      products={products}
      orders={orders}
      reviews={normalizedReviews}
    />
  );
}
