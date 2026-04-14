/**
 * POST /api/orders/[id]/refund/review - Admin approves/rejects refund
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    Prisma,
    OrderStatus,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
} from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { appendStatusHistoryEntry, parseStatusHistory } from '@/lib/services/orderLifecycle';
import { dispatchNotification } from '@/lib/services/notifications';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json().catch(() => ({}));
        const action = typeof body.action === 'string' ? body.action.trim().toLowerCase() : '';
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
        }

        const { id } = await context.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                paymentStatus: true,
                buyer: { select: { userId: true } },
                vendor: { select: { userId: true } },
                statusHistory: true,
            },
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const refundRequest = await prisma.transaction.findFirst({
            where: {
                orderId: order.id,
                type: TransactionType.REFUND,
                status: TransactionStatus.PENDING,
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                walletId: true,
                amount: true,
                reference: true,
                metadata: true,
            },
        });

        if (!refundRequest) {
            return NextResponse.json({ error: 'No pending refund request found for this order.' }, { status: 404 });
        }

        if (action === 'reject') {
            await prisma.$transaction(async (tx) => {
                await tx.transaction.update({
                    where: { id: refundRequest.id },
                    data: {
                        status: TransactionStatus.FAILED,
                        description: `Refund request rejected for order ${order.orderNumber}`,
                        metadata: {
                            ...(refundRequest.metadata && typeof refundRequest.metadata === 'object' && !Array.isArray(refundRequest.metadata)
                                ? (refundRequest.metadata as Record<string, unknown>)
                                : {}),
                            reviewedBy: user.userId,
                            reviewedAt: new Date().toISOString(),
                            action: 'REJECTED',
                            reason,
                        },
                    },
                });

                const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
                const nextHistory = appendStatusHistoryEntry(
                    history,
                    'REFUND_REJECTED',
                    user.userId,
                    reason ? `Refund rejected: ${reason}` : 'Refund request rejected.'
                );

                await tx.order.update({
                    where: { id: order.id },
                    data: { statusHistory: nextHistory as Prisma.InputJsonValue },
                });
            });

            await dispatchNotification({
                userId: order.buyer.userId,
                type: 'PAYMENT_FAILED',
                title: 'Refund Request Rejected',
                message: `Refund request for order ${order.orderNumber} was rejected.`,
                link: '/orders',
                emailSubject: `Refund rejected: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    reason,
                } as Prisma.InputJsonValue,
            });

            return NextResponse.json({ success: true, message: 'Refund request rejected.' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const payout = await tx.transaction.findFirst({
                where: {
                    orderId: order.id,
                    type: TransactionType.PAYOUT,
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    walletId: true,
                    status: true,
                    metadata: true,
                },
            });

            if (payout?.status === TransactionStatus.COMPLETED) {
                const vendorWallet = await tx.wallet.findUnique({
                    where: { id: payout.walletId },
                    select: { id: true, balance: true },
                });

                if (!vendorWallet || vendorWallet.balance < order.total) {
                    throw new Error('VENDOR_WALLET_INSUFFICIENT_FOR_REFUND');
                }

                await tx.wallet.update({
                    where: { id: vendorWallet.id },
                    data: { balance: vendorWallet.balance - order.total },
                });

                await tx.transaction.create({
                    data: {
                        walletId: vendorWallet.id,
                        type: TransactionType.REFUND,
                        amount: order.total,
                        balanceBefore: vendorWallet.balance,
                        balanceAfter: vendorWallet.balance - order.total,
                        status: TransactionStatus.COMPLETED,
                        reference: `REFUND-DEBIT-${order.id}`,
                        description: `Vendor compensation reversal for order ${order.orderNumber}`,
                        orderId: order.id,
                        metadata: {
                            source: 'REFUND_RECONCILIATION',
                            approvedBy: user.userId,
                            approvedAt: new Date().toISOString(),
                        },
                    },
                });

                await tx.transaction.update({
                    where: { id: payout.id },
                    data: {
                        status: TransactionStatus.REVERSED,
                        metadata: {
                            ...(payout.metadata && typeof payout.metadata === 'object' && !Array.isArray(payout.metadata)
                                ? (payout.metadata as Record<string, unknown>)
                                : {}),
                            reversedForRefund: true,
                            reversedAt: new Date().toISOString(),
                            reversedBy: user.userId,
                        },
                    },
                });
            } else if (payout?.status === TransactionStatus.PENDING) {
                await tx.transaction.update({
                    where: { id: payout.id },
                    data: {
                        status: TransactionStatus.REVERSED,
                        metadata: {
                            ...(payout.metadata && typeof payout.metadata === 'object' && !Array.isArray(payout.metadata)
                                ? (payout.metadata as Record<string, unknown>)
                                : {}),
                            reversedForRefund: true,
                            reversedAt: new Date().toISOString(),
                            reversedBy: user.userId,
                        },
                    },
                });
            }

            const buyerWallet = await tx.wallet.findUnique({
                where: { id: refundRequest.walletId },
                select: { id: true, balance: true },
            });

            if (!buyerWallet) {
                throw new Error('BUYER_WALLET_NOT_FOUND');
            }

            const buyerBalanceAfter = buyerWallet.balance + refundRequest.amount;
            await tx.wallet.update({
                where: { id: buyerWallet.id },
                data: { balance: buyerBalanceAfter },
            });

            await tx.transaction.update({
                where: { id: refundRequest.id },
                data: {
                    status: TransactionStatus.COMPLETED,
                    balanceBefore: buyerWallet.balance,
                    balanceAfter: buyerBalanceAfter,
                    description: `Refund approved for order ${order.orderNumber}`,
                    metadata: {
                        ...(refundRequest.metadata && typeof refundRequest.metadata === 'object' && !Array.isArray(refundRequest.metadata)
                            ? (refundRequest.metadata as Record<string, unknown>)
                            : {}),
                        reviewedBy: user.userId,
                        reviewedAt: new Date().toISOString(),
                        action: 'APPROVED',
                        reason,
                    },
                },
            });

            const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
            const withApproved = appendStatusHistoryEntry(
                history,
                'REFUND_APPROVED',
                user.userId,
                reason ? `Refund approved: ${reason}` : 'Refund approved.'
            );
            const withExecuted = appendStatusHistoryEntry(
                withApproved,
                'REFUND_EXECUTED',
                user.userId,
                'Refund credited to buyer wallet and lifecycle reconciled.'
            );

            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.REFUNDED,
                    paymentStatus: PaymentStatus.REFUNDED,
                    statusHistory: withExecuted as Prisma.InputJsonValue,
                    completedAt: new Date(),
                },
            });

            return {
                amount: refundRequest.amount,
            };
        });

        await Promise.allSettled([
            dispatchNotification({
                userId: order.buyer.userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Refund Approved',
                message: `Refund for order ${order.orderNumber} has been credited to your wallet.`,
                link: '/wallet',
                emailSubject: `Refund approved: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    amount: result.amount,
                } as Prisma.InputJsonValue,
            }),
            dispatchNotification({
                userId: order.vendor.userId,
                type: 'DELIVERY_UPDATE',
                title: 'Refund Processed',
                message: `Refund for order ${order.orderNumber} has been processed.`,
                link: '/operations/orders',
                emailSubject: `Refund processed: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    amount: result.amount,
                } as Prisma.InputJsonValue,
            }),
        ]);

        return NextResponse.json({ success: true, message: 'Refund approved and executed.' });
    } catch (error) {
        if (error instanceof Error && error.message === 'VENDOR_WALLET_INSUFFICIENT_FOR_REFUND') {
            return NextResponse.json(
                { error: 'Vendor wallet balance is insufficient for post-settlement refund reconciliation.' },
                { status: 409 }
            );
        }

        if (error instanceof Error && error.message === 'BUYER_WALLET_NOT_FOUND') {
            return NextResponse.json({ error: 'Buyer wallet not found for refund credit.' }, { status: 409 });
        }

        console.error('POST /api/orders/[id]/refund/review error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
