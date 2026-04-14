/**
 * POST /api/orders/[id]/refund/request - Buyer requests refund
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, OrderStatus, PaymentStatus, TransactionStatus, TransactionType } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import {
    appendStatusHistoryEntry,
    getLatestStatusTimestamp,
    parseStatusHistory,
} from '@/lib/services/orderLifecycle';
import { dispatchNotification } from '@/lib/services/notifications';
import { getCommerceLifecycleConfig } from '@/lib/services/commerceConfig';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId }, select: { id: true } });
        if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                buyerId: true,
                vendor: { select: { userId: true } },
                paymentStatus: true,
                status: true,
                total: true,
                statusHistory: true,
                updatedAt: true,
            },
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.buyerId !== buyer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (order.paymentStatus !== PaymentStatus.PAID) {
            return NextResponse.json({ error: 'Only paid orders are eligible for refunds.' }, { status: 400 });
        }

        if (order.status === OrderStatus.REFUNDED) {
            return NextResponse.json({ success: true, idempotent: true, message: 'Order already refunded.' });
        }

        const lifecycleConfig = await getCommerceLifecycleConfig(prisma);
        const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
        const deliveredAt = getLatestStatusTimestamp(history, OrderStatus.DELIVERED);
        if (deliveredAt) {
            const elapsedMs = Date.now() - deliveredAt.getTime();
            const refundWindowMs = lifecycleConfig.refundWindowHours * 60 * 60 * 1000;

            if (elapsedMs > refundWindowMs) {
                return NextResponse.json(
                    {
                        error: `Refund window expired. Requests must be raised within ${lifecycleConfig.refundWindowHours} hour(s) after delivery.`,
                    },
                    { status: 400 }
                );
            }
        }

        const existingRefund = await prisma.transaction.findFirst({
            where: { orderId: order.id, type: TransactionType.REFUND },
            select: { id: true, status: true, reference: true },
            orderBy: { createdAt: 'desc' },
        });

        if (existingRefund && existingRefund.status !== TransactionStatus.FAILED) {
            return NextResponse.json({
                success: true,
                idempotent: true,
                message: 'Refund request already exists for this order.',
                refundReference: existingRefund.reference,
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const buyerWallet = await tx.wallet.upsert({
                where: { userId: user.userId },
                update: {},
                create: { userId: user.userId, currency: 'NGN' },
                select: { id: true, balance: true },
            });

            const reference = `REFUND-REQ-${order.id}`;

            const refundTx = await tx.transaction.create({
                data: {
                    walletId: buyerWallet.id,
                    type: TransactionType.REFUND,
                    amount: order.total,
                    balanceBefore: buyerWallet.balance,
                    balanceAfter: buyerWallet.balance,
                    status: TransactionStatus.PENDING,
                    reference,
                    description: `Refund requested for order ${order.orderNumber}`,
                    metadata: {
                        reason,
                        requestedBy: user.userId,
                        requestedAt: new Date().toISOString(),
                    },
                    orderId: order.id,
                },
            });

            const nextHistory = appendStatusHistoryEntry(
                history,
                'REFUND_REQUESTED',
                user.userId,
                reason ? `Buyer requested refund: ${reason}` : 'Buyer requested refund.'
            );

            await tx.order.update({
                where: { id: order.id },
                data: {
                    statusHistory: nextHistory as Prisma.InputJsonValue,
                },
            });

            return refundTx;
        });

        await Promise.allSettled([
            dispatchNotification({
                userId: user.userId,
                type: 'PAYMENT_FAILED',
                title: 'Refund Request Submitted',
                message: `Your refund request for order ${order.orderNumber} is pending review.`,
                link: '/orders',
                emailSubject: `Refund requested: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    refundReference: result.reference,
                } as Prisma.InputJsonValue,
            }),
            dispatchNotification({
                userId: order.vendor.userId,
                type: 'DELIVERY_UPDATE',
                title: 'Refund Request Received',
                message: `A refund request was raised for order ${order.orderNumber}.`,
                link: '/operations/orders',
                emailSubject: `Refund request: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    refundReference: result.reference,
                } as Prisma.InputJsonValue,
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Refund request submitted for review.',
            refundReference: result.reference,
        });
    } catch (error) {
        console.error('POST /api/orders/[id]/refund/request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
