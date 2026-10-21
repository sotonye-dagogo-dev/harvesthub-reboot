import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/subscriptions/route';

const {
    mockGetCurrentUser,
    mockRunSubscriptionSweep,
    mockDispatchNotification,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRunSubscriptionSweep: vi.fn(),
    mockDispatchNotification: vi.fn(),
}));

vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: {},
}));

vi.mock('@/lib/services/notifications', () => ({
    dispatchNotification: (...args: unknown[]) => mockDispatchNotification(...args),
}));

vi.mock('@/lib/services/subscriptions', () => ({
    runSubscriptionSweep: (...args: unknown[]) => mockRunSubscriptionSweep(...args),
}));

function buildRequest(headers: Record<string, string> = {}, method: 'GET' | 'POST' = 'POST') {
    return new NextRequest('http://localhost/api/cron/subscriptions', {
        method,
        headers,
    });
}

const EMPTY_SWEEP = { expired: [], expiringSoon: [], errors: 0 };

describe('POST /api/cron/subscriptions', () => {
    const originalSecret = process.env.SUBSCRIPTION_CRON_SECRET;

    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.SUBSCRIPTION_CRON_SECRET;
        mockGetCurrentUser.mockResolvedValue(null);
        mockRunSubscriptionSweep.mockResolvedValue(EMPTY_SWEEP);
        mockDispatchNotification.mockResolvedValue(undefined);
    });

    afterEach(() => {
        if (originalSecret === undefined) {
            delete process.env.SUBSCRIPTION_CRON_SECRET;
        } else {
            process.env.SUBSCRIPTION_CRON_SECRET = originalSecret;
        }
    });

    it('rejects unauthenticated calls when no secret is configured', async () => {
        const res = await POST(buildRequest());
        expect(res.status).toBe(401);
        expect(mockRunSubscriptionSweep).not.toHaveBeenCalled();
    });

    it('rejects wrong secrets even when one is configured', async () => {
        process.env.SUBSCRIPTION_CRON_SECRET = 'correct-horse';
        const res = await POST(buildRequest({ 'x-subscription-cron-secret': 'wrong' }));
        expect(res.status).toBe(401);
        expect(mockRunSubscriptionSweep).not.toHaveBeenCalled();
    });

    it('accepts the configured secret', async () => {
        process.env.SUBSCRIPTION_CRON_SECRET = 'correct-horse';
        const res = await POST(buildRequest({ 'x-subscription-cron-secret': 'correct-horse' }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockRunSubscriptionSweep).toHaveBeenCalledTimes(1);
        expect(json.expired).toBe(0);
        expect(json.expiringSoon).toBe(0);
    });

    it('accepts an admin session', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
        const res = await POST(buildRequest());
        expect(res.status).toBe(200);
        expect(mockRunSubscriptionSweep).toHaveBeenCalledTimes(1);
    });

    it('rejects a non-admin session', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-1', role: 'VENDOR' });
        const res = await POST(buildRequest());
        expect(res.status).toBe(401);
    });

    it('dispatches expiry notices and reports dispatched/failed counts', async () => {
        process.env.SUBSCRIPTION_CRON_SECRET = 'correct-horse';
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        mockRunSubscriptionSweep.mockResolvedValue({
            expired: [
                { subscriptionId: 'sub-1', userId: 'user-1', packageName: 'Growth', expiresAt },
            ],
            expiringSoon: [
                { subscriptionId: 'sub-2', userId: 'user-2', packageName: 'Starter', expiresAt },
            ],
            errors: 0,
        });
        mockDispatchNotification
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('email channel down'));

        const res = await POST(buildRequest({ 'x-subscription-cron-secret': 'correct-horse' }));
        const json = await res.json();

        // Notification failures never fail the sweep request (never-fail contract).
        expect(res.status).toBe(200);
        expect(json.expired).toBe(1);
        expect(json.expiringSoon).toBe(1);
        expect(json.notificationsDispatched).toBe(1);
        expect(json.notificationsFailed).toBe(1);

        const dispatchedTypes = mockDispatchNotification.mock.calls.map(
            (call) => (call[0] as { type: string }).type
        );
        expect(dispatchedTypes).toContain('SUBSCRIPTION_EXPIRED');
        expect(dispatchedTypes).toContain('SUBSCRIPTION_EXPIRING_SOON');
    });

    it('returns 200 with zero notices on an idempotent replay (sweep dedupes)', async () => {
        process.env.SUBSCRIPTION_CRON_SECRET = 'correct-horse';
        const res = await POST(buildRequest({ 'x-subscription-cron-secret': 'correct-horse' }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.expired).toBe(0);
        expect(json.expiringSoon).toBe(0);
        expect(mockDispatchNotification).not.toHaveBeenCalled();
    });
});

