/**
 * GET   /api/bug-reports/[id] — Bug report detail (admin)
 * PATCH /api/bug-reports/[id] — Update status/notes (admin)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole, BugReportStatus } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/bug-reports/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const report = await prisma.bugReport.findUnique({
            where: { id },
        });
        if (!report) return apiError('Report not found', 404);

        // Manually join reporter info
        const reporter = report.userId
            ? await prisma.user.findUnique({
                where: { id: report.userId },
                select: { firstName: true, lastName: true, email: true },
            })
            : null;

        const metadata = (report.metadata as Record<string, unknown> | null) || {};
        return apiSuccess({
            report: {
                id: report.id,
                category: report.category.toUpperCase(),
                priority: report.severity.toUpperCase(),
                status: report.status.toUpperCase(),
                subject: report.title,
                details: report.description,
                email: typeof metadata.email === 'string' ? metadata.email : reporter?.email || '',
                userId: report.userId,
                screenshotUrl: report.screenshot || null,
                adminNotes: typeof metadata.adminNotes === 'string' ? metadata.adminNotes : null,
                resolvedAt: report.status.toUpperCase() === BugReportStatus.RESOLVED ? report.updatedAt : null,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                reporter,
            },
        });
    });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    return withApiHandler('PATCH /api/bug-reports/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const report = await prisma.bugReport.findUnique({ where: { id } });
        if (!report) return apiError('Report not found', 404);

        const body = await req.json();
        const data: Record<string, unknown> = {};
        const metadata = (report.metadata as Record<string, unknown> | null) || {};
        if (body.status !== undefined && typeof body.status === 'string') {
            data.status = body.status.toUpperCase();
        }
        if (body.adminNotes !== undefined) {
            data.metadata = { ...metadata, adminNotes: body.adminNotes };
        } else if (body.metadata !== undefined) {
            data.metadata = body.metadata;
        }

        const updated = await prisma.bugReport.update({ where: { id }, data });
        const updatedMetadata = (updated.metadata as Record<string, unknown> | null) || {};
        return apiSuccess({
            report: {
                id: updated.id,
                category: updated.category.toUpperCase(),
                priority: updated.severity.toUpperCase(),
                status: updated.status.toUpperCase(),
                subject: updated.title,
                details: updated.description,
                email: typeof updatedMetadata.email === 'string' ? updatedMetadata.email : '',
                userId: updated.userId,
                screenshotUrl: updated.screenshot || null,
                adminNotes: typeof updatedMetadata.adminNotes === 'string' ? updatedMetadata.adminNotes : null,
                resolvedAt: updated.status.toUpperCase() === BugReportStatus.RESOLVED ? updated.updatedAt : null,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
            },
        });
    });
}
