/**
 * POST /api/push/subscribe — Store push subscription
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

        const { endpoint, keys } = await req.json();
        if (!endpoint || !keys) {
            return NextResponse.json({ error: 'endpoint and keys are required' }, { status: 400 });
        }

        // Upsert by endpoint to avoid duplicates
        const existing = await prisma.pushSubscription.findFirst({
            where: { endpoint, userId: user.userId },
        });

        let subscription;
        if (existing) {
            subscription = await prisma.pushSubscription.update({
                where: { id: existing.id },
                data: { keys, userId: user.userId },
            });
        } else {
            subscription = await prisma.pushSubscription.create({
                data: { endpoint, keys, userId: user.userId },
            });
        }

        return NextResponse.json({ success: true, subscription }, { status: 201 });
    } catch (error) {
        console.error('POST /api/push/subscribe error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
