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

  return (
    <AdminDashboardContent
      users={users}
      vendors={vendors}
      products={products}
      orders={orders}
      reviews={reviews}
    />
  );
}
