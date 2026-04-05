import { describe, expect, it } from 'vitest';
import { buildNav } from '@/lib/navigation';
import { UserRole } from '@/lib/constants';

describe('buildNav', () => {
    it('includes public links for anonymous user', () => {
        const nav = buildNav(undefined);
        expect(nav.some((item) => item.path === '/products')).toBe(true);
        expect(nav.some((item) => item.path === '/orders')).toBe(false);
    });

    it('includes buyer links', () => {
        const nav = buildNav(UserRole.BUYER);
        expect(nav.some((item) => item.path === '/orders')).toBe(true);
        expect(nav.some((item) => item.path === '/dashboard')).toBe(true);
    });

    it('includes admin links', () => {
        const nav = buildNav(UserRole.ADMIN);
        expect(nav.some((item) => item.path === '/operations/users')).toBe(true);
        expect(nav.some((item) => item.path === '/operations/products')).toBe(true);
        expect(nav.some((item) => item.path === '/orders')).toBe(true);
    });

    it('includes vendor operations products link', () => {
        const nav = buildNav(UserRole.VENDOR);
        expect(nav.some((item) => item.path === '/operations/products')).toBe(true);
    });
});
