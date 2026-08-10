import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import {
    getVisitorId,
    trackBannerClick,
    trackBannerConversion,
    trackBannerImpression,
} from '@/lib/tracking/bannerTracking';

const mockSendBeacon = vi.fn<(url: string | URL, data?: BodyInit) => boolean>();
mockSendBeacon.mockReturnValue(true);
const mockFetch = vi.fn();

function stubSendBeacon(enabled = true) {
    if (enabled) {
        Object.defineProperty(navigator, 'sendBeacon', {
            value: mockSendBeacon,
            configurable: true,
            writable: true,
        });
    } else {
        Object.defineProperty(navigator, 'sendBeacon', {
            value: undefined,
            configurable: true,
            writable: true,
        });
    }
}

beforeEach(() => {
    mockSendBeacon.mockClear();
    mockFetch.mockClear();
    localStorage.clear();
    stubSendBeacon(true);
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('Blob', NodeBlob);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('getVisitorId', () => {
    it('persists a stable visitor id across calls', () => {
        const first = getVisitorId();
        const second = getVisitorId();
        expect(first).toBeTruthy();
        expect(second).toBe(first);
    });

    it('returns an empty string when localStorage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('denied');
        });
        expect(getVisitorId()).toBe('');
    });
});

describe('trackBannerImpression', () => {
    it('sends an IMPRESSION beacon with the visitor id and source', async () => {
        const visitorId = getVisitorId();
        trackBannerImpression('imp-banner-1', 'hero');

        expect(mockSendBeacon).toHaveBeenCalledTimes(1);
        const [url, blob] = mockSendBeacon.mock.calls[0] as [string, Blob];
        expect(url).toBe('/api/banners/imp-banner-1');
        expect(JSON.parse(await blob.text())).toEqual({
            type: 'IMPRESSION',
            visitorId,
            source: 'hero',
        });
    });

    it('dedupes repeated impressions for the same banner and source', () => {
        trackBannerImpression('imp-banner-2', 'top');
        trackBannerImpression('imp-banner-2', 'top');
        expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    });

    it('counts distinct sources separately', () => {
        trackBannerImpression('imp-banner-3', 'top');
        trackBannerImpression('imp-banner-3', 'sidebar');
        expect(mockSendBeacon).toHaveBeenCalledTimes(2);
    });

    it('falls back to a keepalive PATCH fetch when sendBeacon is unavailable', () => {
        stubSendBeacon(false);
        mockFetch.mockResolvedValue(new Response());

        trackBannerImpression('imp-banner-4', 'top');

        expect(mockSendBeacon).not.toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0] as [string, { method: string; keepalive: boolean; body: string }];
        expect(url).toBe('/api/banners/imp-banner-4');
        expect(init.method).toBe('PATCH');
        expect(init.keepalive).toBe(true);
        expect(JSON.parse(init.body)).toMatchObject({ type: 'IMPRESSION' });
    });

    it('swallows sendBeacon errors gracefully', () => {
        mockSendBeacon.mockImplementation(() => {
            throw new Error('beacon blocked');
        });
        expect(() => trackBannerImpression('imp-banner-5', 'hero')).not.toThrow();
    });
});

describe('trackBannerClick', () => {
    it('records a CLICK only by default', async () => {
        trackBannerClick('click-banner-1', 'hero');
        expect(mockSendBeacon).toHaveBeenCalledTimes(1);
        const [url, blob] = mockSendBeacon.mock.calls[0] as [string, Blob];
        expect(url).toBe('/api/banners/click-banner-1');
        expect(JSON.parse(await blob.text()).type).toBe('CLICK');
    });

    it('records a CLICK followed by a CONVERSION when requested', async () => {
        trackBannerClick('click-banner-2', 'top', { conversion: true });
        expect(mockSendBeacon).toHaveBeenCalledTimes(2);
        const types = await Promise.all(
            mockSendBeacon.mock.calls.map(async ([, blob]) => JSON.parse(await (blob as Blob).text()).type)
        );
        expect(types).toEqual(['CLICK', 'CONVERSION']);
    });
});

describe('trackBannerConversion', () => {
    it('records a standalone CONVERSION event', async () => {
        trackBannerConversion('conv-banner-1', 'sidebar-modal');
        expect(mockSendBeacon).toHaveBeenCalledTimes(1);
        const [url, blob] = mockSendBeacon.mock.calls[0] as [string, Blob];
        expect(url).toBe('/api/banners/conv-banner-1');
        expect(JSON.parse(await blob.text())).toMatchObject({ type: 'CONVERSION', source: 'sidebar-modal' });
    });
});