import { describe, expect, it, vi } from 'vitest';

// The schema lives in the route module; neutralize its import-time dependencies.
vi.mock('@/lib/db/prisma', () => ({
    prisma: {
        subscriptionPackage: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        vendorSubscription: {
            count: vi.fn(),
        },
    },
}));
vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/middleware/rate-limit', () => ({
    rateLimitByUser: vi.fn(),
    getRateLimitResponse: vi.fn(),
}));

import { subscriptionPackageSchema } from '@/app/api/admin/subscription-packages/route';

const VALID = {
    name: 'Growth',
    slug: 'growth',
    description: 'For growing stores',
    price: 5000,
    durationDays: 30,
    features: ['Priority listing', 'Analytics'],
    isActive: true,
    sortOrder: 1,
};

describe('subscriptionPackageSchema (admin CRUD validation)', () => {
    it('accepts a fully-populated valid package', () => {
        const parsed = subscriptionPackageSchema.safeParse(VALID);
        expect(parsed.success).toBe(true);
    });

    it('coerces numeric strings (form inputs) and rounds to kobo precision', () => {
        const parsed = subscriptionPackageSchema.safeParse({
            ...VALID,
            price: '4999.999',
            durationDays: '60',
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.price).toBe(4999.999);
            expect(parsed.data.durationDays).toBe(60);
        }
    });

    it('rejects missing name and slug', () => {
        const parsed = subscriptionPackageSchema.safeParse({ price: 1000, durationDays: 30 });
        expect(parsed.success).toBe(false);
    });

    it('rejects malformed slugs (uppercase, spaces, leading hyphen)', () => {
        for (const slug of ['Growth Pack', 'growth pack', '-growth', 'growth_', 'GROWTH']) {
            expect(
                subscriptionPackageSchema.safeParse({ ...VALID, slug }).success,
                `slug "${slug}" should be rejected`
            ).toBe(false);
        }
    });

    it('rejects negative prices and out-of-bounds durations', () => {
        expect(subscriptionPackageSchema.safeParse({ ...VALID, price: -1 }).success).toBe(false);
        expect(subscriptionPackageSchema.safeParse({ ...VALID, durationDays: 0 }).success).toBe(false);
        expect(subscriptionPackageSchema.safeParse({ ...VALID, durationDays: 5000 }).success).toBe(false);
        expect(subscriptionPackageSchema.safeParse({ ...VALID, price: 50000000 }).success).toBe(false);
    });

    it('rejects oversized feature lists and over-long feature strings', () => {
        const tooMany = Array.from({ length: 21 }, (_, index) => `Feature ${index}`);
        expect(subscriptionPackageSchema.safeParse({ ...VALID, features: tooMany }).success).toBe(false);
        expect(
            subscriptionPackageSchema.safeParse({ ...VALID, features: ['x'.repeat(121)] }).success
        ).toBe(false);
        expect(subscriptionPackageSchema.safeParse({ ...VALID, features: [''] }).success).toBe(false);
    });

    it('rejects names over 80 characters and descriptions over 500', () => {
        expect(
            subscriptionPackageSchema.safeParse({ ...VALID, name: 'x'.repeat(81) }).success
        ).toBe(false);
        expect(
            subscriptionPackageSchema.safeParse({ ...VALID, description: 'x'.repeat(501) }).success
        ).toBe(false);
    });

    it('makes optional fields optional (minimal valid package)', () => {
        const parsed = subscriptionPackageSchema.safeParse({
            name: 'Starter',
            slug: 'starter',
            price: 0,
            durationDays: 30,
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.isActive).toBeUndefined();
            expect(parsed.data.features).toBeUndefined();
        }
    });

    it('accepts a free (zero-price) package — free activation edge case', () => {
        const parsed = subscriptionPackageSchema.safeParse({ ...VALID, price: 0 });
        expect(parsed.success).toBe(true);
    });
});
