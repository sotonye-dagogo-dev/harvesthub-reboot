/**
 * GET /api/ads/[id] � Ad detail (owner or admin)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/ads/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const ad = await prisma.advertisement.findUnique({
            where: { id },
            include: { payments: true },
        });
        if (!ad) return apiError('Ad not found', 404);

        if (user.role !== UserRole.ADMIN && ad.advertiserId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        return apiSuccess({ ad });
    });
}
