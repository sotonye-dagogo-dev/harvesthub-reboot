/**
 * POST /api/reviews/[id]/vote � Vote on review helpfulness (upsert)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, context: RouteContext) {
    return withApiHandler('POST /api/reviews/[id]/vote', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) return apiError('Review not found', 404);

        const { isHelpful } = await req.json();
        if (typeof isHelpful !== 'boolean') {
            return apiError('isHelpful (boolean) is required', 400);
        }

        const vote = await prisma.reviewVote.upsert({
            where: { reviewId_userId: { reviewId: id, userId: user.userId } },
            update: { helpful: isHelpful },
            create: { reviewId: id, userId: user.userId, helpful: isHelpful },
        });

        // Return updated counts
        const [helpfulCount, unhelpfulCount] = await Promise.all([
            prisma.reviewVote.count({ where: { reviewId: id, helpful: true } }),
            prisma.reviewVote.count({ where: { reviewId: id, helpful: false } }),
        ]);

        return apiSuccess({ vote, helpfulCount, unhelpfulCount });
    });
}
