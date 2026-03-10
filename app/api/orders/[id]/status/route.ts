/**
 * PATCH /api/orders/[id]/status � Update order status (vendor/admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'READY_FOR_PICKUP', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    READY_FOR_PICKUP: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    REFUNDED: [],
};

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Only vendor (owner) or admin
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && order.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { status } = await req.json();
        if (!status) return NextResponse.json({ error: 'Status is required' }, { status: 400 });

        const allowed = VALID_TRANSITIONS[order.status];
        if (!allowed || !allowed.includes(status)) {
            return NextResponse.json(
                { error: `Cannot transition from ${order.status} to ${status}` },
                { status: 400 },
            );
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error('PATCH /api/orders/[id]/status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
