/**
 * POST /api/orders/[id]/confirm-delivery - Buyer confirms delivered order
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, OrderStatus, PaymentStatus } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { dispatchNotification } from '@/lib/services/notifications';
import { releaseOrderSettlement } from '@/lib/services/orderLifecycle';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                paymentStatus: true,
                buyerId: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId }, select: { id: true } });
        if (!buyer || buyer.id !== order.buyerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (order.status !== OrderStatus.DELIVERED) {
            return NextResponse.json(
                { error: 'Order must be delivered before confirmation.' },
                { status: 400 }
            );
        }

        if (order.paymentStatus !== PaymentStatus.PAID) {
            return NextResponse.json(
                { error: 'Only paid orders can be confirmed for settlement release.' },
                { status: 400 }
            );
        }

        const releaseResult = await prisma.$transaction((tx) =>
            releaseOrderSettlement(tx, {
                orderId: id,
                updatedBy: user.userId,
                autoConfirmed: false,
            })
        );

        if (releaseResult.state === 'not_found') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (releaseResult.state === 'not_delivered' || releaseResult.state === 'not_paid') {
            return NextResponse.json(
                { error: 'Order does not meet settlement release conditions.' },
                { status: 400 }
            );
        }

        if (releaseResult.state === 'payout_locked') {
            return NextResponse.json(
                { error: 'Settlement cannot be released because payout record is locked.' },
                { status: 409 }
            );
        }

        if (releaseResult.state === 'released') {
            const metadata = {
                orderId: releaseResult.orderId,
                orderNumber: releaseResult.orderNumber,
                payoutReference: releaseResult.payoutReference,
                amount: releaseResult.amount,
            } as Prisma.InputJsonValue;

            await Promise.allSettled([
                dispatchNotification({
                    userId: releaseResult.buyerUserId as string,
                    type: 'DELIVERY_UPDATE',
                    title: 'Delivery Confirmed',
                    message: `You confirmed delivery for order ${releaseResult.orderNumber}.`,
                    link: '/orders',
                    emailSubject: `Delivery confirmed: ${releaseResult.orderNumber}`,
                    metadata,
                }),
                dispatchNotification({
                    userId: releaseResult.vendorUserId as string,
                    type: 'PAYMENT_SUCCESS',
                    title: 'Settlement Released',
                    message: `Settlement released for order ${releaseResult.orderNumber}.`,
                    link: '/wallet',
                    emailSubject: `Settlement released: ${releaseResult.orderNumber}`,
                    metadata,
                }),
            ]);
        }

        return NextResponse.json({
            success: true,
            state: releaseResult.state,
            message:
                releaseResult.state === 'already_released'
                    ? 'Delivery had already been confirmed and settled.'
                    : 'Delivery confirmed and settlement released.',
            settlement: {
                orderId: releaseResult.orderId,
                orderNumber: releaseResult.orderNumber,
                payoutReference: releaseResult.payoutReference,
            },
        });
    } catch (error) {
        console.error('POST /api/orders/[id]/confirm-delivery error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
