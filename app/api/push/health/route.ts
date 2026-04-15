/**
 * POST /api/push/health - Validate browser push subscription persistence for current user
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/push/health', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json().catch(() => ({}));
        const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';

        const [exists, totalSubscriptions] = await Promise.all([
            endpoint
                ? prisma.pushSubscription.findFirst({
                    where: {
                        userId: user.userId,
                        endpoint,
                    },
                    select: { id: true },
                })
                : Promise.resolve(null),
            prisma.pushSubscription.count({
                where: { userId: user.userId },
            }),
        ]);

        return apiSuccess({
            exists: Boolean(exists),
            totalSubscriptions,
        });
    });
}
