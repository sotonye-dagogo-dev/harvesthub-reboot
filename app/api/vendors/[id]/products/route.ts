/**
 * GET /api/vendors/[id]/products � List vendor's products
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const vendor = await prisma.vendor.findUnique({ where: { id } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
        const category = url.searchParams.get('category');
        const sort = url.searchParams.get('sort') ?? 'newest';
        const search = url.searchParams.get('search');

        const where: Record<string, unknown> = { vendorId: id, isActive: true };
        if (category) where.category = category;
        if (search) where.name = { contains: search, mode: 'insensitive' };

        const orderBy: Record<string, string> =
            sort === 'price_asc' ? { price: 'asc' } :
            sort === 'price_desc' ? { price: 'desc' } :
            sort === 'popular' ? { views: 'desc' } :
            { createdAt: 'desc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/vendors/[id]/products error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
