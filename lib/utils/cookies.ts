/**
 * Cookie Utilities
 * 
 * Handles secure cookie operations for authentication tokens
 */

import { cookies } from 'next/headers';

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// Cookie options
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

/**
 * Set access token cookie
 */
export async function setAccessTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60, // 15 minutes
    });
}

/**
 * Set refresh token cookie
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(REFRESH_TOKEN_COOKIE, token, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

/**
 * Set both access and refresh token cookies
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
    await setAccessTokenCookie(accessToken);
    await setRefreshTokenCookie(refreshToken);
}

/**
 * Get access token from cookie
 */
export async function getAccessToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * Clear access token cookie
 */
export async function clearAccessTokenCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

/**
 * Clear refresh token cookie
 */
export async function clearRefreshTokenCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Clear all auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
    await clearAccessTokenCookie();
    await clearRefreshTokenCookie();
}
