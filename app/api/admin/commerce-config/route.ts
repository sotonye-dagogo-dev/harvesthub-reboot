import { NextRequest } from 'next/server';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { SubscriptionEnforcementLevel } from '../../../../prisma/generated/client';
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

/** Session 104 — payment models slice (commissions OFF default, subscriptions ON default). */
type PaymentModelsFields = {
    vendorCommissionEnabled: boolean;
    subscriptionEnabled: boolean;
    subscriptionExpiringNoticeDays: number;
    subscriptionEnforcementLevel: SubscriptionEnforcementLevel;
};

const SERVICE_HOUR_BOUNDS = { min: 1, max: 720 } as const;
const NOTICE_DAY_BOUNDS = { min: 0, max: 30 } as const;
const SUBSCRIPTION_ENFORCEMENT_LEVELS = ['NONE', 'WARN', 'BLOCK'] as const;

function clampServiceHours(value: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(SERVICE_HOUR_BOUNDS.max, Math.max(SERVICE_HOUR_BOUNDS.min, Math.round(value)));
}

function clampNoticeDays(value: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(NOTICE_DAY_BOUNDS.max, Math.max(NOTICE_DAY_BOUNDS.min, Math.round(value)));
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

async function getPaymentModelsFields(): Promise<PaymentModelsFields> {
    const row = await prisma.commerceLifecycleConfig.upsert({
        where: { key: 'default' },
        update: {},
        create: {},
        select: {
            vendorCommissionEnabled: true,
            subscriptionEnabled: true,
            subscriptionExpiringNoticeDays: true,
            subscriptionEnforcementLevel: true,
        },
    });

    return {
        vendorCommissionEnabled: Boolean(row.vendorCommissionEnabled),
        subscriptionEnabled: Boolean(row.subscriptionEnabled),
        subscriptionExpiringNoticeDays: clampNoticeDays(row.subscriptionExpiringNoticeDays, 3),
        subscriptionEnforcementLevel: SUBSCRIPTION_ENFORCEMENT_LEVELS.includes(
            row.subscriptionEnforcementLevel as (typeof SUBSCRIPTION_ENFORCEMENT_LEVELS)[number]
        )
            ? (row.subscriptionEnforcementLevel as SubscriptionEnforcementLevel)
            : ('WARN' as SubscriptionEnforcementLevel),
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
        const paymentModels = await getPaymentModelsFields();

        return apiSuccess({ config: { ...config, ...serviceFields, ...paymentModels } });
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

        // --- Payment models (Session 104): additive, partial-update semantics ---
        for (const field of ['vendorCommissionEnabled', 'subscriptionEnabled'] as const) {
            if (body[field] !== undefined && typeof body[field] !== 'boolean') {
                return apiError(`${field} must be a boolean`, 400);
            }
        }

        if (
            body.subscriptionExpiringNoticeDays !== undefined &&
            (!Number.isFinite(Number(body.subscriptionExpiringNoticeDays)) ||
                Number(body.subscriptionExpiringNoticeDays) < NOTICE_DAY_BOUNDS.min ||
                Number(body.subscriptionExpiringNoticeDays) > NOTICE_DAY_BOUNDS.max)
        ) {
            return apiError(
                `subscriptionExpiringNoticeDays must be between ${NOTICE_DAY_BOUNDS.min} and ${NOTICE_DAY_BOUNDS.max}`,
                400
            );
        }

        if (
            body.subscriptionEnforcementLevel !== undefined &&
            !SUBSCRIPTION_ENFORCEMENT_LEVELS.includes(
                String(body.subscriptionEnforcementLevel) as (typeof SUBSCRIPTION_ENFORCEMENT_LEVELS)[number]
            )
        ) {
            return apiError(
                `subscriptionEnforcementLevel must be one of ${SUBSCRIPTION_ENFORCEMENT_LEVELS.join(', ')}`,
                400
            );
        }

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

        const serviceFields: Partial<ServiceLifecycleFields> & Partial<PaymentModelsFields> = {
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
            ...(body.vendorCommissionEnabled !== undefined
                ? { vendorCommissionEnabled: body.vendorCommissionEnabled as boolean }
                : {}),
            ...(body.subscriptionEnabled !== undefined
                ? { subscriptionEnabled: body.subscriptionEnabled as boolean }
                : {}),
            ...(body.subscriptionExpiringNoticeDays !== undefined
                ? {
                      subscriptionExpiringNoticeDays: clampNoticeDays(
                          Number(body.subscriptionExpiringNoticeDays),
                          3
                      ),
                  }
                : {}),
            ...(body.subscriptionEnforcementLevel !== undefined
                ? {
                      subscriptionEnforcementLevel: String(
                          body.subscriptionEnforcementLevel
                      ) as SubscriptionEnforcementLevel,
                  }
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
        const paymentModels = await getPaymentModelsFields();

        return apiSuccess({ config: { ...config, ...serviceLifecycle, ...paymentModels } });
    });
}
