/**
 * GET    /api/orders/[id] � Order detail
 * PUT    /api/orders/[id] � Update order (vendor/admin)
 * DELETE /api/orders/[id] � Delete order (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                buyer: { include: { user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } } } },
                vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } },
            },
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Access control
        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && order.buyerId !== buyer?.id && order.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('GET /api/orders/[id] error:', error);
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
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && order.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { notes, deliveryAddress, pickupDetails } = body;
        const data: Record<string, unknown> = {};
        if (notes !== undefined) data.notes = notes;
        if (deliveryAddress !== undefined) data.deliveryAddress = deliveryAddress;
        if (pickupDetails !== undefined) data.pickupDetails = pickupDetails;

        const updated = await prisma.order.update({ where: { id }, data });
        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error('PUT /api/orders/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        await prisma.order.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        console.error('DELETE /api/orders/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
