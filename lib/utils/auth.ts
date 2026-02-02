/**
 * Authentication Utilities
 * 
 * Helper functions for authentication and authorization
 */

import { UserRole } from '@/lib/constants';
import { getAccessToken } from './cookies';
import { verifyAccessToken, type JWTPayload } from './jwt';

// Export verifyToken as an alias for API routes
export { verifyAccessToken as verifyToken } from './jwt';
export type { JWTPayload } from './jwt';

/**
 * Get current authenticated user from request
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
    try {
        const token = await getAccessToken();
        if (!token) return null;

        const payload = verifyAccessToken(token);
        return payload;
    } catch {
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<JWTPayload> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

/**
 * Require specific role (throws if not authorized)
 */
export async function requireRole(role: UserRole): Promise<JWTPayload> {
    const user = await requireAuth();
    if (user.role !== role) {
        throw new Error('Forbidden');
    }
    return user;
}

/**
 * Require any of the specified roles (throws if not authorized)
 */
export async function requireAnyRole(roles: UserRole[]): Promise<JWTPayload> {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        throw new Error('Forbidden');
    }
    return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
    return hasRole(UserRole.ADMIN);
}

/**
 * Check if user is vendor
 */
export async function isVendor(): Promise<boolean> {
    return hasRole(UserRole.VENDOR);
}

/**
 * Check if user is buyer
 */
export async function isBuyer(): Promise<boolean> {
    return hasRole(UserRole.BUYER);
}
