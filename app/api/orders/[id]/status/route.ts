/**
 * PATCH /api/orders/[id]/status - Update order status (vendor/admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/prisma/generated/client';
import {
    OrderStatus,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
} from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext {
    params: Promise<{ id: string }>;
}

type StatusHistoryEntry = {
    status?: string;
    timestamp?: string;
    note?: string;
    updatedBy?: string;
    [key: string]: unknown;
};

const PAYOUT_REFERENCE_PREFIX = 'PAYOUT-ORDER-';

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

function parseStatusHistory(input: Prisma.JsonValue | null): StatusHistoryEntry[] {
    if (Array.isArray(input)) {
        return input.filter((entry) => entry && typeof entry === 'object') as StatusHistoryEntry[];
    }
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parsed.filter((entry) => entry && typeof entry === 'object') as StatusHistoryEntry[];
            }
        } catch {
            return [];
        }
    }
    return [];
}

function appendStatusHistoryEntry(
    history: StatusHistoryEntry[],
    status: OrderStatus,
    updatedBy: string,
): StatusHistoryEntry[] {
    const lastEntry = history.at(-1);
    if (lastEntry?.status === status) {
        return history;
    }
    return [
        ...history,
        {
            status,
            timestamp: new Date().toISOString(),
            note: `Order status updated to ${status.toLowerCase().replace(/_/g, ' ')}.`,
            updatedBy,
        },
    ];
}

function getPayoutReference(orderId: string) {
    return `${PAYOUT_REFERENCE_PREFIX}${orderId}`;
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

            if (
                requestedStatus === OrderStatus.DELIVERED &&
                currentOrder.paymentStatus === PaymentStatus.PAID
            ) {
                const existingPayout = await tx.transaction.findFirst({
                    where: {
                        orderId: currentOrder.id,
                        type: TransactionType.PAYOUT,
                    },
                    select: { id: true, reference: true },
                });

                if (!existingPayout) {
                    const vendorRecord = await tx.vendor.findUnique({
                        where: { id: currentOrder.vendorId },
                        select: { userId: true, storeName: true },
                    });

                    if (vendorRecord) {
                        const vendorWallet = await tx.wallet.upsert({
                            where: { userId: vendorRecord.userId },
                            update: {},
                            create: { userId: vendorRecord.userId, currency: 'NGN' },
                            select: { id: true, balance: true },
                        });

                        const balanceBefore = vendorWallet.balance;
                        const balanceAfter = balanceBefore + currentOrder.total;
                        payoutReference = getPayoutReference(currentOrder.id);

                        await tx.wallet.update({
                            where: { id: vendorWallet.id },
                            data: { balance: balanceAfter },
                        });

                        await tx.transaction.create({
                            data: {
                                walletId: vendorWallet.id,
                                type: TransactionType.PAYOUT,
                                amount: currentOrder.total,
                                balanceBefore,
                                balanceAfter,
                                status: TransactionStatus.COMPLETED,
                                reference: payoutReference,
                                description: `Automated payout for delivered order ${currentOrder.orderNumber}`,
                                orderId: currentOrder.id,
                            },
                        });
                        payoutCreated = true;
                    }
                } else {
                    payoutReference = existingPayout.reference;
                }
            }

            const existingHistory = parseStatusHistory(currentOrder.statusHistory as Prisma.JsonValue);
            const nextHistory = appendStatusHistoryEntry(
                existingHistory,
                requestedStatus,
                user.userId,
            );
            const shouldSetCompletedAt =
                requestedStatus === OrderStatus.DELIVERED ||
                requestedStatus === OrderStatus.CANCELLED ||
                requestedStatus === OrderStatus.REFUNDED;

            const updatedOrder = await tx.order.update({
                where: { id: currentOrder.id },
                data: {
                    status: requestedStatus,
                    statusHistory: nextHistory as Prisma.InputJsonValue,
                    completedAt: shouldSetCompletedAt ? currentOrder.completedAt ?? new Date() : null,
                },
            });

            return {
                kind: 'updated' as const,
                order: updatedOrder,
                payoutCreated,
                payoutReference,
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
