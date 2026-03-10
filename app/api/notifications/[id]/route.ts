/**
 * DELETE /api/notifications/[id] � Delete a notification
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function DELETE(req: NextRequest, context: RouteContext) {
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

        await prisma.notification.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('DELETE /api/notifications/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
