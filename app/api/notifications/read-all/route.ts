/**
 * PUT /api/notifications/read-all — Mark all notifications as read
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

async function handleMarkAllAsRead(_req: NextRequest) {
    return withApiHandler('POST /api/notifications/read-all', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { count } = await prisma.notification.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true },
        });

        return apiSuccess({ message: `${count} notifications marked as read` });
    });
}

export async function POST(req: NextRequest) {
    return handleMarkAllAsRead(req);
}

export async function PUT(req: NextRequest) {
    return handleMarkAllAsRead(req);
}

export async function PATCH(req: NextRequest) {
    return handleMarkAllAsRead(req);
}
