import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/auth";
import { DeliveryMethod, OrderStatus, UserRole } from "@/lib/constants";
import { getOrdersByUserRole } from "@/lib/data/dataFetchers";
import { OrderCard } from "@/components/features/OrderCard";

function resolveDeliveryInfo(order: { deliveryAddress?: unknown; pickupDetails?: unknown }) {
  const deliveryAddress =
    order.deliveryAddress && typeof order.deliveryAddress === "object"
      ? (order.deliveryAddress as Record<string, unknown>)
      : null;
  if (deliveryAddress && typeof deliveryAddress.address === "string") {
    return deliveryAddress.address;
  }

  const pickupDetails =
    order.pickupDetails && typeof order.pickupDetails === "object"
      ? (order.pickupDetails as Record<string, unknown>)
      : null;
  if (pickupDetails && typeof pickupDetails.location === "string") {
    return pickupDetails.location;
  }

  return undefined;
}

function toOrderStatus(value: unknown): OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus)
    ? (value as OrderStatus)
    : OrderStatus.PENDING;
}

function toDeliveryMethod(value: unknown): DeliveryMethod {
  return Object.values(DeliveryMethod).includes(value as DeliveryMethod)
    ? (value as DeliveryMethod)
    : DeliveryMethod.PICKUP;
}

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
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              orderNumber={order.orderNumber}
              status={toOrderStatus(order.status)}
              total={order.total}
              itemCount={order.items?.length ?? 0}
              deliveryMethod={toDeliveryMethod(order.deliveryMethod)}
              deliveryInfo={resolveDeliveryInfo(order)}
              createdAt={order.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
