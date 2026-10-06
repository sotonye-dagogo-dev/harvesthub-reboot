/**
 * POST /api/orders/service-fulfillment - Service lifecycle cron (sibling of auto-confirm)
 *
 * Four idempotent sweeps over paid service orders:
 *  1. PENDING + PAID service-only orders -> AWAITING_REQUIREMENTS (payment settled after creation)
 *  2. requirements gate timeout (serviceRequirementsTimeoutHours, default 48h) -> a
 *     REQUIREMENTS_TIMEOUT history marker (penalty-free cancel eligibility; the cancel
 *     path writes no negative reputation - verified) + buyer notification
 *  3. fulfilment clock breach -> LATE_DELIVERY history marker (once)
 *  4. buyer never approved an in-review deliverable (serviceAutoApproveHours, default 72h)
 *     -> DELIVERED + settlement release in one transaction
 */
import { NextRequest, NextResponse } from 'next/server';
import { ListingType, OrderStatus, PaymentStatus, Prisma } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { dispatchNotification } from '@/lib/services/notifications';
import { UserRole } from '@/lib/constants';
import {
    appendStatusHistoryEntry,
    getLatestStatusTimestamp,
    hasHistoryStatus,
    parseStatusHistory,
    releaseOrderSettlement,
} from '@/lib/services/orderLifecycle';
import { orderIsServiceOnly } from '@/lib/services/serviceOrders';

const CRON_SECRET_HEADERS = ['x-fulfillment-secret', 'x-auto-confirm-secret'];
const CRON_SECRET_ENVS = ['ORDER_FULFILLMENT_SECRET', 'ORDER_AUTO_CONFIRM_SECRET'];

function isAuthorizedCronRequest(req: NextRequest): boolean {
    for (const envName of CRON_SECRET_ENVS) {
        const secret = process.env[envName];
        if (!secret) continue;
        for (const headerName of CRON_SECRET_HEADERS) {
            if (req.headers.get(headerName) === secret) return true;
        }
    }
    return false;
}

