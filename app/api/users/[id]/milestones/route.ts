/**
 * GET /api/users/[id]/milestones � User milestones
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const milestones = await prisma.userMilestone.findMany({
            where: { userId: id },
            orderBy: { achievedAt: 'desc' },
        });

        return NextResponse.json({ success: true, milestones });
    } catch (error) {
        console.error('GET /api/users/[id]/milestones error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
