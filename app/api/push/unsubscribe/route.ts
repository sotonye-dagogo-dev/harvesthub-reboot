/**
 * POST /api/push/unsubscribe — Remove push subscription
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/push/unsubscribe', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { endpoint } = await req.json();
        if (!endpoint) {
            return apiError('endpoint is required', 400);
        }

        const existing = await prisma.pushSubscription.findFirst({
            where: { endpoint, userId: user.userId },
        });
        if (!existing) {
            return apiError('Subscription not found', 404);
        }

        await prisma.pushSubscription.delete({ where: { id: existing.id } });
        return apiSuccess({ message: 'Unsubscribed' });
    });
}
