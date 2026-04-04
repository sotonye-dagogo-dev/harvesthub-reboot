/**
 * GET    /api/reviews/[id] � Single review detail
 * PUT    /api/reviews/[id] � Update own review
 * DELETE /api/reviews/[id] � Delete own review (or admin)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/reviews/[id]', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                buyer: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
                product: { select: { id: true, name: true, images: true } },
                votes: true,
            },
        });
        if (!review) return apiError('Review not found', 404);

        return apiSuccess({ review });
    });
}

export async function PUT(req: NextRequest, context: RouteContext) {
    return withApiHandler('PUT /api/reviews/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { buyer: true } });
        if (!review) return apiError('Review not found', 404);

        if (review.buyer.userId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        const { rating, comment, images } = await req.json();
        const data: Record<string, unknown> = {};
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) return apiError('Rating must be 1-5', 400);
            data.rating = rating;
        }
        if (comment !== undefined) data.comment = comment;
        if (images !== undefined) data.images = images;

        const updated = await prisma.review.update({ where: { id }, data });
        return apiSuccess({ review: updated });
    });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    return withApiHandler('DELETE /api/reviews/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { buyer: true } });
        if (!review) return apiError('Review not found', 404);

        if (user.role !== UserRole.ADMIN && review.buyer.userId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        await prisma.review.delete({ where: { id } });
        return apiSuccess({ message: 'Review deleted' });
    });
}
