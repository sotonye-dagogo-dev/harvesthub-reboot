/**
 * GET /api/products/[id]/reviews � Product reviews
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { ReviewStatus } from '../../../../../prisma/generated/client';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
        const sort = searchParams.get('sort') || 'recent';

        const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const orderBy = sort === 'helpful' ? { helpfulCount: 'desc' as const } : { createdAt: 'desc' as const };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { productId: id, status: ReviewStatus.APPROVED },
                include: { buyer: { include: { user: { select: { firstName: true, lastName: true } } } }, votes: true },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where: { productId: id, status: ReviewStatus.APPROVED } }),
        ]);

        const ratingDist = await prisma.review.groupBy({
            by: ['rating'],
            where: { productId: id, status: ReviewStatus.APPROVED },
            _count: true,
        });

        return NextResponse.json({
            success: true,
            reviews,
            ratingDistribution: ratingDist,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/products/[id]/reviews error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
