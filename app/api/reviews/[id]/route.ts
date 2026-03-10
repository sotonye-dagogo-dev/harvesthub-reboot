/**
 * GET    /api/reviews/[id] � Single review detail
 * PUT    /api/reviews/[id] � Update own review
 * DELETE /api/reviews/[id] � Delete own review (or admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
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
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('GET /api/reviews/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { buyer: true } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        if (review.buyer.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { rating, comment, images } = await req.json();
        const data: Record<string, unknown> = {};
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
            data.rating = rating;
        }
        if (comment !== undefined) data.comment = comment;
        if (images !== undefined) data.images = images;

        const updated = await prisma.review.update({ where: { id }, data });
        return NextResponse.json({ success: true, review: updated });
    } catch (error) {
        console.error('PUT /api/reviews/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { buyer: true } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        if (user.role !== UserRole.ADMIN && review.buyer.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.review.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('DELETE /api/reviews/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
