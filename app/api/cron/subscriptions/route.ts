/**
 * GET|POST /api/cron/subscriptions — Idempotent subscription expiry sweep.
 *
 * Auth (checked in order):
 *  1. `Authorization: Bearer <secret>` matching the CRON_SECRET env var
 *     (Vercel cron convention — vercel.json crons invoke via GET) or the
 *     SUBSCRIPTION_CRON_SECRET env var.
 *  2. `x-subscription-cron-secret` header matching SUBSCRIPTION_CRON_SECRET.
 *  3. An ADMIN session (manual runs / ops tooling).
 *
 * Flips lapsed ACTIVE subscriptions to EXPIRED and dispatches one-time
 * expiring/expired notifications (deduped atomically by the service layer).
 * Safe to call repeatedly — replays produce no duplicate flips or notices.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';
import { dispatchNotification } from '@/lib/services/notifications';
import { runSubscriptionSweep } from '@/lib/services/subscriptions';

const BEARER_SECRET_ENVS = ['CRON_SECRET', 'SUBSCRIPTION_CRON_SECRET'] as const;

function bearerSecretMatches(req: NextRequest): boolean {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return false;
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) return false;
    for (const envName of BEARER_SECRET_ENVS) {
        const secret = process.env[envName];
        if (secret && token === secret) return true;
    }
    return false;
}

async function isAuthorizedSweepRequest(req: NextRequest): Promise<boolean> {
    if (bearerSecretMatches(req)) return true;

    const configuredSecret = process.env.SUBSCRIPTION_CRON_SECRET;
    const incomingSecret = req.headers.get('x-subscription-cron-secret');
    if (configuredSecret && incomingSecret && incomingSecret === configuredSecret) return true;

    const user = await getCurrentUser();
    return Boolean(user && user.role === UserRole.ADMIN);
}

async function handleSweep(req: NextRequest) {
    return withApiHandler('cron subscriptions sweep', async () => {
        if (!(await isAuthorizedSweepRequest(req))) return apiError('Unauthorized', 401);

        const sweep = await runSubscriptionSweep(prisma);

        const deliveries = [
            ...sweep.expired.map((notice) =>
                dispatchNotification({
                    userId: notice.userId,
                    type: 'SUBSCRIPTION_EXPIRED',
                    title: 'Subscription Expired',
                    message: `Your ${notice.packageName} subscription expired on ${new Date(notice.expiresAt).toDateString()}. Renew to restore full seller access.`,
                    link: '/packages',
                    emailSubject: `Your ${notice.packageName} subscription has expired`,
                    metadata: {
                        packageName: notice.packageName,
                        expiresAt: notice.expiresAt,
                        subscriptionId: notice.subscriptionId,
                    },
                })
            ),
            ...sweep.expiringSoon.map((notice) =>
                dispatchNotification({
                    userId: notice.userId,
                    type: 'SUBSCRIPTION_EXPIRING_SOON',
                    title: 'Subscription Expiring Soon',
                    message: `Your ${notice.packageName} subscription expires on ${new Date(notice.expiresAt).toDateString()}. Renew to stay active.`,
                    link: '/packages',
                    emailSubject: `Your ${notice.packageName} subscription expires soon`,
                    metadata: {
                        packageName: notice.packageName,
                        expiresAt: notice.expiresAt,
                        subscriptionId: notice.subscriptionId,
                    },
                })
            ),
        ];

        const settled = await Promise.allSettled(deliveries);

        return apiSuccess({
            expired: sweep.expired.length,
            expiringSoon: sweep.expiringSoon.length,
            sweepErrors: sweep.errors,
            notificationsDispatched: settled.filter((entry) => entry.status === 'fulfilled').length,
            notificationsFailed: settled.filter((entry) => entry.status === 'rejected').length,
        });
    });
}

/** Vercel cron entrypoint — vercel.json crons always invoke via GET. */
export async function GET(req: NextRequest) {
    return handleSweep(req);
}

/** Manual/ops + external-scheduler entrypoint (unchanged contract). */
export async function POST(req: NextRequest) {
    return handleSweep(req);
}
