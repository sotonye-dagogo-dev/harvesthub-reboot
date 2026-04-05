import { describe, expect, it } from 'vitest';
import { UserRole } from '@/lib/constants';
import { getRoutePolicy } from '@/lib/rbac/policies';

describe('rbac route policies', () => {
    it('matches exact and nested routes with most specific policy', () => {
        expect(getRoutePolicy('/')).toMatchObject({ public: true });
        expect(getRoutePolicy('/operations/users')).toMatchObject({
            public: false,
            roles: [UserRole.ADMIN],
        });
        expect(getRoutePolicy('/operations/marketing-content')).toMatchObject({
            public: false,
            roles: [UserRole.VENDOR, UserRole.ADMIN],
        });
    });

    it('marks auth routes for redirect behavior', () => {
        expect(getRoutePolicy('/login')).toMatchObject({ authRoute: true, public: true });
        expect(getRoutePolicy('/signup')).toMatchObject({ authRoute: true, public: true });
        expect(getRoutePolicy('/signup/user-info')).toMatchObject({ authRoute: true, public: true });
    });

    it('returns null for unknown routes so middleware can enforce authentication', () => {
        expect(getRoutePolicy('/unknown-private-route')).toBeNull();
    });

    it('adds analytics route policy to the registry', () => {
        expect(getRoutePolicy('/analytics')).toMatchObject({
            public: false,
            roles: [UserRole.VENDOR, UserRole.ADMIN],
        });
    });

    it('adds store-settings route policy for vendor and admin', () => {
        expect(getRoutePolicy('/store-settings')).toMatchObject({
            public: false,
            roles: [UserRole.VENDOR, UserRole.ADMIN],
        });
    });

    it('adds operations products route policy for vendor and admin', () => {
        expect(getRoutePolicy('/operations/products')).toMatchObject({
            public: false,
            roles: [UserRole.VENDOR, UserRole.ADMIN],
        });
    });

    it('keeps ad-application publicly accessible', () => {
        expect(getRoutePolicy('/ad-application')).toMatchObject({
            public: true,
        });
    });
});
