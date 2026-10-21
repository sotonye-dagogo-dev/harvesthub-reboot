/**
 * GET /api/admin/subscriptions/[id]  — subscription detail.
 * PATCH /api/admin/subscriptions/[id] — admin remediation actions:
 *   { action: 'cancel' }  — cancel an ACTIVE subscription (idempotent).
 *   { action: 'restore' } — reactivate a CANCELLED subscription whose window
 *                           has not yet lapsed (idempotent).
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';

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
    return withApiHandler('GET /api/admin/subscriptions/[id]', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const { id } = await context.params;
        const subscription = await prisma.vendorSubscription
            .findUnique({
                where: { id },
                include: {
                    package: true,
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
            .catch(() => null);
        if (!subscription) {
            return apiError('Subscription not found', 404, { code: 'SUBSCRIPTION_NOT_FOUND' });
        }

        return apiSuccess({ subscription });
    });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    return withApiHandler('PATCH /api/admin/subscriptions/[id]', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(admin.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const body = await req.json().catch(() => null);
        const action = String((body as { action?: unknown } | null)?.action || '').toLowerCase();
        if (action !== 'cancel' && action !== 'restore') {
            return apiError("action must be 'cancel' or 'restore'", 400, { code: 'INVALID_ACTION' });
        }

        const subscription = await prisma.vendorSubscription
            .findUnique({ where: { id }, select: { id: true, status: true, expiresAt: true } })
            .catch(() => null);
        if (!subscription) {
            return apiError('Subscription not found', 404, { code: 'SUBSCRIPTION_NOT_FOUND' });
        }

        if (action === 'cancel') {
            if (subscription.status === 'CANCELLED') {
                return apiSuccess({ subscription, alreadyInState: true, message: 'Subscription already cancelled.' });
            }
            if (subscription.status !== 'ACTIVE') {
                return apiError(`Cannot cancel a ${subscription.status} subscription.`, 409, {
                    code: 'INVALID_STATE',
                });
            }
            const updated = await prisma.vendorSubscription.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            return apiSuccess({ subscription: updated, message: 'Subscription cancelled.' });
        }

        // restore
        if (subscription.status === 'ACTIVE') {
            return apiSuccess({ subscription, alreadyInState: true, message: 'Subscription already active.' });
        }
        if (subscription.expiresAt.getTime() <= Date.now()) {
            return apiError('Subscription window has already lapsed — ask the vendor to renew instead.', 409, {
                code: 'WINDOW_EXPIRED',
            });
        }
        const updated = await prisma.vendorSubscription.update({
            where: { id },
            data: { status: 'ACTIVE', expiredNotifiedAt: null },
        });
        return apiSuccess({ subscription: updated, message: 'Subscription restored.' });
    });
}
