/**
 * POST /api/orders/group/[groupId]/bulk
 * Bulk grouped lifecycle actions with mixed-status partial handling.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '@/prisma/generated/client';
import { appendStatusHistoryEntry, parseOrderGroupIdFromHistory, parseStatusHistory } from '@/lib/services/orderLifecycle';

type BulkAction = 'CANCEL' | 'REFUND_REQUEST';

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

type BulkSkippedItem = {
  orderId: string;
  orderNumber: string;
  reason: string;
};

type BulkAppliedItem = {
  orderId: string;
  orderNumber: string;
  action: BulkAction;
  note: string;
};

function toBulkAction(value: unknown): BulkAction | null {
  if (value === 'CANCEL' || value === 'REFUND_REQUEST') {
    return value;
  }
  return null;
}

function isCancellableStatus(status: string): boolean {
  return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status);
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== UserRole.BUYER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimitByUser(user.userId);
    if (!rl.success) return getRateLimitResponse(rl);

    const { groupId } = await context.params;
    const normalizedGroupId = groupId.trim();
    if (!normalizedGroupId) {
      return NextResponse.json({ error: 'Invalid group id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = toBulkAction((body as { action?: unknown }).action);
    const reasonRaw = (body as { reason?: unknown }).reason;
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim().slice(0, 400) : '';
    const orderIdsRaw = (body as { orderIds?: unknown }).orderIds;
    const orderIds = Array.isArray(orderIdsRaw)
      ? orderIdsRaw.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : [];

    if (!action) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds is required for grouped bulk actions.' }, { status: 400 });
    }

    let buyerId: string | null = null;
    if (user.role === UserRole.BUYER) {
      const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId }, select: { id: true } });
      if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
      buyerId = buyer.id;
    }

    const candidateOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        ...(buyerId ? { buyerId } : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        buyerId: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        total: true,
        statusHistory: true,
      },
    });

    const groupedOrders = candidateOrders.filter(
      (order) =>
        parseOrderGroupIdFromHistory(order.statusHistory as Prisma.JsonValue) === normalizedGroupId
    );

    const applied: BulkAppliedItem[] = [];
    const skipped: BulkSkippedItem[] = [];

    if (groupedOrders.length === 0) {
      return NextResponse.json(
        {
          success: true,
          action,
          groupId: normalizedGroupId,
          applied,
          skipped: [
            {
              orderId: '',
              orderNumber: '',
              reason: 'No orders were found for this grouped action within your access scope.',
            },
          ],
          summary: {
            requested: orderIds.length,
            matched: 0,
            applied: 0,
            skipped: 1,
          },
        },
        { status: 200 }
      );
    }

    for (const order of groupedOrders) {
      if (action === 'CANCEL') {
        if (!isCancellableStatus(order.status)) {
          skipped.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: `Status ${order.status} is not eligible for cancellation.`,
          });
          continue;
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const existingHistory = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
          const nextHistory = appendStatusHistoryEntry(
            existingHistory,
            'CANCELLED',
            user.userId,
            reason || 'Grouped cancel action applied.',
            { orderGroupId: normalizedGroupId }
          );

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              notes: reason || 'Grouped cancel action applied.',
              statusHistory: nextHistory as Prisma.InputJsonValue,
            },
          });

          if (order.paymentMethod === PaymentMethod.WALLET && order.total > 0) {
            const buyer = await tx.buyer.findUnique({
              where: { id: order.buyerId },
              select: { userId: true },
            });

            if (buyer) {
              const wallet = await tx.wallet.upsert({
                where: { userId: buyer.userId },
                update: {},
                create: { userId: buyer.userId, currency: 'NGN' },
              });

              const existingRefund = await tx.transaction.findFirst({
                where: {
                  walletId: wallet.id,
                  orderId: order.id,
                  type: TransactionType.REFUND,
                  reference: `REFUND-${order.id}`,
                },
                select: { id: true },
              });

              if (!existingRefund) {
                await tx.wallet.update({
                  where: { id: wallet.id },
                  data: { balance: { increment: order.total } },
                });

                await tx.transaction.create({
                  data: {
                    walletId: wallet.id,
                    type: TransactionType.REFUND,
                    amount: order.total,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance + order.total,
                    status: TransactionStatus.COMPLETED,
                    reference: `REFUND-${order.id}`,
                    description: `Grouped cancellation refund for order ${order.orderNumber}`,
                    orderId: order.id,
                    metadata: {
                      reason,
                      groupedAction: true,
                      orderGroupId: normalizedGroupId,
                    },
                  },
                });
              }
            }
          }

          const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });

        applied.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          action,
          note: reason || 'Grouped cancel action applied.',
        });
        continue;
      }

      if (order.paymentStatus !== PaymentStatus.PAID) {
        skipped.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: `Payment status ${order.paymentStatus} is not eligible for refund request.`,
        });
        continue;
      }

      if (order.status === 'REFUNDED') {
        skipped.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: 'Order is already refunded.',
        });
        continue;
      }

      const existingPendingRefund = await prisma.transaction.findFirst({
        where: {
          orderId: order.id,
          type: TransactionType.REFUND,
          status: { not: TransactionStatus.FAILED },
        },
        select: { id: true },
      });

      if (existingPendingRefund) {
        skipped.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: 'Refund request already exists for this order.',
        });
        continue;
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const buyer = await tx.buyer.findUnique({
          where: { id: order.buyerId },
          select: { userId: true },
        });

        if (!buyer) {
          throw new Error(`Buyer profile not found for ${order.orderNumber}`);
        }

        const wallet = await tx.wallet.upsert({
          where: { userId: buyer.userId },
          update: {},
          create: { userId: buyer.userId, currency: 'NGN' },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.REFUND,
            amount: order.total,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance,
            status: TransactionStatus.PENDING,
            reference: `REFUND-REQ-${order.id}`,
            description: `Grouped refund request for order ${order.orderNumber}`,
            orderId: order.id,
            metadata: {
              reason,
              groupedAction: true,
              orderGroupId: normalizedGroupId,
            },
          },
        });

        const existingHistory = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
        const nextHistory = appendStatusHistoryEntry(
          existingHistory,
          'REFUND_REQUESTED',
          user.userId,
          reason || 'Grouped refund request submitted.',
          { orderGroupId: normalizedGroupId }
        );

        await tx.order.update({
          where: { id: order.id },
          data: {
            statusHistory: nextHistory as Prisma.InputJsonValue,
          },
        });
      });

      applied.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        action,
        note: reason || 'Grouped refund request submitted.',
      });
    }

    return NextResponse.json({
      success: true,
      action,
      groupId: normalizedGroupId,
      applied,
      skipped,
      summary: {
        requested: orderIds.length,
        matched: groupedOrders.length,
        applied: applied.length,
        skipped: skipped.length,
      },
    });
  } catch (error) {
    console.error('POST /api/orders/group/[groupId]/bulk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
