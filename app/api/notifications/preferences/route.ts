/**
 * GET /api/notifications/preferences — Get notification preferences
 * PUT /api/notifications/preferences — Update notification preferences
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/notifications/preferences', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.userId },
        });

        // Create defaults if not found
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId: user.userId },
            });
        }

        return apiSuccess({ preferences: prefs });
    });
}

export async function PUT(req: NextRequest) {
    return withApiHandler('PUT /api/notifications/preferences', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const allowedFields = [
            'emailNotifications', 'smsNotifications', 'pushNotifications',
            'orderUpdates', 'promotions', 'vendorMessages',
        ];
        const updateData: Record<string, boolean> = {};
        for (const key of allowedFields) {
            if (typeof body[key] === 'boolean') updateData[key] = body[key];
        }

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...updateData },
            update: updateData,
        });

        return apiSuccess({ preferences: prefs });
    });
}
