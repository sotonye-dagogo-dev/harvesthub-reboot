/**
 * GET /api/products/trending — Popular products by sales
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const limit = Math.min(50, parseInt(new URL(req.url).searchParams.get('limit') || '10'));
        const cacheKey = `cache:products:trending:${limit}`;
        const cached = await cacheGet<unknown[]>(cacheKey);
        if (cached) return NextResponse.json({ success: true, products: cached });

        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
            orderBy: { sales: 'desc' },
            take: limit,
        });

        await cacheSet(cacheKey, products, 300);
        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error('GET /api/products/trending error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
