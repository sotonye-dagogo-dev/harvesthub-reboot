import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/analytics/banners/route';

const {
    mockGetCurrentUser,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockPrisma: {
        banner: {
            findMany: vi.fn(),
        },
        bannerEvent: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/lib/utils/auth', () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

function buildRequest(search = '') {
    return new NextRequest(`http://localhost/api/admin/analytics/banners${search}`, {
        method: 'GET',
    });
}

const banners = [
    {
        id: 'banner-1',
        title: 'Christmas Mega Sale',
        position: 'HERO',
        isActive: true,
        clickCount: 3,
        impressionCount: 100,
        conversionCount: 1,
        startDate: new Date('2026-12-01'),
        endDate: null,
    },
    {
        id: 'banner-2',
        title: 'Spring Market Deals',
        position: 'SIDEBAR',
        isActive: true,
        clickCount: 1,
        impressionCount: 40,
        conversionCount: 0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-31'),
    },
];

const events = [
    { bannerId: 'banner-1', type: 'IMPRESSION', userId: 'u1', visitorId: 'v1' },
    { bannerId: 'banner-1', type: 'IMPRESSION', userId: 'u1', visitorId: 'v2' },
    { bannerId: 'banner-1', type: 'IMPRESSION', userId: null, visitorId: 'v3' },
    { bannerId: 'banner-1', type: 'CLICK', userId: 'u1', visitorId: 'v1' },
    { bannerId: 'banner-1', type: 'CLICK', userId: null, visitorId: 'v3' },
    { bannerId: 'banner-1', type: 'CLICK', userId: null, visitorId: 'v3' },
    { bannerId: 'banner-1', type: 'CONVERSION', userId: 'u1', visitorId: 'v1' },
    { bannerId: 'banner-2', type: 'IMPRESSION', userId: 'u2', visitorId: 'v4' },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mockPrisma.banner.findMany.mockResolvedValue(banners);
    mockPrisma.bannerEvent.findMany.mockResolvedValue(events);
});

describe('GET /api/admin/analytics/banners', () => {
    it('returns 401 for unauthenticated requests', async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        const res = await GET(buildRequest());
        expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin roles', async () => {
        mockGetCurrentUser.mockResolvedValue({ userId: 'vendor-1', role: 'VENDOR' });
        const res = await GET(buildRequest());
        expect(res.status).toBe(403);
    });

    it('aggregates events into summary and per-banner metrics', async () => {
        const res = await GET(buildRequest());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.rangeDays).toBe(30);

        expect(body.data.summary.impressions).toBe(4);
        expect(body.data.summary.uniqueImpressions).toBe(3); // u1, v3, u2
        expect(body.data.summary.authenticatedImpressions).toBe(3); // u1x2 + u2
        expect(body.data.summary.anonymousImpressions).toBe(1);
        expect(body.data.summary.clicks).toBe(3);
        expect(body.data.summary.conversions).toBe(1);

        expect(body.data.byBanner).toHaveLength(2);
        const b1 = body.data.byBanner.find((row: any) => row.banner.id === 'banner-1');
        expect(b1).toBeDefined();
        expect(b1.banner.title).toBe('Christmas Mega Sale');
        expect(b1.metrics.impressions).toBe(3);
        expect(b1.metrics.clicks).toBe(3);
        expect(b1.metrics.conversions).toBe(1);
        expect(b1.metrics.clickThroughRate).toBe(1);
    });

    it('passes bannerId and days filters through to the queries', async () => {
        const res = await GET(buildRequest('?bannerId=banner-1&days=7'));
        expect(res.status).toBe(200);

        expect(mockPrisma.banner.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'banner-1' } })
        );
        expect(mockPrisma.bannerEvent.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    bannerId: 'banner-1',
                    occurredAt: expect.objectContaining({ gte: expect.any(Date) }),
                }),
            })
        );

        const body = await res.json();
        expect(body.data.rangeDays).toBe(7);
    });

    it('clamps the days parameter to a sane maximum', async () => {
        const res = await GET(buildRequest('?days=9999'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.rangeDays).toBe(365);
    });

    it('defaults to 30 days when the parameter is invalid', async () => {
        const res = await GET(buildRequest('?days=abc'));
        const body = await res.json();
        expect(body.data.rangeDays).toBe(30);
    });

    it('returns zeroed metrics per banner when no events exist', async () => {
        mockPrisma.bannerEvent.findMany.mockResolvedValue([]);

        const res = await GET(buildRequest());
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.data.summary.impressions).toBe(0);
        expect(body.data.byBanner).toHaveLength(2);
        expect(body.data.byBanner[0].metrics.impressions).toBe(0);
    });
});