import { describe, expect, it } from 'vitest';
import {
    hasRenderableCreative,
    isBannerLive,
    selectInlineSponsoredBanners,
    selectTopStripBanners,
} from '@/lib/utils/bannerPlacement';

const NOW = new Date('2026-11-20T10:00:00Z');

function banner(overrides: Record<string, unknown> = {}) {
    return {
        id: 'b',
        isActive: true,
        position: 'TOP' as const,
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: null as Date | null,
        imageUrl: '/ad.jpg',
        title: '',
        displayOrder: 0,
        ...overrides,
    } as any;
}

describe('bannerPlacement', () => {
    it('treats expired, future and inactive banners as not live', () => {
        expect(isBannerLive(banner(), NOW)).toBe(true);
        expect(isBannerLive(banner({ endDate: new Date('2026-10-30T00:00:00Z') }), NOW)).toBe(false);
        expect(isBannerLive(banner({ startDate: new Date('2026-12-01T00:00:00Z') }), NOW)).toBe(false);
        expect(isBannerLive(banner({ isActive: false }), NOW)).toBe(false);
    });

    it('needs an image for IMAGE banners and a title for DESIGNED banners', () => {
        expect(hasRenderableCreative(banner({ imageUrl: '' }))).toBe(false);
        expect(hasRenderableCreative(banner({ imageUrl: '', displayStyle: 'DESIGNED', title: 'Sale' }))).toBe(true);
        expect(hasRenderableCreative(banner({ displayStyle: 'DESIGNED', title: '  ' }))).toBe(false);
    });

    it('sends house campaigns and premium sponsored adverts to the top strip, other sponsored adverts in-feed', () => {
        const list = [
            banner({ id: 'house', displayOrder: 2 }),
            banner({ id: 'sponsored', isSponsored: true, displayOrder: 1 }),
            banner({ id: 'premium', isSponsored: true, premiumTopPlacement: true, displayOrder: 0 }),
            banner({ id: 'hero', position: 'HERO' }),
        ];

        expect(selectTopStripBanners(list, NOW).map((b) => b.id)).toEqual(['premium', 'house']);
        expect(selectInlineSponsoredBanners(list, NOW).map((b) => b.id)).toEqual(['sponsored']);
    });
});
