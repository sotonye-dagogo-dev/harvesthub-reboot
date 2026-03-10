/**
 * PUT /api/notifications/[id]/read � Mark notification as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        if (notification.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true, notification: updated });
    } catch (error) {
        console.error('PUT /api/notifications/[id]/read error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
