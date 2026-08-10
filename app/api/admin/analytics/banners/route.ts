/**
 * GET /api/admin/analytics/banners
 *
 * Admin-only banner/ad performance analytics. Returns summary KPIs (views,
 * clicks, conversions) plus a per-banner breakdown, all split by unique and
 * authenticated/anonymous counts.
 *
 * Query params:
 *   days     - look-back window in days (default 30, max 365)
 *   bannerId - optional single-banner filter
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { aggregateBannerAnalytics, type BannerAnalyticsEvent } from '@/lib/analytics/bannerAnalytics';

function parseDays(raw: string | null): number {
    const days = Number.parseInt(raw ?? '30', 10);
    if (!Number.isFinite(days)) return 30;
    return Math.min(365, Math.max(1, days));
}

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const days = parseDays(searchParams.get('days'));
        const bannerId = searchParams.get('bannerId');

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const bannerWhere = bannerId ? { id: bannerId } : {};

        const [banners, events] = await Promise.all([
            prisma.banner.findMany({
                where: bannerWhere,
                select: {
                    id: true,
                    title: true,
                    position: true,
                    isActive: true,
                    clickCount: true,
                    impressionCount: true,
                    conversionCount: true,
                    startDate: true,
                    endDate: true,
                },
                orderBy: [{ position: 'asc' }, { displayOrder: 'asc' }],
            }),
            prisma.bannerEvent.findMany({
                where: {
                    bannerId: bannerId ?? undefined,
                    occurredAt: { gte: since },
                },
                select: {
                    bannerId: true,
                    type: true,
                    userId: true,
                    visitorId: true,
                },
            }),
        ]);

        const aggregate = aggregateBannerAnalytics(
            events as BannerAnalyticsEvent[]
        );

        const metricsByBanner = new Map(
            aggregate.byBanner.map((row) => [row.bannerId, row])
        );

        const byBanner = banners.map((banner) => {
            const metrics = metricsByBanner.get(banner.id) ?? {
                bannerId: banner.id,
                impressions: 0,
                uniqueImpressions: 0,
                authenticatedImpressions: 0,
                anonymousImpressions: 0,
                clicks: 0,
                uniqueClicks: 0,
                authenticatedClicks: 0,
                anonymousClicks: 0,
                conversions: 0,
                uniqueConversions: 0,
                authenticatedConversions: 0,
                anonymousConversions: 0,
                clickThroughRate: 0,
                conversionRate: 0,
            };
            return { banner, metrics };
        });

        return NextResponse.json({
            success: true,
            data: {
                rangeDays: days,
                summary: aggregate.summary,
                byBanner,
            },
        });
    } catch (error) {
        console.error('GET /api/admin/analytics/banners error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
