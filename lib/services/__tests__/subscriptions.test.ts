import { describe, expect, it, vi } from 'vitest';
import {
    DAY_MS,
    PAYMENT_MODELS_DEFAULTS,
    buildSubscriptionReference,
    checkSubscriptionEnforcement,
    computeDaysRemaining,
    getLatestSubscription,
    getPaymentModelsConfig,
    getSubscriptionAdminStats,
    getSubscriptionSummary,
    isSubscriptionEffective,
    resolveSubscriptionWindow,
    runSubscriptionSweep,
} from '@/lib/services/subscriptions';

const NOW = new Date('2026-10-21T12:00:00Z');

function daysFromNow(days: number): Date {
    return new Date(NOW.getTime() + days * DAY_MS);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTx(overrides: Record<string, unknown> = {}): any {
    return {
        commerceLifecycleConfig: {
            findUnique: vi.fn().mockResolvedValue(null),
        },
        vendorSubscription: {
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            count: vi.fn().mockResolvedValue(0),
            aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
        },
        subscriptionPackage: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
        },
        ...overrides,
    };
}

describe('resolveSubscriptionWindow', () => {
    it('starts from now when there is no effective subscription', () => {
        const window = resolveSubscriptionWindow(null, 30, NOW);
        expect(window.startAt.getTime()).toBe(NOW.getTime());
        expect(window.expiresAt.getTime()).toBe(NOW.getTime() + 30 * DAY_MS);
    });

    it('extends from the current expiry when it is still in the future (early renewal)', () => {
        const currentExpiry = daysFromNow(10);
        const window = resolveSubscriptionWindow(currentExpiry, 30, NOW);
        expect(window.startAt.getTime()).toBe(currentExpiry.getTime());
        expect(window.expiresAt.getTime()).toBe(currentExpiry.getTime() + 30 * DAY_MS);
    });

    it('never starts in the past when the current expiry has lapsed', () => {
        const lapsed = new Date(NOW.getTime() - 5 * DAY_MS);
        const window = resolveSubscriptionWindow(lapsed, 30, NOW);
        expect(window.startAt.getTime()).toBe(NOW.getTime());
        expect(window.expiresAt.getTime()).toBe(NOW.getTime() + 30 * DAY_MS);
    });

    it('falls back to the 30-day default for NaN and clamps negative durations to one day', () => {
        expect(resolveSubscriptionWindow(null, Number.NaN, NOW).expiresAt.getTime()).toBe(
            NOW.getTime() + 30 * DAY_MS
        );
        expect(resolveSubscriptionWindow(null, -3, NOW).expiresAt.getTime()).toBe(
            NOW.getTime() + DAY_MS
        );
    });
});

describe('isSubscriptionEffective + computeDaysRemaining', () => {
    it('is effective only for ACTIVE rows with a future window', () => {
        expect(isSubscriptionEffective(null, NOW)).toBe(false);
        expect(isSubscriptionEffective({ status: 'EXPIRED', expiresAt: daysFromNow(5) }, NOW)).toBe(false);
        expect(isSubscriptionEffective({ status: 'CANCELLED', expiresAt: daysFromNow(5) }, NOW)).toBe(false);
        expect(isSubscriptionEffective({ status: 'ACTIVE', expiresAt: daysFromNow(-1) }, NOW)).toBe(false);
        expect(isSubscriptionEffective({ status: 'ACTIVE', expiresAt: daysFromNow(1) }, NOW)).toBe(true);
    });

    it('floors day counts at zero', () => {
        expect(computeDaysRemaining(daysFromNow(2.2), NOW)).toBe(3);
        expect(computeDaysRemaining(daysFromNow(-2), NOW)).toBe(0);
    });
});

describe('getPaymentModelsConfig', () => {
    it('returns the safe defaults when no config row exists (commissions OFF, subs ON)', async () => {
        const config = await getPaymentModelsConfig(createTx());
        expect(config).toEqual(PAYMENT_MODELS_DEFAULTS);
        expect(config.vendorCommissionEnabled).toBe(false);
        expect(config.subscriptionEnabled).toBe(true);
        expect(config.subscriptionEnforcementLevel).toBe('WARN');
    });

    it('never throws when the config read fails (DB down)', async () => {
        const tx = createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockRejectedValue(new Error('db down')),
            },
        });
        const config = await getPaymentModelsConfig(tx);
        expect(config).toEqual(PAYMENT_MODELS_DEFAULTS);
    });

    it('normalizes invalid stored values (unknown level → WARN, clamped notice days)', async () => {
        const tx = createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue({
                    vendorCommissionEnabled: true,
                    subscriptionEnabled: false,
                    subscriptionExpiringNoticeDays: 999,
                    subscriptionEnforcementLevel: 'NUKE',
                }),
            },
        });
        const config = await getPaymentModelsConfig(tx);
        expect(config.vendorCommissionEnabled).toBe(true);
        expect(config.subscriptionEnabled).toBe(false);
        expect(config.subscriptionExpiringNoticeDays).toBe(30);
        expect(config.subscriptionEnforcementLevel).toBe('WARN');
    });
});

