/**
 * POST /api/reviews/[id]/vote � Vote on review helpfulness (upsert)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        const { isHelpful } = await req.json();
        if (typeof isHelpful !== 'boolean') {
            return NextResponse.json({ error: 'isHelpful (boolean) is required' }, { status: 400 });
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

        return NextResponse.json({ success: true, vote, helpfulCount, unhelpfulCount });
    } catch (error) {
        console.error('POST /api/reviews/[id]/vote error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
