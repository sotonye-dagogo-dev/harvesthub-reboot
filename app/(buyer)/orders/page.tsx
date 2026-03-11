import { getCurrentUser } from "@/lib/utils/auth";
import { getOrdersByBuyerId } from "@/lib/data/dataFetchers";
import { OrdersContent } from "./OrdersContent";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user?.userId) {
    return <div className="container mx-auto px-4 py-8">Please log in to view your orders</div>;
  }

  // For now, get all orders (in production, fetch by buyer relationship)
  const orders = await getOrdersByBuyerId(user.userId);

  return <OrdersContent orders={orders} />;
}
