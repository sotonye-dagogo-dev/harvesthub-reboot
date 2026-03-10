/**
 * GET /api/ads/my-ads — List authenticated user's ads
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const ads = await prisma.advertisement.findMany({
            where: { advertiserId: user.userId },
            include: { payments: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        console.error('GET /api/ads/my-ads error:', error);
        return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
    }
}
