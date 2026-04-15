import { NextRequest } from 'next/server';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import {
    getCommerceLifecycleConfig,
    upsertCommerceLifecycleConfig,
} from '@/lib/services/commerceConfig';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/admin/commerce-config', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const config = await getCommerceLifecycleConfig(prisma);

        return apiSuccess({ config });
    });
}

export async function PUT(req: NextRequest) {
    return withApiHandler('PUT /api/admin/commerce-config', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json().catch(() => ({}));

        const autoConfirmEnabled =
            typeof body.autoConfirmEnabled === 'boolean' ? body.autoConfirmEnabled : undefined;
        const autoConfirmHours =
            body.autoConfirmHours === undefined ? undefined : Number(body.autoConfirmHours);
        const refundWindowHours =
            body.refundWindowHours === undefined ? undefined : Number(body.refundWindowHours);
        const minOrderAmount =
            body.minOrderAmount === undefined ? undefined : Number(body.minOrderAmount);
        const maxBookingAdvanceDays =
            body.maxBookingAdvanceDays === undefined
                ? undefined
                : Number(body.maxBookingAdvanceDays);

        if (autoConfirmHours !== undefined && (!Number.isFinite(autoConfirmHours) || autoConfirmHours < 1 || autoConfirmHours > 240)) {
            return apiError('autoConfirmHours must be between 1 and 240', 400);
        }

        if (
            refundWindowHours !== undefined &&
            (!Number.isFinite(refundWindowHours) || refundWindowHours < 1 || refundWindowHours > 720)
        ) {
            return apiError('refundWindowHours must be between 1 and 720', 400);
        }

        if (
            minOrderAmount !== undefined &&
            (!Number.isFinite(minOrderAmount) || minOrderAmount < 0 || minOrderAmount > 10000000)
        ) {
            return apiError('minOrderAmount must be between 0 and 10,000,000', 400);
        }

        if (
            maxBookingAdvanceDays !== undefined &&
            (!Number.isFinite(maxBookingAdvanceDays) ||
                maxBookingAdvanceDays < 1 ||
                maxBookingAdvanceDays > 365)
        ) {
            return apiError('maxBookingAdvanceDays must be between 1 and 365', 400);
        }

        const config = await upsertCommerceLifecycleConfig(prisma, {
            autoConfirmEnabled,
            autoConfirmHours,
            refundWindowHours,
            minOrderAmount,
            maxBookingAdvanceDays,
        });

        return apiSuccess({ config });
    });
}
