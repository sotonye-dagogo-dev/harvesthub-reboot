/**
 * GET  /api/bug-reports — List bug reports (admin) + stats
 * POST /api/bug-reports — Create bug report (auth optional)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole, BugReportStatus } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

const STATUS_VALUES = new Set(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const PRIORITY_VALUES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const CATEGORY_VALUES = new Set(['UI_ISSUE', 'PAYMENT', 'ORDER', 'ACCOUNT', 'PERFORMANCE', 'OTHER']);

function normalizeStatus(input: unknown): string {
    const value = typeof input === 'string' ? input.toUpperCase() : '';
    return STATUS_VALUES.has(value) ? value : 'OPEN';
}

function normalizePriority(input: unknown): string {
    const value = typeof input === 'string' ? input.toUpperCase() : '';
    if (PRIORITY_VALUES.has(value)) return value;
    return 'MEDIUM';
}

function normalizeCategory(input: unknown): string {
    const value = typeof input === 'string' ? input.toUpperCase() : '';
    if (CATEGORY_VALUES.has(value)) return value;
    return 'OTHER';
}

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/bug-reports', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
        const status = url.searchParams.get('status');
        const category = url.searchParams.get('category');
        const priority = url.searchParams.get('priority') || url.searchParams.get('severity');

        const where: Record<string, unknown> = {};
        if (status && STATUS_VALUES.has(status.toUpperCase())) where.status = status.toUpperCase();
        if (category) where.category = normalizeCategory(category);
        if (priority) where.severity = normalizePriority(priority);

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
        const userIds = reports
            .map((r: { userId?: string | null }) => r.userId)
            .filter((id): id is string => !!id);
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true, email: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        return apiSuccess({
            reports: reports.map((r: any) => {
                const metadata = (r.metadata as Record<string, unknown> | null) || {};
                return {
                    id: r.id,
                    category: normalizeCategory(r.category),
                    priority: normalizePriority(r.severity),
                    status: normalizeStatus(r.status),
                    subject: r.title,
                    details: r.description,
                    email: typeof metadata.email === 'string' ? metadata.email : userMap.get(r.userId || '')?.email || '',
                    userId: r.userId,
                    screenshotUrl: r.screenshot || null,
                    adminNotes: typeof metadata.adminNotes === 'string' ? metadata.adminNotes : null,
                    resolvedAt: r.status?.toUpperCase() === BugReportStatus.RESOLVED ? r.updatedAt : null,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                    reporter: r.userId ? userMap.get(r.userId) ?? null : null,
                };
            }),
            stats: (() => {
                const normalizedStats = (stats as Array<{ status: string; _count: { id: number } }>).reduce<Record<string, number>>(
                    (acc, s) => {
                        acc[normalizeStatus(s.status)] = s._count.id;
                        return acc;
                    },
                    {}
                );
                return {
                    total,
                    open: normalizedStats.OPEN ?? 0,
                    inProgress: normalizedStats.IN_PROGRESS ?? 0,
                    resolved: normalizedStats.RESOLVED ?? 0,
                    closed: normalizedStats.CLOSED ?? 0,
                };
            })(),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/bug-reports', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const user = await getCurrentUser();
        const body = await req.json();
        const title = String(body.title || body.subject || '').trim();
        const description = String(body.description || body.details || '').trim();
        const category = normalizeCategory(body.category);
        const severity = normalizePriority(body.severity || body.priority);
        const screenshot = typeof body.screenshotUrl === 'string'
            ? body.screenshotUrl
            : typeof body.screenshot === 'string'
                ? body.screenshot
                : null;
        const screenshotPublicId = typeof body.screenshotPublicId === 'string'
            ? body.screenshotPublicId
            : undefined;
        const email =
            typeof body.email === 'string' && body.email.trim().length > 0
                ? body.email.trim().toLowerCase()
                : user?.email || '';
        const metadataInput = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

        if (!title || !description) {
            return apiError('Title and description are required', 400);
        }

        if (
            typeof screenshot === 'string' &&
            screenshot.length > 0 &&
            !screenshot.startsWith('https://res.cloudinary.com/')
        ) {
            return apiError('Screenshot must be uploaded through the managed Cloudinary upload flow.', 400);
        }

        const report = await prisma.bugReport.create({
            data: {
                title,
                description,
                category,
                severity,
                screenshot: screenshot ?? null,
                metadata: {
                    ...(metadataInput as Record<string, unknown>),
                    email,
                    ...(screenshotPublicId ? { screenshotPublicId } : {}),
                },
                status: BugReportStatus.OPEN,
                userId: user?.userId ?? null,
            },
        });

        return apiSuccess({
            report: {
                id: report.id,
                category,
                priority: severity,
                status: normalizeStatus(report.status),
                subject: report.title,
                details: report.description,
                email,
                userId: report.userId,
                screenshotUrl: report.screenshot,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
            },
        }, 201);
    });
}
