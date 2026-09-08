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

        const ALLOWED_STATUSES = new Set(Object.values(BugReportStatus).map((v) => String(v).toUpperCase()));

        let nextRawStatus: string | null = null;
        if (body.status !== undefined) {
            if (typeof body.status !== 'string' || body.status.trim().length === 0) {
                return apiError('Invalid status', 400);
            }
            nextRawStatus = body.status.trim().toUpperCase();
            if (nextRawStatus === null || !ALLOWED_STATUSES.has(nextRawStatus)) {
                return apiError(`Invalid status. Allowed: ${Array.from(ALLOWED_STATUSES).join(', ')}`, 400);
            }
            data.status = nextRawStatus;
        }

        let nextAdminNotes: string | null = null;
        if (body.adminNotes !== undefined) {
            if (body.adminNotes !== null && typeof body.adminNotes !== 'string') {
                return apiError('adminNotes must be a string or null', 400);
            }
            const trimmed = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : null;
            // sanitize: limit to 2000 chars, strip control chars
            const sanitized = trimmed ? trimmed.slice(0, 2000).replace(/[\u0000-\u001F\u007F]/g, '') : trimmed;
            nextAdminNotes = sanitized && sanitized.length > 0 ? sanitized : null;
            data.metadata = { ...metadata, adminNotes: nextAdminNotes };
        } else if (body.metadata !== undefined) {
            // allow raw metadata only if it is an object; sanitize adminNotes inside
            if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
                const incoming = body.metadata as Record<string, unknown>;
                const incomingNotes = typeof incoming.adminNotes === 'string' ? incoming.adminNotes.trim().slice(0, 2000) : null;
                data.metadata = { ...metadata, ...incoming, ...(incomingNotes !== null ? { adminNotes: incomingNotes } : {}) };
                nextAdminNotes = typeof (data.metadata as Record<string, unknown>).adminNotes === 'string' ? String((data.metadata as Record<string, unknown>).adminNotes) : null;
            }
        }

        // If no change submitted, return current
        if (Object.keys(data).length === 0) {
            return apiError('No update fields provided', 400);
        }

        const updated = await prisma.bugReport.update({ where: { id }, data });
        const updatedMetadata = (updated.metadata as Record<string, unknown> | null) || {};

        // ── Automated email flow for status changes (non-blocking, tightened) ──
        const prevStatus = String(report.status).toUpperCase();
        const nextStatus = String(updated.status).toUpperCase();
        const statusChanged = prevStatus !== nextStatus;
        const adminNotesForEmail = typeof updatedMetadata.adminNotes === 'string' ? (updatedMetadata.adminNotes as string) : nextAdminNotes;

        if (statusChanged) {
          try {
            // Resolve reporter contact: prefer metadata.email, fallback to user row
            let reporterEmail: string | null = null;
            let reporterName: string | undefined = undefined;
            const metaEmail = typeof updatedMetadata.email === 'string' ? updatedMetadata.email.trim() : '';
            if (metaEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(metaEmail)) {
              reporterEmail = metaEmail.toLowerCase();
            }
            if (!reporterEmail && report.userId) {
              const dbUser = await prisma.user.findUnique({ where: { id: report.userId }, select: { email: true, firstName: true } }).catch(() => null);
              if (dbUser?.email) {
                reporterEmail = dbUser.email.trim().toLowerCase();
                reporterName = dbUser.firstName ?? undefined;
              }
            } else if (report.userId) {
              // if metaEmail was used, still try to get name
              const dbUser = await prisma.user.findUnique({ where: { id: report.userId }, select: { firstName: true } }).catch(() => null);
              reporterName = dbUser?.firstName ?? undefined;
            }
            // If unauthenticated reporter and no userId, try reporterName from metadata if present
            if (!reporterName && typeof (updatedMetadata as Record<string, unknown>).reporterName === 'string') {
              reporterName = String((updatedMetadata as Record<string, unknown>).reporterName);
            }

            if (reporterEmail) {
              if (nextStatus === BugReportStatus.RESOLVED) {
                const { sendBugResolvedEmail } = await import('@/lib/services/email');
                await sendBugResolvedEmail(reporterEmail, {
                  reporterName,
                  title: updated.title,
                  adminNotes: adminNotesForEmail,
                }).catch((e) => console.error('[bug-report] resolved email failed', e));
              } else {
                const { sendBugStatusUpdateEmail } = await import('@/lib/services/email');
                await sendBugStatusUpdateEmail(reporterEmail, {
                  reporterName,
                  title: updated.title,
                  prevStatus,
                  nextStatus,
                  adminNotes: adminNotesForEmail,
                }).catch((e) => console.error('[bug-report] status-update email failed', e));
              }
            } else {
              console.warn(`[bug-report] status ${prevStatus}→${nextStatus} for ${updated.id} has no reporter email — skipping email`);
            }
          } catch (e) {
            console.error('[bug-report] status email flow error', e);
          }
        }

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