const HOUR_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!isAuthorizedCronRequest(req) && (!user || user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await prisma.commerceLifecycleConfig
            .findUnique({ where: { key: 'default' } })
            .catch(() => null);
        const requirementsTimeoutHours = config?.serviceRequirementsTimeoutHours ?? 48;
        const autoApproveHours = config?.serviceAutoApproveHours ?? 72;

        const now = Date.now();
        const candidates = await prisma.order.findMany({
            where: {
                paymentStatus: PaymentStatus.PAID,
                status: {
                    in: [
                        OrderStatus.PENDING,
                        OrderStatus.AWAITING_REQUIREMENTS,
                        OrderStatus.IN_PROGRESS,
                        OrderStatus.IN_REVIEW,
                    ],
                },
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                statusHistory: true,
                updatedAt: true,
                buyer: { select: { userId: true } },
                vendor: { select: { userId: true } },
                items: {
                    select: {
                        listingType: true,
                        serviceConfig: true,
                        deadlineAt: true,
                        requirementsSubmittedAt: true,
                    },
                },
            },
            take: 250,
            orderBy: { updatedAt: 'asc' },
        });

        let promoted = 0;
        let timedOut = 0;
        let lateFlagged = 0;
        let autoApproved = 0;

        for (const order of candidates) {
            if (!orderIsServiceOnly(order.items)) continue;

            const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);

            // 1. payment settled after the order was created
            if (order.status === OrderStatus.PENDING) {
                const nextHistory = appendStatusHistoryEntry(
                    history,
                    OrderStatus.AWAITING_REQUIREMENTS,
                    'system-service-fulfillment',
                    'Paid service order moved into the requirements gate.',
                );
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: OrderStatus.AWAITING_REQUIREMENTS,
                        statusHistory: nextHistory as Prisma.InputJsonValue,
                    },
                });
                promoted += 1;
                continue;
            }

            // 2. requirements gate timeout
            if (order.status === OrderStatus.AWAITING_REQUIREMENTS) {
                if (hasHistoryStatus(history, 'REQUIREMENTS_TIMEOUT')) continue;
                const gateEnteredAt =
                    getLatestStatusTimestamp(history, 'AWAITING_REQUIREMENTS') || order.updatedAt;
                if (now - gateEnteredAt.getTime() < requirementsTimeoutHours * HOUR_MS) continue;

                const nextHistory = appendStatusHistoryEntry(
                    history,
                    'REQUIREMENTS_TIMEOUT',
                    'system-service-fulfillment',
                    `Buyer did not submit requirements within ${requirementsTimeoutHours} hour(s). Order is eligible for penalty-free cancellation.`,
                    { penaltyFree: true, timeoutHours: requirementsTimeoutHours },
                );
                await prisma.order.update({
                    where: { id: order.id },
                    data: { statusHistory: nextHistory as Prisma.InputJsonValue },
                });
                timedOut += 1;
                if (order.buyer?.userId) {
                    void dispatchNotification({
                        userId: order.buyer.userId,
                        type: 'SERVICE_REQUIREMENTS_TIMEOUT',
                        title: 'Requirements overdue',
                        message: `Requirements for order ${order.orderNumber} were not submitted within ${requirementsTimeoutHours} hours.`,
                        link: `/orders/${order.id}`,
                    }).catch(() => undefined);
                }
                continue;
            }

            // 3. fulfilment clock breach marker (once)
            if (order.status === OrderStatus.IN_PROGRESS) {
                const deadline = order.items[0]?.deadlineAt ?? null;
                if (!deadline || hasHistoryStatus(history, 'LATE_DELIVERY')) continue;
                if (new Date(deadline).getTime() >= now) continue;

                const nextHistory = appendStatusHistoryEntry(
                    history,
                    'LATE_DELIVERY',
                    'system-service-fulfillment',
                    'Deliverable is past the agreed deadline.',
                    { deadlineAt: deadline },
                );
                await prisma.order.update({
                    where: { id: order.id },
                    data: { statusHistory: nextHistory as Prisma.InputJsonValue },
                });
                lateFlagged += 1;
                continue;
            }

            // 4. service auto-approve: buyer never responded to the in-review deliverable
            if (order.status === OrderStatus.IN_REVIEW) {
                if (hasHistoryStatus(history, 'SETTLEMENT_RELEASED')) continue;
                if (hasHistoryStatus(history, 'AUTO_CONFIRMED')) continue;
                const submittedAt =
                    getLatestStatusTimestamp(history, OrderStatus.IN_REVIEW) || order.updatedAt;
                if (now - submittedAt.getTime() < autoApproveHours * HOUR_MS) continue;

                const result = await prisma.$transaction(async (tx) => {
                    const fresh = await tx.order.findUnique({
                        where: { id: order.id },
                        select: { status: true },
                    });
                    if (fresh?.status !== OrderStatus.IN_REVIEW) return null;

                    const nextHistory = appendStatusHistoryEntry(
                        history,
                        OrderStatus.DELIVERED,
                        'system-service-fulfillment',
                        `Deliverable auto-approved after ${autoApproveHours} hour(s) without buyer response.`,
                    );
                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            status: OrderStatus.DELIVERED,
                            statusHistory: nextHistory as Prisma.InputJsonValue,
                            completedAt: new Date(),
                        },
                    });
                    return releaseOrderSettlement(tx, {
                        orderId: order.id,
                        updatedBy: 'system-service-fulfillment',
                        autoConfirmed: true,
                    });
                });

                if (result?.state === 'released') {
                    autoApproved += 1;
                    await Promise.allSettled([
                        dispatchNotification({
                            userId: order.buyer?.userId ?? '',
                            type: 'DELIVERY_UPDATE',
                            title: 'Order Auto-Confirmed',
                            message: `Order ${order.orderNumber} was auto-approved after ${autoApproveHours} hour(s).`,
                            link: `/orders/${order.id}`,
                        }),
                        dispatchNotification({
                            userId: order.vendor?.userId ?? '',
                            type: 'SERVICE_RELEASED',
                            title: 'Service payment released',
                            message: `Settlement released for order ${order.orderNumber} after auto-approval.`,
                            link: '/wallet',
                        }),
                    ]);
                }
            }
        }

        return NextResponse.json({
            success: true,
            scanned: candidates.length,
            promoted,
            timedOut,
            lateFlagged,
            autoApproved,
            config: { requirementsTimeoutHours, autoApproveHours },
            listingType: ListingType.SERVICE,
        });
    } catch (error) {
        console.error('POST /api/orders/service-fulfillment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
