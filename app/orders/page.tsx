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
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user?.userId) {
    return <div className="container mx-auto px-4 py-8">Please log in to view orders</div>;
  }

  if (user.role === UserRole.ADMIN) {
    redirect("/operations/orders");
  }

  const orders =
    user.role === UserRole.VENDOR
      ? await (async () => {
          const vendor = await getVendorByUserId(user.userId);
          if (!vendor?.id) return [];
          return getOrdersByVendorId(vendor.id);
        })()
      : await (async () => {
          const buyer = await getBuyerByUserId(user.userId);
          if (!buyer?.id) return [];
          return getOrdersByBuyerId(buyer.id);
        })();

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