describe('getSubscriptionSummary', () => {
    function summaryTx(options: {
        config?: Record<string, unknown> | null;
        latest?: Record<string, unknown> | null;
    }) {
        return createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue(options.config ?? null),
            },
            vendorSubscription: {
                findFirst: vi.fn().mockResolvedValue(options.latest ?? null),
            },
        });
    }

    const activeRow = {
        id: 'sub-1',
        userId: 'user-1',
        packageId: 'pkg-1',
        status: 'ACTIVE',
        amount: 5000,
        startAt: NOW,
        expiresAt: daysFromNow(20),
        paymentMethod: 'CARD',
        paymentReference: 'SUB-123-abc',
        package: { id: 'pkg-1', name: 'Growth', slug: 'growth', durationDays: 30 },
    };

    it('reports NONE + BLOCK-gated when enabled and no subscription exists', async () => {
        const tx = summaryTx({
            config: {
                vendorCommissionEnabled: false,
                subscriptionEnabled: true,
                subscriptionExpiringNoticeDays: 3,
                subscriptionEnforcementLevel: 'BLOCK',
            },
        });
        const summary = await getSubscriptionSummary(tx, 'user-1', NOW);
        expect(summary.status).toBe('NONE');
        expect(summary.blocked).toBe(true);
        expect(summary.subscription).toBeNull();
    });

    it('reports ACTIVE with days remaining and no block', async () => {
        const tx = summaryTx({ latest: activeRow });
        const summary = await getSubscriptionSummary(tx, 'user-1', NOW);
        expect(summary.status).toBe('ACTIVE');
        expect(summary.daysRemaining).toBe(20);
        expect(summary.blocked).toBe(false);
        expect(summary.expiringSoon).toBe(false);
        expect(summary.subscription?.packageName).toBe('Growth');
    });

    it('flags expiringSoon within the notice window', async () => {
        const tx = summaryTx({
            config: {
                vendorCommissionEnabled: false,
                subscriptionEnabled: true,
                subscriptionExpiringNoticeDays: 3,
                subscriptionEnforcementLevel: 'WARN',
            },
            latest: { ...activeRow, expiresAt: daysFromNow(2) },
        });
        const summary = await getSubscriptionSummary(tx, 'user-1', NOW);
        expect(summary.status).toBe('ACTIVE');
        expect(summary.expiringSoon).toBe(true);
        expect(summary.daysRemaining).toBe(2);
    });

    it('treats a lapsed ACTIVE row as EXPIRED even before the cron flips it', async () => {
        const tx = summaryTx({
            latest: { ...activeRow, expiresAt: daysFromNow(-1) },
        });
        const summary = await getSubscriptionSummary(tx, 'user-1', NOW);
        expect(summary.status).toBe('EXPIRED');
        expect(summary.daysRemaining).toBe(0);
        expect(summary.blocked).toBe(false); // WARN default → never blocks
    });

    it('never throws when the subscription lookup fails', async () => {
        const tx = createTx({
            vendorSubscription: {
                findFirst: vi.fn().mockRejectedValue(new Error('db down')),
            },
        });
        const summary = await getSubscriptionSummary(tx, 'user-1', NOW);
        expect(summary.status).toBe('NONE');
    });
});

describe('checkSubscriptionEnforcement', () => {
    it('blocks only when enabled + BLOCK + no effective subscription', async () => {
        const tx = createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue({
                    vendorCommissionEnabled: false,
                    subscriptionEnabled: true,
                    subscriptionExpiringNoticeDays: 3,
                    subscriptionEnforcementLevel: 'BLOCK',
                }),
            },
        });
        const check = await checkSubscriptionEnforcement(tx, 'user-1', NOW);
        expect(check.allowed).toBe(false);
        expect(check.code).toBe('SUBSCRIPTION_REQUIRED');
        expect(check.message).toContain('subscription');
    });

    it('allows when enforcement is WARN (default) even with no subscription', async () => {
        const check = await checkSubscriptionEnforcement(createTx(), 'user-1', NOW);
        expect(check.allowed).toBe(true);
        expect(check.code).toBeNull();
    });

    it('allows when the subscription feature is disabled entirely', async () => {
        const tx = createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue({
                    vendorCommissionEnabled: false,
                    subscriptionEnabled: false,
                    subscriptionExpiringNoticeDays: 3,
                    subscriptionEnforcementLevel: 'BLOCK',
                }),
            },
        });
        const check = await checkSubscriptionEnforcement(tx, 'user-1', NOW);
        expect(check.allowed).toBe(true);
    });

    it('allows an actively-subscribed vendor under BLOCK', async () => {
        const tx = createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue({
                    vendorCommissionEnabled: false,
                    subscriptionEnabled: true,
                    subscriptionExpiringNoticeDays: 3,
                    subscriptionEnforcementLevel: 'BLOCK',
                }),
            },
            vendorSubscription: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 'sub-1',
                    userId: 'user-1',
                    packageId: 'pkg-1',
                    status: 'ACTIVE',
                    amount: 5000,
                    startAt: NOW,
                    expiresAt: daysFromNow(15),
                    paymentMethod: 'WALLET',
                    paymentReference: 'SUB-456-def',
                    package: { id: 'pkg-1', name: 'Starter', slug: 'starter', durationDays: 30 },
                }),
            },
        });
        const check = await checkSubscriptionEnforcement(tx, 'user-1', NOW);
        expect(check.allowed).toBe(true);
    });
});

