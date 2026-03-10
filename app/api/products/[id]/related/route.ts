/**
 * GET /api/products/[id]/related � Related products
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
        const product = await prisma.product.findUnique({ where: { id }, select: { category: true, vendorId: true, tags: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const related = await prisma.product.findMany({
            where: {
                id: { not: id },
                isActive: true,
                OR: [
                    { category: product.category },
                    { vendorId: product.vendorId },
                    { tags: { hasSome: product.tags } },
                ],
            },
            select: { id: true, name: true, price: true, compareAtPrice: true, discount: true, mainImage: true, averageRating: true, totalReviews: true, vendorId: true, category: true, listingType: true },
            orderBy: { sales: 'desc' },
            take: 12,
        });

        return NextResponse.json({ success: true, products: related });
    } catch (error) {
        console.error('GET /api/products/[id]/related error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
