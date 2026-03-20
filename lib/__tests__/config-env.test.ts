import { describe, expect, it, vi } from 'vitest';

describe('config env normalization', () => {
  it('normalizes boolean flags and numeric retry values', async () => {
    vi.resetModules();
    process.env.USE_PRISMA = 'true';
    process.env.ENABLE_MOCK_BACKEND = 'false';
    process.env.ENABLE_EMAIL = 'false';
    process.env.EMAIL_RETRY_ATTEMPTS = '4';
    process.env.EMAIL_RETRY_BASE_DELAY_MS = '750';

    const { env } = await import('@/lib/config/env');

    expect(env.usePrisma).toBe(true);
    expect(env.enableMockBackend).toBe(false);
    expect(env.enableEmail).toBe(false);
    expect(env.emailRetryAttempts).toBe(4);
    expect(env.emailRetryBaseDelayMs).toBe(750);
  });

  it('falls back to safe defaults for invalid numeric values', async () => {
    vi.resetModules();
    process.env.EMAIL_RETRY_ATTEMPTS = '-2';
    process.env.EMAIL_RETRY_BASE_DELAY_MS = 'not-a-number';

    const { env } = await import('@/lib/config/env');

    expect(env.emailRetryAttempts).toBe(3);
    expect(env.emailRetryBaseDelayMs).toBe(500);
  });
});