describe('GET /api/cron/subscriptions (Vercel cron entrypoint)', () => {
    const originalCronSecret = process.env.CRON_SECRET;
    const originalSubscriptionSecret = process.env.SUBSCRIPTION_CRON_SECRET;

    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.CRON_SECRET;
        delete process.env.SUBSCRIPTION_CRON_SECRET;
        mockGetCurrentUser.mockResolvedValue(null);
        mockRunSubscriptionSweep.mockResolvedValue(EMPTY_SWEEP);
        mockDispatchNotification.mockResolvedValue(undefined);
    });

    afterEach(() => {
        if (originalCronSecret === undefined) {
            delete process.env.CRON_SECRET;
        } else {
            process.env.CRON_SECRET = originalCronSecret;
        }
        if (originalSubscriptionSecret === undefined) {
            delete process.env.SUBSCRIPTION_CRON_SECRET;
        } else {
            process.env.SUBSCRIPTION_CRON_SECRET = originalSubscriptionSecret;
        }
    });

    it('rejects unauthenticated GETs when no secret is configured', async () => {
        const res = await GET(buildRequest({}, 'GET'));
        expect(res.status).toBe(401);
        expect(mockRunSubscriptionSweep).not.toHaveBeenCalled();
    });

    it('rejects a wrong bearer token even when CRON_SECRET is configured', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret';
        const res = await GET(buildRequest({ authorization: 'Bearer wrong-token' }, 'GET'));
        expect(res.status).toBe(401);
        expect(mockRunSubscriptionSweep).not.toHaveBeenCalled();
    });

    it('rejects a non-bearer Authorization header (e.g. Basic) even with CRON_SECRET set', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret';
        const res = await GET(buildRequest({ authorization: 'Basic vercel-cron-secret' }, 'GET'));
        expect(res.status).toBe(401);
    });

    it('accepts the Vercel-style Bearer CRON_SECRET invocation', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret';
        const res = await GET(buildRequest({ authorization: 'Bearer vercel-cron-secret' }, 'GET'));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(mockRunSubscriptionSweep).toHaveBeenCalledTimes(1);
        expect(json.expired).toBe(0);
        expect(json.expiringSoon).toBe(0);
    });

    it('also accepts a Bearer SUBSCRIPTION_CRON_SECRET invocation', async () => {
        process.env.SUBSCRIPTION_CRON_SECRET = 'subscription-horse';
        const res = await GET(buildRequest({ authorization: 'Bearer subscription-horse' }, 'GET'));
        expect(res.status).toBe(200);
        expect(mockRunSubscriptionSweep).toHaveBeenCalledTimes(1);
    });

    it('accepts an admin session on GET', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
        const res = await GET(buildRequest({}, 'GET'));
        expect(res.status).toBe(200);
    });

    it('rejects a non-admin session on GET', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-1', role: 'VENDOR' });
        const res = await GET(buildRequest({}, 'GET'));
        expect(res.status).toBe(401);
    });

    it('dispatches notices on GET sweeps exactly like POST (shared handler)', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret';
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        mockRunSubscriptionSweep.mockResolvedValue({
            expired: [
                { subscriptionId: 'sub-1', userId: 'user-1', packageName: 'Growth', expiresAt },
            ],
            expiringSoon: [],
            errors: 0,
        });

        const res = await GET(buildRequest({ authorization: 'Bearer vercel-cron-secret' }, 'GET'));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.expired).toBe(1);
        expect(json.notificationsDispatched).toBe(1);
        expect(mockDispatchNotification.mock.calls[0]![0]).toMatchObject({
            type: 'SUBSCRIPTION_EXPIRED',
        });
    });
});