describe('runSubscriptionSweep (cron idempotency)', () => {
    function sweepTx(options: {
        lapsed?: unknown[];
        expiring?: unknown[];
        noticeDays?: number;
        flipResults?: number[];
    }) {
        const flipResults = options.flipResults ?? [];
        let flipCall = 0;
        return createTx({
            commerceLifecycleConfig: {
                findUnique: vi.fn().mockResolvedValue({
                    subscriptionExpiringNoticeDays: options.noticeDays ?? 3,
                }),
            },
            vendorSubscription: {
                findMany: vi.fn().mockImplementation(async (args: any) => {
                    if (args?.where?.expiresAt?.lte) return options.lapsed ?? [];
                    return options.expiring ?? [];
                }),
                updateMany: vi
                    .fn()
                    .mockImplementation(async () => ({ count: flipResults[flipCall++] ?? 0 })),
            },
        });
    }

    const lapsedRow = {
        id: 'sub-lapsed',
        userId: 'user-1',
        expiresAt: daysFromNow(-1),
        package: { name: 'Growth' },
    };
    const expiringRow = {
        id: 'sub-expiring',
        userId: 'user-2',
        expiresAt: daysFromNow(2),
        package: { name: 'Starter' },
    };

    it('flips lapsed rows and arms one-time notices', async () => {
        const tx = sweepTx({ lapsed: [lapsedRow], expiring: [expiringRow], flipResults: [1, 1] });
        const result = await runSubscriptionSweep(tx, NOW);

        expect(result.expired).toHaveLength(1);
        expect(result.expired[0]).toMatchObject({
            subscriptionId: 'sub-lapsed',
            userId: 'user-1',
            packageName: 'Growth',
        });
        expect(result.expiringSoon).toHaveLength(1);
        expect(result.errors).toBe(0);

        // Lapsed flip: status EXPIRED + expiredNotifiedAt armed atomically
        expect(tx.vendorSubscription.updateMany).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                where: { id: 'sub-lapsed', status: 'ACTIVE', expiredNotifiedAt: null },
                data: expect.objectContaining({ status: 'EXPIRED' }),
            })
        );
    });

    it('produces no notices on replay when the atomic guards already fired', async () => {
        const tx = sweepTx({ lapsed: [lapsedRow], expiring: [expiringRow], flipResults: [0, 0] });
        const result = await runSubscriptionSweep(tx, NOW);

        expect(result.expired).toHaveLength(0);
        expect(result.expiringSoon).toHaveLength(0);
        expect(result.errors).toBe(0);
    });

    it('skips expiring notices when the notice window is 0', async () => {
        const tx = sweepTx({ noticeDays: 0, lapsed: [], expiring: [expiringRow] });
        const result = await runSubscriptionSweep(tx, NOW);
        expect(result.expiringSoon).toHaveLength(0);
    });

    it('tolerates per-row failures without aborting the sweep', async () => {
        const tx = sweepTx({ lapsed: [lapsedRow], expiring: [] });
        tx.vendorSubscription.updateMany = vi.fn().mockRejectedValue(new Error('write conflict'));
        const result = await runSubscriptionSweep(tx, NOW);
        expect(result.errors).toBeGreaterThan(0);
        expect(result.expired).toHaveLength(0);
    });
});

describe('getSubscriptionAdminStats', () => {
    it('falls back to zeroes when the aggregate queries fail', async () => {
        const tx = createTx({
            vendorSubscription: {
                count: vi.fn().mockRejectedValue(new Error('db down')),
            },
        });
        const stats = await getSubscriptionAdminStats(tx, NOW);
        expect(stats).toMatchObject({
            activeSubscriptions: 0,
            totalRevenue: 0,
            uniqueSubscribers: 0,
        });
    });
});

describe('buildSubscriptionReference', () => {
    it('uses the SUB- prefix and produces distinct references', () => {
        const first = buildSubscriptionReference();
        const second = buildSubscriptionReference();
        expect(first.startsWith('SUB-')).toBe(true);
        expect(second.startsWith('SUB-')).toBe(true);
        expect(first).not.toBe(second);
    });
});

describe('getLatestSubscription', () => {
    it('returns null on lookup failure instead of throwing', async () => {
        const tx = createTx({
            vendorSubscription: {
                findFirst: vi.fn().mockRejectedValue(new Error('db down')),
            },
        });
        await expect(getLatestSubscription(tx, 'user-1')).resolves.toBeNull();
    });
});
