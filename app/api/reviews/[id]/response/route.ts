/**
 * GET    /api/reviews/[id]/response � Get vendor response
 * POST   /api/reviews/[id]/response � Add vendor response
 * DELETE /api/reviews/[id]/response � Delete vendor response
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({
            where: { id },
            select: { id: true, vendorResponse: true, vendorRespondedAt: true },
        });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        return NextResponse.json({ success: true, response: review.vendorResponse, respondedAt: review.vendorRespondedAt });
    } catch (error) {
        console.error('GET /api/reviews/[id]/response error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { vendorId: true, vendor: { select: { userId: true } } } } } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        // Only the vendor who was reviewed can respond
        if (review.product.vendor.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { response } = await req.json();
        if (!response || typeof response !== 'string') {
            return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { vendorResponse: response, vendorRespondedAt: new Date() },
        });

        return NextResponse.json({ success: true, review: updated });
    } catch (error) {
        console.error('POST /api/reviews/[id]/response error:', error);
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
        const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { vendorId: true, vendor: { select: { userId: true } } } } } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        if (review.product.vendor.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { vendorResponse: null, vendorRespondedAt: null },
        });

        return NextResponse.json({ success: true, review: updated });
    } catch (error) {
        console.error('DELETE /api/reviews/[id]/response error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
