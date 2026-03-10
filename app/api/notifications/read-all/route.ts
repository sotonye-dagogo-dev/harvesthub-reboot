/**
 * PUT /api/notifications/read-all — Mark all notifications as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { count } = await prisma.notification.updateMany({
            where: { userId: user.userId, isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true, message: `${count} notifications marked as read` });
    } catch (error) {
        console.error('PUT /api/notifications/read-all error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
