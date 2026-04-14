import { Prisma } from '@/prisma/generated/client';

type CommerceConfigClient = {
    commerceLifecycleConfig: Prisma.TransactionClient['commerceLifecycleConfig'];
};

const CONFIG_KEY = 'default';

const DEFAULT_CONFIG = {
    autoConfirmEnabled: true,
    autoConfirmHours: 48,
    refundWindowHours: 72,
} as const;

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
}

export type CommerceLifecycleConfigSnapshot = {
    autoConfirmEnabled: boolean;
    autoConfirmHours: number;
    refundWindowHours: number;
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
        },
    });

    return {
        autoConfirmEnabled: Boolean(record.autoConfirmEnabled),
        autoConfirmHours: clampInt(record.autoConfirmHours, DEFAULT_CONFIG.autoConfirmHours, 1, 240),
        refundWindowHours: clampInt(record.refundWindowHours, DEFAULT_CONFIG.refundWindowHours, 1, 720),
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
        },
        select: {
            autoConfirmEnabled: true,
            autoConfirmHours: true,
            refundWindowHours: true,
        },
    });

    return {
        autoConfirmEnabled: Boolean(updated.autoConfirmEnabled),
        autoConfirmHours: updated.autoConfirmHours,
        refundWindowHours: updated.refundWindowHours,
    };
}
