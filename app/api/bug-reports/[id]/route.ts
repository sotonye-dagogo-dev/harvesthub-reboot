/**
 * GET   /api/bug-reports/[id] � Bug report detail (admin)
 * PATCH /api/bug-reports/[id] � Update status/notes (admin)
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
        const report = await prisma.bugReport.findUnique({
            where: { id },
        });
        if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

        // Manually join reporter info
        const reporter = report.userId
            ? await prisma.user.findUnique({
                where: { id: report.userId },
                select: { firstName: true, lastName: true, email: true },
            })
            : null;

        return NextResponse.json({ success: true, report: { ...report, reporter } });
    } catch (error) {
        console.error('GET /api/bug-reports/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const report = await prisma.bugReport.findUnique({ where: { id } });
        if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

        const body = await req.json();
        const data: Record<string, unknown> = {};
        if (body.status !== undefined) data.status = body.status;
        if (body.metadata !== undefined) data.metadata = body.metadata;

        const updated = await prisma.bugReport.update({ where: { id }, data });
        return NextResponse.json({ success: true, report: updated });
    } catch (error) {
        console.error('PATCH /api/bug-reports/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
