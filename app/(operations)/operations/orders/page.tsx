import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";
import { getOrdersByUserRole } from "@/lib/data/dataFetchers";
import { OrderCard } from "@/components/features/OrderCard";

export const dynamic = "force-dynamic";

export default async function OperationsOrdersPage() {
  const user = await getCurrentUser();

  if (!user?.userId) {
    redirect("/login?from=/operations/orders");
  }

  if (user.role !== UserRole.VENDOR && user.role !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }

  const orders = await getOrdersByUserRole(user);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Orders Operations</h1>
        <p className="text-ds-text-secondary">
          Manage {user.role === UserRole.ADMIN ? "platform-wide" : "store"} orders.
        </p>
      </div>
      {orders.length === 0 ? (
        <p className="text-ds-text-secondary">No orders found yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
