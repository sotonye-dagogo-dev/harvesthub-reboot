/**
 * GET   /api/availability-requests/[id] � Request detail
 * PATCH /api/availability-requests/[id] � Vendor confirm/decline
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
        const request = await prisma.productAvailabilityRequest.findUnique({
            where: { id },
            include: {
                buyer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                vendor: { select: { id: true, storeName: true } },
            },
        });
        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        // Access control
        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && request.buyerId !== buyer?.id && request.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ success: true, request });
    } catch (error) {
        console.error('GET /api/availability-requests/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const request = await prisma.productAvailabilityRequest.findUnique({ where: { id } });
        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        // Only vendor who received the request can respond
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (!vendor || request.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (request.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request has already been responded to' }, { status: 400 });
        }

        const { status, vendorResponse } = await req.json();
        if (!status || !['CONFIRMED', 'DECLINED'].includes(status)) {
            return NextResponse.json({ error: 'Status must be CONFIRMED or DECLINED' }, { status: 400 });
        }

        const updated = await prisma.productAvailabilityRequest.update({
            where: { id },
            data: { status, vendorResponse: vendorResponse ?? null },
        });

        return NextResponse.json({ success: true, request: updated });
    } catch (error) {
        console.error('PATCH /api/availability-requests/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
