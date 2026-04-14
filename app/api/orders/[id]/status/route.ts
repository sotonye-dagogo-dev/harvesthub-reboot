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
import {
    appendStatusHistoryEntry,
    ensurePayoutHoldOnDelivery,
    parseStatusHistory,
} from '@/lib/services/orderLifecycle';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// PROCESSING transitions branch by fulfilment mode:
// - DELIVERY orders should progress to OUT_FOR_DELIVERY
// - PICKUP orders should progress to READY_FOR_PICKUP
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    PROCESSING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    READY_FOR_PICKUP: [OrderStatus.DELIVERED],
    OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
};

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
            select: { id: true, vendorId: true, status: true },
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const vendor = await prisma.vendor.findUnique({
            where: { userId: user.userId },
            select: { id: true },
        });
        if (user.role !== UserRole.ADMIN && order.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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

            if (
                requestedStatus === OrderStatus.DELIVERED &&
                currentOrder.paymentStatus === PaymentStatus.PAID
            ) {
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

            const existingHistory = parseStatusHistory(currentOrder.statusHistory as Prisma.JsonValue);
            const nextHistory = appendStatusHistoryEntry(
                existingHistory,
                requestedStatus,
                user.userId,
                transitionNote ||
                    `Order status updated to ${requestedStatus.toLowerCase().replace(/_/g, ' ')}.`,
            );
            const nextHistoryWithSettlement =
                requestedStatus === OrderStatus.DELIVERED && payoutHeld
                    ? appendStatusHistoryEntry(
                        nextHistory,
                        'SETTLEMENT_HELD',
                        user.userId,
                        'Settlement held pending buyer/system delivery confirmation.',
                        {
                            payoutReference,
                        }
                    )
                    : nextHistory;
            const shouldSetCompletedAt =
                requestedStatus === OrderStatus.DELIVERED ||
                requestedStatus === OrderStatus.CANCELLED ||
                requestedStatus === OrderStatus.REFUNDED;

            const updatedOrder = await tx.order.update({
                where: { id: currentOrder.id },
                data: {
                    status: requestedStatus,
                    statusHistory: nextHistoryWithSettlement as Prisma.InputJsonValue,
                    completedAt: shouldSetCompletedAt
                        ? currentOrder.completedAt ?? new Date()
                        : currentOrder.completedAt,
                },
            });

            return {
                kind: 'updated' as const,
                order: updatedOrder,
                payoutCreated,
                payoutReference,
                payoutHeld,
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

        console.error('PATCH /api/orders/[id]/status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
