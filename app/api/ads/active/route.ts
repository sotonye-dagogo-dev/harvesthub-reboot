/**
 * GET /api/ads/active — Public: return active ads for display rotation
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { AdStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const now = new Date();

        const activeAds = await prisma.advertisement.findMany({
            where: {
                status: AdStatus.ACTIVE,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            select: {
                id: true,
                title: true,
                subtitle: true,
                ctaText: true,
                ctaLink: true,
                imageUrl: true,
            },
        });

        // Batch increment impressions for returned ads
        if (activeAds.length > 0) {
            await prisma.advertisement.updateMany({
                where: { id: { in: activeAds.map((a) => a.id) } },
                data: { impressions: { increment: 1 } },
            });
        }

        return NextResponse.json({ success: true, ads: activeAds });
    } catch (error) {
        console.error('GET /api/ads/active error:', error);
        return NextResponse.json({ error: 'Failed to fetch active ads' }, { status: 500 });
    }
}
