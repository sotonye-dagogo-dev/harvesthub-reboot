/**
 * GET  /api/orders — List orders (role-filtered)
 * POST /api/orders — Create order (authenticated users)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';
import { getPaymentFallbackTelemetry, verifyPayment, type SupportedPaymentGateway } from '@/lib/services/payments';
import { dispatchNotification } from '@/lib/services/notifications';
import { parseOrderGroupIdFromHistory } from '@/lib/services/orderLifecycle';
import { getCommerceLifecycleConfig } from '@/lib/services/commerceConfig';
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
            include: {
                _count: {
                    select: { items: true },
                },
                items: {
                    select: { quantity: true },
                },
            },
            take: groupId ? 500 : undefined,
        });

        const ordersWithGroup = allScopedOrders.map((order) => {
            const orderGroupId = parseOrderGroupIdFromHistory(order.statusHistory as Prisma.JsonValue);
            const itemCount = order._count?.items ?? (Array.isArray(order.items) ? order.items.length : 0);
            const totalQuantity = Array.isArray(order.items)
                ? order.items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0)
                : 0;
            const { items: _items, _count: _count, ...orderData } = order;

            return {
                ...orderData,
                orderGroupId,
                itemCount,
                totalQuantity,
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
            proofOfTransfer,
        } = body;

        const normalizedNotes = typeof notes === 'string' ? notes.trim() : '';
        const normalizedPaymentReference =
            typeof paymentReference === 'string' && paymentReference.trim().length > 0
                ? paymentReference.trim()
                : null;

        let normalizedProofOfTransfer: {
            imageUrl: string;
            imagePublicId: string | null;
            bankReference: string | null;
            amount: number;
        } | null = null;
        if (
            proofOfTransfer &&
            typeof proofOfTransfer === 'object' &&
            typeof (proofOfTransfer as Record<string, unknown>).imageUrl === 'string'
        ) {
            const proof = proofOfTransfer as Record<string, unknown>;
            const imageUrl = String(proof.imageUrl).trim();
            const amount = Number(proof.amount);
            if (imageUrl.length > 0 && Number.isFinite(amount) && amount > 0) {
                normalizedProofOfTransfer = {
                    imageUrl,
                    imagePublicId:
                        typeof proof.imagePublicId === 'string' && proof.imagePublicId.trim().length > 0
                            ? proof.imagePublicId.trim()
                            : null,
                    bankReference:
                        typeof proof.bankReference === 'string' && proof.bankReference.trim().length > 0
                            ? proof.bankReference.trim()
                            : null,
                    amount,
                };
            }
        }

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

        if (paymentMethod === PaymentMethod.BANK_TRANSFER_PROOF && !normalizedProofOfTransfer) {
            return NextResponse.json(
                {
                    error:
                        'A proof of payment upload (receipt image and amount) is required to place a bank transfer order.',
                    code: 'PROOF_OF_PAYMENT_REQUIRED',
                },
                { status: 400 }
            );
        }

        const commerceConfig = await getCommerceLifecycleConfig(prisma);
        const paymentsEnabled = commerceConfig.paymentsEnabled;
        const requiresGatewayVerification = paymentsEnabled && paymentMethod === PaymentMethod.CARD;

        let gatewayVerification: Awaited<ReturnType<typeof verifyPayment>> | null = null;
        let paymentAuditNote = 'Payment pending confirmation.';
        let paymentVerifiedAt: string | null = null;
        let paymentConfirmationPending = false;

        if (requiresGatewayVerification) {
            if (!paymentGateway || !normalizedPaymentReference) {
                return NextResponse.json(
                    { error: 'paymentGateway and paymentReference are required for card payments' },
                    { status: 400 }
                );
            }

            const gateway = String(paymentGateway).toUpperCase() as SupportedPaymentGateway;
            if (!['PAYSTACK', 'FLUTTERWAVE'].includes(gateway)) {
                return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });
            }

            const verificationReference = paymentVerificationReference || normalizedPaymentReference;
            gatewayVerification = await verifyPayment({
                gateway,
                reference: verificationReference,
            });

            if (gatewayVerification.status === 'GATEWAY_UNAVAILABLE') {
                paymentConfirmationPending = true;
                paymentAuditNote = `Payment verification pending via ${gateway} (gateway unavailable).`;
            } else if (gatewayVerification.status !== 'SUCCESS') {
                return NextResponse.json(
                    {
                        error: 'Payment verification is not successful',
                        code: 'PAYMENT_VERIFICATION_FAILED',
                        verification: gatewayVerification,
                    },
                    { status: 400 }
                );
            }

            if (gatewayVerification.status === 'SUCCESS') {
                paymentVerifiedAt = new Date().toISOString();
                paymentAuditNote = `Payment verified via ${gateway} (ref: ${normalizedPaymentReference}).`;
            }
        } else if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled) {
            paymentAuditNote = 'Wallet payment selected.';
        } else if (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.BANK_TRANSFER_PROOF) {
            const fallback = getPaymentFallbackTelemetry();
            if (normalizedProofOfTransfer) {
                paymentAuditNote = `Bank transfer with proof of payment uploaded. Vendor verification required (fallback deprecates in ${fallback.deprecationDays} day(s)).`;
            } else {
                paymentAuditNote = `Bank transfer fallback used (deprecates in ${fallback.deprecationDays} day(s)).`;
            }
        }

        // Use Prisma for all order operations (no mock fallback)
        const buyer = await prisma.buyer.upsert({
            where: { userId: user.userId },
            update: {},
            create: { userId: user.userId },
        });

        if (requiresGatewayVerification && normalizedPaymentReference) {
            const existingOrders = await prisma.order.findMany({
                where: {
                    buyerId: buyer.id,
                    notes: {
                        contains: normalizedPaymentReference,
                    },
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true,
                    vendor: { select: { id: true, storeName: true } },
                },
                take: 20,
            });

            if (existingOrders.length > 0) {
                const groupId = parseOrderGroupIdFromHistory(
                    existingOrders[0]?.statusHistory as Prisma.JsonValue
                );

                if (existingOrders.length === 1) {
                    return NextResponse.json(
                        {
                            success: true,
                            idempotentReplay: true,
                            message: 'Payment reference already has a completed order. Returning existing order.',
                            order: existingOrders[0],
                        },
                        { status: 200 }
                    );
                }

                return NextResponse.json(
                    {
                        success: true,
                        split: true,
                        idempotentReplay: true,
                        message:
                            'Payment reference already has completed split orders. Returning existing orders.',
                        orderGroupId: groupId,
                        orders: existingOrders,
                    },
                    { status: 200 }
                );
            }
        }

        const requestedVendorIds = Array.from(
            new Set(normalizedVendorOrders.map((entry) => entry.vendorId))
        );
        const vendors = await prisma.vendor.findMany({
            where: { id: { in: requestedVendorIds } },
            select: { id: true, userId: true, status: true, storeName: true },
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
            vendorStoreName: string | null;
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
                vendorStoreName: vendor.storeName,
                subtotal,
                deliveryFee: deliveryFeePerOrder,
                total: subtotal + deliveryFeePerOrder,
                orderItems,
            });
        }

        const grandTotal = preparedOrders.reduce((sum, entry) => sum + entry.total, 0);
        if (grandTotal < commerceConfig.minOrderAmount) {
            return NextResponse.json(
                {
                    error: `Minimum order amount is NGN ${commerceConfig.minOrderAmount.toLocaleString('en-NG')}`,
                    code: 'MIN_ORDER_AMOUNT_NOT_MET',
                    minOrderAmount: commerceConfig.minOrderAmount,
                },
                { status: 400 }
            );
        }

        if (gatewayVerification) {
            const verifiedCurrency = gatewayVerification.currency.trim().toUpperCase();
            if (verifiedCurrency !== 'NGN') {
                return NextResponse.json(
                    {
                        error: `Payment currency mismatch. Expected NGN but received ${verifiedCurrency}.`,
                        code: 'PAYMENT_CURRENCY_MISMATCH',
                        verification: gatewayVerification,
                    },
                    { status: 400 }
                );
            }

            const expectedAmountSubunit = Math.round(grandTotal * 100);
            const verifiedAmountSubunit = Math.round(gatewayVerification.amount * 100);
            if (verifiedAmountSubunit !== expectedAmountSubunit) {
                return NextResponse.json(
                    {
                        error: 'Payment amount does not match order total. Your order was not placed.',
                        code: 'PAYMENT_AMOUNT_MISMATCH',
                        expectedAmount: grandTotal,
                        verifiedAmount: gatewayVerification.amount,
                        verification: gatewayVerification,
                    },
                    { status: 400 }
                );
            }
        }

        const paymentStatus = requiresGatewayVerification
            ? gatewayVerification?.status === 'SUCCESS'
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING
            : paymentMethod === PaymentMethod.WALLET && paymentsEnabled
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING;

        const orderGroupId = `CHK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const composedOrderNotes = [
            normalizedNotes,
            paymentAuditNote,
            normalizedPaymentReference ? `Payment ref: ${normalizedPaymentReference}.` : null,
        ]
            .filter((entry): entry is string => Boolean(entry && entry.trim().length > 0))
            .join(' ');

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
                        paymentReference: normalizedPaymentReference,
                        paymentGateway: paymentGateway || null,
                        verificationStatus: gatewayVerification?.status || null,
                        verificationProviderStatus: gatewayVerification?.providerStatus || null,
                        paymentVerifiedAt,
                        paymentConfirmationPending,
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
                        notes: composedOrderNotes,
                        statusHistory: statusHistory as Prisma.InputJsonValue,
                        items: { create: prepared.orderItems },
                    },
                    include: { items: true, vendor: { select: { id: true, storeName: true } } },
                });

                if (normalizedProofOfTransfer) {
                    await tx.proofOfTransfer.create({
                        data: {
                            orderId: newOrder.id,
                            userId: user.userId,
                            imageUrl: normalizedProofOfTransfer.imageUrl,
                            imagePublicId: normalizedProofOfTransfer.imagePublicId,
                            bankReference: normalizedProofOfTransfer.bankReference,
                            amount: normalizedProofOfTransfer.amount,
                            status: 'PENDING',
                        },
                    });
                }

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

        if (paymentMethod === PaymentMethod.WALLET && paymentsEnabled) {
            await cacheInvalidate(userWalletKey(user.userId));
        }

        const orderMetricsById = new Map(
            orders.map((order, index) => {
                const prepared = preparedOrders[index];
                const itemCount = prepared ? prepared.orderItems.length : 0;
                const totalQuantity = prepared
                    ? prepared.orderItems.reduce((sum: number, item) => {
                        const quantity = Number(item.quantity);
                        return sum + (Number.isFinite(quantity) ? quantity : 0);
                    }, 0)
                    : 0;
                return [order.id, { itemCount, totalQuantity }] as const;
            })
        );
        const aggregateItemCount = Array.from(orderMetricsById.values()).reduce(
            (sum, metrics) => sum + metrics.itemCount,
            0
        );
        const aggregateQuantity = Array.from(orderMetricsById.values()).reduce(
            (sum, metrics) => sum + metrics.totalQuantity,
            0
        );

        const vendorNotifications = orders.map((order) => {
            const preparedForVendor = preparedOrders.find((entry) => entry.vendorId === order.vendorId);
            const vendorUserId = preparedForVendor?.vendorUserId;
            if (!vendorUserId) return Promise.resolve();
            const metrics = orderMetricsById.get(order.id) ?? { itemCount: 0, totalQuantity: 0 };

            return dispatchNotification({
                userId: vendorUserId,
                type: 'ORDER_CONFIRMED',
                title: 'New Order Received',
                message: `Order ${order.orderNumber} (${metrics.itemCount} item${metrics.itemCount === 1 ? '' : 's'}) has been placed.`,
                link: '/orders',
                emailSubject: `New order received: ${order.orderNumber}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    vendorName: preparedForVendor?.vendorStoreName || null,
                    paymentMethod,
                    paymentStatus,
                    subtotal: order.subtotal,
                    deliveryFee: order.deliveryFee,
                    total: order.total,
                    deliveryMethod: order.deliveryMethod,
                    pickupService:
                        order.pickupDetails && typeof order.pickupDetails === 'object' && !Array.isArray(order.pickupDetails)
                            ? (order.pickupDetails as Record<string, unknown>).pickupService || null
                            : null,
                    deliveryAddress: order.deliveryAddress || null,
                    itemCount: metrics.itemCount,
                    totalQuantity: metrics.totalQuantity,
                    orderGroupId,
                } as Prisma.InputJsonValue,
            });
        });

        const firstOrder = orders[0];
        const firstOrderMetrics = firstOrder
            ? orderMetricsById.get(firstOrder.id) ?? { itemCount: 0, totalQuantity: 0 }
            : { itemCount: 0, totalQuantity: 0 };
        const buyerMessage =
            firstOrder && orders.length === 1
                ? paymentConfirmationPending
                    ? `Your order ${firstOrder.orderNumber} (${firstOrderMetrics.itemCount} item${firstOrderMetrics.itemCount === 1 ? '' : 's'}) was placed and is awaiting payment confirmation.`
                    : `Your order ${firstOrder.orderNumber} (${firstOrderMetrics.itemCount} item${firstOrderMetrics.itemCount === 1 ? '' : 's'}) has been placed successfully.`
                : paymentConfirmationPending
                    ? `Your checkout has been split into ${orders.length} vendor orders (${aggregateItemCount} item${aggregateItemCount === 1 ? '' : 's'}) and is awaiting payment confirmation.`
                    : `Your checkout has been split into ${orders.length} vendor orders (${aggregateItemCount} item${aggregateItemCount === 1 ? '' : 's'}).`;

        await Promise.allSettled([
            ...vendorNotifications,
            dispatchNotification({
                userId: user.userId,
                type: 'ORDER_CONFIRMED',
                title: paymentConfirmationPending ? 'Order Pending Payment Confirmation' : 'Order Placed Successfully',
                message: buyerMessage,
                link: '/orders',
                emailSubject:
                    firstOrder && orders.length === 1
                        ? paymentConfirmationPending
                            ? `Order ${firstOrder.orderNumber} pending payment confirmation`
                            : `Order ${firstOrder.orderNumber} confirmed`
                        : paymentConfirmationPending
                            ? `${orders.length} orders pending payment confirmation`
                            : `${orders.length} orders confirmed`,
                metadata: {
                    orderId: firstOrder?.id || null,
                    orderNumber: firstOrder?.orderNumber || null,
                    vendorName: preparedOrders[0]?.vendorStoreName || null,
                    orderGroupId,
                    orderCount: orders.length,
                    paymentMethod,
                    paymentStatus,
                    subtotal: orders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0),
                    deliveryFee: orders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0),
                    total: grandTotal,
                    deliveryMethod: firstOrder?.deliveryMethod || null,
                    pickupService:
                        firstOrder?.pickupDetails && typeof firstOrder.pickupDetails === 'object' && !Array.isArray(firstOrder.pickupDetails)
                            ? (firstOrder.pickupDetails as Record<string, unknown>).pickupService || null
                            : null,
                    deliveryAddress: firstOrder?.deliveryAddress || null,
                    itemCount: aggregateItemCount,
                    totalQuantity: aggregateQuantity,
                    orderIds: orders.map((order) => order.id),
                } as Prisma.InputJsonValue,
            }),
        ]);

        if (orders.length === 1) {
            return NextResponse.json(
                {
                    success: true,
                    order: orders[0],
                    paymentConfirmationPending,
                    message: paymentConfirmationPending
                        ? 'Order placed and payment confirmation is pending.'
                        : undefined,
                },
                { status: paymentConfirmationPending ? 202 : 201 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                split: true,
                orderGroupId,
                orders,
                paymentConfirmationPending,
                message: paymentConfirmationPending
                    ? 'Checkout completed and payment confirmation is pending.'
                    : undefined,
            },
            { status: paymentConfirmationPending ? 202 : 201 }
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
