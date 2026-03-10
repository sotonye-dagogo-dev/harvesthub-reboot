/**
 * GET /api/products/new-arrivals — Newest products
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const cacheKey = 'cache:products:new-arrivals';
        const cached = await cacheGet<unknown[]>(cacheKey);
        if (cached) return NextResponse.json({ success: true, products: cached, total: cached.length });

        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        await cacheSet(cacheKey, products, 300);
        return NextResponse.json({ success: true, products, total: products.length });
    } catch (error) {
        console.error('GET /api/products/new-arrivals error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
