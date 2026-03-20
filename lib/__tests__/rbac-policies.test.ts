import { describe, expect, it } from 'vitest';
import { UserRole } from '@/lib/constants';
import { getRoutePolicy } from '@/lib/rbac/policies';

describe('rbac route policies', () => {
  it('matches exact and nested routes with most specific policy', () => {
    expect(getRoutePolicy('/')).toMatchObject({ public: true });
    expect(getRoutePolicy('/admin/dashboard')).toMatchObject({
      public: false,
      roles: [UserRole.ADMIN],
    });
    expect(getRoutePolicy('/vendor/products/123')).toMatchObject({
      public: false,
      roles: [UserRole.VENDOR],
    });
  });

  it('marks auth routes for redirect behavior', () => {
    expect(getRoutePolicy('/login')).toMatchObject({ authRoute: true, public: true });
    expect(getRoutePolicy('/register')).toMatchObject({ authRoute: true, public: true });
  });

  it('returns null for unknown routes so middleware can enforce authentication', () => {
    expect(getRoutePolicy('/unknown-private-route')).toBeNull();
  });
});
