/**
 * GET  /api/orders — List orders (role-filtered)
 * POST /api/orders — Create order (buyer only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { Prisma } from '@/prisma/generated/client';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const where: Prisma.OrderWhereInput = {};
        if (status) where.status = status as Prisma.OrderWhereInput['status'];
        if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.OrderWhereInput['paymentStatus'];

        // Role-based filtering
        if (user.role === UserRole.BUYER) {
            const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
            if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
            where.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
            where.vendorId = vendor.id;
        }
        // ADMIN sees all

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
                    vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true, userId: true } },
                    buyer: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            orders,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Only buyers can place orders' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { vendorId, items, paymentMethod, deliveryMethod, deliveryAddress, pickupDetails, notes } = body;

        if (!vendorId || !items?.length || !paymentMethod || !deliveryMethod) {
            return NextResponse.json({ error: 'vendorId, items, paymentMethod, deliveryMethod are required' }, { status: 400 });
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        // Validate products and calculate totals
        let subtotal = 0;
        const orderItems: { product: { connect: { id: string } }; productName: string; productImage: string; quantity: number; price: number; subtotal: number; selectedVariants: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined }[] = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product || !product.isActive) {
                return NextResponse.json({ error: `Product ${item.productId} not found or inactive` }, { status: 400 });
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
                selectedVariants: item.selectedVariants ? (item.selectedVariants as Prisma.InputJsonValue) : Prisma.DbNull,
            });
        }

        const deliveryFee = deliveryMethod === 'DELIVERY' ? 1500 : 0;
        const total = subtotal + deliveryFee;
        const orderNumber = `MHH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    buyerId: buyer.id,
                    vendorId,
                    subtotal,
                    deliveryFee,
                    total,
                    paymentMethod,
                    deliveryMethod,
                    deliveryAddress: deliveryAddress || null,
                    pickupDetails: pickupDetails || null,
                    notes: notes || null,
                    statusHistory: [{ status: 'PENDING', timestamp: new Date().toISOString(), note: 'Order created' }],
                    items: { create: orderItems },
                },
                include: { items: true, vendor: { select: { id: true, storeName: true } } },
            });

            // Decrement stock for physical products
            for (const item of orderItems) {
                const prod = await tx.product.findUnique({ where: { id: item.product.connect.id }, select: { listingType: true } });
                if (prod?.listingType !== 'SERVICE') {
                    await tx.product.update({
                        where: { id: item.product.connect.id },
                        data: { stock: { decrement: item.quantity }, sales: { increment: item.quantity } },
                    });
                }
            }

            // Update vendor stats
            await tx.vendor.update({
                where: { id: vendorId },
                data: { totalOrders: { increment: 1 }, totalSales: { increment: total } },
            });

            // Create notification for vendor
            await tx.notification.create({
                data: {
                    userId: vendor.userId,
                    type: 'ORDER_CONFIRMED',
                    title: 'New Order Received',
                    message: `Order ${orderNumber} has been placed.`,
                    link: `/vendor/orders`,
                },
            });

            return newOrder;
        });

        return NextResponse.json({ success: true, order }, { status: 201 });
    } catch (error) {
        console.error('POST /api/orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
