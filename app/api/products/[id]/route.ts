/**
 * GET    /api/products/[id] � Product detail
 * PUT    /api/products/[id] � Update product (vendor owner or admin)
 * DELETE /api/products/[id] � Delete product
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache/redis';
import { productKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cacheK = productKey(id);
        const cached = await cacheGet(cacheK);
        if (cached) return NextResponse.json(cached);

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true, averageRating: true } },
                reviews: { where: { status: 'APPROVED' }, include: { buyer: { include: { user: { select: { firstName: true, lastName: true } } } }, votes: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        await prisma.product.update({ where: { id }, data: { views: { increment: 1 } } });

        const data = { success: true, product };
        await cacheSet(cacheK, data, 600);
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const product = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        if (product.vendor.userId !== user.userId && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { vendorId: _vendorId, id: _id, createdAt: _createdAt, updatedAt: _updatedAt, vendor: _vendor, reviews: _reviews, orderItems: _orderItems, cartItems: _cartItems, bookings: _bookings, ...updateData } = body;
        const updated = await prisma.product.update({ where: { id }, data: updateData });

        await cacheInvalidate(productKey(id));
        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error('PUT /api/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const product = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        if (product.vendor.userId !== user.userId && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.product.delete({ where: { id } });
        await cacheInvalidate(productKey(id));
        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('DELETE /api/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
