/**
 * GET  /api/bug-reports — List bug reports (admin) + stats
 * POST /api/bug-reports — Create bug report (auth optional)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
        const status = url.searchParams.get('status');
        const severity = url.searchParams.get('severity');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (severity) where.severity = severity;

        const [reports, total, stats] = await Promise.all([
            prisma.bugReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.bugReport.count({ where }),
            prisma.bugReport.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
        ]);

        // Manually join reporter info for reports that have userId
        const userIds = reports.map((r) => r.userId).filter((id): id is string => !!id);
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true, email: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        return NextResponse.json({
            success: true,
            reports: reports.map((r) => ({
                ...r,
                reporter: r.userId ? userMap.get(r.userId) ?? null : null,
            })),
            stats: (stats as Array<{ status: string; _count: { id: number } }>).reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/bug-reports error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const user = await getCurrentUser();
        const { title, description, category, severity, screenshot, metadata } = await req.json();

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
        }

        const report = await prisma.bugReport.create({
            data: {
                title,
                description,
                category: category ?? 'OTHER',
                severity: severity ?? 'MEDIUM',
                screenshot: screenshot ?? null,
                metadata: metadata ?? {},
                status: 'OPEN',
                userId: user?.userId ?? null,
            },
        });

        return NextResponse.json({ success: true, report }, { status: 201 });
    } catch (error) {
        console.error('POST /api/bug-reports error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
