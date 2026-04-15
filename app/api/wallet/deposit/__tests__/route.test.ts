import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/wallet/deposit/route';

const {
    mockGetCurrentUser,
    mockRateLimitByUser,
    mockGetRateLimitResponse,
    mockVerifyPayment,
    mockDispatchNotification,
    mockCacheInvalidate,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByUser: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockVerifyPayment: vi.fn(),
    mockDispatchNotification: vi.fn(),
    mockCacheInvalidate: vi.fn(),
    mockPrisma: {
        wallet: {
            findUnique: vi.fn(),
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

vi.mock('@/lib/cache/redis', () => ({
    cacheInvalidate: (...args: unknown[]) => mockCacheInvalidate(...args),
}));

vi.mock('@/lib/services/payments', () => ({
    verifyPayment: (...args: unknown[]) => mockVerifyPayment(...args),
}));

vi.mock('@/lib/services/notifications', () => ({
    dispatchNotification: (...args: unknown[]) => mockDispatchNotification(...args),
}));

function buildRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: 5000,
            paymentReference: 'PAY-123',
            paymentGateway: 'PAYSTACK',
            paymentVerificationReference: 'PAY-123',
            ...body,
        }),
    });
}

describe('POST /api/wallet/deposit role and verification guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRateLimitByUser.mockResolvedValue({ success: true });
        mockDispatchNotification.mockResolvedValue(undefined);
        mockCacheInvalidate.mockResolvedValue(undefined);
    });

    it('blocks admin wallet deposits', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });

        const res = await POST(buildRequest({}));
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.code).toBe('WALLET_ROLE_BLOCKED');
        expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    it('returns 503 when gateway verification is unavailable', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'buyer-1', role: 'BUYER' });
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'PAY-123',
            status: 'GATEWAY_UNAVAILABLE',
            amount: 0,
            currency: 'NGN',
            message: 'Paystack secret key is not configured.',
        });

        const res = await POST(buildRequest({}));
        const json = await res.json();

        expect(res.status).toBe(503);
        expect(json.error).toMatch(/unavailable/i);
        expect(json.verification?.status).toBe('GATEWAY_UNAVAILABLE');
    });

    it('rejects deposit when verified amount does not match request amount', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'buyer-1', role: 'BUYER' });
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'PAY-123',
            status: 'SUCCESS',
            amount: 4000,
            currency: 'NGN',
            message: 'Payment verified.',
        });

        const res = await POST(buildRequest({ amount: 5000 }));
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.code).toBe('PAYMENT_AMOUNT_MISMATCH');
    });

    it('rejects deposit when verified currency is not NGN', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'buyer-1', role: 'BUYER' });
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'PAY-123',
            status: 'SUCCESS',
            amount: 5000,
            currency: 'USD',
            message: 'Payment verified.',
        });

        const res = await POST(buildRequest({ amount: 5000 }));
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.code).toBe('PAYMENT_CURRENCY_MISMATCH');
    });
});
