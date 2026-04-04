/**
 * GET    /api/reviews/[id]/response � Get vendor response
 * POST   /api/reviews/[id]/response � Add vendor response
 * DELETE /api/reviews/[id]/response � Delete vendor response
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/reviews/[id]/response', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({
            where: { id },
            select: { id: true, vendorResponse: true, vendorRespondedAt: true },
        });
        if (!review) return apiError('Review not found', 404);

        return apiSuccess({ response: review.vendorResponse, respondedAt: review.vendorRespondedAt });
    });
}

export async function POST(req: NextRequest, context: RouteContext) {
    return withApiHandler('POST /api/reviews/[id]/response', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { vendorId: true, vendor: { select: { userId: true } } } } } });
        if (!review) return apiError('Review not found', 404);

        // Only the vendor who was reviewed can respond
        if (review.product.vendor.userId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        const { response } = await req.json();
        if (!response || typeof response !== 'string') {
            return apiError('Response text is required', 400);
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { vendorResponse: response, vendorRespondedAt: new Date() },
        });

        return apiSuccess({ review: updated });
    });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    return withApiHandler('DELETE /api/reviews/[id]/response', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { vendorId: true, vendor: { select: { userId: true } } } } } });
        if (!review) return apiError('Review not found', 404);

        if (review.product.vendor.userId !== user.userId) {
            return apiError('Forbidden', 403);
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { vendorResponse: null, vendorRespondedAt: null },
        });

        return apiSuccess({ review: updated });
    });
}
