/**
 * GET /api/notifications — List user's notifications
 * POST /api/notifications — Create notification (internal)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

        return NextResponse.json({ success: true, notifications, unreadCount });
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { userId, type, title, message, link, metadata } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json({ error: 'userId, type, title, and message are required' }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: { userId, type, title, message, link, metadata },
        });

        return NextResponse.json({ success: true, notification }, { status: 201 });
    } catch (error) {
        console.error('POST /api/notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
