/**
 * GET    /api/admin/subscription-packages/[id] — package detail + recent subscribers.
 * PUT    /api/admin/subscription-packages/[id] — partial update.
 * DELETE /api/admin/subscription-packages/[id] — hard delete when unused, soft
 *         deactivation (isActive=false) when subscribers exist (never orphan history).
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';
import { subscriptionPackageSchema } from '../route';

interface RouteContext {
    params: Promise<{ id: string }>;
}

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) return null;
    if (user.role !== UserRole.ADMIN) return null;
    return user;
}

export async function GET(_req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/admin/subscription-packages/[id]', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const { id } = await context.params;

        const pkg = await prisma.subscriptionPackage
            .findUnique({
                where: { id },
                include: {
                    _count: { select: { subscriptions: true } },
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        include: {
                            user: { select: { email: true, firstName: true, lastName: true } },
                        },
                    },
                },
            })
            .catch(() => null);
        if (!pkg) return apiError('Subscription package not found', 404, { code: 'PACKAGE_NOT_FOUND' });

        return apiSuccess({ package: pkg });
    });
}

export async function PUT(req: NextRequest, context: RouteContext) {
    return withApiHandler('PUT /api/admin/subscription-packages/[id]', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const { id } = await context.params;

        const existing = await prisma.subscriptionPackage
            .findUnique({ where: { id }, select: { id: true, slug: true } })
            .catch(() => null);
        if (!existing) return apiError('Subscription package not found', 404, { code: 'PACKAGE_NOT_FOUND' });

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            return apiError('Request body must include at least one field to update', 400);
        }

        // Partial update: validate only the provided fields against the create schema.
        const partialSchema = subscriptionPackageSchema.partial();
        const parsed = partialSchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return apiError(first ? `${first.path.join('.')}: ${first.message}` : 'Invalid package payload', 400, {
                code: 'INVALID_PACKAGE',
                issues: parsed.error.issues,
            });
        }

        if (parsed.data.slug && parsed.data.slug !== existing.slug) {
            const duplicate = await prisma.subscriptionPackage
                .findUnique({ where: { slug: parsed.data.slug }, select: { id: true } })
                .catch(() => null);
            if (duplicate && duplicate.id !== id) {
                return apiError('A package with this slug already exists.', 409, { code: 'SLUG_TAKEN' });
            }
        }

        const updated = await prisma.subscriptionPackage.update({
            where: { id },
            data: {
                ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
                ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
                ...(parsed.data.description !== undefined ? { description: parsed.data.description ?? null } : {}),
                ...(parsed.data.price !== undefined
                    ? { price: Math.round(parsed.data.price * 100) / 100 }
                    : {}),
                ...(parsed.data.durationDays !== undefined ? { durationDays: parsed.data.durationDays } : {}),
                ...(parsed.data.features !== undefined ? { features: parsed.data.features } : {}),
                ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
                ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
                updatedBy: admin.userId,
            },
        });

        return apiSuccess({ package: updated });
    });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    return withApiHandler('DELETE /api/admin/subscription-packages/[id]', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const { id } = await context.params;

        const existing = await prisma.subscriptionPackage
            .findUnique({ where: { id }, select: { id: true, name: true } })
            .catch(() => null);
        if (!existing) return apiError('Subscription package not found', 404, { code: 'PACKAGE_NOT_FOUND' });

        const subscriberCount = await prisma.vendorSubscription
            .count({ where: { packageId: id } })
            .catch(() => 0);

        if (subscriberCount > 0) {
            // Subscribers exist — never orphan their history; deactivate instead.
            const deactivated = await prisma.subscriptionPackage.update({
                where: { id },
                data: { isActive: false, updatedBy: admin.userId },
            });
            return apiSuccess({
                package: deactivated,
                softDeleted: true,
                subscriberCount,
                message: `Package has ${subscriberCount} subscriber record(s) and was deactivated instead of deleted.`,
            });
        }

        await prisma.subscriptionPackage.delete({ where: { id } });
        return apiSuccess({ deleted: true, id });
    });
}
