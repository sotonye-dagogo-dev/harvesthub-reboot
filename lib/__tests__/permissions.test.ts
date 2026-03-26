import { describe, expect, it } from 'vitest';
import { canAccess } from '@/lib/permissions';
import { UserRole } from '@/lib/constants';

describe('permissions canAccess', () => {
    it('allows admin to manage products', () => {
        expect(canAccess(UserRole.ADMIN, 'manageProducts')).toBe(true);
    });

    it('prevents buyer from managing vendors', () => {
        expect(canAccess(UserRole.BUYER, 'manageVendors')).toBe(false);
    });

    it('allows vendor to view orders', () => {
        expect(canAccess(UserRole.VENDOR, 'viewOrders')).toBe(true);
    });

    it('prevents unauthenticated users', () => {
        expect(canAccess(undefined, 'viewOrders')).toBe(false);
    });
});
