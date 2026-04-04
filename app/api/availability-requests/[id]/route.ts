/**
 * GET   /api/availability-requests/[id] � Request detail
 * PATCH /api/availability-requests/[id] � Vendor confirm/decline
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/availability-requests/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
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
        if (!request) return apiError('Request not found', 404);

        // Access control
        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && request.buyerId !== buyer?.id && request.vendorId !== vendor?.id) {
            return apiError('Forbidden', 403);
        }

        return apiSuccess({ request });
    });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    return withApiHandler('PATCH /api/availability-requests/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const request = await prisma.productAvailabilityRequest.findUnique({ where: { id } });
        if (!request) return apiError('Request not found', 404);

        // Only vendor who received the request can respond
        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (!vendor || request.vendorId !== vendor.id) {
            return apiError('Forbidden', 403);
        }

        if (request.status !== 'PENDING') {
            return apiError('Request has already been responded to', 400);
        }

        const { status, vendorResponse } = await req.json();
        if (!status || !['CONFIRMED', 'DECLINED'].includes(status)) {
            return apiError('Status must be CONFIRMED or DECLINED', 400);
        }

        const updated = await prisma.productAvailabilityRequest.update({
            where: { id },
            data: { status, vendorResponse: vendorResponse ?? null },
        });

        return apiSuccess({ request: updated });
    });
}
