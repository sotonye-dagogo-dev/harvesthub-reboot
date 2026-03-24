import { describe, expect, it } from 'vitest';
import { getCacheBustedUrl } from '@/lib/services/asset';

describe('asset service', () => {
    it('returns cache busted URL with timestamp query', () => {
        const raw = 'https://example.com/image.jpg';
        const out = getCacheBustedUrl(raw);

        expect(out).toMatch(/^https:\/\/example.com\/image.jpg\?v=\d+$/);
    });

    it('appends cache busting to existing query', () => {
        const raw = 'https://example.com/image.jpg?foo=bar';
        const out = getCacheBustedUrl(raw);

        expect(out).toMatch(/^https:\/\/example.com\/image.jpg\?foo=bar&v=\d+$/);
    });
});
