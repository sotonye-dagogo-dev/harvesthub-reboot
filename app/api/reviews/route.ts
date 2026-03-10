/**
 * GET /api/reviews — List reviews with filters
 * POST /api/reviews — Create a review
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, ReviewStatus, OrderStatus } from '../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const productId = searchParams.get('productId');
        const vendorId = searchParams.get('vendorId');
        const rating = searchParams.get('rating');

        const where: Prisma.ReviewWhereInput = { status: ReviewStatus.APPROVED };
        if (productId) where.productId = productId;
        if (vendorId) where.product = { vendorId };
        if (rating) where.rating = parseInt(rating);

        const [reviews, total, avgAgg] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    buyer: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
            prisma.review.aggregate({ where: { ...where, rating: undefined }, _avg: { rating: true } }),
        ]);

        const enriched = reviews.map((r) => ({
            ...r,
        }));

        return NextResponse.json({
            success: true,
            reviews: enriched,
            averageRating: avgAgg._avg?.rating ?? 0,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/reviews error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Buyers only' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { productId, orderId, rating, comment, images } = body;

        if (!productId || !rating) {
            return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 });
        }
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Check for duplicate review
        const existing = await prisma.review.findFirst({
            where: { buyerId: buyer.id, productId },
        });
        if (existing) return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });

        // Verify purchase
        let verifiedPurchase = false;
        if (orderId) {
            const order = await prisma.order.findFirst({
                where: {
                    id: orderId,
                    buyerId: buyer.id,
                    status: { in: [OrderStatus.DELIVERED] },
                },
                include: { items: true },
            });
            if (order && order.items.some((item) => item.productId === productId)) {
                verifiedPurchase = true;
            }
        }

        const review = await prisma.review.create({
            data: {
                productId,
                buyerId: buyer.id,
                orderId: orderId || productId,
                rating,
                comment: comment || '',
                images: images || [],
                isVerifiedPurchase: verifiedPurchase,
                status: ReviewStatus.APPROVED,
            },
            include: {
                buyer: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
            },
        });

        // Update product rating
        const ratingAgg = await prisma.review.aggregate({
            where: { productId, status: ReviewStatus.APPROVED },
            _avg: { rating: true },
            _count: true,
        });
        await prisma.product.update({
            where: { id: productId },
            data: { averageRating: ratingAgg._avg.rating ?? 0, totalReviews: ratingAgg._count },
        });

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (error) {
        console.error('POST /api/reviews error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
