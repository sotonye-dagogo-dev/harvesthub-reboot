/**
 * Single source of truth for the order status transition graph.
 *
 * The API (`app/api/orders/[id]/status/route.ts`) enforces it; the operations
 * orders page (`app/(operations)/operations/orders/page.tsx`) offers the same
 * graph to the operator. Both alias this map, so the two can never drift — the
 * old "keep the two maps in lockstep" rule is now structural.
 *
 * Service statuses (T5): PENDING -> AWAITING_REQUIREMENTS -> IN_PROGRESS ->
 * IN_REVIEW -> DELIVERED. Product statuses unchanged.
 *
 * Typed against the `lib/constants` mirror; the Prisma route casts it once at
 * the boundary (the enum value sets are identical by construction).
 */
import { OrderStatus } from '@/lib/constants';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
    [OrderStatus.AWAITING_REQUIREMENTS]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.IN_REVIEW, OrderStatus.CANCELLED],
    [OrderStatus.IN_REVIEW]: [OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS],
};
