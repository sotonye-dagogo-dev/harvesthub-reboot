import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH, POST } from '@/app/api/banners/[id]/route';

const {
    mockGetCurrentUser,
    mockRateLimitByIP,
    mockGetRateLimitResponse,
    mockCacheInvalidate,
    mockAcquireIdempotencyKey,
    mockCacheGet,
    mockCacheSet,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByIP: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockCacheInvalidate: vi.fn(),
    mockAcquireIdempotencyKey: vi.fn(),
    mockCacheGet: vi.fn(),
    mockCacheSet: vi.fn(),
    mockPrisma: {
        banner: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        bannerEvent: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
    rateLimitByIP: (...args: unknown[]) => mockRateLimitByIP(...args),
    rateLimitByUser: vi.fn(),
    getRateLimitResponse: (...args: unknown[]) => mockGetRateLimitResponse(...args),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/cache/redis', () => ({
    cacheInvalidate: (...args: unknown[]) => mockCacheInvalidate(...args),
    cacheAcquireIdempotencyKey: (...args: unknown[]) => mockAcquireIdempotencyKey(...args),
    cacheGet: (...args: unknown[]) => mockCacheGet(...args),
    cacheSet: (...args: unknown[]) => mockCacheSet(...args),
}));

function buildRequest(body: Record<string, unknown>, method = 'PATCH') {
    return new NextRequest('http://localhost/api/banners/banner-1', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const context = { params: Promise.resolve({ id: 'banner-1' }) };

const baseBanner = {
    id: 'banner-1',
    title: 'Sunrise Bakery Special',
    clickCount: 12,
    impressionCount: 300,
    conversionCount: 4,
};

beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitByIP.mockResolvedValue({ success: true });
    mockGetCurrentUser.mockResolvedValue(null);
    mockPrisma.banner.findUnique.mockResolvedValue(baseBanner);
    mockPrisma.bannerEvent.create.mockResolvedValue({ id: 'event-1' });
    mockPrisma.banner.update.mockImplementation(async ({ data }: any) => ({
        ...baseBanner,
        clickCount:
            typeof data?.clickCount?.increment === 'number'
                ? baseBanner.clickCount + data.clickCount.increment
                : baseBanner.clickCount,
        impressionCount:
            typeof data?.impressionCount?.increment === 'number'
                ? baseBanner.impressionCount + data.impressionCount.increment
                : baseBanner.impressionCount,
        conversionCount:
            typeof data?.conversionCount?.increment === 'number'
                ? baseBanner.conversionCount + data.conversionCount.increment
                : baseBanner.conversionCount,
    }));
});

describe('PATCH/POST /api/banners/[id] event tracking', () => {
    it('defaults an empty body to a CLICK event', async () => {
        const res = await PATCH(buildRequest({}), context);

        expect(res.status).toBe(200);
        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ bannerId: 'banner-1', type: 'CLICK', userId: null }),
        });
        expect(mockPrisma.banner.update).toHaveBeenCalledWith({
            where: { id: 'banner-1' },
            data: { clickCount: { increment: 1 } },
        });
    });

    it('records an IMPRESSION and increments the impression counter', async () => {
        const res = await PATCH(
            buildRequest({ type: 'IMPRESSION', visitorId: 'visitor-1', source: 'hero' }),
            context
        );

        expect(res.status).toBe(200);
        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                bannerId: 'banner-1',
                type: 'IMPRESSION',
                visitorId: 'visitor-1',
                source: 'hero',
                userId: null,
            }),
        });
        expect(mockPrisma.banner.update).toHaveBeenCalledWith({
            where: { id: 'banner-1' },
            data: { impressionCount: { increment: 1 } },
        });
        const json = await res.json();
        expect(json.impressions).toBe(301);
    });

    it('records a CONVERSION and increments the conversion counter', async () => {
        const res = await PATCH(
            buildRequest({ type: 'CONVERSION', visitorId: 'visitor-1', source: 'top' }),
            context
        );

        expect(res.status).toBe(200);
        expect(mockPrisma.banner.update).toHaveBeenCalledWith({
            where: { id: 'banner-1' },
            data: { conversionCount: { increment: 1 } },
        });
        const json = await res.json();
        expect(json.conversions).toBe(5);
    });

    it('falls back to CLICK for an unknown event type', async () => {
        const res = await PATCH(buildRequest({ type: 'VIEW' }), context);

        expect(res.status).toBe(200);
        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ type: 'CLICK' }),
        });
    });

    it('records the authenticated user id on the event', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'buyer-1', role: 'BUYER' });

        await PATCH(buildRequest({ type: 'CONVERSION' }), context);

        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ type: 'CONVERSION', userId: 'buyer-1' }),
        });
    });

    it('truncates oversized visitor ids and source strings', async () => {
        await PATCH(
            buildRequest({
                type: 'CLICK',
                visitorId: 'v'.repeat(500),
                source: 's'.repeat(200),
            }),
            context
        );

        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                visitorId: 'v'.repeat(200),
                source: 's'.repeat(50),
            }),
        });
    });

    it('returns 404 when the banner does not exist', async () => {
        mockPrisma.banner.findUnique.mockResolvedValue(null);

        const res = await PATCH(buildRequest({ type: 'CLICK' }), context);

        expect(res.status).toBe(404);
        expect(mockPrisma.bannerEvent.create).not.toHaveBeenCalled();
        expect(mockPrisma.banner.update).not.toHaveBeenCalled();
    });

    it('blocks requests that hit the IP rate limit', async () => {
        mockRateLimitByIP.mockResolvedValue({ success: false });
        mockGetRateLimitResponse.mockReturnValue(
            new Response('Too many requests', { status: 429, headers: { 'Content-Type': 'application/json' } })
        );

        const res = await PATCH(buildRequest({ type: 'CLICK' }), context);

        expect(res.status).toBe(429);
        expect(mockPrisma.bannerEvent.create).not.toHaveBeenCalled();
        expect(mockPrisma.banner.update).not.toHaveBeenCalled();
    });

    it('still returns counters when the event log insert fails (best effort)', async () => {
        mockPrisma.bannerEvent.create.mockRejectedValue(new Error('db connection lost'));

        const res = await PATCH(buildRequest({ type: 'CLICK' }), context);

        expect(res.status).toBe(200);
        expect(mockPrisma.banner.update).toHaveBeenCalled();
        const json = await res.json();
        expect(json.clicks).toBe(13);
    });

    it('throws a 500 when the counter increment update fails', async () => {
        mockPrisma.banner.update.mockRejectedValue(new Error('update failed'));

        const res = await PATCH(buildRequest({ type: 'CLICK' }), context);

        expect(res.status).toBe(500);
    });

    it('exposes a POST alias so sendBeacon can submit events', async () => {
        const res = await POST(buildRequest({ type: 'IMPRESSION' }, 'POST'), context);

        expect(res.status).toBe(200);
        expect(mockPrisma.bannerEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ type: 'IMPRESSION' }),
        });
    });
});