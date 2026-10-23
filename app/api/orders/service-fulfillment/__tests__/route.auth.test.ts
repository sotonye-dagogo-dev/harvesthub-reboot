import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/orders/service-fulfillment/route';

const { mockGetCurrentUser, mockPrisma } = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockPrisma: {
        commerceLifecycleConfig: {
            findUnique: vi.fn(),
        },
        order: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/services/notifications', () => ({
    dispatchNotification: vi.fn().mockResolvedValue(undefined),
}));

function buildRequest(headers: Record<string, string> = {}, method: 'GET' | 'POST' = 'GET') {
    return new NextRequest('http://localhost/api/orders/service-fulfillment', {
        method,
        headers,
    });
}

const ENV_KEYS = [
    'CRON_SECRET',
    'ORDER_FULFILLMENT_SECRET',
    'ORDER_AUTO_CONFIRM_SECRET',
] as const;

describe('service-fulfillment cron auth matrix (Session 105 — Vercel cron readiness)', () => {
    const original: Record<string, string | undefined> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        for (const key of ENV_KEYS) {
            original[key] = process.env[key];
            delete process.env[key];
        }
        mockGetCurrentUser.mockResolvedValue(null);
        mockPrisma.commerceLifecycleConfig.findUnique.mockResolvedValue(null);
        // No candidates → the four sweeps are no-ops; this suite exercises auth only.
        mockPrisma.order.findMany.mockResolvedValue([]);
    });

    afterEach(() => {
        for (const key of ENV_KEYS) {
            if (original[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = original[key];
            }
        }
    });

    it('rejects GET without any configured secret or session', async () => {
        const res = await GET(buildRequest());
        expect(res.status).toBe(401);
        expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
    });

    it('rejects a wrong Bearer token even when CRON_SECRET is set', async () => {
        process.env.CRON_SECRET = 'cron-sauce';
        const res = await GET(buildRequest({ authorization: 'Bearer nope' }));
        expect(res.status).toBe(401);
    });

    it('accepts the Vercel-style Bearer CRON_SECRET GET invocation', async () => {
        process.env.CRON_SECRET = 'cron-sauce';
        const res = await GET(buildRequest({ authorization: 'Bearer cron-sauce' }));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.scanned).toBe(0);
        expect(mockPrisma.order.findMany).toHaveBeenCalledTimes(1);
    });

    it('accepts a Bearer ORDER_FULFILLMENT_SECRET invocation', async () => {
        process.env.ORDER_FULFILLMENT_SECRET = 'fulfil-sauce';
        const res = await GET(buildRequest({ authorization: 'Bearer fulfil-sauce' }));
        expect(res.status).toBe(200);
    });

    it('accepts a Bearer ORDER_AUTO_CONFIRM_SECRET invocation', async () => {
        process.env.ORDER_AUTO_CONFIRM_SECRET = 'auto-sauce';
        const res = await GET(buildRequest({ authorization: 'Bearer auto-sauce' }));
        expect(res.status).toBe(200);
    });

    it('keeps the legacy x-fulfillment-secret POST contract working (regression)', async () => {
        process.env.ORDER_FULFILLMENT_SECRET = 'fulfil-sauce';
        const res = await POST(buildRequest({ 'x-fulfillment-secret': 'fulfil-sauce' }, 'POST'));
        expect(res.status).toBe(200);
    });

    it('keeps the legacy x-auto-confirm-secret POST contract working (regression)', async () => {
        process.env.ORDER_AUTO_CONFIRM_SECRET = 'auto-sauce';
        const res = await POST(buildRequest({ 'x-auto-confirm-secret': 'auto-sauce' }, 'POST'));
        expect(res.status).toBe(200);
    });

    it('accepts an admin session without any secret', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
        const res = await GET(buildRequest());
        expect(res.status).toBe(200);
    });

    it('rejects a non-admin session', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-1', role: 'VENDOR' });
        const res = await GET(buildRequest());
        expect(res.status).toBe(401);
    });
});
