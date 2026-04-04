/**
 * DELETE /api/notifications/[id] � Delete a notification
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function DELETE(req: NextRequest, context: RouteContext) {
    return withApiHandler('DELETE /api/notifications/[id]', async () => {
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

        await prisma.notification.delete({ where: { id } });
        return apiSuccess({ message: 'Notification deleted' });
    });
}
