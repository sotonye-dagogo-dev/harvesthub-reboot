/**
 * GET /api/products/trending — Popular products ranked by sales, rating, and recency
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { TRENDING_CONFIG } from '@/lib/config/trendingDeals';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const limit = Math.min(50, parseInt(new URL(req.url).searchParams.get('limit') || String(TRENDING_CONFIG.defaultLimit)));
        const cacheKey = `cache:products:trending:${limit}`;
        const cached = await cacheGet<unknown[]>(cacheKey);
        if (cached) return NextResponse.json({ success: true, products: cached });

        const newnessThreshold = new Date(Date.now() - TRENDING_CONFIG.newnessDays * 24 * 60 * 60 * 1000);

        // Fetch active products with relevant fields for composite scoring
        const rawProducts = await prisma.product.findMany({
            where: { isActive: true },
            include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
            orderBy: { sales: 'desc' },
            take: limit * 4, // over-fetch to allow score re-sorting
        });

        // Composite score: sales (weighted) + rating (weighted) + recency boost
        const maxSales = rawProducts.reduce((m, p) => Math.max(m, p.sales ?? 0), 1);
        const maxRating = 5;

        const scored = rawProducts.map((product) => {
            const salesScore = TRENDING_CONFIG.salesWeight * ((product.sales ?? 0) / maxSales);
            const ratingScore = TRENDING_CONFIG.ratingWeight * ((product.averageRating ?? 0) / maxRating);
            const isNew = product.createdAt >= newnessThreshold;
            const recencyScore = isNew ? TRENDING_CONFIG.recencyWeight : 0;
            return { product, score: salesScore + ratingScore + recencyScore };
        });

        scored.sort((a, b) => b.score - a.score);
        const products = scored.slice(0, limit).map((s) => s.product);

        await cacheSet(cacheKey, products, TRENDING_CONFIG.cacheTtlSeconds);
        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error('GET /api/products/trending error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
