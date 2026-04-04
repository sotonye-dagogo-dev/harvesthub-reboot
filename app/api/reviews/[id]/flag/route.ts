/**
 * POST /api/reviews/[id]/flag � Flag a review for moderation
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, context: RouteContext) {
    return withApiHandler('POST /api/reviews/[id]/flag', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) return apiError('Review not found', 404);

        const { reason } = await req.json();
        if (!reason) return apiError('Reason is required', 400);

        const updated = await prisma.review.update({
            where: { id },
            data: { isFlagged: true, status: 'PENDING' },
        });

        return apiSuccess({ review: updated });
    });
}
