/**
 * PUT /api/admin/reviews/[id]/flag � Flag/unflag review (set ReviewStatus)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        const { status } = await req.json();
        const validStatuses = ['APPROVED', 'FLAGGED', 'HIDDEN', 'PENDING'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: `Status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const updated = await prisma.review.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ success: true, review: updated });
    } catch (error) {
        console.error('PUT /api/admin/reviews/[id]/flag error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
