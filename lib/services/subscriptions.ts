import { Prisma } from '@/prisma/generated/client';

/**
 * Vendor subscription engine (Session 104 — payment models).
 *
 * Design rules:
 * - Config-driven: everything reads CommerceLifecycleConfig with safe defaults
 *   (subscriptions ON, commissions OFF, WARN enforcement) and NEVER throws on
 *   config read failure — degraded reads fall back to defaults.
 * - Expiry semantics: a subscription is effective while `expiresAt > now`,
 *   regardless of whether the cron has flipped `status` yet (cron keeps the
 *   stored status + notification bookkeeping in sync, reads never depend on it).
 * - Renewal/upgrade semantics: every purchase is a new VendorSubscription row;
 *   the new window starts at `max(now, previousActiveExpiresAt)` so early
 *   renewals never lose paid time.
 */

type SubscriptionDbClient = {
    commerceLifecycleConfig: Prisma.TransactionClient['commerceLifecycleConfig'];
    vendorSubscription: Prisma.TransactionClient['vendorSubscription'];
    subscriptionPackage: Prisma.TransactionClient['subscriptionPackage'];
};

export const SUBSCRIPTION_CONFIG_KEY = 'default';
export const SUBSCRIPTION_REFERENCE_PREFIX = 'SUB-';

export const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionEnforcementLevelValue = 'NONE' | 'WARN' | 'BLOCK';

export type PaymentModelsConfig = {
    vendorCommissionEnabled: boolean;
    subscriptionEnabled: boolean;
    subscriptionExpiringNoticeDays: number;
    subscriptionEnforcementLevel: SubscriptionEnforcementLevelValue;
};

/** Client-stated defaults: commissions OFF, subscription packages ON. */
export const PAYMENT_MODELS_DEFAULTS: PaymentModelsConfig = {
    vendorCommissionEnabled: false,
    subscriptionEnabled: true,
    subscriptionExpiringNoticeDays: 3,
    subscriptionEnforcementLevel: 'WARN',
};

const ENFORCEMENT_LEVELS: SubscriptionEnforcementLevelValue[] = ['NONE', 'WARN', 'BLOCK'];

function normalizeEnforcementLevel(value: unknown): SubscriptionEnforcementLevelValue {
    return ENFORCEMENT_LEVELS.includes(value as SubscriptionEnforcementLevelValue)
        ? (value as SubscriptionEnforcementLevelValue)
        : PAYMENT_MODELS_DEFAULTS.subscriptionEnforcementLevel;
}

function clampNoticeDays(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return PAYMENT_MODELS_DEFAULTS.subscriptionExpiringNoticeDays;
    return Math.min(30, Math.max(0, Math.round(parsed)));
}

