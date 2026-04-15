import { Prisma } from '@/prisma/generated/client';
import { PLATFORM_DEFAULTS } from '@/lib/constants';

type CommerceConfigClient = {
    commerceLifecycleConfig: Prisma.TransactionClient['commerceLifecycleConfig'];
};

const CONFIG_KEY = 'default';

const DEFAULT_CONFIG = {
    autoConfirmEnabled: true,
    autoConfirmHours: 48,
    refundWindowHours: 72,
    withdrawalSettlementHoldHours: PLATFORM_DEFAULTS.WITHDRAWAL_SETTLEMENT_HOLD_HOURS,
    paymentsEnabled: PLATFORM_DEFAULTS.PAYMENTS_ENABLED,
    minOrderAmount: PLATFORM_DEFAULTS.MIN_ORDER_AMOUNT,
    maxBookingAdvanceDays: PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS,
} as const;

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
}

function clampFloat(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = Math.round(parsed * 100) / 100;
    return Math.min(max, Math.max(min, normalized));
}

export type CommerceLifecycleConfigSnapshot = {
    autoConfirmEnabled: boolean;
    autoConfirmHours: number;
    refundWindowHours: number;
    withdrawalSettlementHoldHours: number;
    paymentsEnabled: boolean;
    minOrderAmount: number;
    maxBookingAdvanceDays: number;
};

export async function getCommerceLifecycleConfig(
    tx: CommerceConfigClient
): Promise<CommerceLifecycleConfigSnapshot> {
    const record = await tx.commerceLifecycleConfig.upsert({
        where: { key: CONFIG_KEY },
        update: {},
        create: {
            key: CONFIG_KEY,
            ...DEFAULT_CONFIG,
        },
        select: {
            autoConfirmEnabled: true,
            autoConfirmHours: true,
            refundWindowHours: true,
            withdrawalSettlementHoldHours: true,
            paymentsEnabled: true,
            minOrderAmount: true,
            maxBookingAdvanceDays: true,
        },
    });

    return {
        autoConfirmEnabled: Boolean(record.autoConfirmEnabled),
        autoConfirmHours: clampInt(record.autoConfirmHours, DEFAULT_CONFIG.autoConfirmHours, 1, 240),
        refundWindowHours: clampInt(record.refundWindowHours, DEFAULT_CONFIG.refundWindowHours, 1, 720),
        withdrawalSettlementHoldHours: clampInt(
            record.withdrawalSettlementHoldHours,
            DEFAULT_CONFIG.withdrawalSettlementHoldHours,
            1,
            720
        ),
        paymentsEnabled: Boolean(record.paymentsEnabled),
        minOrderAmount: clampFloat(record.minOrderAmount, DEFAULT_CONFIG.minOrderAmount, 0, 10000000),
        maxBookingAdvanceDays: clampInt(
            record.maxBookingAdvanceDays,
            DEFAULT_CONFIG.maxBookingAdvanceDays,
            1,
            365
        ),
    };
}

export async function upsertCommerceLifecycleConfig(
    tx: CommerceConfigClient,
    payload: Partial<CommerceLifecycleConfigSnapshot>
): Promise<CommerceLifecycleConfigSnapshot> {
    const existing = await getCommerceLifecycleConfig(tx);

    const updated = await tx.commerceLifecycleConfig.upsert({
        where: { key: CONFIG_KEY },
        update: {
            autoConfirmEnabled:
                typeof payload.autoConfirmEnabled === 'boolean'
                    ? payload.autoConfirmEnabled
                    : existing.autoConfirmEnabled,
            autoConfirmHours: clampInt(
                payload.autoConfirmHours,
                existing.autoConfirmHours,
                1,
                240
            ),
            refundWindowHours: clampInt(
                payload.refundWindowHours,
                existing.refundWindowHours,
                1,
                720
            ),
            withdrawalSettlementHoldHours: clampInt(
                payload.withdrawalSettlementHoldHours,
                existing.withdrawalSettlementHoldHours,
                1,
                720
            ),
            paymentsEnabled:
                typeof payload.paymentsEnabled === 'boolean'
                    ? payload.paymentsEnabled
                    : existing.paymentsEnabled,
            minOrderAmount: clampFloat(
                payload.minOrderAmount,
                existing.minOrderAmount,
                0,
                10000000
            ),
            maxBookingAdvanceDays: clampInt(
                payload.maxBookingAdvanceDays,
                existing.maxBookingAdvanceDays,
                1,
                365
            ),
        },
        create: {
            key: CONFIG_KEY,
            autoConfirmEnabled:
                typeof payload.autoConfirmEnabled === 'boolean'
                    ? payload.autoConfirmEnabled
                    : existing.autoConfirmEnabled,
            autoConfirmHours: clampInt(
                payload.autoConfirmHours,
                existing.autoConfirmHours,
                1,
                240
            ),
            refundWindowHours: clampInt(
                payload.refundWindowHours,
                existing.refundWindowHours,
                1,
                720
            ),
            withdrawalSettlementHoldHours: clampInt(
                payload.withdrawalSettlementHoldHours,
                existing.withdrawalSettlementHoldHours,
                1,
                720
            ),
            paymentsEnabled:
                typeof payload.paymentsEnabled === 'boolean'
                    ? payload.paymentsEnabled
                    : existing.paymentsEnabled,
            minOrderAmount: clampFloat(
                payload.minOrderAmount,
                existing.minOrderAmount,
                0,
                10000000
            ),
            maxBookingAdvanceDays: clampInt(
                payload.maxBookingAdvanceDays,
                existing.maxBookingAdvanceDays,
                1,
                365
            ),
        },
        select: {
            autoConfirmEnabled: true,
            autoConfirmHours: true,
            refundWindowHours: true,
            withdrawalSettlementHoldHours: true,
            paymentsEnabled: true,
            minOrderAmount: true,
            maxBookingAdvanceDays: true,
        },
    });

    return {
        autoConfirmEnabled: Boolean(updated.autoConfirmEnabled),
        autoConfirmHours: clampInt(updated.autoConfirmHours, existing.autoConfirmHours, 1, 240),
        refundWindowHours: clampInt(updated.refundWindowHours, existing.refundWindowHours, 1, 720),
        withdrawalSettlementHoldHours: clampInt(
            updated.withdrawalSettlementHoldHours,
            existing.withdrawalSettlementHoldHours,
            1,
            720
        ),
        paymentsEnabled: Boolean(updated.paymentsEnabled),
        minOrderAmount: clampFloat(updated.minOrderAmount, existing.minOrderAmount, 0, 10000000),
        maxBookingAdvanceDays: clampInt(
            updated.maxBookingAdvanceDays,
            existing.maxBookingAdvanceDays,
            1,
            365
        ),
    };
}
