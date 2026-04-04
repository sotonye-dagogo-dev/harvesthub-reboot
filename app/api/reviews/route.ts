/**
 * GET /api/reviews — List reviews with filters
 * POST /api/reviews — Create a review
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, ReviewStatus, OrderStatus } from '../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/reviews', async () => {
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

        const enriched = reviews.map((r: any) => ({
            ...r,
        }));

        return apiSuccess({
            reviews: enriched,
            averageRating: avgAgg._avg?.rating ?? 0,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/reviews', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.BUYER) return apiError('Buyers only', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { productId, orderId, rating, comment, images } = body;

        if (!productId || !rating) {
            return apiError('productId and rating are required', 400);
        }
        if (rating < 1 || rating > 5) {
            return apiError('Rating must be 1-5', 400);
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return apiError('Buyer not found', 404);

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return apiError('Product not found', 404);

        // Check for duplicate review
        const existing = await prisma.review.findFirst({
            where: { buyerId: buyer.id, productId },
        });
        if (existing) return apiError('You have already reviewed this product', 409);

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
            if (order && order.items.some((item: any) => item.productId === productId)) {
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

        return apiSuccess({ review }, 201);
    });
}
