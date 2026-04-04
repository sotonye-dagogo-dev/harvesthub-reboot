/**
 * POST /api/push/subscribe — Store push subscription
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/push/subscribe', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { endpoint, keys } = await req.json();
        if (!endpoint || !keys) {
            return apiError('endpoint and keys are required', 400);
        }

        // Upsert by endpoint to avoid duplicates
        const existing = await prisma.pushSubscription.findFirst({
            where: { endpoint, userId: user.userId },
        });

        let subscription;
        if (existing) {
            subscription = await prisma.pushSubscription.update({
                where: { id: existing.id },
                data: { keys, userId: user.userId },
            });
        } else {
            subscription = await prisma.pushSubscription.create({
                data: { endpoint, keys, userId: user.userId },
            });
        }

        return apiSuccess({ subscription }, 201);
    });
}
