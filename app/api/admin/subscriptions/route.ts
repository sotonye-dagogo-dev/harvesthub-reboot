/**
 * GET /api/admin/subscriptions — Admin observability: subscribers, subscriptions
 * and payment records with aggregate stats. Filters: status, packageId, search
 * (email/store name), pagination.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';
import {
    getPaymentModelsConfig,
    getSubscriptionAdminStats,
} from '@/lib/services/subscriptions';

const STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/admin/subscriptions', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const params = req.nextUrl.searchParams;
        const statusRaw = (params.get('status') || '').toUpperCase();
        const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number])
            ? (statusRaw as (typeof STATUSES)[number])
            : undefined;
        const packageId = params.get('packageId') || undefined;
        const search = (params.get('search') || '').trim();
        const page = Math.max(1, Number(params.get('page')) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20));

        const where = {
            ...(status ? { status } : {}),
            ...(packageId ? { packageId } : {}),
            ...(search
                ? {
                      user: {
                          OR: [
                              { email: { contains: search, mode: 'insensitive' as const } },
                              { firstName: { contains: search, mode: 'insensitive' as const } },
                              { lastName: { contains: search, mode: 'insensitive' as const } },
                              { vendor: { storeName: { contains: search, mode: 'insensitive' as const } } },
                          ],
                      },
                  }
                : {}),
        };

        const [total, subscriptions, stats, config, packages] = await Promise.all([
            prisma.vendorSubscription.count({ where }).catch(() => 0),
            prisma.vendorSubscription
                .findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: {
                        package: { select: { id: true, name: true, slug: true, durationDays: true } },
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                vendor: { select: { id: true, storeName: true, status: true } },
                            },
                        },
                    },
                })
                .catch(() => []),
            getSubscriptionAdminStats(prisma),
            getPaymentModelsConfig(prisma),
            prisma.subscriptionPackage
                .findMany({
                    select: { id: true, name: true, slug: true, isActive: true },
                    orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
                })
                .catch(() => []),
        ]);

        return apiSuccess({
            subscriptions,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
            stats,
            config,
            packages,
        });
    });
}
