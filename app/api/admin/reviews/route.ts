/**
 * GET /api/admin/reviews — List reviews for moderation
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, ReviewStatus } from '@/prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const flagged = searchParams.get('flagged') === 'true';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const where: Prisma.ReviewWhereInput = {};
        if (flagged) {
            where.status = ReviewStatus.PENDING;
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    buyer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                    product: { select: { id: true, name: true, vendor: { select: { id: true, storeName: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            reviews,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/admin/reviews error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
