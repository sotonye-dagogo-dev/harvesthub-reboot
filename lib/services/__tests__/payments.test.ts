import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializePayment, verifyPayment } from '@/lib/services/payments';
import { env } from '@/lib/config/env';

const envMutable = env as unknown as {
  paystackSecretKey?: string;
};
const originalPaystackSecretKey = envMutable.paystackSecretKey;

afterEach(() => {
  envMutable.paystackSecretKey = originalPaystackSecretKey;
  vi.restoreAllMocks();
});

describe('payment gateway stubs', () => {
  it('initializes paystack stub payload with expected defaults', async () => {
    envMutable.paystackSecretKey = undefined;

    const result = await initializePayment({
      gateway: 'PAYSTACK',
      amount: 2500,
      email: 'buyer@example.com',
    });

    expect(result.status).toBe('STUBBED');
    expect(result.currency).toBe('NGN');
    expect(result.verificationReference).toBe(result.reference);
    expect(result.authorizationUrl).toContain('checkout.paystack.com');
  });

  it('returns gateway unavailable status when paystack credentials are missing', async () => {
    envMutable.paystackSecretKey = undefined;

    const result = await verifyPayment({
      gateway: 'PAYSTACK',
      reference: 'paystack-ref-123',
    });

    expect(result.status).toBe('GATEWAY_UNAVAILABLE');
  });

  it('treats paystack initialize response with status=false as a failed initialization', async () => {
    envMutable.paystackSecretKey = 'sk_test_123';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: false,
        message: 'Invalid transaction payload',
        data: {},
      }),
    } as Response);

    await expect(
      initializePayment({
        gateway: 'PAYSTACK',
        amount: 2500,
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Invalid transaction payload');
  });

  it('returns gateway unavailable when paystack verification endpoint cannot be reached', async () => {
    envMutable.paystackSecretKey = 'sk_test_123';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await verifyPayment({
      gateway: 'PAYSTACK',
      reference: 'paystack-ref-123',
    });

    expect(result.status).toBe('GATEWAY_UNAVAILABLE');
  });

  it('verifies reference status heuristics for stub flow', async () => {
    const success = await verifyPayment({
      gateway: 'FLUTTERWAVE',
      reference: 'fw-success-123',
    });

    const failed = await verifyPayment({
      gateway: 'FLUTTERWAVE',
      reference: 'fw-fail-123',
    });

    expect(success.status).toBe('SUCCESS');
    expect(failed.status).toBe('FAILED');
  });
});
