/**
 * POST /api/reviews/[id]/flag � Flag a review for moderation
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

        const { reason } = await req.json();
        if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 });

        const updated = await prisma.review.update({
            where: { id },
            data: { isFlagged: true, status: 'PENDING' },
        });

        return NextResponse.json({ success: true, review: updated });
    } catch (error) {
        console.error('POST /api/reviews/[id]/flag error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
