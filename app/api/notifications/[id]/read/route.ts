/**
 * PUT /api/notifications/[id]/read � Mark notification as read
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

async function handleMarkAsRead(_req: NextRequest, context: RouteContext) {
    return withApiHandler('PUT /api/notifications/[id]/read', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return apiError('Notification not found', 404);
        if (notification.userId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return apiSuccess({ notification: updated });
    });
}

export async function PUT(req: NextRequest, context: RouteContext) {
    return handleMarkAsRead(req, context);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    return handleMarkAsRead(req, context);
}
