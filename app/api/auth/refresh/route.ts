/**
 * POST /api/auth/refresh
 * 
 * Refresh access token using refresh token
 */

import { NextResponse } from 'next/server';
import { getRefreshToken } from '@/lib/utils/cookies';
import { verifyRefreshToken, generateAccessToken } from '@/lib/utils/jwt';
import { setAccessTokenCookie } from '@/lib/utils/cookies';
import { userDb } from '@/lib/data/database';

export async function POST() {
    try {
        // Get refresh token from cookie
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        // Verify user still exists and is active
        const user = userDb.findById(payload.userId);
        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 401 }
            );
        }

        // Generate new access token
        const newAccessToken = await generateAccessToken(user.id, user.email, user.role);

        // Set new access token cookie
        await setAccessTokenCookie(newAccessToken);

        return NextResponse.json(
            { message: 'Token refreshed successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
