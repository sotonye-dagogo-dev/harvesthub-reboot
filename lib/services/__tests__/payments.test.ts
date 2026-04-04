import { describe, expect, it } from 'vitest';
import { initializePayment, verifyPayment } from '@/lib/services/payments';

describe('payment gateway stubs', () => {
  it('initializes paystack stub payload with expected defaults', async () => {
    const result = await initializePayment({
      gateway: 'PAYSTACK',
      amount: 2500,
      email: 'buyer@example.com',
    });

    expect(result.status).toBe('STUBBED');
    expect(result.currency).toBe('NGN');
    expect(result.authorizationUrl).toContain('checkout.paystack.com');
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
