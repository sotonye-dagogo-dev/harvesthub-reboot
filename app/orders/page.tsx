import { getCurrentUser } from "@/lib/utils/auth";
import {
  getBuyerByUserId,
  getOrdersByBuyerId,
  getOrdersByVendorId,
  getVendorByUserId,
} from "@/lib/data/dataFetchers";
import { OrderCard } from "@/components/features/OrderCard";
import { RoleAwareFeatureRenderer } from "@/components/ui/RoleAwareFeatureRenderer";
import { orderModule } from "@/modules/orders";
import { UserRole } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getVendorOrdersForUser(userId: string) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor?.id) return [];
  return getOrdersByVendorId(vendor.id);
}

async function getBuyerOrdersForUser(userId: string) {
  const buyer = await getBuyerByUserId(userId);
  if (!buyer?.id) return [];
  return getOrdersByBuyerId(buyer.id);
}

async function getOrdersForAdminUser(userId: string) {
  const buyerOrders = await getBuyerOrdersForUser(userId);
  if (buyerOrders.length > 0) return buyerOrders;
  return getVendorOrdersForUser(userId);
}

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user?.userId) {
    return <div className="container mx-auto px-4 py-8">Please log in to view orders</div>;
  }

  const orders =
    user.role === UserRole.ADMIN
      ? await getOrdersForAdminUser(user.userId)
      : user.role === UserRole.VENDOR
      ? await getVendorOrdersForUser(user.userId)
      : await getBuyerOrdersForUser(user.userId);

  return (
    <RoleAwareFeatureRenderer requiredCapability={orderModule.capability}>
      <div className="container mx-auto px-4 py-8 space-y-4">
        {orders.length === 0 ? (
          <p className="text-ds-text-secondary">No orders found yet.</p>
        ) : (
          orders.map((order: any) => (
            <OrderCard
              key={order.id}
              id={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              total={order.total}
              itemCount={order.items?.length ?? 0}
              deliveryMethod={order.deliveryMethod}
              deliveryInfo={order.deliveryAddress?.address ?? order.pickupDetails?.location}
              createdAt={order.createdAt}
            />
          ))
        )}
      </div>
    </RoleAwareFeatureRenderer>
  );
}
