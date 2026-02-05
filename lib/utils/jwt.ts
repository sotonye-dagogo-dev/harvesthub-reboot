/**
 * JWT Token Utilities
 * 
 * Handles token generation, verification, and refresh
 * Uses jose for Edge-compatible JWT operations
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { UserRole } from '@/lib/constants';

// Secret keys (in production, use environment variables)
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'harvesthub-access-secret-key-2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'harvesthub-refresh-secret-key-2026';

// Convert secrets to Uint8Array for jose
const accessTokenSecret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
const refreshTokenSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);

// Token expiry times (in seconds)
const ACCESS_TOKEN_EXPIRY = '8h'; // 8 hours
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
export async function generateAccessToken(userId: string, email: string, role: UserRole): Promise<string> {
    const token = await new SignJWT({
        userId,
        email,
        role,
        type: 'access',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(accessTokenSecret);

    return token;
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(userId: string, email: string, role: UserRole): Promise<string> {
    const token = await new SignJWT({
        userId,
        email,
        role,
        type: 'refresh',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(refreshTokenSecret);

    return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(userId: string, email: string, role: UserRole): Promise<{
    accessToken: string;
    refreshToken: string;
}> {
    const [accessToken, refreshToken] = await Promise.all([
        generateAccessToken(userId, email, role),
        generateRefreshToken(userId, email, role),
    ]);

    return {
        accessToken,
        refreshToken,
    };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, accessTokenSecret);
        const decoded = payload as unknown as JWTPayload;

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
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, refreshTokenSecret);
        const decoded = payload as unknown as JWTPayload;

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
        return decodeJwt(token) as JWTPayload;
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

    const decodedWithExp = decoded as JWTPayload & { exp?: number };
    if (!decodedWithExp.exp) return true;

    return Date.now() >= decodedWithExp.exp * 1000;
}

/**
 * Get token expiry time in milliseconds
 */
export function getTokenExpiry(token: string): number | null {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    const decodedWithExp = decoded as JWTPayload & { exp?: number };
    if (!decodedWithExp.exp) return null;

    return decodedWithExp.exp * 1000;
}
