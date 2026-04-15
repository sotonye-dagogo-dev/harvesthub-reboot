/**
 * Cookie Utilities
 * 
 * Handles secure cookie operations for authentication tokens
 */

import { cookies } from 'next/headers';

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const REMEMBER_ME_COOKIE = 'rememberMe';

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
 * Set access token cookie with session/remember semantics.
 */
export async function setAccessTokenCookieWithPreference(
    token: string,
    rememberMe = false
): Promise<void> {
    const cookieStore = await cookies();
    const accessCookieOptions = rememberMe
        ? { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 } // 8h when remembered
        : { ...COOKIE_OPTIONS }; // session cookie when not remembered
    cookieStore.set(ACCESS_TOKEN_COOKIE, token, accessCookieOptions);
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
 * When rememberMe is true, extends cookie lifetime
 */
export async function setAuthCookies(accessToken: string, refreshToken: string, rememberMe = false): Promise<void> {
    const cookieStore = await cookies();
    const accessCookieOptions = rememberMe
        ? { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 } // 8h when remembered
        : { ...COOKIE_OPTIONS }; // session cookie when not remembered
    const refreshCookieOptions = rememberMe
        ? { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 } // 30d when remembered
        : { ...COOKIE_OPTIONS }; // session cookie when not remembered

    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);

    if (rememberMe) {
        cookieStore.set(REMEMBER_ME_COOKIE, '1', {
            ...COOKIE_OPTIONS,
            httpOnly: false,
            maxAge: 30 * 24 * 60 * 60,
        });
    } else {
        cookieStore.delete(REMEMBER_ME_COOKIE);
    }
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
 * Get remember-me preference from cookie.
 */
export async function getRememberMePreference(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get(REMEMBER_ME_COOKIE)?.value === '1';
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
    const cookieStore = await cookies();
    cookieStore.delete(REMEMBER_ME_COOKIE);
}
