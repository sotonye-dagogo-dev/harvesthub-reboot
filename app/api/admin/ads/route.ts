/**
 * GET /api/admin/ads — List all advertisements
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, AdStatus } from '../../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as AdStatus | null;
        const userId = searchParams.get('userId');

        const where: Prisma.AdvertisementWhereInput = {};
        if (status && Object.values(AdStatus).includes(status)) where.status = status;
        if (userId) where.advertiserId = userId;

        const ads = await prisma.advertisement.findMany({
            where,
            include: {
                advertiser: { select: { id: true, firstName: true, lastName: true, email: true } },
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        console.error('GET /api/admin/ads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
