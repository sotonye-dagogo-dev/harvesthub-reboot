/**
 * POST /api/push/unsubscribe — Remove push subscription
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { endpoint } = await req.json();
        if (!endpoint) {
            return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
        }

        const existing = await prisma.pushSubscription.findFirst({
            where: { endpoint, userId: user.userId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        await prisma.pushSubscription.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, message: 'Unsubscribed' });
    } catch (error) {
        console.error('POST /api/push/unsubscribe error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
