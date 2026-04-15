import { createHmac } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/webhook/route';

const {
    envMock,
    mockCacheAcquireIdempotencyKey,
    mockVerifyPayment,
    mockPrisma,
} = vi.hoisted(() => ({
    envMock: {
        paystackWebhooksEnabled: true,
        paystackWebhookSecret: 'whsec_test_123',
        paystackSecretKey: 'sk_test_123',
        paystackMode: 'test',
    },
    mockCacheAcquireIdempotencyKey: vi.fn(),
    mockVerifyPayment: vi.fn(),
    mockPrisma: {
        transaction: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        order: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/config/env', () => ({
    env: envMock,
}));

vi.mock('@/lib/cache/redis', () => ({
    cacheAcquireIdempotencyKey: (...args: unknown[]) => mockCacheAcquireIdempotencyKey(...args),
}));

vi.mock('@/lib/services/payments', () => ({
    verifyPayment: (...args: unknown[]) => mockVerifyPayment(...args),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

function signPayload(rawBody: string, secret: string): string {
    return createHmac('sha512', secret).update(rawBody).digest('hex');
}

function buildRequest(rawBody: string, opts?: { includeSignature?: boolean }) {
    const includeSignature = opts?.includeSignature ?? true;
    const headers = new Headers({ 'Content-Type': 'application/json' });

    if (includeSignature) {
        headers.set('x-paystack-signature', signPayload(rawBody, envMock.paystackWebhookSecret));
    }

    return new NextRequest('http://localhost/api/payments/webhook', {
        method: 'POST',
        headers,
        body: rawBody,
    });
}

describe('POST /api/payments/webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        envMock.paystackWebhooksEnabled = true;
        envMock.paystackWebhookSecret = 'whsec_test_123';
        envMock.paystackSecretKey = 'sk_test_123';
        envMock.paystackMode = 'test';

        mockCacheAcquireIdempotencyKey.mockResolvedValue('acquired');
        mockVerifyPayment.mockResolvedValue({
            gateway: 'PAYSTACK',
            reference: 'PAY-REF-123',
            status: 'SUCCESS',
            amount: 6500,
            currency: 'NGN',
            message: 'Payment verified',
            providerStatus: 'success',
        });
        mockPrisma.transaction.findUnique.mockResolvedValue(null);
        mockPrisma.transaction.update.mockResolvedValue({ id: 'txn-1' });
        mockPrisma.order.findMany.mockResolvedValue([]);
        mockPrisma.order.update.mockResolvedValue({ id: 'order-1' });
    });

    it('rejects requests without webhook signature', async () => {
        const body = JSON.stringify({ event: 'charge.success', data: { reference: 'PAY-REF-123' } });
        const res = await POST(buildRequest(body, { includeSignature: false }));
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toMatch(/signature/i);
    });

    it('ignores duplicate webhook replays using idempotency key', async () => {
        mockCacheAcquireIdempotencyKey.mockResolvedValue('exists');

        const body = JSON.stringify({
            event: 'charge.success',
            data: { id: 12001, reference: 'PAY-REF-123', amount: 650000, currency: 'NGN' },
        });

        const res = await POST(buildRequest(body));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.duplicate).toBe(true);
        expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    it('reconciles charge.success by re-verifying reference and auditing matched records', async () => {
        mockPrisma.transaction.findUnique.mockResolvedValue({
            id: 'txn-1',
            type: 'DEPOSIT',
            status: 'PENDING',
            metadata: null,
        });
        mockPrisma.order.findMany.mockResolvedValue([
            {
                id: 'order-1',
                orderNumber: 'MHH-ORDER-1',
                statusHistory: [],
            },
        ]);

        const body = JSON.stringify({
            event: 'charge.success',
            data: {
                id: 9981,
                reference: 'PAY-REF-123',
                status: 'success',
                amount: 650000,
                currency: 'NGN',
            },
        });

        const res = await POST(buildRequest(body));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.reconciliation?.verification?.status).toBe('SUCCESS');
        expect(json.reconciliation?.transactionMatched).toBe(true);
        expect(json.reconciliation?.updatedOrderCount).toBe(1);
        expect(mockVerifyPayment).toHaveBeenCalledWith({ gateway: 'PAYSTACK', reference: 'PAY-REF-123' });
        expect(mockPrisma.transaction.update).toHaveBeenCalledTimes(1);
        expect(mockPrisma.order.update).toHaveBeenCalledTimes(1);
    });
});
