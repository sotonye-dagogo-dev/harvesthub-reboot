/**
 * GET    /api/admin/milestones/[id] � Get milestone detail
 * DELETE /api/admin/milestones/[id] � Delete milestone
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
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const milestone = await prisma.userMilestone.findUnique({
            where: { id },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        });
        if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        return NextResponse.json({ success: true, milestone });
    } catch (error) {
        console.error('GET /api/admin/milestones/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const milestone = await prisma.userMilestone.findUnique({ where: { id } });
        if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        await prisma.userMilestone.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Milestone deleted' });
    } catch (error) {
        console.error('DELETE /api/admin/milestones/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
