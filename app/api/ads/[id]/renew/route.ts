/**
 * POST /api/ads/[id]/renew � Renew an expired ad
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const ad = await prisma.advertisement.findUnique({ where: { id } });
        if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

        if (ad.advertiserId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (ad.status !== 'EXPIRED') {
            return NextResponse.json({ error: 'Only expired ads can be renewed' }, { status: 400 });
        }

        const { durationDays } = await req.json();
        const days = durationDays ?? 30;

        const updated = await prisma.advertisement.update({
            where: { id },
            data: {
                status: 'PENDING_PAYMENT',
                startDate: new Date(),
                endDate: new Date(Date.now() + days * 86400000),
            },
        });

        return NextResponse.json({ success: true, ad: updated });
    } catch (error) {
        console.error('POST /api/ads/[id]/renew error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
