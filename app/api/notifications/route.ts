/**
 * GET /api/notifications — List user's notifications
 * POST /api/notifications — Create notification (internal)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/notifications', async () => {
        const user = await getCurrentUser();
        if (!user) {
            // Unauthenticated users should still receive a valid response
            // (prevents noisy 401 errors when the app checks notifications).
            return apiSuccess({ notifications: [], unreadCount: 0 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const where = { userId: user.userId, ...(unreadOnly ? { isRead: false } : {}) };

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
        ]);

        return apiSuccess({ notifications, unreadCount });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/notifications', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { userId, type, title, message, link, metadata } = body;

        if (!userId || !type || !title || !message) {
            return apiError('userId, type, title, and message are required', 400);
        }

        const notification = await prisma.notification.create({
            data: { userId, type, title, message, link, metadata },
        });

        return apiSuccess({ notification }, 201);
    });
}
