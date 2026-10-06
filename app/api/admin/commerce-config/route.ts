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

type ServiceLifecycleFields = {
    serviceRequirementsTimeoutHours: number;
    serviceAutoApproveHours: number;
    serviceCountdownWarningHours: number;
    serviceSettlementCommissionEnabled: boolean;
};

const SERVICE_HOUR_BOUNDS = { min: 1, max: 720 } as const;

function clampServiceHours(value: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(SERVICE_HOUR_BOUNDS.max, Math.max(SERVICE_HOUR_BOUNDS.min, Math.round(value)));
}

async function getServiceLifecycleFields(): Promise<ServiceLifecycleFields> {
    const row = await prisma.commerceLifecycleConfig.upsert({
        where: { key: 'default' },
        update: {},
        create: {},
        select: {
            serviceRequirementsTimeoutHours: true,
            serviceAutoApproveHours: true,
            serviceCountdownWarningHours: true,
            serviceSettlementCommissionEnabled: true,
        },
    });

    return {
        serviceRequirementsTimeoutHours: clampServiceHours(
            row.serviceRequirementsTimeoutHours,
            48
        ),
        serviceAutoApproveHours: clampServiceHours(row.serviceAutoApproveHours, 72),
        serviceCountdownWarningHours: clampServiceHours(row.serviceCountdownWarningHours, 12),
        serviceSettlementCommissionEnabled: Boolean(row.serviceSettlementCommissionEnabled),
    };
}

function parseServiceHourField(body: Record<string, unknown>, field: string) {
    if (body[field] === undefined) return { value: undefined as number | undefined, error: null };
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < SERVICE_HOUR_BOUNDS.min || value > SERVICE_HOUR_BOUNDS.max) {
        return {
            value: undefined as number | undefined,
            error: `${field} must be between ${SERVICE_HOUR_BOUNDS.min} and ${SERVICE_HOUR_BOUNDS.max}`,
        };
    }
    return { value: Math.round(value), error: null };
}

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/admin/commerce-config', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const config = await getCommerceLifecycleConfig(prisma);
        const serviceFields = await getServiceLifecycleFields();

        return apiSuccess({ config: { ...config, ...serviceFields } });
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
        const withdrawalSettlementHoldHours =
            body.withdrawalSettlementHoldHours === undefined
                ? undefined
                : Number(body.withdrawalSettlementHoldHours);
        const minOrderAmount =
            body.minOrderAmount === undefined ? undefined : Number(body.minOrderAmount);
        const maxBookingAdvanceDays =
            body.maxBookingAdvanceDays === undefined
                ? undefined
                : Number(body.maxBookingAdvanceDays);

        const requirementsTimeout = parseServiceHourField(body, 'serviceRequirementsTimeoutHours');
        const autoApprove = parseServiceHourField(body, 'serviceAutoApproveHours');
        const countdownWarning = parseServiceHourField(body, 'serviceCountdownWarningHours');

        if (requirementsTimeout.error) return apiError(requirementsTimeout.error, 400);
        if (autoApprove.error) return apiError(autoApprove.error, 400);
        if (countdownWarning.error) return apiError(countdownWarning.error, 400);

        if (
            body.serviceSettlementCommissionEnabled !== undefined &&
            typeof body.serviceSettlementCommissionEnabled !== 'boolean'
        ) {
            return apiError('serviceSettlementCommissionEnabled must be a boolean', 400);
        }

        const serviceSettlementCommissionEnabled =
            body.serviceSettlementCommissionEnabled === undefined
                ? undefined
                : body.serviceSettlementCommissionEnabled;

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
            withdrawalSettlementHoldHours !== undefined &&
            (!Number.isFinite(withdrawalSettlementHoldHours) ||
                withdrawalSettlementHoldHours < 1 ||
                withdrawalSettlementHoldHours > 720)
        ) {
            return apiError('withdrawalSettlementHoldHours must be between 1 and 720', 400);
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
            withdrawalSettlementHoldHours,
            minOrderAmount,
            maxBookingAdvanceDays,
        });

        const serviceFields: Partial<ServiceLifecycleFields> = {
            ...(requirementsTimeout.value !== undefined
                ? { serviceRequirementsTimeoutHours: requirementsTimeout.value }
                : {}),
            ...(autoApprove.value !== undefined
                ? { serviceAutoApproveHours: autoApprove.value }
                : {}),
            ...(countdownWarning.value !== undefined
                ? { serviceCountdownWarningHours: countdownWarning.value }
                : {}),
            ...(serviceSettlementCommissionEnabled !== undefined
                ? { serviceSettlementCommissionEnabled }
                : {}),
        };

        if (Object.keys(serviceFields).length > 0) {
            await prisma.commerceLifecycleConfig.upsert({
                where: { key: 'default' },
                update: serviceFields,
                create: serviceFields,
            });
        }

        const serviceLifecycle = await getServiceLifecycleFields();

        return apiSuccess({ config: { ...config, ...serviceLifecycle } });
    });
}
