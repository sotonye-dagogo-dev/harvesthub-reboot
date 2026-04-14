/**
 * POST /api/orders/auto-confirm - Auto confirm delivered orders past SLA window
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, OrderStatus, PaymentStatus } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { dispatchNotification } from '@/lib/services/notifications';
import {
    getLatestStatusTimestamp,
    hasHistoryStatus,
    parseStatusHistory,
    releaseOrderSettlement,
} from '@/lib/services/orderLifecycle';
import { getCommerceLifecycleConfig } from '@/lib/services/commerceConfig';
import { UserRole } from '@/lib/constants';

function isAuthorizedCronRequest(req: NextRequest): boolean {
    const configuredSecret = process.env.ORDER_AUTO_CONFIRM_SECRET;
    if (!configuredSecret) return false;
    const incoming = req.headers.get('x-auto-confirm-secret');
    return incoming === configuredSecret;
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        const cronAuthorized = isAuthorizedCronRequest(req);

        if (!cronAuthorized && (!user || user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lifecycleConfig = await getCommerceLifecycleConfig(prisma);
        if (!lifecycleConfig.autoConfirmEnabled) {
            return NextResponse.json({
                success: true,
                scanned: 0,
                eligible: 0,
                released: 0,
                alreadyReleased: 0,
                skipped: 0,
                message: 'Auto-confirm is disabled by admin commerce config.',
            });
        }

        const autoConfirmWindowMs = lifecycleConfig.autoConfirmHours * 60 * 60 * 1000;

        const now = Date.now();
        const candidates = await prisma.order.findMany({
            where: {
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.PAID,
            },
            select: {
                id: true,
                orderNumber: true,
                statusHistory: true,
                updatedAt: true,
            },
            take: 250,
            orderBy: { updatedAt: 'asc' },
        });

        const eligible = candidates.filter((order) => {
            const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);

            if (hasHistoryStatus(history, 'SETTLEMENT_RELEASED')) return false;
            if (hasHistoryStatus(history, 'BUYER_CONFIRMED')) return false;
            if (hasHistoryStatus(history, 'AUTO_CONFIRMED')) return false;

            const deliveredAt = getLatestStatusTimestamp(history, OrderStatus.DELIVERED) || order.updatedAt;
            return now - deliveredAt.getTime() >= autoConfirmWindowMs;
        });

        let released = 0;
        let alreadyReleased = 0;
        let skipped = 0;

        for (const order of eligible) {
            const result = await prisma.$transaction((tx) =>
                releaseOrderSettlement(tx, {
                    orderId: order.id,
                    updatedBy: user?.userId || 'system-auto-confirm',
                    autoConfirmed: true,
                })
            );

            if (result.state === 'released') {
                released += 1;

                const metadata = {
                    orderId: result.orderId,
                    orderNumber: result.orderNumber,
                    payoutReference: result.payoutReference,
                    amount: result.amount,
                    autoConfirmed: true,
                } as Prisma.InputJsonValue;

                await Promise.allSettled([
                    dispatchNotification({
                        userId: result.buyerUserId as string,
                        type: 'DELIVERY_UPDATE',
                        title: 'Order Auto-Confirmed',
                        message: `Order ${result.orderNumber} was auto-confirmed after ${lifecycleConfig.autoConfirmHours} hour(s).`,
                        link: '/orders',
                        emailSubject: `Order auto-confirmed: ${result.orderNumber}`,
                        metadata,
                    }),
                    dispatchNotification({
                        userId: result.vendorUserId as string,
                        type: 'PAYMENT_SUCCESS',
                        title: 'Settlement Released',
                        message: `Settlement released for order ${result.orderNumber} after auto-confirmation.`,
                        link: '/wallet',
                        emailSubject: `Settlement released: ${result.orderNumber}`,
                        metadata,
                    }),
                ]);

                continue;
            }

            if (result.state === 'already_released') {
                alreadyReleased += 1;
            } else {
                skipped += 1;
            }
        }

        return NextResponse.json({
            success: true,
            scanned: candidates.length,
            eligible: eligible.length,
            released,
            alreadyReleased,
            skipped,
            config: {
                autoConfirmEnabled: lifecycleConfig.autoConfirmEnabled,
                autoConfirmHours: lifecycleConfig.autoConfirmHours,
            },
        });
    } catch (error) {
        console.error('POST /api/orders/auto-confirm error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
