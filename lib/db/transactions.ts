import { prisma } from './prisma';
import type { Prisma } from '@/prisma/generated/client';

/**
 * ACID Transaction Utilities for MyHarvestHub
 * All multi-table mutations must go through these wrappers to ensure data consistency.
 */

// ── Order Creation Transaction ─────────────────────────────────────────
// Cart → Order → Wallet debit → Transaction log → Notification (all-or-nothing)
export async function createOrderTransaction(params: {
  buyerId: string;
  vendorId: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    selectedVariants?: Record<string, string>;
  }>;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryAddress?: Prisma.InputJsonValue;
  pickupDetails?: Prisma.InputJsonValue;
  notes?: string;
  deliveryFee?: number;
  voucherCode?: string;
  voucherDiscount?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = params.deliveryFee ?? 0;
    const discount = params.voucherDiscount ?? 0;
    const total = subtotal + deliveryFee - discount;

    const order = await tx.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        buyerId: params.buyerId,
        vendorId: params.vendorId,
        status: 'PENDING',
        subtotal,
        deliveryFee,
        total,
        paymentStatus: params.paymentMethod === 'WALLET' ? 'PAID' : 'PENDING',
        paymentMethod: params.paymentMethod as 'WALLET' | 'BANK_TRANSFER' | 'CARD' | 'USSD' | 'BANK_TRANSFER_PROOF',
        deliveryMethod: params.deliveryMethod as 'PICKUP' | 'DELIVERY',
        deliveryAddress: params.deliveryAddress ?? undefined,
        pickupDetails: params.pickupDetails ?? undefined,
        notes: params.notes,
        statusHistory: JSON.stringify([
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            note: 'Order placed',
          },
        ]),
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            selectedVariants: item.selectedVariants
              ? JSON.stringify(item.selectedVariants)
              : undefined,
          })),
        },
      },
      include: { items: true },
    });

    // Debit wallet if paying with wallet
    if (params.paymentMethod === 'WALLET') {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.buyerId },
      });

      if (!wallet || wallet.balance < total) {
        throw new Error('Insufficient wallet balance');
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance - total },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: total,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - total,
          status: 'COMPLETED',
          reference: `PAY-${order.id}-${Date.now()}`,
          description: `Payment for order ${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }

    // Update product stock
    for (const item of params.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          sales: { increment: item.quantity },
        },
      });
    }

    // Clear buyer's cart
    const cart = await tx.cart.findUnique({
      where: { buyerId: params.buyerId },
    });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { subtotal: 0 },
      });
    }

    // Update vendor analytics
    await tx.vendor.update({
      where: { id: params.vendorId },
      data: {
        totalOrders: { increment: 1 },
        totalSales: { increment: total },
      },
    });

    // Notify buyer
    await tx.notification.create({
      data: {
        userId: params.buyerId,
        type: 'ORDER_CONFIRMED',
        title: 'Order Placed',
        message: `Your order ${order.orderNumber} has been placed successfully.`,
        link: `/orders/${order.id}`,
      },
    });

    return order;
  });
}

// ── Wallet Deposit Transaction ─────────────────────────────────────────
export async function walletDepositTransaction(params: {
  userId: string;
  amount: number;
  reference: string;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId: params.userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const newBalance = wallet.balance + params.amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: params.amount,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        reference: params.reference,
        description: params.description || 'Wallet deposit',
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, transaction };
  });
}

// ── Wallet Withdrawal Transaction ──────────────────────────────────────
export async function walletWithdrawalTransaction(params: {
  userId: string;
  amount: number;
  reference: string;
  description?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId: params.userId },
    });

    if (!wallet || wallet.balance < params.amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = wallet.balance - params.amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: params.amount,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        status: 'PENDING',
        reference: params.reference,
        description: params.description || 'Wallet withdrawal',
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, transaction };
  });
}

// ── Voucher Redemption Transaction ─────────────────────────────────────
export async function voucherRedemptionTransaction(params: {
  voucherId: string;
  userId: string;
  orderId: string;
  discountApplied: number;
}) {
  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findUnique({
      where: { id: params.voucherId },
    });

    if (!voucher || !voucher.isActive) {
      throw new Error('Voucher is not valid');
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new Error('Voucher usage limit reached');
    }

    const userRedemptions = await tx.voucherRedemption.count({
      where: {
        voucherId: params.voucherId,
        userId: params.userId,
      },
    });

    if (userRedemptions >= voucher.perUserLimit) {
      throw new Error('Per-user voucher limit reached');
    }

    await tx.voucher.update({
      where: { id: params.voucherId },
      data: { usedCount: { increment: 1 } },
    });

    const redemption = await tx.voucherRedemption.create({
      data: {
        voucherId: params.voucherId,
        userId: params.userId,
        orderId: params.orderId,
        discountApplied: params.discountApplied,
      },
    });

    return redemption;
  });
}

// ── Order Status Update Transaction ────────────────────────────────────
export async function orderStatusUpdateTransaction(params: {
  orderId: string;
  newStatus: string;
  note?: string;
  updatedBy: string;
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const statusHistory = JSON.parse(
      (order.statusHistory as string) || '[]'
    );
    statusHistory.push({
      status: params.newStatus,
      timestamp: new Date().toISOString(),
      note: params.note || `Status updated to ${params.newStatus}`,
      updatedBy: params.updatedBy,
    });

    const updatedOrder = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status: params.newStatus as 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED',
        statusHistory: JSON.stringify(statusHistory),
        completedAt: ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(
          params.newStatus
        )
          ? new Date()
          : undefined,
      },
    });

    await tx.notification.create({
      data: {
        userId: order.buyerId,
        type:
          params.newStatus === 'CANCELLED'
            ? 'ORDER_CANCELLED'
            : 'ORDER_CONFIRMED',
        title: `Order ${params.newStatus}`,
        message: `Your order ${order.orderNumber} is now ${params.newStatus.toLowerCase().replace(/_/g, ' ')}.`,
        link: `/orders/${order.id}`,
      },
    });

    // If refunded, credit buyer's wallet
    if (params.newStatus === 'REFUNDED') {
      const wallet = await tx.wallet.findUnique({
        where: { userId: order.buyerId },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance + order.total },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: order.total,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + order.total,
            status: 'COMPLETED',
            reference: `REF-${order.id}-${Date.now()}`,
            description: `Refund for order ${order.orderNumber}`,
            orderId: order.id,
          },
        });
      }
    }

    return updatedOrder;
  });
}
