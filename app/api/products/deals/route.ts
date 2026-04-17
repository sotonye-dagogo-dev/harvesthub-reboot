/**
 * GET /api/products/deals — Active discounted products for home deals section
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { DEALS_CONFIG } from '@/lib/config/trendingDeals';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const limit = Math.min(50, parseInt(new URL(req.url).searchParams.get('limit') || String(DEALS_CONFIG.homePageLimit)));
        const cacheKey = `cache:products:deals:${limit}`;
        const cached = await cacheGet<unknown[]>(cacheKey);
        if (cached) return NextResponse.json({ success: true, products: cached });

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                discount: { gte: DEALS_CONFIG.minDiscountPercent },
            },
            include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
            orderBy: [{ discount: 'desc' }, { sales: 'desc' }],
            take: limit,
        });

        await cacheSet(cacheKey, products, DEALS_CONFIG.cacheTtlSeconds);
        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error('GET /api/products/deals error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
