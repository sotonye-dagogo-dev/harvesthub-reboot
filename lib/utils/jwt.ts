/**
 * JWT Token Utilities
 * 
 * Handles token generation, verification, and refresh
 * Uses jose for Edge-compatible JWT operations
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { TextEncoder } from 'util';
import { UserRole } from '@/lib/constants';

// Secret keys — hardcoded fallback is dev-only; production MUST set env vars
const isProduction = process.env.NODE_ENV === 'production';

function getSecretRaw(envKey: string): string | null {
    return process.env[envKey] || null;
}

function getSecretKey(secret: string): Uint8Array {
    return new TextEncoder().encode(secret);
}

function getAccessSecret(): Uint8Array {
    const val = getSecretRaw('JWT_SECRET');
    if (!val && isProduction) throw new Error('Missing required environment variable: JWT_SECRET');
    return getSecretKey(val || 'harvesthub-dev-access-secret-2026');
}

function getRefreshSecret(): Uint8Array {
    const val = getSecretRaw('JWT_REFRESH_SECRET');
    if (!val && isProduction) throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
    return getSecretKey(val || 'harvesthub-dev-refresh-secret-2026');
}

// JWT claims
const ISSUER = 'harvesthub';
const AUDIENCE = 'harvesthub-app';

// Token expiry
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '8h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

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
    const secret = getAccessSecret();
    console.log('generateAccessToken secret type', secret.constructor.name, secret instanceof Uint8Array);
    const token = await new SignJWT({
        userId,
        email,
        role,
        type: 'access',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(secret);

    return token;
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(userId: string, email: string, role: UserRole): Promise<string> {
    const secret = getRefreshSecret();
    console.log('generateRefreshToken secret type', secret.constructor.name, secret instanceof Uint8Array);
    const token = await new SignJWT({
        userId,
        email,
        role,
        type: 'refresh',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(secret);

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
        const { payload } = await jwtVerify(token, getAccessSecret(), {
            issuer: ISSUER,
            audience: AUDIENCE,
        });
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
        const { payload } = await jwtVerify(token, getRefreshSecret(), {
            issuer: ISSUER,
            audience: AUDIENCE,
        });
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