export function buildSubscriptionReference(): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${SUBSCRIPTION_REFERENCE_PREFIX}${Date.now()}-${random}`;
}

/**
 * Read the payment-models slice of CommerceLifecycleConfig.
 * Never throws: any failure (table missing, DB down) yields the safe defaults.
 */
export async function getPaymentModelsConfig(tx: Pick<SubscriptionDbClient, 'commerceLifecycleConfig'>): Promise<PaymentModelsConfig> {
    try {
        const record = await tx.commerceLifecycleConfig.findUnique({
            where: { key: SUBSCRIPTION_CONFIG_KEY },
            select: {
                vendorCommissionEnabled: true,
                subscriptionEnabled: true,
                subscriptionExpiringNoticeDays: true,
                subscriptionEnforcementLevel: true,
            },
        });
        if (!record) return { ...PAYMENT_MODELS_DEFAULTS };
        return {
            vendorCommissionEnabled: Boolean(record.vendorCommissionEnabled),
            subscriptionEnabled: Boolean(record.subscriptionEnabled),
            subscriptionExpiringNoticeDays: clampNoticeDays(record.subscriptionExpiringNoticeDays),
            subscriptionEnforcementLevel: normalizeEnforcementLevel(record.subscriptionEnforcementLevel),
        };
    } catch {
        return { ...PAYMENT_MODELS_DEFAULTS };
    }
}

export type ActiveSubscriptionRow = {
    id: string;
    userId: string;
    packageId: string;
    status: string;
    amount: number;
    startAt: Date;
    expiresAt: Date;
    paymentMethod: string;
    paymentReference: string;
    package: {
        id: string;
        name: string;
        slug: string;
        durationDays: number;
    };
};

/**
 * Latest effective (non-cancelled) subscription for a user, or null.
 * An `ACTIVE` row whose window has lapsed is still returned (status computed
 * by callers via `isSubscriptionEffective`) so expiry handling stays consistent.
 */
export async function getLatestSubscription(
    tx: Pick<SubscriptionDbClient, 'vendorSubscription'>,
    userId: string
): Promise<ActiveSubscriptionRow | null> {
    try {
        const row = await tx.vendorSubscription.findFirst({
            where: { userId, status: { in: ['ACTIVE', 'EXPIRED'] } },
            orderBy: { createdAt: 'desc' },
            include: {
                package: { select: { id: true, name: true, slug: true, durationDays: true } },
            },
        });
        return row as ActiveSubscriptionRow | null;
    } catch {
        return null;
    }
}

export function isSubscriptionEffective(subscription: { status: string; expiresAt: Date } | null, now: Date = new Date()): boolean {
    if (!subscription) return false;
    if (subscription.status !== 'ACTIVE') return false;
    return subscription.expiresAt.getTime() > now.getTime();
}

export function computeDaysRemaining(expiresAt: Date, now: Date = new Date()): number {
    return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));
}

/**
 * Purchase/renewal window: extends from max(now, current effective expiry)
 * so early renewals add the full package duration on top of remaining time.
 */
export function resolveSubscriptionWindow(
    currentExpiresAt: Date | null,
    durationDays: number,
    now: Date = new Date()
): { startAt: Date; expiresAt: Date } {
    const safeDuration = Math.max(1, Math.round(Number.isFinite(durationDays) ? durationDays : 30));
    const currentMs = currentExpiresAt ? currentExpiresAt.getTime() : 0;
    const startMs = Math.max(now.getTime(), currentMs);
    return {
        startAt: new Date(startMs),
        expiresAt: new Date(startMs + safeDuration * DAY_MS),
    };
}

export type SubscriptionSummary = {
    enabled: boolean;
    enforcementLevel: SubscriptionEnforcementLevelValue;
    /** NONE = no effective subscription, ACTIVE = paying now, EXPIRED = lapsed */
    status: 'NONE' | 'ACTIVE' | 'EXPIRED';
    subscription: {
        id: string;
        packageId: string;
        packageName: string;
        packageSlug: string;
        amount: number;
        paymentMethod: string;
        startAt: string;
        expiresAt: string;
    } | null;
    daysRemaining: number | null;
    expiringSoon: boolean;
    /** True when enforcement BLOCK would refuse new selling actions. */
    blocked: boolean;
};

/**
 * Full subscription summary for a user (vendor surfaces + enforcement checks).
 * Never throws.
 */
export async function getSubscriptionSummary(
    tx: Pick<SubscriptionDbClient, 'commerceLifecycleConfig' | 'vendorSubscription'>,
    userId: string,
    now: Date = new Date()
): Promise<SubscriptionSummary> {
    const config = await getPaymentModelsConfig(tx);
    const latest = await getLatestSubscription(tx, userId);

    if (!latest) {
        return {
            enabled: config.subscriptionEnabled,
            enforcementLevel: config.subscriptionEnforcementLevel,
            status: 'NONE',
            subscription: null,
            daysRemaining: null,
            expiringSoon: false,
            blocked: config.subscriptionEnabled && config.subscriptionEnforcementLevel === 'BLOCK',
        };
    }

    const effective = isSubscriptionEffective(latest, now);
    const daysRemaining = effective ? computeDaysRemaining(latest.expiresAt, now) : 0;
    const expiringSoon =
        effective && daysRemaining <= config.subscriptionExpiringNoticeDays;

    return {
        enabled: config.subscriptionEnabled,
        enforcementLevel: config.subscriptionEnforcementLevel,
        status: effective ? 'ACTIVE' : 'EXPIRED',
        subscription: {
            id: latest.id,
            packageId: latest.packageId,
            packageName: latest.package.name,
            packageSlug: latest.package.slug,
            amount: latest.amount,
            paymentMethod: latest.paymentMethod,
            startAt: latest.startAt.toISOString(),
            expiresAt: latest.expiresAt.toISOString(),
        },
        daysRemaining,
        expiringSoon,
        blocked: config.subscriptionEnabled && config.subscriptionEnforcementLevel === 'BLOCK' && !effective,
    };
}

export type SubscriptionSweepNotices = {
    subscriptionId: string;
    userId: string;
    packageName: string;
    expiresAt: string;
};

export type SubscriptionSweepResult = {
    expired: SubscriptionSweepNotices[];
    expiringSoon: SubscriptionSweepNotices[];
    errors: number;
};

/**
 * Idempotent expiry sweep (cron). Flips lapsed ACTIVE rows to EXPIRED and
 * arms one-time expiring/expired notices via atomic `expiringNotifiedAt` /
 * `expiredNotifiedAt` guards (updateMany where-null → only rows that flipped
 * produce a notice, so replays never double-notify).
 *
 * Returns the notices to deliver; dispatching stays the caller's job so this
 * service remains independent of the notification pipeline.
 */
export async function runSubscriptionSweep(
    tx: Pick<SubscriptionDbClient, 'vendorSubscription' | 'subscriptionPackage' | 'commerceLifecycleConfig'>,
    now: Date = new Date()
): Promise<SubscriptionSweepResult> {
    const result: SubscriptionSweepResult = { expired: [], expiringSoon: [], errors: 0 };
    const config = await getPaymentModelsConfig(tx);
    const noticeDays = config.subscriptionExpiringNoticeDays;

    const noticeWindowEnd = new Date(now.getTime() + noticeDays * DAY_MS);

    try {
        const lapsed = await tx.vendorSubscription.findMany({
            where: { status: 'ACTIVE', expiresAt: { lte: now } },
            include: { package: { select: { name: true } } },
            take: 500,
        });
        for (const row of lapsed) {
            try {
                const flipped = await tx.vendorSubscription.updateMany({
                    where: { id: row.id, status: 'ACTIVE', expiredNotifiedAt: null },
                    data: { status: 'EXPIRED', expiredNotifiedAt: now },
                });
                if (flipped.count === 1) {
                    result.expired.push({
                        subscriptionId: row.id,
                        userId: row.userId,
                        packageName: row.package.name,
                        expiresAt: row.expiresAt.toISOString(),
                    });
                }
            } catch {
                result.errors += 1;
            }
        }
    } catch {
        result.errors += 1;
    }

    if (noticeDays > 0) {
        try {
            const expiring = await tx.vendorSubscription.findMany({
                where: {
                    status: 'ACTIVE',
                    expiresAt: { gt: now, lte: noticeWindowEnd },
                    expiringNotifiedAt: null,
                },
                include: { package: { select: { name: true } } },
                take: 500,
            });
            for (const row of expiring) {
                try {
                    const armed = await tx.vendorSubscription.updateMany({
                        where: { id: row.id, status: 'ACTIVE', expiringNotifiedAt: null },
                        data: { expiringNotifiedAt: now },
                    });
                    if (armed.count === 1) {
                        result.expiringSoon.push({
                            subscriptionId: row.id,
                            userId: row.userId,
                            packageName: row.package.name,
                            expiresAt: row.expiresAt.toISOString(),
                        });
                    }
                } catch {
                    result.errors += 1;
                }
            }
        } catch {
            result.errors += 1;
        }
    }

    return result;
}

export type SubscriptionEnforcementCheck = {
    /** True when the action may proceed (subscriptions disabled, WARN/NONE level, or active subscription). */
    allowed: boolean;
    code: 'SUBSCRIPTION_REQUIRED' | null;
    message: string | null;
    summary: SubscriptionSummary;
};

/**
 * Enforcement gate for selling actions (product create, service publish).
 * Only ever blocks when the platform toggle is ON AND the level is BLOCK AND
 * the user has no effective subscription — WARN/NONE always allow.
 * Never throws.
 */
export async function checkSubscriptionEnforcement(
    tx: Pick<SubscriptionDbClient, 'commerceLifecycleConfig' | 'vendorSubscription'>,
    userId: string,
    now: Date = new Date()
): Promise<SubscriptionEnforcementCheck> {
    const summary = await getSubscriptionSummary(tx, userId, now);
    if (!summary.blocked) {
        return { allowed: true, code: null, message: null, summary };
    }
    const message = summary.subscription
        ? `Your ${summary.subscription.packageName} subscription has lapsed. Renew or choose another package to continue publishing listings.`
        : 'An active vendor subscription is required to publish listings. Choose a package on the Packages page to continue.';
    return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message,
        summary,
    };
}

export type SubscriptionAdminStats = {
    activeSubscriptions: number;
    expiringSoon: number;
    expiredSubscriptions: number;
    totalSubscriptions: number;
    uniqueSubscribers: number;
    totalRevenue: number;
    activePackages: number;
};

/** Admin observability aggregates. Never throws (falls back to zeroes). */
export async function getSubscriptionAdminStats(
    tx: Pick<SubscriptionDbClient, 'vendorSubscription' | 'subscriptionPackage' | 'commerceLifecycleConfig'>,
    now: Date = new Date()
): Promise<SubscriptionAdminStats> {
    const empty: SubscriptionAdminStats = {
        activeSubscriptions: 0,
        expiringSoon: 0,
        expiredSubscriptions: 0,
        totalSubscriptions: 0,
        uniqueSubscribers: 0,
        totalRevenue: 0,
        activePackages: 0,
    };
    try {
        const config = await getPaymentModelsConfig(tx);
        const noticeDays = config.subscriptionExpiringNoticeDays;
        const noticeWindowEnd = new Date(now.getTime() + noticeDays * DAY_MS);
        const [active, expiringSoon, expired, total, subscribers, revenue, activePackages] =
            await Promise.all([
                tx.vendorSubscription.count({
                    where: { status: 'ACTIVE', expiresAt: { gt: now } },
                }),
                tx.vendorSubscription.count({
                    where: { status: 'ACTIVE', expiresAt: { gt: now, lte: noticeWindowEnd } },
                }),
                tx.vendorSubscription.count({
                    where: { status: 'EXPIRED' },
                }),
                tx.vendorSubscription.count(),
                tx.vendorSubscription.findMany({
                    where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
                    distinct: ['userId'],
                    select: { userId: true },
                }),
                tx.vendorSubscription.aggregate({
                    where: { status: { not: 'CANCELLED' } },
                    _sum: { amount: true },
                }),
                tx.subscriptionPackage.count({ where: { isActive: true } }),
            ]);
        return {
            activeSubscriptions: active,
            expiringSoon,
            expiredSubscriptions: expired,
            totalSubscriptions: total,
            uniqueSubscribers: subscribers.length,
            totalRevenue: Math.round((revenue._sum.amount ?? 0) * 100) / 100,
            activePackages,
        };
    } catch {
        return empty;
    }
}
