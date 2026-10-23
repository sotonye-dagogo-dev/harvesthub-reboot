import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/subscriptions/route';

const {
    mockGetCurrentUser,
    mockRateLimitByUser,
    mockGetRateLimitResponse,
    mockVerifyPayment,
    mockDispatchNotification,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByUser: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockVerifyPayment: vi.fn(),
    mockDispatchNotification: vi.fn(),
    mockPrisma: {
        commerceLifecycleConfig: {
            findUnique: vi.fn(),
        },
        subscriptionPackage: {
            findFirst: vi.fn(),
        },
        vendorSubscription: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
        },
        wallet: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        transaction: {
            aggregate: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
    rateLimitByUser: (...args: unknown[]) => mockRateLimitByUser(...args),
    getRateLimitResponse: (...args: unknown[]) => mockGetRateLimitResponse(...args),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/services/payments', () => ({
    verifyPayment: (...args: unknown[]) => mockVerifyPayment(...args),
}));

vi.mock('@/lib/services/notifications', () => ({
    dispatchNotification: (...args: unknown[]) => mockDispatchNotification(...args),
}));

const PACKAGE = {
    id: 'pkg-1',
    name: 'Growth',
    slug: 'growth',
    description: 'For growing stores',
    price: 5000,
    durationDays: 30,
    features: ['Priority listing'],
    isActive: true,
    sortOrder: 0,
};

function buildRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/subscriptions purchase flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-user-1', role: 'VENDOR' });
        mockRateLimitByUser.mockResolvedValue({ success: true });
        mockDispatchNotification.mockResolvedValue(undefined);
        mockPrisma.commerceLifecycleConfig.findUnique.mockResolvedValue({
            vendorCommissionEnabled: false,
            subscriptionEnabled: true,
            subscriptionExpiringNoticeDays: 3,
            subscriptionEnforcementLevel: 'WARN',
        });
        mockPrisma.subscriptionPackage.findFirst.mockResolvedValue(PACKAGE);
        // Idempotency lookup (where.paymentReference) → none; latest-sub lookup (where.userId) → none
        mockPrisma.vendorSubscription.findFirst.mockImplementation(async (args: any) => {
            if (args?.where?.paymentReference) return null;
            return null;
        });
        mockPrisma.vendorSubscription.findMany.mockResolvedValue([]);
        mockPrisma.wallet.findUnique.mockResolvedValue({
            id: 'wallet-1',
            userId: 'vendor-user-1',
            balance: 20000,
            isActive: true,
        });
        mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
        mockPrisma.transaction.create.mockResolvedValue({ id: 'txn-1' });
        mockPrisma.vendorSubscription.create.mockResolvedValue({
            id: 'sub-1',
            userId: 'vendor-user-1',
            packageId: 'pkg-1',
            status: 'ACTIVE',
            paymentMethod: 'WALLET',
            paymentReference: 'SUB-100-abc',
            amount: 5000,
            startAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 86400000),
            package: { id: 'pkg-1', name: 'Growth', slug: 'growth', durationDays: 30 },
        });
        mockPrisma.wallet.update.mockResolvedValue({ id: 'wallet-1', balance: 15000 });
        mockPrisma.$transaction.mockImplementation(async (callback: any) =>
            callback({
                wallet: {
                    findUnique: (...args: unknown[]) => mockPrisma.wallet.findUnique(...args),
                    update: (...args: unknown[]) => mockPrisma.wallet.update(...args),
                },
                transaction: {
                    aggregate: (...args: unknown[]) => mockPrisma.transaction.aggregate(...args),
                    create: (...args: unknown[]) => mockPrisma.transaction.create(...args),
                },
                vendorSubscription: {
                    create: (...args: unknown[]) => mockPrisma.vendorSubscription.create(...args),
                },
            })
        );
    });

    it('rejects unauthenticated purchases', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        const res = await POST(buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET' }));
        expect(res.status).toBe(401);
    });

    it('rejects admin purchases (admins do not subscribe)', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
        const res = await POST(buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET' }));
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(JSON.stringify(json)).toContain('ADMIN_NOT_ELIGIBLE');
    });

    it('rejects unsupported payment methods', async () => {
        const res = await POST(buildRequest({ packageId: 'pkg-1', paymentMethod: 'BANK_TRANSFER' }));
        expect(res.status).toBe(400);
    });

    it('returns 403 when the subscription model is disabled by the admin', async () => {
        mockPrisma.commerceLifecycleConfig.findUnique.mockResolvedValue({
            vendorCommissionEnabled: false,
            subscriptionEnabled: false,
            subscriptionExpiringNoticeDays: 3,
            subscriptionEnforcementLevel: 'WARN',
        });
        const res = await POST(buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET' }));
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(JSON.stringify(json)).toContain('SUBSCRIPTIONS_DISABLED');
    });

    it('returns 404 for unknown or deactivated packages', async () => {
        mockPrisma.subscriptionPackage.findFirst.mockResolvedValue(null);
        const res = await POST(buildRequest({ packageId: 'missing', paymentMethod: 'WALLET' }));
        expect(res.status).toBe(404);
    });

    it('activates a WALLET purchase atomically with a ledger row + notification', async () => {
        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET', paymentReference: 'SUB-200-wal' })
        );
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json.subscription?.id).toBe('sub-1');
        expect(json.message).toContain('active until');

        // ACID: debit + subscription + ledger inside one transaction
        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
            where: { id: 'wallet-1' },
            data: { balance: { decrement: 5000 } },
        });
        expect(mockPrisma.vendorSubscription.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.transaction.create.mock.calls[0]![0].data).toMatchObject({
            type: 'PAYMENT',
            amount: 5000,
            reference: 'SUB-200-wal',
        });

        // Post-commit notification with subscription metadata
        expect(mockDispatchNotification).toHaveBeenCalledTimes(1);
        expect(mockDispatchNotification.mock.calls[0]![0]).toMatchObject({
            userId: 'vendor-user-1',
            type: 'SUBSCRIPTION_ACTIVATED',
        });
    });

    it('rejects WALLET purchases with insufficient available balance', async () => {
        mockPrisma.wallet.findUnique.mockResolvedValue({
            id: 'wallet-1',
            userId: 'vendor-user-1',
            balance: 1000,
            isActive: true,
        });
        mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

        const res = await POST(buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET' }));
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(JSON.stringify(json)).toContain('INSUFFICIENT_WALLET_BALANCE');
        expect(mockPrisma.vendorSubscription.create).not.toHaveBeenCalled();
        expect(mockPrisma.wallet.update).not.toHaveBeenCalled();
    });

    it('verifies CARD payments and rejects amount mismatches', async () => {
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'SUB-300-card',
            status: 'SUCCESS',
            amount: 1000,
            currency: 'NGN',
            message: 'Payment verified.',
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-300-card' })
        );
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.code).toBe('PAYMENT_AMOUNT_MISMATCH');
        expect(mockPrisma.vendorSubscription.create).not.toHaveBeenCalled();
    });

    it('rejects non-NGN verified CARD payments', async () => {
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'SUB-301-card',
            status: 'SUCCESS',
            amount: 5000,
            currency: 'USD',
            message: 'Payment verified.',
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-301-card' })
        );
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.code).toBe('PAYMENT_CURRENCY_MISMATCH');
    });

    it('activates a verified CARD purchase with exact NGN amount', async () => {
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'SUB-302-card',
            status: 'SUCCESS',
            amount: 5000,
            currency: 'NGN',
            message: 'Payment verified.',
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-302-card' })
        );
        const json = await res.json();

        expect(res.status).toBe(201);
        expect(json.subscription?.id).toBe('sub-1');
        expect(json.verification?.status).toBe('SUCCESS');
        expect(mockPrisma.vendorSubscription.create).toHaveBeenCalledTimes(1);
        expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
    });

    it('accepts Paystack inline responses when gateway verification is unavailable (wallet-deposit precedent)', async () => {
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'SUB-303-card',
            status: 'GATEWAY_UNAVAILABLE',
            amount: 0,
            currency: 'NGN',
            message: 'Paystack secret key is not configured.',
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-303-card' })
        );
        const json = await res.json();

        expect(res.status).toBe(201);
        const createdMetadata = mockPrisma.vendorSubscription.create.mock.calls[0]![0].data.metadata;
        expect(createdMetadata.acceptedWithoutVerification).toBe(true);
    });

    it('rejects FAILED CARD verifications', async () => {
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'SUB-304-card',
            status: 'FAILED',
            amount: 0,
            currency: 'NGN',
            message: 'Declined by issuer.',
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-304-card' })
        );
        expect(res.status).toBe(400);
        expect(mockPrisma.vendorSubscription.create).not.toHaveBeenCalled();
    });

    it('returns the existing subscription for an already-used payment reference (no double charge)', async () => {
        const existing = {
            id: 'sub-existing',
            userId: 'vendor-user-1',
            packageId: 'pkg-1',
            paymentReference: 'SUB-400-replay',
            package: { id: 'pkg-1', name: 'Growth', slug: 'growth', durationDays: 30 },
        };
        mockPrisma.vendorSubscription.findFirst.mockImplementation(async (args: any) => {
            if (args?.where?.paymentReference === 'SUB-400-replay') return existing;
            return null;
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'CARD', paymentReference: 'SUB-400-replay' })
        );
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.idempotentReplay).toBe(true);
        expect(json.subscription?.id).toBe('sub-existing');
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    it('extends the renewal window from the current effective expiry', async () => {
        const futureExpiry = new Date(Date.now() + 10 * 86400000);
        const latest = {
            id: 'sub-old',
            userId: 'vendor-user-1',
            packageId: 'pkg-1',
            status: 'ACTIVE',
            amount: 5000,
            startAt: new Date(Date.now() - 20 * 86400000),
            expiresAt: futureExpiry,
            paymentMethod: 'WALLET',
            paymentReference: 'SUB-OLD',
            package: { id: 'pkg-1', name: 'Growth', slug: 'growth', durationDays: 30 },
        };
        mockPrisma.vendorSubscription.findFirst.mockImplementation(async (args: any) => {
            if (args?.where?.paymentReference) return null;
            return latest;
        });

        const res = await POST(
            buildRequest({ packageId: 'pkg-1', paymentMethod: 'WALLET', paymentReference: 'SUB-500-renew' })
        );
        const json = await res.json();

        expect(res.status).toBe(201);
        const createArgs = mockPrisma.vendorSubscription.create.mock.calls[0]![0];
        expect(createArgs.data.startAt.getTime()).toBe(futureExpiry.getTime());
        expect(createArgs.data.expiresAt.getTime()).toBe(futureExpiry.getTime() + 30 * 86400000);
        expect(json.window.previousExpiresAt).toBe(futureExpiry.toISOString());
    });
});

describe('GET /api/subscriptions summary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-user-1', role: 'VENDOR' });
        mockRateLimitByUser.mockResolvedValue({ success: true });
        mockPrisma.commerceLifecycleConfig.findUnique.mockResolvedValue(null); // → defaults
        mockPrisma.vendorSubscription.findFirst.mockResolvedValue(null);
        mockPrisma.vendorSubscription.findMany.mockResolvedValue([]);
        mockPrisma.wallet.findUnique.mockResolvedValue({
            id: 'wallet-1',
            balance: 20000,
            isActive: true,
        });
    });

    it('requires authentication', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('returns the summary, history and wallet balance', async () => {
        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.summary?.status).toBe('NONE');
        expect(json.summary?.enabled).toBe(true); // subscriptions default ON
        expect(json.walletBalance).toBe(20000);
        expect(Array.isArray(json.history)).toBe(true);
    });
});
