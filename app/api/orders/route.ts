/**
 * GET  /api/orders — List orders (role-filtered)
 * POST /api/orders — Create order (buyer only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { isPaymentProcessingEnabled } from '@/lib/config/payments';
import { getPaymentFallbackTelemetry, verifyPayment, type SupportedPaymentGateway } from '@/lib/services/payments';
import { dispatchNotification } from '@/lib/services/notifications';
import { parseOrderGroupIdFromHistory } from '@/lib/services/orderLifecycle';
import {
    PaymentMethod,
    PaymentStatus,
    Prisma,
    TransactionStatus,
    TransactionType,
} from '../../../prisma/generated/client';

type IncomingOrderItem = {
    productId: string;
    quantity: number;
    selectedVariants?: unknown;
};

type IncomingVendorOrder = {
    vendorId: string;
    items: IncomingOrderItem[];
};

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const groupId = searchParams.get('groupId')?.trim() || null;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const where: any = {};
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        // Role-based filtering
        if (user.role === UserRole.BUYER) {
            // Use buyer profile id for filtering
            const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
            if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
            where.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
            where.vendorId = vendor.id;
        }
        // ADMIN sees all

        // Group filtering relies on status-history metadata, so fetch a bounded role-scoped set first,
        // then apply metadata filtering and pagination in memory.
        const allScopedOrders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: groupId ? 500 : undefined,
        });

        const ordersWithGroup = allScopedOrders.map((order) => {
            const orderGroupId = parseOrderGroupIdFromHistory(order.statusHistory as Prisma.JsonValue);
            return {
                ...order,
                orderGroupId,
            };
        });

        const filteredOrders = groupId
            ? ordersWithGroup.filter((order) => order.orderGroupId === groupId)
            : ordersWithGroup;

        const total = filteredOrders.length;
        const take = limit;
        const skip = (page - 1) * limit;
        const paginatedOrders = filteredOrders.slice(skip, skip + take);

        const groupedSummary = filteredOrders.reduce<Record<string, { orderCount: number; total: number }>>(
            (acc, order) => {
                if (!order.orderGroupId) return acc;
                if (!acc[order.orderGroupId]) {
                    acc[order.orderGroupId] = { orderCount: 0, total: 0 };
                }
                const currentGroup = acc[order.orderGroupId];
                if (currentGroup) {
                    currentGroup.orderCount += 1;
                    currentGroup.total += Number(order.total || 0);
                }
                return acc;
            },
            {}
        );

        return NextResponse.json({
            success: true,
            orders: paginatedOrders,
            groupedSummary,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        console.error('GET /api/orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const {
            vendorId,
            items,
            vendorOrders,
            paymentMethod,
            deliveryMethod,
            deliveryAddress,
            pickupDetails,
            notes,
            paymentGateway,
            paymentReference,
            paymentVerificationReference,
        } = body;

        let normalizedVendorOrders: IncomingVendorOrder[] = [];
        if (Array.isArray(vendorOrders) && vendorOrders.length > 0) {
            normalizedVendorOrders = vendorOrders
                .filter((entry): entry is IncomingVendorOrder => Boolean(entry && typeof entry === 'object'))
                .map((entry) => ({
                    vendorId: typeof entry.vendorId === 'string' ? entry.vendorId : '',
                    items: Array.isArray(entry.items)
                        ? entry.items
                            .filter((line): line is IncomingOrderItem => Boolean(line && typeof line === 'object'))
                            .map((line) => ({
                                productId: typeof line.productId === 'string' ? line.productId : '',
                                quantity: Number(line.quantity),
                                selectedVariants: line.selectedVariants,
                            }))
                        : [],
                }))
                .filter((entry) => entry.vendorId && entry.items.length > 0);
        } else if (vendorId && Array.isArray(items) && items.length > 0) {
            normalizedVendorOrders = [
                {
                    vendorId,
                    items: items
                        .filter((line: unknown) => Boolean(line && typeof line === 'object'))
                        .map((line: Record<string, unknown>) => ({
                            productId: typeof line.productId === 'string' ? line.productId : '',
                            quantity: Number(line.quantity),
                            selectedVariants: line.selectedVariants,
                        }))
                        .filter((line) => line.productId && Number.isFinite(line.quantity) && line.quantity > 0),
                },
            ];
        }

        if (!paymentMethod || !deliveryMethod || normalizedVendorOrders.length === 0) {
            return NextResponse.json(
                {
                    error:
                        'paymentMethod, deliveryMethod and either vendorOrders[] or vendorId+items are required',
                },
                { status: 400 }
            );
        }

        for (const entry of normalizedVendorOrders) {
            if (!entry.vendorId || entry.items.length === 0) {
                return NextResponse.json(
                    { error: 'Each vendor order must include vendorId and at least one item.' },
                    { status: 400 }
                );
            }

            for (const line of entry.items) {
                if (!line.productId || !Number.isFinite(line.quantity) || line.quantity <= 0) {
                    return NextResponse.json(
                        { error: 'Each order item requires productId and quantity > 0.' },
                        { status: 400 }
                    );
                }
            }
        }

        if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
            return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
        }

        const paymentsEnabled = isPaymentProcessingEnabled();
        const requiresGatewayVerification = paymentsEnabled && paymentMethod === PaymentMethod.CARD;

        let gatewayVerification: Awaited<ReturnType<typeof verifyPayment>> | null = null;
        let paymentAuditNote = 'Payment pending confirmation.';

        if (requiresGatewayVerification) {
            if (!paymentGateway || !paymentReference) {
                return NextResponse.json(
                    { error: 'paymentGateway and paymentReference are required for card payments' },
                    { status: 400 }
                );
            }

            const gateway = String(paymentGateway).toUpperCase() as SupportedPaymentGateway;
            if (!['PAYSTACK', 'FLUTTERWAVE'].includes(gateway)) {
                return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });
            }

            const verificationReference = paymentVerificationReference || paymentReference;
            gatewayVerification = await verifyPayment({
                gateway,
                reference: verificationReference,
            });

            if (gatewayVerification.status !== 'SUCCESS') {
                return NextResponse.json(
                    {
                        error: 'Payment verification is not successful',
                        code: 'PAYMENT_VERIFICATION_FAILED',
                        verification: gatewayVerification,
                    },
                    { status: 400 }
                );
            }

            paymentAuditNote = `Payment verified via ${gateway} (ref: ${paymentReference}).`;
        } else if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled) {
            paymentAuditNote = 'Wallet payment selected.';
        } else if (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.BANK_TRANSFER_PROOF) {
            const fallback = getPaymentFallbackTelemetry();
            paymentAuditNote = `Bank transfer fallback used (deprecates in ${fallback.deprecationDays} day(s)).`;
        }

        // Use Prisma for all order operations (no mock fallback)
        const buyer = await prisma.buyer.upsert({
            where: { userId: user.userId },
            update: {},
            create: { userId: user.userId },
        });

        const requestedVendorIds = Array.from(
            new Set(normalizedVendorOrders.map((entry) => entry.vendorId))
        );
        const vendors = await prisma.vendor.findMany({
            where: { id: { in: requestedVendorIds } },
            select: { id: true, userId: true, status: true },
        });
        const vendorById = new Map(vendors.map((entry) => [entry.id, entry]));

        if (vendors.length !== requestedVendorIds.length) {
            const missing = requestedVendorIds.filter((entry) => !vendorById.has(entry));
            return NextResponse.json(
                { error: `Vendor not found: ${missing.join(', ')}` },
                { status: 404 }
            );
        }

        const unverifiedVendors = vendors.filter((entry) => entry.status !== 'APPROVED');
        if (unverifiedVendors.length > 0 && body.vendorVerificationAcknowledged !== true) {
            return NextResponse.json(
                {
                    error: 'Vendor is currently unverified. Buyer acknowledgment is required before placing this order.',
                    code: 'VENDOR_UNVERIFIED_ACK_REQUIRED',
                    vendors: unverifiedVendors.map((entry) => ({ id: entry.id, status: entry.status })),
                },
                { status: 409 }
            );
        }

        type PreparedOrder = {
            vendorId: string;
            vendorUserId: string;
            vendorStatus: string;
            subtotal: number;
            deliveryFee: number;
            total: number;
            orderItems: {
                product: { connect: { id: string } };
                productName: string;
                productImage: string;
                quantity: number;
                price: number;
                subtotal: number;
                selectedVariants:
                    | Prisma.NullableJsonNullValueInput
                    | Prisma.InputJsonValue
                    | undefined;
            }[];
        };

        const preparedOrders: PreparedOrder[] = [];
        const deliveryFeePerOrder = deliveryMethod === 'DELIVERY' ? 1500 : 0;

        for (const entry of normalizedVendorOrders) {
            const vendor = vendorById.get(entry.vendorId);
            if (!vendor) {
                return NextResponse.json({ error: `Vendor ${entry.vendorId} not found` }, { status: 404 });
            }

            let subtotal = 0;
            const orderItems: PreparedOrder['orderItems'] = [];

            for (const item of entry.items) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product || !product.isActive) {
                    return NextResponse.json(
                        { error: `Product ${item.productId} not found or inactive` },
                        { status: 400 }
                    );
                }

                if (product.vendorId !== entry.vendorId) {
                    return NextResponse.json(
                        {
                            error: `Product ${product.id} does not belong to vendor ${entry.vendorId}`,
                        },
                        { status: 400 }
                    );
                }

                if (product.stock < item.quantity && product.listingType !== 'SERVICE') {
                    return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
                }

                const itemSubtotal = product.price * item.quantity;
                subtotal += itemSubtotal;
                orderItems.push({
                    product: { connect: { id: product.id } },
                    productName: product.name,
                    productImage: product.mainImage,
                    quantity: item.quantity,
                    price: product.price,
                    subtotal: itemSubtotal,
                    selectedVariants: item.selectedVariants
                        ? (item.selectedVariants as Prisma.InputJsonValue)
                        : Prisma.DbNull,
                });
            }

            preparedOrders.push({
                vendorId: vendor.id,
                vendorUserId: vendor.userId,
                vendorStatus: vendor.status,
                subtotal,
                deliveryFee: deliveryFeePerOrder,
                total: subtotal + deliveryFeePerOrder,
                orderItems,
            });
        }

        const grandTotal = preparedOrders.reduce((sum, entry) => sum + entry.total, 0);
        const paymentStatus =
            requiresGatewayVerification ||
                (paymentMethod === PaymentMethod.WALLET && paymentsEnabled)
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING;

        const orderGroupId = `CHK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const orders = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            let buyerWalletId: string | null = null;
            let runningWalletBalance = 0;

            if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled) {
                const buyerWallet = await tx.wallet.findUnique({
                    where: { userId: user.userId },
                    select: { id: true, balance: true, isActive: true },
                });

                if (!buyerWallet || !buyerWallet.isActive) {
                    throw new Error('WALLET_NOT_AVAILABLE');
                }

                if (buyerWallet.balance < grandTotal) {
                    throw new Error('INSUFFICIENT_WALLET_BALANCE');
                }

                buyerWalletId = buyerWallet.id;
                runningWalletBalance = buyerWallet.balance;
            }

            const createdOrders: Array<
                Awaited<ReturnType<typeof tx.order.create>>
            > = [];

            for (const prepared of preparedOrders) {
                const orderNumber = `MHH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
                const statusHistory: Array<Record<string, unknown>> = [
                    { status: 'PENDING', timestamp: new Date().toISOString(), note: 'Order created' },
                    {
                        status: 'PAYMENT_RECORDED',
                        timestamp: new Date().toISOString(),
                        note: paymentAuditNote,
                        paymentStatus,
                        paymentMethod,
                        paymentReference: paymentReference || null,
                        paymentGateway: paymentGateway || null,
                        verificationStatus: gatewayVerification?.status || null,
                        vendorVerification: prepared.vendorStatus,
                        vendorVerificationAcknowledged: body.vendorVerificationAcknowledged === true,
                        orderGroupId,
                    },
                ];

                const newOrder = await tx.order.create({
                    data: {
                        orderNumber,
                        buyerId: buyer.id,
                        vendorId: prepared.vendorId,
                        subtotal: prepared.subtotal,
                        deliveryFee: prepared.deliveryFee,
                        total: prepared.total,
                        paymentMethod,
                        paymentStatus,
                        deliveryMethod,
                        deliveryAddress: deliveryAddress || null,
                        pickupDetails: pickupDetails || null,
                        notes: notes || paymentAuditNote,
                        statusHistory: statusHistory as Prisma.InputJsonValue,
                        items: { create: prepared.orderItems },
                    },
                    include: { items: true, vendor: { select: { id: true, storeName: true } } },
                });

                if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled && buyerWalletId) {
                    const balanceBefore = runningWalletBalance;
                    const balanceAfter = runningWalletBalance - prepared.total;
                    runningWalletBalance = balanceAfter;

                    await tx.transaction.create({
                        data: {
                            walletId: buyerWalletId,
                            type: TransactionType.PAYMENT,
                            amount: prepared.total,
                            balanceBefore,
                            balanceAfter,
                            status: TransactionStatus.COMPLETED,
                            reference: `PAYMENT-ORDER-${newOrder.id}`,
                            description: `Wallet payment for order ${newOrder.orderNumber}`,
                            orderId: newOrder.id,
                            metadata: {
                                paymentMethod,
                                orderGroupId,
                                vendorId: prepared.vendorId,
                            },
                        },
                    });
                }

                for (const item of prepared.orderItems) {
                    const productId = item.product.connect.id;
                    const prod = await tx.product.findUnique({
                        where: { id: productId },
                        select: { listingType: true },
                    });
                    if (prod?.listingType !== 'SERVICE') {
                        await tx.product.update({
                            where: { id: productId },
                            data: { stock: { decrement: item.quantity }, sales: { increment: item.quantity } },
                        });
                    }
                }

                await tx.vendor.update({
                    where: { id: prepared.vendorId },
                    data: { totalOrders: { increment: 1 }, totalSales: { increment: prepared.total } },
                });

                createdOrders.push(newOrder);
            }

            if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled && buyerWalletId) {
                await tx.wallet.update({
                    where: { id: buyerWalletId },
                    data: { balance: runningWalletBalance },
                });
            }

            return createdOrders;
        });

        const vendorNotifications = orders.map((order) => {
            const vendorUserId = preparedOrders.find((entry) => entry.vendorId === order.vendorId)?.vendorUserId;
            if (!vendorUserId) return Promise.resolve();

            return dispatchNotification({
                userId: vendorUserId,
                type: 'ORDER_CONFIRMED',
                title: 'New Order Received',
                message: `Order ${order.orderNumber} has been placed.`,
                link: '/orders',
                emailSubject: `New order received: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    paymentMethod,
                    paymentStatus,
                    total: order.total,
                    orderGroupId,
                } as Prisma.InputJsonValue,
            });
        });

        const firstOrder = orders[0];
        const buyerMessage =
            firstOrder && orders.length === 1
                ? `Your order ${firstOrder.orderNumber} has been placed successfully.`
                : `Your checkout has been split into ${orders.length} vendor orders.`;

        await Promise.allSettled([
            ...vendorNotifications,
            dispatchNotification({
                userId: user.userId,
                type: 'ORDER_CONFIRMED',
                title: 'Order Placed Successfully',
                message: buyerMessage,
                link: '/orders',
                emailSubject:
                    firstOrder && orders.length === 1
                        ? `Order ${firstOrder.orderNumber} confirmed`
                        : `${orders.length} orders confirmed`,
                metadata: {
                    orderGroupId,
                    orderCount: orders.length,
                    paymentMethod,
                    paymentStatus,
                    total: grandTotal,
                    orderIds: orders.map((order) => order.id),
                } as Prisma.InputJsonValue,
            }),
        ]);

        if (orders.length === 1) {
            return NextResponse.json({ success: true, order: orders[0] }, { status: 201 });
        }

        return NextResponse.json(
            {
                success: true,
                split: true,
                orderGroupId,
                orders,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === 'WALLET_NOT_AVAILABLE') {
            return NextResponse.json(
                { error: 'Buyer wallet is unavailable for wallet payment.', code: 'WALLET_NOT_AVAILABLE' },
                { status: 409 }
            );
        }

        if (error instanceof Error && error.message === 'INSUFFICIENT_WALLET_BALANCE') {
            return NextResponse.json(
                {
                    error: 'Insufficient wallet balance for this checkout.',
                    code: 'INSUFFICIENT_WALLET_BALANCE',
                },
                { status: 400 }
            );
        }

        console.error('POST /api/orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
