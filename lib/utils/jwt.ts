/**
 * JWT Token Utilities
 * 
 * Handles token generation, verification, and refresh
 * Uses jsonwebtoken for JWT operations
 */

import jwt from 'jsonwebtoken';
import { UserRole } from '@/lib/constants';

// Secret keys (in production, use environment variables)
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'harvesthub-access-secret-key-2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'harvesthub-refresh-secret-key-2026';

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// JWT Payload interface
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
}

/**
 * Generate access token
 */
export function generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload: JWTPayload = {
        userId,
        email,
        role,
        type: 'access',
    };

    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, email: string, role: UserRole): string {
    const payload: JWTPayload = {
        userId,
        email,
        role,
        type: 'refresh',
    };

    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string, role: UserRole): {
    accessToken: string;
    refreshToken: string;
} {
    return {
        accessToken: generateAccessToken(userId, email, role),
        refreshToken: generateRefreshToken(userId, email, role),
    };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;

        if (decoded.type !== 'access') {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;

        if (decoded.type !== 'refresh') {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded) return true;

    const decodedWithExp = decoded as jwt.JwtPayload;
    if (!decodedWithExp.exp) return true;

    return Date.now() >= decodedWithExp.exp * 1000;
}

/**
 * Get token expiry time in milliseconds
 */
export function getTokenExpiry(token: string): number | null {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    const decodedWithExp = decoded as jwt.JwtPayload;
    if (!decodedWithExp.exp) return null;

    return decodedWithExp.exp * 1000;
}
