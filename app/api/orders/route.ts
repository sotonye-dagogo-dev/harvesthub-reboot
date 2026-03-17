/**
 * GET  /api/orders — List orders (role-filtered)
 * POST /api/orders — Create order (buyer only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { Prisma } from '../../../prisma/generated/client';

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

        const where: any = {};
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        // Role-based filtering
        if (user.role === UserRole.BUYER) {
            // Use buyer profile id for filtering
            const buyer = await db.buyers.findByUserId(user.userId as string);
            if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
            where.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = await db.vendors.findByUserId(user.userId as string);
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
            where.vendorId = vendor.id;
        }
        // ADMIN sees all

        // Use unified db for list + count; adapters may or may not include relations.
        const orders = await db.orders.findAll({ ...where, page, limit } as any);
        const total = await db.orders.count(where as any);

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

        // Determine runtime (Prisma vs mock)
        const usePrisma = process.env.USE_PRISMA === 'true' || process.env.NODE_ENV === 'production';

        if (usePrisma) {
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
        }

        // Mock path (no DB transaction): validate and perform in-memory updates
        const buyer = await db.buyers.findByUserId(user.userId as string);
        if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });

        const vendor = await db.vendors.findById(vendorId as string);
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        // Validate products and calculate totals
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of items) {
            const product = await db.products.findById(item.productId as string);
            if (!product || !product.isActive) {
                return NextResponse.json({ error: `Product ${item.productId} not found or inactive` }, { status: 400 });
            }
            if (product.stock < item.quantity && product.listingType !== 'SERVICE') {
                return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
            }
            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;
            orderItems.push({
                productId: product.id,
                productName: product.name,
                productImage: product.mainImage,
                quantity: item.quantity,
                price: product.price,
                subtotal: itemSubtotal,
                selectedVariants: item.selectedVariants || null,
            });
        }

        const deliveryFee = deliveryMethod === 'DELIVERY' ? 1500 : 0;
        const total = subtotal + deliveryFee;
        const orderNumber = `MHH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const newOrder = await db.orders.create({
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
            statusHistory: [{ status: 'PENDING', timestamp: new Date(), updatedBy: buyer.id }],
            items: orderItems,
        } as any);

        // Decrement stock and increment sales for products
        for (const it of orderItems) {
            const prod = await db.products.findById(it.productId);
            if (prod && prod.listingType !== 'SERVICE') {
                await db.products.update(prod.id, { stock: (prod.stock || 0) - it.quantity, sales: (prod.sales || 0) + it.quantity } as any);
            }
        }

        // Update vendor analytics
        if (typeof db.vendors.updateAnalytics === 'function') {
            db.vendors.updateAnalytics(vendor.id);
        }

        return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
    } catch (error) {
        console.error('POST /api/orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
