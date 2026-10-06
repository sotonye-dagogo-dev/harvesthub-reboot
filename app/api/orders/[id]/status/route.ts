/**
 * PATCH /api/orders/[id]/status - Update order status (vendor/admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/prisma/generated/client';
import {
    OrderStatus,
    PaymentStatus,
} from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { ORDER_STATUS_TRANSITIONS } from '@/lib/config/orderTransitions';
import {
    appendStatusHistoryEntry,
    ensurePayoutHoldOnDelivery,
    parseStatusHistory,
} from '@/lib/services/orderLifecycle';
import { dispatchNotification } from '@/lib/services/notifications';
import {
    consumeRevisionBudget,
    hasRevisionBudget,
    isDeadlinePast,
    isServiceItem,
    orderIsServiceOnly,
    readServiceConfig,
    rearmDeadline,
    getServiceDeliveryDays,
} from '@/lib/services/serviceOrders';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * Transition graph shared with the operations orders page through
 * `lib/config/orderTransitions.ts` — one source, structurally in lockstep.
 * Cast boundary: the shared map is typed against the `lib/constants` mirror.
 */
const VALID_TRANSITIONS = ORDER_STATUS_TRANSITIONS as unknown as Record<
    OrderStatus,
    OrderStatus[]
>;

function isOrderStatus(value: string): value is OrderStatus {
    return Object.values(OrderStatus).includes(value as OrderStatus);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({
            where: { id },
            select: { id: true, vendorId: true, buyerId: true, status: true },
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const vendor = await prisma.vendor.findUnique({
            where: { userId: user.userId },
            select: { id: true },
        });
        const isSeller = Boolean(vendor && order.vendorId === vendor.id);

        const body = await req.json().catch(() => ({}));
        const requestedStatusRaw =
            typeof body?.status === 'string' ? body.status.trim().toUpperCase() : '';
        const transitionNote =
            typeof body?.note === 'string' && body.note.trim().length > 0
                ? body.note.trim().slice(0, 400)
                : null;
        if (!requestedStatusRaw || !isOrderStatus(requestedStatusRaw)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const requestedStatus = requestedStatusRaw as OrderStatus;

        // Service revision path (PRD TC-003): the buyer pushes an in-review service
        // order back to IN_PROGRESS. Everything else stays vendor/admin only.
        // The buyer profile is only resolved for non-seller, non-admin callers.
        let isOrderBuyer = false;
        if (!isSeller && user.role !== UserRole.ADMIN) {
            try {
                const buyerProfile = await prisma.buyer.findUnique({
                    where: { userId: user.userId },
                    select: { id: true },
                });
                isOrderBuyer = Boolean(buyerProfile && buyerProfile.id === order.buyerId);
            } catch {
                isOrderBuyer = false;
            }
        }
        const buyerRevision =
            isOrderBuyer &&
            order.status === OrderStatus.IN_REVIEW &&
            requestedStatus === OrderStatus.IN_PROGRESS;

        if (user.role !== UserRole.ADMIN && !isSeller && !buyerRevision) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const txResult = await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id },
                select: {
                    id: true,
                    orderNumber: true,
                    vendorId: true,
                    buyerId: true,
                    status: true,
                    statusHistory: true,
                    paymentStatus: true,
                    total: true,
                    completedAt: true,
                    items: {
                        select: {
                            id: true,
                            listingType: true,
                            serviceConfig: true,
                            deadlineAt: true,
                            revisionsRemaining: true,
                        },
                    },
                    buyer: { select: { userId: true } },
                    vendor: { select: { userId: true } },
                },
            });
            if (!currentOrder) {
                throw new Error('ORDER_NOT_FOUND');
            }

            if (currentOrder.status === requestedStatus) {
                return {
                    kind: 'idempotent' as const,
                    order: currentOrder,
                    payoutCreated: false,
                };
            }

            const allowedTransitions = VALID_TRANSITIONS[currentOrder.status];
            if (!allowedTransitions.includes(requestedStatus)) {
                throw new Error(
                    `INVALID_TRANSITION:${currentOrder.status}:${requestedStatus}`,
                );
            }

            let payoutCreated = false;
            let payoutReference: string | null = null;
            let payoutHeld = false;

            const serviceItems = (currentOrder.items ?? []).filter(isServiceItem);
            const isServiceOrder = orderIsServiceOnly(currentOrder.items ?? []);
            const isServiceSubmit = isServiceOrder && requestedStatus === OrderStatus.IN_REVIEW;
            const isServiceRevision =
                isServiceOrder &&
                requestedStatus === OrderStatus.IN_PROGRESS &&
                currentOrder.status === OrderStatus.IN_REVIEW;

            // Service escrow: hold lands when the seller submits for review (plan: hold on
            // IN_REVIEW) and again on DELIVERED for the product path. ensurePayoutHold is
            // idempotent, so the second call is a no-op.
            const shouldHoldPayout =
                requestedStatus === OrderStatus.DELIVERED || isServiceSubmit;

            if (shouldHoldPayout && currentOrder.paymentStatus === PaymentStatus.PAID) {
                const payoutHold = await ensurePayoutHoldOnDelivery(tx, {
                    orderId: currentOrder.id,
                    orderNumber: currentOrder.orderNumber,
                    vendorId: currentOrder.vendorId,
                    total: currentOrder.total,
                    paymentStatus: currentOrder.paymentStatus,
                });

                payoutCreated = payoutHold.created;
                payoutReference = payoutHold.reference;
                payoutHeld = !payoutHold.skipped;
            }

            const isLate = isServiceSubmit && isDeadlinePast(serviceItems[0]?.deadlineAt ?? null);
            let nextDeadline: Date | null = null;
            if (isServiceRevision) {
                if (!hasRevisionBudget(serviceItems[0]?.revisionsRemaining)) {
                    throw new Error('REVISION_EXHAUSTED');
                }
                nextDeadline = rearmDeadline(getServiceDeliveryDays(readServiceConfig(serviceItems[0])));
            }

            const existingHistory = parseStatusHistory(currentOrder.statusHistory as Prisma.JsonValue);
            const nextHistory = appendStatusHistoryEntry(
                existingHistory,
                requestedStatus,
                user.userId,
                transitionNote ||
                    (isServiceSubmit
                        ? 'Deliverable submitted for buyer review.'
                        : isServiceRevision
                            ? 'Buyer requested a revision; fulfilment clock re-armed.'
                            : `Order status updated to ${requestedStatus.toLowerCase().replace(/_/g, ' ')}.`),
            );
            const nextHistoryWithSettlement =
                shouldHoldPayout && payoutHeld
                    ? appendStatusHistoryEntry(
                        nextHistory,
                        'SETTLEMENT_HELD',
                        user.userId,
                        requestedStatus === OrderStatus.IN_REVIEW
                            ? 'Escrow hold placed on delivery submission pending buyer approval.'
                            : 'Settlement held pending buyer/system delivery confirmation.',
                        {
                            payoutReference,
                        }
                    )
                    : nextHistory;
            const nextHistoryWithLate = isLate
                ? appendStatusHistoryEntry(
                    nextHistoryWithSettlement,
                    'LATE_DELIVERY',
                    user.userId,
                    'Deliverable submitted after the agreed deadline.',
                    { deadlineAt: serviceItems[0]?.deadlineAt ?? null }
                )
                : nextHistoryWithSettlement;
            const shouldSetCompletedAt =
                requestedStatus === OrderStatus.DELIVERED ||
                requestedStatus === OrderStatus.CANCELLED ||
                requestedStatus === OrderStatus.REFUNDED;

            const updatedOrder = await tx.order.update({
                where: { id: currentOrder.id },
                data: {
                    status: requestedStatus,
                    statusHistory: nextHistoryWithLate as Prisma.InputJsonValue,
                    completedAt: shouldSetCompletedAt
                        ? currentOrder.completedAt ?? new Date()
                        : currentOrder.completedAt,
                },
            });

            if (nextDeadline) {
                await tx.orderItem.updateMany({
                    where: { orderId: currentOrder.id, listingType: 'SERVICE' },
                    data: {
                        revisionsRemaining: consumeRevisionBudget(serviceItems[0]?.revisionsRemaining),
                        deadlineAt: nextDeadline,
                    },
                });
            }

            return {
                kind: 'updated' as const,
                order: updatedOrder,
                payoutCreated,
                payoutReference,
                payoutHeld,
                isServiceSubmit,
                isServiceRevision,
                isLate,
                buyerUserId: currentOrder.buyer?.userId ?? null,
                vendorUserId: currentOrder.vendor?.userId ?? null,
            };
        });

        if (txResult.kind === 'idempotent') {
            return NextResponse.json({
                success: true,
                idempotent: true,
                order: txResult.order,
                payout: { created: false, reason: 'No-op transition; status already applied.' },
            });
        }

        if (txResult.kind === 'updated') {
            if (txResult.isServiceSubmit && txResult.buyerUserId) {
                void dispatchNotification({
                    userId: txResult.buyerUserId,
                    type: 'SERVICE_DELIVERED',
                    title: 'Deliverable ready for review',
                    message: `The seller submitted the deliverable for order ${txResult.order.orderNumber}.`,
                    link: `/orders/${txResult.order.id}`,
                }).catch(() => undefined);
            }
            if (txResult.isServiceRevision && txResult.vendorUserId) {
                void dispatchNotification({
                    userId: txResult.vendorUserId,
                    type: 'SERVICE_REVISION_REQUESTED',
                    title: 'Revision requested',
                    message: `The buyer requested a revision on order ${txResult.order.orderNumber}.`,
                    link: `/orders/${txResult.order.id}`,
                }).catch(() => undefined);
            }
        }

        return NextResponse.json({
            success: true,
            idempotent: false,
            order: txResult.order,
            payout: {
                created: txResult.payoutCreated,
                reference: txResult.payoutReference,
                held: txResult.payoutHeld,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('INVALID_TRANSITION:')) {
            const [, from, to] = error.message.split(':');
            return NextResponse.json(
                { error: `Cannot transition from ${from} to ${to}` },
                { status: 400 },
            );
        }
        if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (error instanceof Error && error.message === 'REVISION_EXHAUSTED') {
            return NextResponse.json(
                {
                    error: 'No revisions remaining on this order.',
                    code: 'REVISION_EXHAUSTED',
                },
                { status: 409 },
            );
        }

        console.error('PATCH /api/orders/[id]/status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
