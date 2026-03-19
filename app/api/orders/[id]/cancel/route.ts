/**
 * POST /api/orders/[id]/cancel � Cancel an order
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/prisma/generated/client';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: { buyer: true },
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Only buyer who owns the order can cancel
        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer || order.buyerId !== buyer.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!CANCELLABLE_STATUSES.includes(order.status)) {
            return NextResponse.json({ error: `Cannot cancel order with status ${order.status}` }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const { reason } = body as { reason?: string };

        // Cancel + refund to wallet in a transaction
        const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const cancelled = await tx.order.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    notes: reason ? `Cancelled by buyer: ${reason}` : 'Cancelled by buyer',
                },
            });

            // Refund to wallet if paid
            if (order.paymentMethod === 'WALLET' && order.total > 0) {
                const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: buyer.userId } });
                await tx.wallet.update({
                    where: { userId: buyer.userId },
                    data: { balance: { increment: order.total } },
                });
                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'REFUND',
                        amount: order.total,
                        balanceBefore: wallet.balance,
                        balanceAfter: wallet.balance + order.total,
                        description: `Refund for cancelled order #${order.orderNumber}`,
                        status: 'COMPLETED',
                        reference: `REFUND-${order.id}`,
                    },
                });
            }

            // Restore product stock
            const items = await tx.orderItem.findMany({ where: { orderId: id } });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }

            return cancelled;
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error('POST /api/orders/[id]/cancel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
